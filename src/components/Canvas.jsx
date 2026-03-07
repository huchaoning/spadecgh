import React from 'react';
import { Box } from 'lucide-react';

export default function Canvas() {
  return (
    <main className="flex-1 bg-base-300 relative p-8 flex flex-col gap-6">
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #000 2px, transparent 2px)', backgroundSize: '32px 32px' }}></div>
      <div className="flex-1 flex flex-col bg-neutral rounded-2xl shadow-2xl border border-white/5 overflow-hidden relative group">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Box size={60} className="mx-auto mb-4 opacity-10 text-white animate-pulse" />
            <p className="text-white/20 font-mono text-[10px] uppercase tracking-[0.2em]">Hologram Processing...</p>
          </div>
        </div>
      </div>
    </main>
  );
}