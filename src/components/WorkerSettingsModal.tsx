import React from 'react';
import { useTaskContext } from '../context/TaskContext';
import { X, Sliders, Cpu, ShieldAlert, RotateCcw } from 'lucide-react';

export const WorkerSettingsModal: React.FC = () => {
  const { 
    isWorkerModalOpen, 
    setIsWorkerModalOpen, 
    settings, 
    updateWorkerSettings,
    resetToDefault 
  } = useTaskContext();

  if (!isWorkerModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="relative w-full max-w-xl glass-panel rounded-2xl border border-slate-800 shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Cluster & Worker Node Configuration</h2>
              <p className="text-xs text-slate-400">Manage parallel worker concurrency & fault-injection settings</p>
            </div>
          </div>
          <button
            onClick={() => setIsWorkerModalOpen(false)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 text-xs">
          
          {/* Concurrency Slider */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-slate-200 font-semibold flex items-center space-x-2">
                <Cpu className="w-4 h-4 text-cyan-400" />
                <span>Parallel Worker Threads:</span>
              </label>
              <span className="font-mono text-cyan-400 font-bold text-sm px-2.5 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/30">
                {settings.concurrency} Workers
              </span>
            </div>
            <input
              type="range"
              min={1}
              max={5}
              value={settings.concurrency}
              onChange={e => updateWorkerSettings({ concurrency: Number(e.target.value) })}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
            />
            <div className="flex justify-between text-[10px] text-slate-500">
              <span>1 Worker (Sequential)</span>
              <span>3 Workers (Default)</span>
              <span>5 Workers (Max Parallel)</span>
            </div>
          </div>

          {/* Processing Speed Multiplier */}
          <div className="space-y-2">
            <label className="text-slate-200 font-semibold block">Execution Speed Multiplier:</label>
            <div className="grid grid-cols-3 gap-3">
              {[1, 2, 5].map(speed => (
                <button
                  key={speed}
                  onClick={() => updateWorkerSettings({ speedMultiplier: speed })}
                  className={`p-3 rounded-xl border text-center font-medium transition-all ${
                    settings.speedMultiplier === speed
                      ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300 shadow-md shadow-cyan-500/10 font-bold'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                  }`}
                >
                  {speed}x Speed
                </button>
              ))}
            </div>
          </div>

          {/* Fault Injection / Failure Rate Simulator */}
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3">
            <div className="flex justify-between items-center">
              <label className="text-slate-200 font-semibold flex items-center space-x-2">
                <ShieldAlert className="w-4 h-4 text-rose-400" />
                <span>Failure Injection Simulator (Retry Testing):</span>
              </label>
              <span className={`font-mono font-bold text-sm px-2.5 py-0.5 rounded ${
                settings.failureRate > 0 ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' : 'bg-slate-800 text-slate-400'
              }`}>
                {(settings.failureRate * 100).toFixed(0)}% Error Rate
              </span>
            </div>

            <input
              type="range"
              min={0}
              max={0.5}
              step={0.05}
              value={settings.failureRate}
              onChange={e => updateWorkerSettings({ failureRate: Number(e.target.value) })}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-rose-500"
            />

            <p className="text-[11px] text-slate-400">
              Injects simulated 504 Gateway Timeouts to test automatic exponential backoff retry logic.
            </p>
          </div>

          {/* Reset System State */}
          <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-slate-400">
            <span>Reset task queue to default seed state:</span>
            <button
              onClick={() => {
                resetToDefault();
                setIsWorkerModalOpen(false);
              }}
              className="px-3 py-1.5 rounded-lg bg-rose-500/10 text-rose-300 border border-rose-500/30 hover:bg-rose-500/20 text-xs font-medium transition-all flex items-center space-x-1"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset State</span>
            </button>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/90 flex items-center justify-end">
          <button
            onClick={() => setIsWorkerModalOpen(false)}
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold shadow-lg shadow-cyan-500/20 transition-all"
          >
            Apply Configuration
          </button>
        </div>

      </div>
    </div>
  );
};
