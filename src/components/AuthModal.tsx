import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { X, Lock, Mail, User as UserIcon } from 'lucide-react';

export const AuthModal: React.FC = () => {
  const { isAuthModalOpen, setIsAuthModalOpen, login, register } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('admin@nexusai.io');
  const [password, setPassword] = useState('admin123');
  const [name, setName] = useState('Senior Architect');
  const [isLoading, setIsLoading] = useState(false);

  if (!isAuthModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (mode === 'login') {
      await login(email, password);
    } else {
      await register(name, email, password);
    }

    setIsLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
      <div className="relative w-full max-w-md glass-panel rounded-2xl border border-slate-800 shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                {mode === 'login' ? 'JWT Authentication' : 'Create User Account'}
              </h2>
              <p className="text-xs text-slate-400">
                {mode === 'login' ? 'Sign in to access protected API endpoints' : 'Register new cluster operator token'}
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsAuthModalOpen(false)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          
          {mode === 'register' && (
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Full Name:</label>
              <div className="relative">
                <UserIcon className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  placeholder="Senior Solutions Architect"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Email Address:</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                placeholder="admin@nexusai.io"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Password:</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50"
              />
            </div>
          </div>

          {/* Quick Demo Credentials Fill */}
          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 space-y-1 text-[11px] text-slate-400">
            <div className="flex justify-between items-center text-cyan-400 font-semibold">
              <span>Demo JWT Identity:</span>
              <button
                type="button"
                onClick={() => {
                  setEmail('admin@nexusai.io');
                  setPassword('admin123');
                }}
                className="hover:underline text-[10px]"
              >
                Auto-fill
              </button>
            </div>
            <div>Email: <strong className="text-slate-300">admin@nexusai.io</strong></div>
            <div>Password: <strong className="text-slate-300">admin123</strong></div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold shadow-lg shadow-cyan-500/20 transition-all"
          >
            {isLoading ? 'Processing JWT Session...' : mode === 'login' ? 'Authenticate (Issue JWT)' : 'Create Operator Account'}
          </button>

          {/* Mode Switcher */}
          <div className="text-center pt-2 text-slate-400 text-xs">
            {mode === 'login' ? (
              <span>
                Need a token identity?{' '}
                <button
                  type="button"
                  onClick={() => setMode('register')}
                  className="text-cyan-400 font-medium hover:underline"
                >
                  Register Account
                </button>
              </span>
            ) : (
              <span>
                Already registered?{' '}
                <button
                  type="button"
                  onClick={() => setMode('login')}
                  className="text-cyan-400 font-medium hover:underline"
                >
                  Sign In
                </button>
              </span>
            )}
          </div>

        </form>

      </div>
    </div>
  );
};
