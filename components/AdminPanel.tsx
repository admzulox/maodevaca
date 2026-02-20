import React, { useEffect, useState } from 'react';
import { getPendingDeals, updateDealStatus, getUsers, toggleBanUser, updateDeal, getReportedDeals, dismissReport, deleteDeal, getDeals } from '../services/dealService';
import { Deal, UserProfile, DEAL_CATEGORIES } from '../types';
import { Check, X, Ban, ShieldCheck, AlertCircle, Pencil, Save, ExternalLink, Trash2, Flag, Zap, User } from 'lucide-react';

export const AdminPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'pending' | 'active' | 'reported' | 'users'>('pending');
  const [pendingDeals, setPendingDeals] = useState<Deal[]>([]);
  const [activeDeals, setActiveDeals] = useState<Deal[]>([]);
  const [reportedDeals, setReportedDeals] = useState<Deal[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(false);

  // Estados para edição
  const [editingDeal, setEditingDeal] = useState<Deal | null>(null);
  
  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    const [pending, active, reported, userList] = await Promise.all([
      getPendingDeals(),
      getDeals(),
      getReportedDeals(),
      getUsers()
    ]);
    
    setPendingDeals(pending);
    setActiveDeals(active);
    setReportedDeals(reported);
    setUsers(userList as UserProfile[]);
    setLoading(false);
  };

  const refreshData = async () => {
    fetchAllData();
  };

  const handleApprove = async (id: number) => {
    if (confirm('Aprovar oferta?')) {
      await updateDealStatus(id, 'approved');
      refreshData();
    }
  };

  const handleReject = async (id: number) => {
    if (confirm('Rejeitar e remover oferta?')) {
      await updateDealStatus(id, 'rejected');
      refreshData();
    }
  };
  
  const handleDeletePermanent = async (id: number) => {
    if (confirm('ATENÇÃO: Isso excluirá a oferta permanentemente. Confirmar exclusão?')) {
        const { success, error } = await deleteDeal(id);
        if (success) {
            refreshData();
        } else {
            console.error(error);
            alert("Erro ao excluir. Verifique se você rodou o script SQL de permissões no Supabase.");
        }
    }
  }

  const handleDismissReport = async (id: number) => {
      await dismissReport(id);
      refreshData();
  }

  const handleBan = async (id: string, currentStatus: boolean) => {
    if (confirm(currentStatus ? 'Desbanir usuário?' : 'Banir este usuário permanentemente?')) {
      await toggleBanUser(id, currentStatus);
      refreshData();
    }
  };

  // Atalho para banir diretamente da oferta pendente
  const handleBanFromDeal = async (userId: string, userEmail: string | undefined) => {
      if (!userId) return;
      if (confirm(`TEM CERTEZA? Isso banirá o usuário ${userEmail || 'Desconhecido'} e ele não poderá mais postar.`)) {
          // Assume que o status atual é false (não banido), pois ele conseguiu postar
          await toggleBanUser(userId, false);
          alert('Usuário banido com sucesso.');
          refreshData();
      }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDeal) return;

    const success = await updateDeal(editingDeal);
    if (success) {
      alert("Oferta atualizada com sucesso!");
      setEditingDeal(null);
      refreshData();
    } else {
      alert("Erro ao atualizar oferta.");
    }
  };

  return (
    <>
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden min-h-[600px]">
        <div className="bg-gray-900 text-white p-6 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
                <ShieldCheck className="text-brand-400" />
                Painel Administrativo
            </h2>
            <p className="text-gray-400 text-sm mt-1">Gerencie ofertas, reportes e usuários da comunidade.</p>
          </div>
        </div>

        <div className="border-b border-gray-200 bg-gray-50 overflow-x-auto">
          <nav className="flex -mb-px">
            <button
              onClick={() => setActiveTab('pending')}
              className={`whitespace-nowrap py-4 px-6 font-medium text-sm transition-colors border-b-2 flex items-center gap-2 ${
                activeTab === 'pending'
                  ? 'border-brand-500 text-brand-600 bg-white'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Pendentes 
              {pendingDeals.length > 0 && <span className="bg-brand-100 text-brand-700 px-2 py-0.5 rounded-full text-xs font-bold">{pendingDeals.length}</span>}
            </button>
            <button
              onClick={() => setActiveTab('active')}
              className={`whitespace-nowrap py-4 px-6 font-medium text-sm transition-colors border-b-2 flex items-center gap-2 ${
                activeTab === 'active'
                  ? 'border-brand-500 text-brand-600 bg-white'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Zap size={14} /> Ativas 
              <span className="bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full text-xs font-bold">{activeDeals.length}</span>
            </button>
            <button
              onClick={() => setActiveTab('reported')}
              className={`whitespace-nowrap py-4 px-6 font-medium text-sm transition-colors border-b-2 flex items-center gap-2 ${
                activeTab === 'reported'
                  ? 'border-red-500 text-red-600 bg-white'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Flag size={14} /> Reportados 
              {reportedDeals.length > 0 && <span className="bg-red-100 text-red-600 px-2 py-0.5 rounded-full text-xs font-bold animate-pulse">{reportedDeals.length}</span>}
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`whitespace-nowrap py-4 px-6 font-medium text-sm transition-colors border-b-2 ${
                activeTab === 'users'
                  ? 'border-brand-500 text-brand-600 bg-white'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Usuários
            </button>
          </nav>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="flex justify-center items-center py-20">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600"></div>
            </div>
          ) : activeTab === 'pending' ? (
            <div className="space-y-4">
              {pendingDeals.length === 0 && <p className="text-gray-500 text-center py-10">Nenhuma oferta pendente.</p>}
              {pendingDeals.map(deal => (
                <div key={deal.id} className="flex flex-col sm:flex-row items-center gap-4 bg-gray-50 p-4 rounded-xl border border-gray-200">
                  <img src={deal.imageUrl} className="w-16 h-16 object-contain mix-blend-multiply bg-white rounded-lg p-1 border border-gray-100" />
                  <div className="flex-1 w-full sm:w-auto">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-bold text-gray-500 uppercase border border-gray-200 px-1.5 rounded bg-white">{deal.category}</span>
                    </div>
                    <h4 className="font-bold text-gray-900">{deal.title}</h4>
                    <div className="text-sm text-gray-500 flex flex-wrap gap-2 mt-1">
                      <span className="bg-gray-100 px-2 py-0.5 rounded text-xs">{deal.storeName}</span>
                      <span className="text-money-600 font-bold">R$ {deal.price}</span>
                      {deal.link.includes('maodevaca') && <span className="text-green-600 text-xs font-bold border border-green-200 px-1 rounded">Afiliado</span>}
                    </div>
                    <div className="flex items-center gap-1.5 mt-2 text-xs text-gray-600 bg-white border border-gray-200 w-fit px-2 py-1 rounded-md">
                        <User size={12} className="text-brand-500" />
                        <span className="font-semibold">Autor:</span> {deal.userEmail || 'Desconhecido'}
                    </div>
                  </div>
                  <div className="flex gap-2">
                     <button onClick={() => setEditingDeal(deal)} className="p-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200" title="Editar Detalhes">
                      <Pencil size={20} />
                    </button>
                    {deal.user_id && (
                        <button 
                            onClick={() => handleBanFromDeal(deal.user_id!, deal.userEmail)} 
                            className="p-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900" 
                            title="Banir Usuário (Spam)"
                        >
                            <Ban size={20} />
                        </button>
                    )}
                    <button onClick={() => handleApprove(deal.id)} className="p-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200" title="Aprovar">
                      <Check size={20} />
                    </button>
                    <button onClick={() => handleDeletePermanent(deal.id)} className="p-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200" title="Excluir Definitivamente">
                      <Trash2 size={20} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : activeTab === 'active' ? (
             <div className="space-y-4">
               {activeDeals.length === 0 && <p className="text-gray-500 text-center py-10">Nenhuma oferta ativa.</p>}
               {activeDeals.map(deal => (
                 <div key={deal.id} className="flex flex-col sm:flex-row items-center gap-4 bg-white p-4 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                   <img src={deal.imageUrl} className="w-16 h-16 object-contain mix-blend-multiply bg-gray-50 rounded-lg p-1 border border-gray-100" />
                   <div className="flex-1 w-full sm:w-auto">
                     <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-bold text-gray-500 uppercase border border-gray-200 px-1.5 rounded bg-gray-50">{deal.category}</span>
                        {deal.isHot && <span className="text-[10px] bg-red-100 text-red-600 px-2 rounded-full border border-red-200">HOT</span>}
                     </div>
                     <h4 className="font-bold text-gray-900 flex items-center gap-2">
                       {deal.title}
                     </h4>
                     <div className="text-sm text-gray-500 flex flex-wrap gap-2 mt-1">
                       <span className="bg-gray-100 px-2 py-0.5 rounded text-xs">{deal.storeName}</span>
                       <span className="text-money-600 font-bold">R$ {deal.price}</span>
                       <span className="text-gray-400 text-xs">Temp: {deal.temperature}°</span>
                     </div>
                   </div>
                   <div className="flex gap-2">
                      <button onClick={() => setEditingDeal(deal)} className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 border border-blue-200" title="Editar">
                       <Pencil size={18} />
                     </button>
                     <button onClick={() => handleDeletePermanent(deal.id)} className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 border border-red-200" title="Excluir">
                       <Trash2 size={18} />
                     </button>
                   </div>
                 </div>
               ))}
             </div>
          ) : activeTab === 'reported' ? (
             <div className="space-y-4">
               {reportedDeals.length === 0 && <p className="text-gray-500 text-center py-10">Nenhum reporte pendente. Comunidade segura!</p>}
               {reportedDeals.map(deal => (
                 <div key={deal.id} className="flex flex-col sm:flex-row items-center gap-4 bg-red-50 p-4 rounded-xl border border-red-100">
                   <img src={deal.imageUrl} className="w-16 h-16 object-contain mix-blend-multiply bg-white rounded-lg p-1 border border-gray-100" />
                   <div className="flex-1 w-full sm:w-auto">
                     <div className="flex items-center gap-2 mb-1">
                        <span className="bg-red-200 text-red-800 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">Reportado</span>
                        <span className="text-[10px] font-bold text-gray-500 uppercase border border-gray-200 px-1.5 rounded bg-white">{deal.category}</span>
                     </div>
                     <h4 className="font-bold text-gray-900">{deal.title}</h4>
                     <a href={deal.link} target="_blank" className="text-sm text-blue-600 hover:underline flex items-center gap-1 mt-1 font-medium">
                       Verificar Link <ExternalLink size={14} />
                     </a>
                   </div>
                   <div className="flex flex-col sm:flex-row gap-2">
                      <button onClick={() => handleDeletePermanent(deal.id)} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-bold flex items-center gap-2 justify-center" title="Confirmar Exclusão">
                       <Trash2 size={16} /> Excluir
                     </button>
                     <button onClick={() => handleDismissReport(deal.id)} className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium" title="Ignorar Reporte">
                       Manter Oferta
                     </button>
                   </div>
                 </div>
               ))}
             </div>
          ) : (
            <div className="overflow-x-auto">
               <table className="w-full text-left text-sm text-gray-600">
                 <thead className="bg-gray-50 text-gray-900 font-bold">
                   <tr>
                     <th className="p-3 rounded-tl-lg">Email</th>
                     <th className="p-3">Role</th>
                     <th className="p-3">Status</th>
                     <th className="p-3 rounded-tr-lg">Ações</th>
                   </tr>
                 </thead>
                 <tbody>
                   {users.map(user => (
                     <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50">
                       <td className="p-3">{user.email}</td>
                       <td className="p-3">
                         <span className={`px-2 py-1 rounded text-xs font-bold ${user.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'}`}>
                           {user.role}
                         </span>
                       </td>
                       <td className="p-3">
                          {user.is_banned ? (
                            <span className="text-red-600 font-bold flex items-center gap-1"><AlertCircle size={14}/> Banido</span>
                          ) : (
                            <span className="text-green-600 font-bold">Ativo</span>
                          )}
                       </td>
                       <td className="p-3">
                         {user.role !== 'admin' && (
                           <button 
                             onClick={() => handleBan(user.id, user.is_banned)}
                             className={`p-1.5 rounded-md text-white transition-colors ${user.is_banned ? 'bg-gray-500 hover:bg-gray-600' : 'bg-red-500 hover:bg-red-600'}`}
                             title={user.is_banned ? "Desbanir" : "Banir"}
                           >
                             <Ban size={16} />
                           </button>
                         )}
                       </td>
                     </tr>
                   ))}
                 </tbody>
               </table>
            </div>
          )}
        </div>
      </div>

      {/* MODAL DE EDIÇÃO */}
      {editingDeal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setEditingDeal(null)}></div>
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl relative z-10 max-h-[90vh] overflow-y-auto">
            <div className="bg-gray-900 px-6 py-4 flex justify-between items-center sticky top-0">
               <h3 className="text-white font-bold flex items-center gap-2">
                 <Pencil size={18} /> Editar Oferta #{editingDeal.id}
               </h3>
               <button onClick={() => setEditingDeal(null)} className="text-gray-400 hover:text-white"><X size={20}/></button>
            </div>
            
            <form onSubmit={handleSaveEdit} className="p-6 space-y-4">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Título</label>
                    <input 
                      type="text" 
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                      value={editingDeal.title}
                      onChange={e => setEditingDeal({...editingDeal, title: e.target.value})}
                    />
                 </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Loja</label>
                    <input 
                      type="text" 
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                      value={editingDeal.storeName}
                      onChange={e => setEditingDeal({...editingDeal, storeName: e.target.value})}
                    />
                 </div>
               </div>

               <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                 <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Preço</label>
                    <input 
                      type="number" step="0.01"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                      value={editingDeal.price}
                      onChange={e => setEditingDeal({...editingDeal, price: parseFloat(e.target.value)})}
                    />
                 </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Original</label>
                    <input 
                      type="number" step="0.01"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                      value={editingDeal.originalPrice || ''}
                      onChange={e => setEditingDeal({...editingDeal, originalPrice: e.target.value ? parseFloat(e.target.value) : undefined})}
                    />
                 </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Cupom</label>
                    <input 
                      type="text"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                      value={editingDeal.couponCode || ''}
                      onChange={e => setEditingDeal({...editingDeal, couponCode: e.target.value})}
                    />
                 </div>
               </div>
               
               {/* CATEGORY SELECTOR */}
               <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
                  <select 
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white"
                    value={editingDeal.category}
                    onChange={e => setEditingDeal({...editingDeal, category: e.target.value})}
                  >
                    {DEAL_CATEGORIES.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
               </div>

               <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Link (URL Final/Afiliado)</label>
                  <input 
                    type="text" 
                    className="w-full border border-blue-300 bg-blue-50 rounded-lg px-3 py-2 text-sm font-mono text-blue-800"
                    value={editingDeal.link}
                    onChange={e => setEditingDeal({...editingDeal, link: e.target.value})}
                  />
                  <p className="text-xs text-gray-400 mt-1">O link não será re-otimizado automaticamente. Cole o link final desejado.</p>
               </div>

               <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Imagem URL</label>
                  <div className="flex gap-4">
                    <input 
                      type="text" 
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                      value={editingDeal.imageUrl}
                      onChange={e => setEditingDeal({...editingDeal, imageUrl: e.target.value})}
                    />
                    <img src={editingDeal.imageUrl} className="w-10 h-10 object-contain border rounded" alt="Preview" />
                  </div>
               </div>

               <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                  <textarea 
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm h-24"
                    value={editingDeal.description}
                    onChange={e => setEditingDeal({...editingDeal, description: e.target.value})}
                  />
               </div>

               <div className="flex justify-end pt-4 gap-3 border-t border-gray-100">
                 <button type="button" onClick={() => setEditingDeal(null)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Cancelar</button>
                 <button type="submit" className="px-6 py-2 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-lg flex items-center gap-2">
                   <Save size={18} /> Salvar Alterações
                 </button>
               </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};