import React from 'react';
import { DEAL_CATEGORIES } from '../types';
import { Smartphone, Laptop, Shirt, Home, Gamepad, ShoppingBag, Gift, TrendingUp, Tag, Wrench, Dumbbell, BookOpen, Sparkles } from 'lucide-react';

interface SidebarProps {
  onCategorySelect?: (category: string) => void;
  selectedCategory?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({ onCategorySelect, selectedCategory }) => {
  
  // Mapeamento de ícones para as categorias definidas em types.ts
  const getIcon = (category: string) => {
    switch (category) {
      case 'Eletrônicos': return <Smartphone size={18} />;
      case 'Informática': return <Laptop size={18} />;
      case 'Smartphones': return <Smartphone size={18} />;
      case 'Moda': return <Shirt size={18} />;
      case 'Casa e Jardim': return <Home size={18} />;
      case 'Games': return <Gamepad size={18} />;
      case 'Mercado': return <ShoppingBag size={18} />;
      case 'Livros': return <BookOpen size={18} />;
      case 'Ferramentas': return <Wrench size={18} />;
      case 'Beleza': return <Sparkles size={18} />;
      case 'Esporte': return <Dumbbell size={18} />;
      default: return <Tag size={18} />;
    }
  };

  const stores = ['Amazon', 'Mercado Livre', 'AliExpress', 'Shopee', 'Magalu', 'KaBuM!'];

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
        <h3 className="font-extrabold text-gray-900 mb-4 px-1 text-sm uppercase tracking-wide flex items-center gap-2">
            <TrendingUp size={16} className="text-brand-500" />
            Departamentos
        </h3>
        <ul className="space-y-1">
          {DEAL_CATEGORIES.map((cat, idx) => (
            <li key={idx}>
              <button 
                onClick={() => onCategorySelect && onCategorySelect(cat)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors text-sm font-medium group text-left ${
                  selectedCategory === cat 
                    ? 'bg-brand-100 text-brand-700' 
                    : 'text-gray-600 hover:bg-brand-50 hover:text-brand-700'
                }`}
              >
                <span className={`${selectedCategory === cat ? 'text-brand-600' : 'text-gray-400 group-hover:text-brand-500'} transition-colors`}>
                  {getIcon(cat)}
                </span>
                {cat}
              </button>
            </li>
          ))}
          <li>
            <button 
              onClick={() => onCategorySelect && onCategorySelect('')}
              className="w-full flex items-center gap-3 px-3 py-2.5 text-brand-600 hover:bg-brand-50 rounded-xl transition-colors text-sm font-bold text-left"
            >
              <Gift size={18} />
              Ver tudo
            </button>
          </li>
        </ul>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
         <h3 className="font-extrabold text-gray-900 mb-4 px-1 text-sm uppercase tracking-wide">Top Lojas</h3>
         <div className="flex flex-wrap gap-2">
            {stores.map((store, idx) => (
              <button 
                key={idx} 
                onClick={() => onCategorySelect && onCategorySelect(store)} // Reusa a busca para lojas
                className="px-3 py-1.5 bg-gray-50 border border-gray-200 text-gray-600 text-xs font-semibold rounded-lg cursor-pointer hover:bg-white hover:border-brand-300 hover:text-brand-600 hover:shadow-sm transition-all"
              >
                {store}
              </button>
            ))}
         </div>
      </div>

      <div className="relative overflow-hidden bg-gradient-to-br from-brand-700 to-purple-900 rounded-2xl p-6 text-white text-center shadow-lg shadow-brand-200">
        <div className="absolute top-0 right-0 -mr-4 -mt-4 w-24 h-24 bg-white opacity-10 rounded-full blur-xl"></div>
        <div className="relative z-10">
            <h4 className="font-bold text-lg mb-2">Clube Mão de Vaca</h4>
            <p className="text-brand-100 text-sm mb-5 leading-relaxed">Não perca nenhum bug de preço! Entre no nosso grupo VIP.</p>
            <button className="w-full bg-white text-brand-700 font-bold py-2.5 rounded-xl hover:bg-brand-50 transition-colors shadow-lg transform active:scale-95 text-sm">
            Entrar no Grupo
            </button>
        </div>
      </div>
    </div>
  );
};