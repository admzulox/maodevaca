import React, { useState, useMemo, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { DealCard } from './components/DealCard';
import { CreateDealModal } from './components/CreateDealModal';
import { AuthModal } from './components/AuthModal';
import { AdminPanel } from './components/AdminPanel';
import { Deal, SortOption, UserProfile } from './types';
import { Flame, Clock, Sparkles, Loader2, X, CreditCard } from 'lucide-react';
import { getDeals, createDeal } from './services/dealService';
import { getCurrentProfile, signOut } from './services/authService';

function App() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  
  const [user, setUser] = useState<UserProfile | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>(SortOption.HOTTEST);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedPayment, setSelectedPayment] = useState('');

  // Carregar ofertas e perfil ao iniciar
  useEffect(() => {
    loadDeals();
    checkUser();
  }, []);

  const checkUser = async () => {
    const profile = await getCurrentProfile();
    setUser(profile);
  };

  const loadDeals = async () => {
    setLoading(true);
    const data = await getDeals();
    setDeals(data);
    setLoading(false);
  };

  const handleCreateDealClick = async () => {
    if (!user) {
      setIsAuthModalOpen(true);
      return;
    }

    // Busca o perfil atualizado direto do banco para garantir que não está usando cache antigo
    const currentProfile = await getCurrentProfile();
    
    // Bloqueia se estiver banido
    if (currentProfile?.is_banned) {
        alert("🚫 ACESSO NEGADO\n\nVocê está banido da comunidade e não pode enviar novas ofertas.\nEntre em contato com o suporte se achar que foi um erro.");
        return;
    }

    setIsModalOpen(true);
  };

  const handleCreateDeal = async (newDealData: Omit<Deal, 'id' | 'createdAt' | 'temperature' | 'isHot' | 'status'>) => {
    try {
      const savedDeal = await createDeal(newDealData);
      if (savedDeal) {
        alert("Oferta enviada para aprovação! Assim que um administrador verificar, ela aparecerá na lista.");
        setIsModalOpen(false);
      } else {
        throw new Error("Erro ao salvar");
      }
    } catch (error: any) {
      if (error.message === 'USER_BANNED') {
          alert("🚫 ERRO: Sua conta está banida. Ação bloqueada pelo servidor.");
          setIsModalOpen(false);
      } else {
          // Deixa o erro propagar para o modal exibir se não for banimento
          throw error;
      }
    }
  };

  const handleLogout = async () => {
    await signOut();
    setUser(null);
    setShowAdminPanel(false);
  };

  const handleCategorySelect = (category: string) => {
    setSelectedCategory(category);
    setSearchTerm(''); // Limpa busca textual ao selecionar categoria
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePaymentSelect = (method: string) => {
      setSelectedPayment(method);
      window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  const filteredDeals = useMemo(() => {
    let result = deals;

    // Filtro por categoria (Sidebar)
    if (selectedCategory) {
        // Verifica se é uma loja (ex: Amazon) ou Categoria
        result = result.filter(deal => 
            deal.category === selectedCategory || 
            deal.storeName.toLowerCase().includes(selectedCategory.toLowerCase())
        );
    }
    
    // Filtro por Pagamento
    if (selectedPayment) {
        result = result.filter(deal => deal.paymentMethod === selectedPayment);
    }

    // Filtro por busca textual
    if (searchTerm) {
        result = result.filter(deal => 
            deal.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            deal.storeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            deal.category.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }

    if (sortBy === SortOption.HOTTEST) {
      result.sort((a, b) => (b.temperature || 0) - (a.temperature || 0));
    } else {
      result.sort((a, b) => {
        const dateA = new Date(a.createdAt).getTime();
        const dateB = new Date(b.createdAt).getTime();
        return dateB - dateA;
      });
    }

    return result;
  }, [deals, searchTerm, sortBy, selectedCategory, selectedPayment]);

  return (
    <div className="min-h-screen bg-[#f8fafc] font-sans text-gray-900 pb-20 selection:bg-brand-200 selection:text-brand-900">
      <Navbar 
        onOpenModal={handleCreateDealClick} 
        searchTerm={searchTerm}
        setSearchTerm={(term) => { setSearchTerm(term); setSelectedCategory(''); }}
        user={user}
        onAuthClick={() => setIsAuthModalOpen(true)}
        onLogout={handleLogout}
        onAdminClick={() => setShowAdminPanel(!showAdminPanel)}
      />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* Main Content */}
          <div className="flex-1 min-w-0">
            {showAdminPanel && user?.role === 'admin' ? (
              <AdminPanel />
            ) : (
              <>
                {/* Header / Filter Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
                  <div>
                    <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2">
                      {selectedCategory ? `${selectedCategory}` : 'Ofertas em Destaque'}
                      {selectedPayment && <span className="text-lg bg-gray-100 px-3 py-1 rounded-full text-gray-600 font-normal">({selectedPayment})</span>}
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">
                      {selectedCategory ? `Exibindo ofertas em ${selectedCategory}` : 'Selecionadas a dedo pela comunidade Mão de Vaca.'}
                    </p>
                  </div>
                  
                  <div className="flex bg-white p-1 rounded-xl border border-gray-200 shadow-sm self-start sm:self-auto items-center flex-wrap">
                    {(selectedCategory || selectedPayment) && (
                         <button 
                            onClick={() => { setSelectedCategory(''); setSelectedPayment(''); }}
                            className="mr-2 px-3 py-2 text-xs font-bold bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg flex items-center gap-1 transition-colors"
                         >
                            <X size={14} /> Limpar Filtros
                         </button>
                    )}
                    <button 
                      onClick={() => setSortBy(SortOption.HOTTEST)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                        sortBy === SortOption.HOTTEST 
                          ? 'bg-red-50 text-red-600 shadow-sm ring-1 ring-red-100' 
                          : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <Flame size={16} fill={sortBy === SortOption.HOTTEST ? "currentColor" : "none"} />
                      Mais Quentes
                    </button>
                    <div className="w-px bg-gray-200 mx-1 my-1"></div>
                    <button 
                      onClick={() => setSortBy(SortOption.NEWEST)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                        sortBy === SortOption.NEWEST 
                          ? 'bg-blue-50 text-blue-600 shadow-sm ring-1 ring-blue-100' 
                          : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <Clock size={16} />
                      Recentes
                    </button>
                  </div>
                </div>

                {/* Loading State */}
                {loading && (
                  <div className="flex justify-center items-center py-20">
                    <Loader2 size={40} className="text-brand-500 animate-spin" />
                  </div>
                )}

                {/* Deal Grid */}
                {!loading && filteredDeals.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                    {filteredDeals.map(deal => (
                      <DealCard key={deal.id} deal={deal} />
                    ))}
                  </div>
                ) : !loading && (
                  <div className="bg-white rounded-3xl p-16 text-center border border-dashed border-gray-300">
                    <div className="mx-auto w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6">
                      <Sparkles className="text-gray-400" size={40} />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Nada por aqui...</h3>
                    <p className="text-gray-500 max-w-md mx-auto">
                        {selectedCategory || selectedPayment ? 'Nenhuma oferta encontrada com esses filtros.' : 'Parece que os Mãos de Vaca ainda não postaram nada com esse termo.'}
                    </p>
                    {(selectedCategory || selectedPayment) && (
                        <button onClick={() => { setSelectedCategory(''); setSelectedPayment(''); }} className="mt-4 text-brand-600 font-bold hover:underline">
                            Ver todas as ofertas
                        </button>
                    )}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Sidebar (Desktop) */}
          <aside className="hidden lg:block w-80 flex-shrink-0">
            <div className="sticky top-24">
              <Sidebar 
                onCategorySelect={handleCategorySelect} 
                selectedCategory={selectedCategory} 
                onPaymentSelect={handlePaymentSelect}
                selectedPayment={selectedPayment}
              />
            </div>
          </aside>
        </div>
      </main>

      <CreateDealModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSubmit={handleCreateDeal}
      />

      <AuthModal 
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={checkUser}
      />
    </div>
  );
}

export default App;