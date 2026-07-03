import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Lock, LogIn } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  fallbackTitle?: string;
  fallbackDescription?: string;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  fallbackTitle = 'Authentication Required',
  fallbackDescription = 'This section contains protected task processing endpoints and queue controls. Please sign in with your email and password to proceed.',
}) => {
  const { isAuthenticated, setIsAuthModalOpen } = useAuth();

  if (!isAuthenticated) {
    return (
      <div className="glass-panel p-12 rounded-2xl border border-slate-800 text-center space-y-4 max-w-xl mx-auto my-8">
        <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 flex items-center justify-center mx-auto shadow-lg shadow-cyan-500/10">
          <Lock className="w-6 h-6 animate-pulse-subtle" />
        </div>
        <div className="space-y-1">
          <h3 className="text-lg font-bold text-white">{fallbackTitle}</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">{fallbackDescription}</p>
        </div>
        <button
          onClick={() => setIsAuthModalOpen(true)}
          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold text-xs shadow-lg shadow-cyan-500/20 transition-all flex items-center space-x-2 mx-auto"
        >
          <LogIn className="w-4 h-4" />
          <span>Sign In / Sign Up</span>
        </button>
      </div>
    );
  }

  return <>{children}</>;
};
