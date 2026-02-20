import { supabase } from '../lib/supabase';
import { Deal } from '../types';

// Otimizador de Links de Afiliado
const optimizeLink = (url: string): string => {
  try {
    const urlObj = new URL(url);
    if (urlObj.hostname.includes('amazon')) {
      urlObj.searchParams.set('tag', 'maodevaca-20');
    }
    return urlObj.toString();
  } catch (e) {
    return url;
  }
};

// Busca apenas ofertas aprovadas para o público geral
export const getDeals = async (): Promise<Deal[]> => {
  const { data, error } = await supabase
    .from('deals')
    .select('*')
    .eq('status', 'approved')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Erro ao buscar ofertas:', error);
    return [];
  }
  return mapDeals(data);
};

// ADMIN: Busca todas as ofertas pendentes COM dados do usuário (email)
export const getPendingDeals = async (): Promise<Deal[]> => {
  // Fazemos um select relacionando com a tabela profiles
  // Nota: Isso requer que exista uma Foreign Key entre deals.user_id e profiles.id no banco
  const { data, error } = await supabase
    .from('deals')
    .select('*, profiles(email)')
    .eq('status', 'pending')
    .order('created_at', { ascending: false });

  if (error) {
    console.error("Erro ao buscar pendentes:", error);
    return [];
  }
  return mapDeals(data);
};

// ADMIN: Busca ofertas reportadas como expiradas
export const getReportedDeals = async (): Promise<Deal[]> => {
  const { data, error } = await supabase
    .from('deals')
    .select('*')
    .eq('report_status', 'pending_review')
    .order('created_at', { ascending: false });

  if (error) return [];
  return mapDeals(data);
};

// USER: Reportar oferta como expirada (Com verificação de banimento)
export const reportDealExpired = async (id: number): Promise<boolean> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  // Verifica se usuário está banido antes de permitir o reporte
  const { data: profile } = await supabase
    .from('profiles')
    .select('is_banned')
    .eq('id', user.id)
    .single();

  if (profile?.is_banned) {
    throw new Error("USER_BANNED");
  }

  const { error } = await supabase
    .from('deals')
    .update({ report_status: 'pending_review' })
    .eq('id', id);
  
  if (error) return false;
  return true;
};

// ADMIN: Dispensar reporte (Oferta ainda vale)
export const dismissReport = async (id: number): Promise<boolean> => {
  const { error } = await supabase
    .from('deals')
    .update({ report_status: null })
    .eq('id', id);
  return !error;
};

// ADMIN: Excluir oferta definitivamente
export const deleteDeal = async (id: number): Promise<{ success: boolean; error?: any }> => {
  const { error: rpcError } = await supabase.rpc('delete_deal_admin', { target_deal_id: id });

  if (!rpcError) return { success: true };

  console.warn("RPC falhou, tentando método tradicional...", rpcError);
  
  await supabase.from('votes').delete().eq('deal_id', id);
  const { error } = await supabase.from('deals').delete().eq('id', id);

  if (error) {
    console.error("ERRO AO DELETAR:", error);
    return { success: false, error };
  }
  return { success: true };
};

// ADMIN: Aprovar ou Rejeitar oferta (Apenas status)
export const updateDealStatus = async (id: number, status: 'approved' | 'rejected') => {
  const { error } = await supabase
    .from('deals')
    .update({ status })
    .eq('id', id);
  return !error;
};

// ADMIN: Editar oferta completa
export const updateDeal = async (deal: Deal): Promise<boolean> => {
  const { error } = await supabase
    .from('deals')
    .update({
      title: deal.title,
      price: deal.price,
      original_price: deal.originalPrice,
      description: deal.description,
      image_url: deal.imageUrl,
      store_name: deal.storeName,
      link: deal.link,
      category: deal.category,
      coupon_code: deal.couponCode,
      status: deal.status,
      payment_method: deal.paymentMethod
    })
    .eq('id', deal.id);
  
  if (error) {
    console.error("Erro ao atualizar oferta:", error);
    return false;
  }
  return true;
};

// ADMIN: Listar usuários
export const getUsers = async () => {
  const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
  return data || [];
};

// ADMIN: Banir/Desbanir usuário
export const toggleBanUser = async (userId: string, currentStatus: boolean) => {
  const { error } = await supabase
    .from('profiles')
    .update({ is_banned: !currentStatus })
    .eq('id', userId);
  return !error;
};

// Criar oferta (sempre pendente)
export const createDeal = async (deal: Omit<Deal, 'id' | 'createdAt' | 'temperature' | 'isHot' | 'status'>): Promise<Deal | null> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  // 1. Verificação de Banimento
  const { data: profile } = await supabase
    .from('profiles')
    .select('is_banned')
    .eq('id', user.id)
    .single();

  if (profile?.is_banned) {
    throw new Error("USER_BANNED");
  }

  const optimizedLink = optimizeLink(deal.link);

  const dbPayload = {
    title: deal.title,
    price: deal.price,
    original_price: deal.originalPrice,
    description: deal.description,
    image_url: deal.imageUrl,
    store_name: deal.storeName,
    link: optimizedLink,
    category: deal.category,
    coupon_code: deal.couponCode,
    payment_method: deal.paymentMethod || 'À vista', // Default
    temperature: 0,
    is_hot: false,
    status: 'pending', // Padrão
    user_id: user.id
  };

  const { data, error } = await supabase
    .from('deals')
    .insert([dbPayload])
    .select()
    .single();

  if (error) {
    console.error('Erro ao criar oferta:', error);
    return null;
  }

  return mapDeals([data])[0];
};

// Votar na oferta
export const upvoteDeal = async (dealId: number): Promise<{ success: boolean; newTemp?: number }> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false };

  const { data: existingVote } = await supabase
    .from('votes')
    .select('id')
    .eq('user_id', user.id)
    .eq('deal_id', dealId)
    .single();

  if (existingVote) {
    return { success: false }; 
  }

  const { error: voteError } = await supabase.from('votes').insert({ user_id: user.id, deal_id: dealId });
  if (voteError) return { success: false };

  const { data: deal } = await supabase.from('deals').select('temperature').eq('id', dealId).single();
  const newTemp = (deal?.temperature || 0) + 1;
  const isHot = newTemp >= 50;

  await supabase
    .from('deals')
    .update({ temperature: newTemp, is_hot: isHot })
    .eq('id', dealId);

  return { success: true, newTemp };
};

// Helper
const mapDeals = (data: any[]): Deal[] => {
  return data.map((item: any) => ({
    id: item.id,
    title: item.title,
    price: item.price,
    originalPrice: item.original_price,
    description: item.description,
    imageUrl: item.image_url,
    storeName: item.store_name,
    link: item.link,
    category: item.category,
    temperature: item.temperature,
    createdAt: item.created_at,
    couponCode: item.coupon_code,
    isHot: item.is_hot,
    status: item.status,
    reportStatus: item.report_status,
    user_id: item.user_id,
    userEmail: item.profiles?.email,
    paymentMethod: item.payment_method || 'À vista' // Default visual
  }));
};