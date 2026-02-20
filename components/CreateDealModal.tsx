import React, { useState } from 'react';
import { X, Sparkles, Loader2, Store, Tag, Image as ImageIcon, Link as LinkIcon, Ticket, CreditCard } from 'lucide-react';
import { analyzeDeal } from '../services/geminiService';
import { Deal, DEAL_CATEGORIES, PAYMENT_METHODS } from '../types';

interface CreateDealModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (deal: Omit<Deal, 'id' | 'createdAt' | 'temperature' | 'isHot' | 'status'>) => Promise<void>;
}

export const CreateDealModal: React.FC<CreateDealModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const [loadingAI, setLoadingAI] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  
  const [formData, setFormData] = useState({
    title: '',
    price: '',
    originalPrice: '',
    storeName: '',
    link: '',
    imageUrl: '',
    description: '',
    category: 'Outros',
    couponCode: '',
    paymentMethod: 'À vista'
  });

  if (!isOpen) return null;

  const handleAIAnalyze = async () => {
    if (!formData.title || !formData.price || !formData.storeName) {
      alert("Preencha Título, Preço e Loja para usar a IA.");
      return;
    }

    setLoadingAI(true);
    const result = await analyzeDeal(
      formData.title, 
      parseFloat(formData.price), 
      formData.storeName
    );
    setLoadingAI(false);

    if (result) {
        const matchedCategory = DEAL_CATEGORIES.find(c => c.toLowerCase() === result.category.toLowerCase()) || 'Outros';
        
      setFormData(prev => ({
        ...prev,
        description: result.description,
        category: matchedCategory,
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMessage('');
    
    try {
        await onSubmit({
          title: formData.title,
          price: parseFloat(formData.price),
          originalPrice: formData.originalPrice ? parseFloat(formData.originalPrice) : undefined,
          description: formData.description,
          imageUrl: formData.imageUrl || 'https://via.placeholder.com/400x400?text=Sem+Imagem',
          storeName: formData.storeName,
          link: formData.link,
          category: formData.category || 'Outros',
          couponCode: formData.couponCode || undefined,
          paymentMethod: formData.paymentMethod
        });
        
        onClose();
        setFormData({
          title: '',
          price: '',
          originalPrice: '',
          storeName: '',
          link: '',
          imageUrl: '',
          description: '',
          category: 'Outros',
          couponCode: '',
          paymentMethod: 'À vista'
        });

    } catch (error: any) {
        if (error.message === 'USER_BANNED') {
            setErrorMessage('Sua conta está suspensa. Você não pode enviar ofertas.');
        } else {
            setErrorMessage('Ocorreu um erro ao enviar. Tente novamente.');
        }
    } finally {
        setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose}></div>
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl relative z-10 max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white px-6 py-4 border-b border-gray-100 flex items-center justify-between z-20">
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <Tag className="text-brand-500" />
            Compartilhar Oferta
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {errorMessage && (
            <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-100 text-sm font-bold text-center">
                {errorMessage}
            </div>
          )}

          <div className="flex flex-col md:flex-row gap-6">
            
            <div className="flex-1 space-y-6">
              {/* Link Section */}
              <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                <label className="block text-sm font-medium text-blue-900 mb-1">Link da Oferta</label>
                <div className="relative">
                  <LinkIcon className="absolute left-3 top-3 text-blue-400" size={18} />
                  <input 
                    required
                    type="url" 
                    value={formData.link}
                    onChange={e => setFormData({...formData, link: e.target.value})}
                    placeholder="https://..."
                    className="w-full pl-10 pr-4 py-2 bg-white border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
                  />
                </div>
              </div>

              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Título</label>
                  <input 
                    required
                    type="text" 
                    value={formData.title}
                    onChange={e => setFormData({...formData, title: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
                    placeholder="Ex: iPhone 13"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Loja</label>
                  <div className="relative">
                    <Store className="absolute left-3 top-2.5 text-gray-400" size={18} />
                    <input 
                      required
                      type="text" 
                      value={formData.storeName}
                      onChange={e => setFormData({...formData, storeName: e.target.value})}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
                      placeholder="Ex: Amazon"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Preço Atual</label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-gray-500 text-sm">R$</span>
                    <input 
                      required
                      type="number" 
                      step="0.01"
                      value={formData.price}
                      onChange={e => setFormData({...formData, price: e.target.value})}
                      className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none font-bold text-gray-800"
                      placeholder="0,00"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Original</label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-gray-500 text-sm">R$</span>
                    <input 
                      type="number" 
                      step="0.01"
                      value={formData.originalPrice}
                      onChange={e => setFormData({...formData, originalPrice: e.target.value})}
                      className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none text-gray-500"
                      placeholder="0,00"
                    />
                  </div>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Pagamento</label>
                    <div className="relative">
                        <CreditCard className="absolute left-3 top-2.5 text-gray-400" size={18} />
                        <select
                            value={formData.paymentMethod}
                            onChange={e => setFormData({...formData, paymentMethod: e.target.value})}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none text-sm bg-white"
                        >
                            {PAYMENT_METHODS.map(method => (
                                <option key={method} value={method}>{method}</option>
                            ))}
                        </select>
                    </div>
                </div>
              </div>
                
              <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cupom (Opcional)</label>
                  <div className="relative">
                    <Ticket className="absolute left-3 top-2.5 text-gray-400" size={18} />
                    <input 
                      type="text" 
                      value={formData.couponCode}
                      onChange={e => setFormData({...formData, couponCode: e.target.value})}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none font-mono uppercase text-sm"
                      placeholder="Ex: PROMO10"
                    />
                  </div>
              </div>

            </div>

            {/* Right Column: Image & Desc */}
            <div className="w-full md:w-1/3 flex flex-col gap-4">
               {/* Image Preview */}
               <div className="relative aspect-square rounded-xl overflow-hidden bg-gray-50 border-2 border-dashed border-gray-200 flex items-center justify-center group">
                  {formData.imageUrl ? (
                    <img src={formData.imageUrl} alt="Preview" className="w-full h-full object-contain p-2" onError={(e) => (e.currentTarget.src = 'https://via.placeholder.com/400x400?text=Erro+na+Imagem')} />
                  ) : (
                    <div className="text-center p-4">
                      <ImageIcon className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                      <span className="text-xs text-gray-400">Preview da Imagem</span>
                    </div>
                  )}
                  <input 
                    type="url"
                    value={formData.imageUrl}
                    onChange={e => setFormData({...formData, imageUrl: e.target.value})}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                   <div className="absolute bottom-2 left-2 right-2 bg-white/90 backdrop-blur shadow-sm rounded-lg p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                     <input 
                       type="url" 
                       value={formData.imageUrl}
                       onChange={e => setFormData({...formData, imageUrl: e.target.value})}
                       className="w-full text-xs border-none bg-transparent focus:ring-0 px-2 py-1 text-center"
                       placeholder="Cole a URL da imagem aqui"
                     />
                   </div>
               </div>

               <div className="flex-grow flex flex-col gap-2">
                 <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-gray-700">Descrição</label>
                    <button
                      type="button"
                      onClick={handleAIAnalyze}
                      disabled={loadingAI}
                      className="text-[10px] bg-brand-100 text-brand-700 px-2 py-1 rounded-full flex items-center gap-1 hover:bg-brand-200 transition-colors"
                    >
                      {loadingAI ? <Loader2 size={10} className="animate-spin" /> : <Sparkles size={10} />}
                      Gerar com IA
                    </button>
                 </div>
                 <textarea 
                   required
                   value={formData.description}
                   onChange={e => setFormData({...formData, description: e.target.value})}
                   className="w-full flex-grow px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none resize-none text-sm"
                   placeholder="Descrição do produto..."
                 ></textarea>
                 
                 <label className="text-sm font-medium text-gray-700">Categoria</label>
                 <select 
                   value={formData.category}
                   onChange={e => setFormData({...formData, category: e.target.value})}
                   className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none text-sm bg-white"
                 >
                    {DEAL_CATEGORIES.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                    ))}
                 </select>
               </div>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-100 flex justify-end gap-3">
            <button 
              type="button" 
              onClick={onClose}
              className="px-6 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              disabled={submitting}
              className="px-6 py-2 bg-brand-600 hover:bg-brand-700 text-white font-medium rounded-lg shadow-md hover:shadow-lg transition-all transform active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {submitting && <Loader2 size={16} className="animate-spin" />}
              {submitting ? 'Enviando...' : 'Postar Oferta'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};