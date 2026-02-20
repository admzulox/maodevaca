import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { X, Mail, Lock, LogIn, UserPlus, AlertCircle, KeyRound, ChevronLeft } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [view, setView] = useState<'login' | 'signup' | 'forgot'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMsg('');

    try {
      if (view === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        onSuccess();
        onClose();
      } else if (view === 'signup') {
        const { error } = await supabase.auth.signUp({ 
          email, 
          password,
          options: {
            emailRedirectTo: window.location.origin 
          }
        });
        if (error) throw error;
        alert('Cadastro realizado! Verifique seu email e clique no link para ativar a conta.');
        onSuccess();
        onClose();
      } else if (view === 'forgot') {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: window.location.origin,
        });
        if (error) throw error;
        setMsg('Email de recuperação enviado! Verifique sua caixa de entrada.');
      }
    } catch (err: any) {
      if (err.message.includes('User already registered')) {
        setError('Este email já possui cadastro. Tente fazer login.');
      } else if (err.message.includes('Invalid login credentials')) {
        setError('Email ou senha incorretos.');
      } else {
        setError(err.message || 'Ocorreu um erro.');
      }
    } finally {
      setLoading(false);
    }
  };

  const getTitle = () => {
      switch(view) {
          case 'login': return 'Bem-vindo de volta!';
          case 'signup': return 'Crie sua conta';
          case 'forgot': return 'Recuperar Senha';
      }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl relative z-10 overflow-hidden">
        <div className="bg-brand-600 p-6 text-center">
          <h2 className="text-2xl font-bold text-white mb-1">
            {getTitle()}
          </h2>
          <p className="text-brand-100 text-sm">Entre para economizar e compartilhar.</p>
          <button onClick={onClose} className="absolute top-4 right-4 text-white/80 hover:text-white">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-5">
          {error && (
            <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg flex items-center gap-2">
              <AlertCircle size={16} />
              {error}
            </div>
          )}
          {msg && (
            <div className="bg-green-50 text-green-700 text-sm p-3 rounded-lg flex items-center gap-2">
              <KeyRound size={16} />
              {msg}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 text-gray-400" size={18} />
              <input 
                type="email" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none"
                placeholder="seu@email.com"
              />
            </div>
          </div>

          {view !== 'forgot' && (
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Senha</label>
                <div className="relative">
                <Lock className="absolute left-3 top-3 text-gray-400" size={18} />
                <input 
                    type="password" 
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none"
                    placeholder="••••••••"
                />
                </div>
            </div>
          )}

          {view === 'login' && (
              <div className="flex justify-end">
                  <button 
                    type="button" 
                    onClick={() => { setView('forgot'); setError(''); setMsg(''); }}
                    className="text-xs font-semibold text-brand-600 hover:text-brand-800 hover:underline"
                  >
                      Esqueceu a senha?
                  </button>
              </div>
          )}

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-brand-600 hover:bg-brand-700 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-brand-200 transform active:scale-95 flex items-center justify-center gap-2"
          >
            {loading ? 'Carregando...' : view === 'login' ? (
              <> <LogIn size={18} /> Entrar </>
            ) : view === 'signup' ? (
              <> <UserPlus size={18} /> Cadastrar </>
            ) : (
                <> <Mail size={18} /> Enviar Link </>
            )}
          </button>

          <div className="text-center pt-2 border-t border-gray-100">
            {view === 'forgot' ? (
                <button 
                type="button"
                onClick={() => { setView('login'); setError(''); setMsg(''); }}
                className="text-gray-600 hover:text-brand-800 text-sm font-semibold hover:underline flex items-center justify-center gap-1"
              >
                <ChevronLeft size={14} /> Voltar para Login
              </button>
            ) : (
                <button 
                type="button"
                onClick={() => { setView(view === 'login' ? 'signup' : 'login'); setError(''); setMsg(''); }}
                className="text-brand-600 hover:text-brand-800 text-sm font-semibold hover:underline"
                >
                {view === 'login' ? 'Não tem conta? Cadastre-se' : 'Já tem conta? Faça login'}
                </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};