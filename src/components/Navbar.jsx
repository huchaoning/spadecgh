import React from 'react';
import { Box, Info, Menu } from 'lucide-react';

export default function Navbar({ showSidebar, setShowSidebar }) {
  return (
    <header className="navbar bg-base-100 shadow-sm z-30 px-4 border-b border-base-300">
      <div className="flex-none">
        <button className="btn btn-ghost btn-sm btn-square" onClick={() => setShowSidebar(!showSidebar)}>
          <Menu size={20} />
        </button>
      </div>
      <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2">
        <div className="bg-primary p-1 rounded-lg">
          <Box size={18} className="text-primary-content" />
        </div>
        <span className="text-lg font-black tracking-tight uppercase">
          CGH Generator <span className="text-[10px] font-normal opacity-50 ml-1">v1.0</span>
        </span>
      </div>
      <div className="flex-1 flex justify-end">
        <button className="btn btn-ghost btn-sm btn-square text-base-content/40 hover:text-primary transition-colors">
          <Info size={20} />
        </button>
      </div>
    </header>
  );
}