import { createClient } from '@supabase/supabase-js';

// Função auxiliar para pegar variáveis de ambiente de forma segura
const getEnvVar = (key: string, viteKey: string) => {
  if (typeof process !== 'undefined' && process.env && process.env[key]) {
    return process.env[key];
  }
  // @ts-ignore
  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[viteKey]) {
    // @ts-ignore
    return import.meta.env[viteKey];
  }
  return '';
};

// Tenta pegar do .env
const envUrl = getEnvVar('REACT_APP_SUPABASE_URL', 'VITE_SUPABASE_URL');
const envKey = getEnvVar('REACT_APP_SUPABASE_ANON_KEY', 'VITE_SUPABASE_ANON_KEY');

// Fallbacks de segurança - Se não tiver ENV, usa string vazia para não quebrar o build,
// mas o createClient vai reclamar se tentar usar.
// IMPORTANTE: A chave 'sb_publishable' que estava aqui parecia incorreta (chaves Supabase começam com eyJ...).
// Mantendo o fallback anterior por compatibilidade se funcionava para você, mas ideal é configurar no Cloudflare.

const fallbackUrl = 'https://jkwpusebesondgibbsoz.supabase.co';
// Chave pública segura para evitar crash se a ENV falhar
const fallbackKey = envKey || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imprd3B1c2ViZXNvbmRnaWJic296Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDk4NTYwMDAsImV4cCI6MjAyNTIxMzYwMH0.MOCK_KEY_PLACEHOLDER_FOR_BUILD_SAFETY'; 

const SUPABASE_URL = envUrl || fallbackUrl;
const SUPABASE_KEY = envKey || 'sb_publishable_mNe5LR0rV5OZ8SPfR3Ql9w_DpUNzxO3'; // Mantendo sua chave original como fallback

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.warn('⚠️ Supabase Credentials missing! App will load but data fetching will fail.');
}

// Create client robusto - não crasha a tela branca se a URL for inválida, apenas loga erro
let client;
try {
    client = createClient(SUPABASE_URL, SUPABASE_KEY);
} catch (error) {
    console.error("Erro fatal ao iniciar Supabase:", error);
    // Cria um cliente mock para a tela não ficar branca
    client = {
        from: () => ({ select: () => ({ data: [], error: { message: "Supabase not configured" } }) }),
        auth: { getUser: () => ({ data: { user: null } }), onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }) }
    } as any;
}

export const supabase = client;