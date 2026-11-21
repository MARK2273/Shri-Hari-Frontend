import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api, TENANT_ID } from '../api/client';
import { Factory, Lock, Mail, AlertCircle, ArrowRight, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { Button } from '../components/common/Button';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
      setError(err.response?.data?.message || 'Failed to authenticate. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#F6F7F5] dark:bg-[#111714] text-[#202B26] dark:text-[#EAEFEA]">
      <div className="w-full max-w-md">
        {/* Brand identity */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-xl bg-[#176B52] mx-auto flex items-center justify-center text-white shadow-sm mb-3">
            <Factory className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[#202B26] dark:text-white">
            Shri Hari Packaging
          </h1>
          <p className="text-xs text-[#68746D] dark:text-[#9DAAA2] mt-1">
            Manufacturing & Factory Operations Management
          </p>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 mt-2.5 rounded-md bg-[#EAF4EF] dark:bg-[#172B21] border border-[#ACCFBF] dark:border-[#204938] text-[#176B52] dark:text-[#80C6A5] text-[11px] font-semibold">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Factory Plant: {TENANT_ID}</span>
          </div>
        </div>

        {/* Login Card */}
        <div className="bg-white dark:bg-[#1B2420] border border-[#E5EAE6] dark:border-[#26332C] rounded-xl p-6 sm:p-8 shadow-sm">
          <h2 className="text-base font-bold text-[#202B26] dark:text-white mb-1">
            Sign In to Factory Portal
          </h2>
          <p className="text-xs text-[#68746D] dark:text-[#9DAAA2] mb-5">
            Enter your factory credentials to access your daily tasks.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 rounded-lg bg-[#FDF2F2] dark:bg-[#2A1313] border border-[#FACDCD] dark:border-[#4E1E1E] text-[#A62828] dark:text-[#F68282] text-xs flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span className="leading-snug">{error}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-[#202B26] dark:text-[#EAEFEA] mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#68746D] dark:text-[#9DAAA2] absolute left-3 top-3 pointer-events-none" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@shriharipack.com"
                  className="w-full pl-9 pr-3 py-2 bg-white dark:bg-[#151D19] border border-[#CBD5CD] dark:border-[#2E3C34] rounded-lg text-xs sm:text-sm text-[#202B26] dark:text-white placeholder-[#8A9790] focus:outline-none focus:ring-2 focus:ring-[#176B52]/20 focus:border-[#176B52] transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#202B26] dark:text-[#EAEFEA] mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#68746D] dark:text-[#9DAAA2] absolute left-3 top-3 pointer-events-none" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2 bg-white dark:bg-[#151D19] border border-[#CBD5CD] dark:border-[#2E3C34] rounded-lg text-xs sm:text-sm text-[#202B26] dark:text-white placeholder-[#8A9790] focus:outline-none focus:ring-2 focus:ring-[#176B52]/20 focus:border-[#176B52] transition-colors"
                />
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={isLoading}
              loadingText="Signing In..."
              className="w-full mt-2"
            >
              Sign In to ERP
            </Button>
          </form>

          <div className="mt-6 pt-4 border-t border-[#E5EAE6] dark:border-[#26332C] text-center">
            <p className="text-[11px] text-[#68746D] dark:text-[#9DAAA2]">
              Need help accessing your account? Please contact your factory administrator.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
