import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api, TENANT_ID } from '../api/client';
import { Factory, Lock, Mail, AlertCircle, ArrowRight, ShieldCheck } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('admin@shrihari.com');
  const [password, setPassword] = useState('Admin@123');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const response = await api.post('/auth/login', {
        email,
        password,
        tenantSlug: TENANT_ID,
        tenantId: TENANT_ID,
      });

      if (response.data.success) {
        login(response.data.token, response.data.user);
        navigate('/dashboard');
      } else {
        setError(response.data.message || 'Login failed');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to authenticate. Check credentials and server status.');
    } finally {
      setIsLoading(false);
    }
  };

  const fillQuick = (userEmail: string) => {
    setEmail(userEmail);
    setPassword('Admin@123');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-900 via-factory-900 to-slate-950 text-white relative overflow-hidden">
      {/* Decorative gradient orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-500/15 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-brand-600 to-emerald-400 mx-auto flex items-center justify-center text-white shadow-xl shadow-brand-500/25 mb-4">
            <Factory className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-black tracking-tight text-white">Shri Hari Packaging</h2>
          <p className="text-xs text-slate-400 mt-1">Multi-Tenant Manufacturing & Traceability ERP</p>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 mt-3 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-400 text-[11px] font-semibold">
            <ShieldCheck className="w-3.5 h-3.5" />
            Tenant: {TENANT_ID}
          </div>
        </div>

        <div className="bg-white/10 dark:bg-factory-900/60 backdrop-blur-xl border border-white/15 dark:border-slate-800 rounded-3xl p-8 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@shrihari.com"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950/60 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950/60 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-3 px-4 bg-gradient-to-r from-brand-600 to-emerald-500 hover:from-brand-500 hover:to-emerald-400 text-white font-bold text-xs rounded-xl shadow-lg shadow-brand-500/25 flex items-center justify-center gap-2 transition-all duration-200 disabled:opacity-50"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  Sign In to Factory
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Logins */}
          <div className="mt-6 pt-5 border-t border-white/10 text-center">
            <p className="text-[11px] text-slate-400 mb-2 font-medium">Quick Demo Profiles (Click to test):</p>
            <div className="flex flex-wrap justify-center gap-2">
              <button
                type="button"
                onClick={() => fillQuick('admin@shrihari.com')}
                className="px-2.5 py-1 text-[11px] font-semibold bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-emerald-400 transition-colors"
              >
                Factory Admin
              </button>
              <button
                type="button"
                onClick={() => fillQuick('supervisor@shrihari.com')}
                className="px-2.5 py-1 text-[11px] font-semibold bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sky-400 transition-colors"
              >
                Supervisor
              </button>
              <button
                type="button"
                onClick={() => fillQuick('operator@shrihari.com')}
                className="px-2.5 py-1 text-[11px] font-semibold bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-amber-400 transition-colors"
              >
                Operator
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
