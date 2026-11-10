import React, { useState, useRef } from 'react';
import { Lock, User, ArrowRight, ShieldCheck } from 'lucide-react';
import ThemeToggle from '../components/ThemeToggle';

export default function LoginView({ onLogin }) {
  const [email, setEmail] = useState('ventas.minadesign@gmail.com');
  const [password, setPassword] = useState('');
  const passwordRef = useRef(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await onLogin(email, password);
    } catch (err) {
      setError(err.message || 'Credenciales incorrectas');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-[#0c1f38] via-[#173865] to-[#1e4a85] relative">
      <ThemeToggle className="absolute top-4 right-4 bg-white/90 border-white/40" />
      <div className="w-full max-w-md bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border border-white/40 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 animate-modal-in">
        {/* Brand */}
        <div className="text-center space-y-1.5">
          <div className="w-16 h-16 rounded-2xl bg-[#173865] flex items-center justify-center mx-auto shadow-lg border-2 border-white/20 font-black text-2xl text-white mb-2">
            M
          </div>
          <h1 className="text-2xl font-black tracking-tight text-gray-900 dark:text-gray-100">MINA DESIGN</h1>
          <p className="text-xs font-bold text-[#173865] dark:text-blue-400 tracking-widest uppercase">Sistema de Gestión & Dashboard</p>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-[#173865] text-[11px] font-bold mt-2 border border-blue-100">
            <ShieldCheck className="w-3.5 h-3.5" /> Acceso Privado y Seguro
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs font-bold text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="text-gray-600 dark:text-gray-300 uppercase font-bold text-xs tracking-wide block mb-1 pl-1">
              Usuario o Correo Electrónico
            </label>
            <div className="relative flex items-center">
              <User className="w-4 h-4 absolute left-4 text-gray-400" />
              <input
                type="text"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-100 pl-10 pr-4 py-2.5 rounded-full border border-gray-200 dark:border-gray-700 font-bold focus:outline-none focus:ring-2 focus:ring-[#173865] focus:bg-white transition shadow-inner text-xs"
              />
            </div>
          </div>

          <div>
            <label className="text-gray-600 dark:text-gray-300 uppercase font-bold text-xs tracking-wide block mb-1 pl-1">
              Contraseña
            </label>
            <div className="relative flex items-center">
              <Lock className="w-4 h-4 absolute left-4 text-gray-400" />
              <input
                type="password"
                ref={passwordRef}
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-100 pl-10 pr-4 py-2.5 rounded-full border border-gray-200 dark:border-gray-700 font-bold focus:outline-none focus:ring-2 focus:ring-[#173865] focus:bg-white transition shadow-inner text-xs tracking-widest"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-[#173865] hover:bg-blue-900 text-white font-bold rounded-full shadow-md hover:shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-all text-sm disabled:opacity-50"
          >
            <span>{loading ? 'Verificando...' : 'Entrar al Dashboard'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Acceso exclusivo Administrador */}
        <div className="border-t border-gray-100 dark:border-gray-800 pt-4 flex items-center justify-center gap-2 text-gray-400 text-xs">
          <ShieldCheck className="w-4 h-4 text-[#173865]" />
          <span className="text-[11px] font-semibold tracking-wide">Acceso Administrador</span>
        </div>
      </div>
    </div>
  );
}
