import React, { useState } from 'react';
import { Lock, Mail, ArrowRight, ShieldCheck } from 'lucide-react';

export default function LoginView({ onLogin }) {
  const [email, setEmail] = useState('ventas.minadesign@gmail.com');
  const [password, setPassword] = useState('1210');
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

  const selectAccount = (mail) => {
    setEmail(mail);
    setPassword('1210');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#121314]">
      <div className="w-full max-w-sm bg-[#1c1d1f] border border-gray-800 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6">
        {/* Brand */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-orange-600 flex items-center justify-center mx-auto shadow-lg shadow-orange-950 font-extrabold text-2xl text-white">
            M
          </div>
          <h1 className="text-xl font-bold tracking-tight text-gray-100">MINA DESIGN ERP</h1>
          <p className="text-xs text-gray-400">Sistema Integral de Gestión y Control</p>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-800/80 text-rose-300 text-xs text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="text-gray-400 uppercase font-bold text-[10px] block mb-1">
              Correo Electrónico
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3 top-2.5 text-gray-500" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="usuario@minadesign.com"
                className="w-full bg-[#151617] text-gray-100 pl-9 pr-3 py-2.5 rounded-lg border border-gray-700 focus:outline-none focus:ring-1 focus:ring-orange-500 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="text-gray-400 uppercase font-bold text-[10px] block mb-1">
              Contraseña
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-2.5 text-gray-500" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••"
                className="w-full bg-[#151617] text-gray-100 pl-9 pr-3 py-2.5 rounded-lg border border-gray-700 focus:outline-none focus:ring-1 focus:ring-orange-500 text-sm"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 bg-orange-600 hover:bg-orange-500 text-white font-semibold rounded-lg shadow-lg shadow-orange-950/40 flex items-center justify-center gap-2 active:scale-95 transition-all text-xs"
          >
            <span>{loading ? 'Accediendo...' : 'Iniciar Sesión'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Quick select demo profiles */}
        <div className="border-t border-gray-800/80 pt-4 space-y-2">
          <span className="text-[10px] uppercase font-bold text-gray-500 block text-center">
            Perfiles de Acceso Rápido
          </span>
          <div className="grid grid-cols-3 gap-1.5 text-[10px]">
            <button
              onClick={() => selectAccount('ventas.minadesign@gmail.com')}
              className="p-1.5 bg-[#151617] hover:bg-gray-800 rounded border border-gray-700/60 text-gray-300 transition-colors"
            >
              Admin
            </button>
            <button
              onClick={() => selectAccount('produccion.minadesign@gmail.com')}
              className="p-1.5 bg-[#151617] hover:bg-gray-800 rounded border border-gray-700/60 text-gray-300 transition-colors"
            >
              Producción
            </button>
            <button
              onClick={() => selectAccount('cotizaciones.minadesign@gmail.com')}
              className="p-1.5 bg-[#151617] hover:bg-gray-800 rounded border border-gray-700/60 text-gray-300 transition-colors"
            >
              Cotizador
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
