import React, { useState, useRef, useEffect } from 'react';
import { Search, Plus, Bell, User as UserIcon, Menu, PiggyBank, LogOut, Shield, ChevronDown } from 'lucide-react';
import { UserProfile } from '../types';

interface NavbarProps {
  onOpenModal: () => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  user: UserProfile | null;
  onAuthClick: () => void;
  onLogout: () => void;
  onAdminClick: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ 
  onOpenModal, searchTerm, setSearchTerm, user, onAuthClick, onLogout, onAdminClick 
}) => {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fecha o dropdown se clicar fora
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <nav className="sticky top-0 z-40 bg-white border-b border-gray-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 cursor-pointer group" onClick={() => window.location.reload()}>
              <div className="bg-brand-600 p-2 rounded-xl transform group-hover:rotate-12 transition-transform duration-300 shadow-lg shadow-brand-200">
                <PiggyBank size={24} className="text-white" />
              </div>
              <div className="flex flex-col">
                <span className="font-extrabold text-xl tracking-tight text-gray-900 leading-none">Mão de Vaca</span>
                <span className="text-[10px] font-bold text-brand-600 uppercase tracking-widest leading-none mt-0.5">Clube de Ofertas</span>
              </div>
            </div>
          </div>

          {/* Search Bar */}
          <div className="flex-1 max-w-2xl mx-4 hidden sm:block">
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search size={18} className="text-gray-400 group-focus-within:text-brand-500 transition-colors" />
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-full leading-5 bg-gray-50 text-gray-900 placeholder-gray-400 focus:outline-none focus:bg-white focus:border-brand-300 focus:ring-4 focus:ring-brand-50 transition-all duration-200 sm:text-sm"
                placeholder="O que você quer economizar hoje?"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            {user?.role === 'admin' && (
              <button 
                onClick={onAdminClick}
                className="hidden md:flex items-center gap-1 bg-gray-800 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-gray-700 transition-colors"
              >
                <Shield size={12} />
                Painel Admin
              </button>
            )}

            <button 
              onClick={onOpenModal}
              className="hidden sm:flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white px-5 py-2.5 rounded-full font-semibold text-sm transition-all shadow-md hover:shadow-lg shadow-brand-200 transform hover:-translate-y-0.5"
            >
              <Plus size={18} strokeWidth={2.5} />
              Enviar Oferta
            </button>

            {user ? (
               <div className="relative" ref={dropdownRef}>
                 <button 
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="flex items-center gap-2 p-1 pl-2 hover:bg-gray-50 rounded-full transition-colors ml-1 border border-transparent hover:border-gray-200"
                 >
                   <div className="text-right hidden md:block">
                     <p className="text-xs font-bold text-gray-700 max-w-[100px] truncate">{user.email.split('@')[0]}</p>
                   </div>
                   <div className="w-9 h-9 bg-brand-100 rounded-full flex items-center justify-center border-2 border-white shadow-sm overflow-hidden text-brand-700 font-bold">
                     {user.email[0].toUpperCase()}
                   </div>
                   <ChevronDown size={14} className={`text-gray-400 transition-transform duration-200 ${isProfileOpen ? 'rotate-180' : ''}`} />
                 </button>
                 
                 {/* Dropdown - Click based instead of hover */}
                 {isProfileOpen && (
                   <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 py-1 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                     {user.role === 'admin' && (
                        <button 
                          onClick={() => {
                            onAdminClick();
                            setIsProfileOpen(false);
                          }} 
                          className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 md:hidden font-medium"
                        >
                          <Shield size={14} /> Admin
                        </button>
                     )}
                     <button 
                      onClick={() => {
                        onLogout();
                        setIsProfileOpen(false);
                      }} 
                      className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 font-medium"
                     >
                       <LogOut size={14} /> Sair
                     </button>
                   </div>
                 )}
               </div>
            ) : (
              <button 
                onClick={onAuthClick}
                className="flex items-center gap-2 text-gray-600 font-bold text-sm hover:text-brand-600 hover:bg-brand-50 px-4 py-2 rounded-full transition-colors"
              >
                <UserIcon size={18} />
                Entrar
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};