import React, { useState } from 'react';
import { useTaskContext } from '../context/TaskContext';
import { useAuth } from '../context/AuthContext';
import { 
  Cpu, 
  Plus, 
  Play, 
  Pause, 
  BarChart2, 
  List, 
  Code2, 
  LayoutDashboard, 
  Sliders, 
  Zap,
  Lock,
  LogOut,
  ChevronDown,
  Key,
  Check
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const { 
    activeTab, 
    setActiveTab, 
    tasks, 
    workers, 
    settings, 
    togglePauseQueue, 
    setIsCreateModalOpen, 
    setIsWorkerModalOpen,
    triggerBatchSimulate 
  } = useTaskContext();

  const { user, token, isAuthenticated, setIsAuthModalOpen, logout } = useAuth();
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const [copiedToken, setCopiedToken] = useState(false);

  const processingCount = tasks.filter(t => t.status === 'processing').length;
  const queuedCount = tasks.filter(t => t.status === 'queued' || t.status === 'pending').length;
  const busyWorkers = workers.filter(w => w.status === 'busy').length;

  const handleCopyToken = () => {
    if (token) {
      navigator.clipboard.writeText(token);
      setCopiedToken(true);
      setTimeout(() => setCopiedToken(false), 2000);
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Brand Logo & Platform Title */}
          <div className="flex items-center space-x-3">
            <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-600 shadow-lg shadow-cyan-500/20 text-white font-bold">
              <Cpu className="w-5 h-5 animate-pulse-subtle" />
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500"></span>
              </span>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-base font-bold text-white tracking-wide">NexusAI</h1>
                <span className="px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 rounded-md">
                  v2.4 Core
                </span>
              </div>
              <p className="text-xs text-slate-400">AI Task Processing Platform</p>
            </div>
          </div>

          {/* Center Navigation Tabs */}
          <nav className="hidden md:flex items-center space-x-1 bg-slate-900/80 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'dashboard'
                  ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-md shadow-blue-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>Dashboard</span>
            </button>

            <button
              onClick={() => setActiveTab('tasks')}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all relative ${
                activeTab === 'tasks'
                  ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-md shadow-blue-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>Task Queue</span>
              {(processingCount > 0 || queuedCount > 0) && (
                <span className="ml-1 px-1.5 py-0.2 text-[10px] font-bold bg-cyan-500/20 text-cyan-300 rounded-full border border-cyan-500/30">
                  {processingCount + queuedCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('analytics')}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'analytics'
                  ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-md shadow-blue-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <BarChart2 className="w-3.5 h-3.5" />
              <span>Analytics</span>
            </button>

            <button
              onClick={() => setActiveTab('api')}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'api'
                  ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-md shadow-blue-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Code2 className="w-3.5 h-3.5" />
              <span>API & Webhooks</span>
            </button>
          </nav>

          {/* Right Action Bar */}
          <div className="flex items-center space-x-3">
            
            {/* Session-Driven Header (Sign in ↔ Account Menu) */}
            {isAuthenticated ? (
              <div className="relative">
                <button
                  onClick={() => setIsAccountMenuOpen(!isAccountMenuOpen)}
                  className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-cyan-500/40 text-xs font-medium transition-all"
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                  <span className="text-white font-semibold">{user?.name}</span>
                  <span className="text-[10px] font-mono uppercase bg-cyan-500/10 px-1.5 py-0.2 rounded border border-cyan-500/30 text-cyan-300">
                    {user?.role}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>

                {/* Dropdown Menu */}
                {isAccountMenuOpen && (
                  <div className="absolute right-0 mt-2 w-64 glass-panel rounded-xl border border-slate-800 shadow-2xl p-3 z-50 text-xs space-y-2.5 animate-in fade-in zoom-in-95 duration-150">
                    <div className="pb-2 border-b border-slate-800 space-y-0.5">
                      <p className="font-semibold text-white">{user?.name}</p>
                      <p className="text-[11px] text-slate-400 font-mono truncate">{user?.email}</p>
                    </div>

                    <div className="space-y-1">
                      <button
                        onClick={handleCopyToken}
                        className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-800/80 text-slate-300 flex items-center justify-between transition-all"
                      >
                        <span className="flex items-center space-x-1.5">
                          <Key className="w-3.5 h-3.5 text-cyan-400" />
                          <span>Copy Bearer JWT</span>
                        </span>
                        {copiedToken ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <span className="text-[10px] font-mono text-slate-500">JWT</span>}
                      </button>
                    </div>

                    <div className="pt-2 border-t border-slate-800">
                      <button
                        onClick={() => {
                          logout();
                          setIsAccountMenuOpen(false);
                        }}
                        className="w-full text-left px-2.5 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 font-medium flex items-center space-x-1.5 transition-all"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => setIsAuthModalOpen(true)}
                className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 hover:border-cyan-500/40 hover:text-white text-xs font-semibold transition-all"
              >
                <Lock className="w-3.5 h-3.5 text-cyan-400" />
                <span>Sign In</span>
              </button>
            )}

            {/* Live Worker Status */}
            <button
              onClick={() => setIsWorkerModalOpen(true)}
              className="hidden lg:flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all group"
            >
              <span className={`w-2 h-2 rounded-full ${settings.isPaused ? 'bg-amber-500' : 'bg-emerald-400 animate-ping'}`}></span>
              <span className="text-xs font-medium text-slate-300 group-hover:text-white">
                Workers: <strong className="text-cyan-400">{busyWorkers}/{settings.concurrency} Busy</strong>
              </span>
              <Sliders className="w-3.5 h-3.5 text-slate-400 group-hover:text-cyan-400 transition-colors" />
            </button>

            {/* Pause / Resume Queue Button */}
            <button
              onClick={togglePauseQueue}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all flex items-center space-x-1.5 ${
                settings.isPaused
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-300 hover:bg-amber-500/20'
                  : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700 hover:text-white'
              }`}
              title={settings.isPaused ? 'Resume Processing Queue' : 'Pause Queue Processing'}
            >
              {settings.isPaused ? <Play className="w-3.5 h-3.5 fill-current" /> : <Pause className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">{settings.isPaused ? 'Resume' : 'Pause'}</span>
            </button>

            {/* Batch Simulate Button */}
            <button
              onClick={() => triggerBatchSimulate(3)}
              className="hidden sm:flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:border-cyan-500/40 hover:text-cyan-300 text-xs font-medium transition-all"
              title="Simulate 3 incoming tasks"
            >
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>Simulate</span>
            </button>

            {/* Create Task Modal Button */}
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="flex items-center space-x-1.5 px-4 py-1.5 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-medium text-xs shadow-lg shadow-cyan-500/20 transition-all hover:scale-105"
            >
              <Plus className="w-4 h-4" />
              <span>New Task</span>
            </button>

          </div>

        </div>
      </div>
    </header>
  );
};
