import React, { useState } from 'react';
import { Deal } from '../types';
import { Flame, ExternalLink, ThumbsUp, MessageCircle, Copy, Check, TrendingDown, Flag, AlertTriangle } from 'lucide-react';
import { upvoteDeal, reportDealExpired } from '../services/dealService';
import { supabase } from '../lib/supabase';
import { getCurrentProfile } from '../services/authService';

interface DealCardProps {
  deal: Deal;
}

export const DealCard: React.FC<DealCardProps> = ({ deal }) => {
  const [copied, setCopied] = useState(false);
  const [temperature, setTemperature] = useState(deal.temperature);
  const [hasVoted, setHasVoted] = useState(false);
  const [isAnimatingVote, setIsAnimatingVote] = useState(false);
  
  // Estado local para controle imediato do reporte
  const [isReported, setIsReported] = useState(deal.reportStatus === 'pending_review');

  const handleCopy = (e: React.MouseEvent) => {
    e.preventDefault();
    if (deal.couponCode) {
      navigator.clipboard.writeText(deal.couponCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleVote = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      alert("Faça login para esquentar ofertas!");
      return;
    }
    
    if (hasVoted) return;

    // Optimistic UI
    setHasVoted(true);
    setIsAnimatingVote(true);
    setTemperature(prev => prev + 1);

    const { success, newTemp } = await upvoteDeal(deal.id);
    
    if (success && newTemp) {
        setTemperature(newTemp);
    } else if (!success) {
        // Revert
        setHasVoted(false);
        setTemperature(prev => prev - 1);
        if(!newTemp) alert("Erro ao votar ou você já votou.");
    }
    
    setTimeout(() => setIsAnimatingVote(false), 500);
  };

  const handleReport = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      alert("Faça login para reportar ofertas.");
      return;
    }

    // Verificação de banimento em tempo real
    const profile = await getCurrentProfile();
    if (profile?.is_banned) {
        alert("🚫 VOCÊ ESTÁ BANIDO\nUsuários banidos não podem reportar ofertas.");
        return;
    }

    if (isReported) return;

    if (confirm("Essa oferta expirou ou o preço mudou? Ao confirmar, enviaremos para análise.")) {
      try {
        const success = await reportDealExpired(deal.id);
        if (success) {
            setIsReported(true);
            alert("Obrigado! Um administrador irá verificar se a oferta expirou.");
        } else {
            alert("Erro ao enviar reporte.");
        }
      } catch (error: any) {
        if (error.message === 'USER_BANNED') {
            alert("🚫 VOCÊ ESTÁ BANIDO\nUsuários banidos não podem reportar ofertas.");
        } else {
            alert("Erro inesperado ao reportar.");
        }
      }
    }
  };

  const affiliateLink = `${deal.link}${deal.link.includes('?') ? '&' : '?'}ref=maodevaca_app`;

  const discountPercentage = deal.originalPrice 
    ? Math.round(((deal.originalPrice - deal.price) / deal.originalPrice) * 100) 
    : 0;

  return (
    <div className="bg-white rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)] border border-gray-100 transition-all duration-300 overflow-hidden flex flex-col min-h-full transform hover:-translate-y-1">
      {/* Image Area */}
      <div className="relative h-56 w-full p-6 flex items-center justify-center bg-white border-b border-gray-50">
        <img 
          src={deal.imageUrl} 
          alt={deal.title} 
          className="max-h-full max-w-full object-contain mix-blend-multiply transition-transform duration-300 hover:scale-105"
        />
        {(deal.isHot || temperature > 50) && (
          <div className="absolute top-3 left-3 bg-red-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1 shadow-sm uppercase tracking-wide animate-pulse">
            <Flame size={12} fill="currentColor" />
            Pegando Fogo
          </div>
        )}
        {discountPercentage > 15 && (
          <div className="absolute bottom-3 right-3 bg-money-100 text-money-700 text-xs font-bold px-2.5 py-1 rounded-lg border border-money-200 flex items-center gap-1">
            <TrendingDown size={14} />
            {discountPercentage}% OFF
          </div>
        )}
      </div>

      {/* Content Area */}
      <div className="p-5 flex flex-col flex-grow">
        <div className="flex items-center justify-between mb-2">
           <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
             {deal.category}
           </span>
           <span className="text-[10px] font-bold text-brand-600 bg-brand-50 px-2 py-0.5 rounded-full border border-brand-100">
             {deal.storeName}
           </span>
        </div>

        <h3 className="font-bold text-gray-800 text-lg leading-snug mb-3 line-clamp-2 hover:text-brand-600 transition-colors">
          <a href={affiliateLink} target="_blank" rel="noopener noreferrer">{deal.title}</a>
        </h3>

        <div className="mt-auto">
          <div className="flex flex-col mb-4 bg-gray-50 p-3 rounded-xl border border-gray-100">
             {deal.originalPrice && (
               <span className="text-xs text-gray-400 line-through mb-0.5">
                 De: R$ {deal.originalPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
               </span>
             )}
             <div className="flex items-baseline gap-1">
               <span className="text-sm font-medium text-gray-500">Por:</span>
               <span className="text-2xl font-extrabold text-money-600">
                 R$ {deal.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
               </span>
             </div>
             <p className="text-xs text-money-600 font-medium mt-1">
               À vista ou no PIX
             </p>
          </div>

          <p className="text-sm text-gray-500 mb-4 line-clamp-2 leading-relaxed">
            {deal.description}
          </p>

          {deal.couponCode && (
            <div 
              onClick={handleCopy}
              className="mb-4 group/coupon relative overflow-hidden bg-gradient-to-r from-accent-500 to-yellow-500 rounded-lg p-[1px] cursor-pointer"
            >
              <div className="bg-white rounded-[7px] p-2 flex items-center justify-between hover:bg-yellow-50 transition-colors">
                <div className="flex items-center gap-2">
                    <div className="bg-yellow-100 p-1 rounded">
                        <Check size={14} className={`text-yellow-700 transition-all ${copied ? 'scale-100' : 'scale-0 hidden'}`} />
                        <Copy size={14} className={`text-yellow-700 transition-all ${copied ? 'scale-0 hidden' : 'scale-100'}`} />
                    </div>
                    <span className="text-xs font-mono font-bold text-gray-700 uppercase tracking-wide">
                        {deal.couponCode}
                    </span>
                </div>
                <span className="text-[10px] font-bold text-yellow-600 uppercase pr-1">
                    {copied ? 'Copiado!' : 'Copiar Cupom'}
                </span>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between gap-3 pt-3 border-t border-gray-100">
            <div className="flex items-center gap-2 text-gray-400">
              <button 
                onClick={handleVote}
                className={`flex items-center gap-1.5 transition-all group/vote px-2 py-1 rounded-md hover:bg-gray-50 ${
                  hasVoted ? 'text-brand-600' : 'hover:text-brand-600 cursor-pointer'
                }`}
              >
                <ThumbsUp 
                  size={18} 
                  className={`transition-transform duration-300 ${
                    hasVoted ? 'fill-current' : 'group-hover/vote:scale-110'
                  } ${isAnimatingVote ? 'scale-125' : ''}`} 
                />
                <span className="text-sm font-semibold">{temperature}°</span>
              </button>
            </div>
            
            <div className="flex items-center gap-2">
                <button
                    onClick={handleReport}
                    disabled={isReported}
                    title={isReported ? "Já reportado" : "Reportar problema"}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${
                        isReported 
                        ? 'bg-red-50 text-red-500 border-red-100 cursor-not-allowed' 
                        : 'bg-white text-gray-400 border-gray-200 hover:text-red-500 hover:border-red-200 hover:bg-red-50'
                    }`}
                >
                    <Flag size={14} fill={isReported ? "currentColor" : "none"} />
                    <span className="hidden sm:inline">{isReported ? 'Análise' : 'Reportar'}</span>
                </button>

                <a 
                href={affiliateLink} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-bold px-4 py-2 rounded-lg transition-all shadow-md hover:shadow-lg shadow-brand-200"
                >
                Pegar
                <ExternalLink size={16} />
                </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};