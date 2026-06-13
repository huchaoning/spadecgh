import { Box, Menu, Info } from "lucide-react";

export default function Navbar({ showSidebar, setShowSidebar }) {
    return (
        <header className="navbar bg-base-100 shadow-sm z-30 px-4 border-b border-base-200">
            <div className="flex-none">
                <button
                    className="btn btn-ghost btn-sm btn-square"
                    onClick={() => setShowSidebar(!showSidebar)}
                >
                    <Menu size={20} />
                </button>
            </div>
            <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2">
                <div className="bg-primary p-1 rounded-lg">
                    <Box size={18} className="text-primary-content" />
                </div>
                <div className="items-baseline flex gap-2">
                    <div className="text-lg">
                        <span className="font-mono font-black">hducgh</span>
                        <span> / </span>
                        <span className="font-serif italic">web-app</span>
                    </div>
                    
                    <div className="font-mono text-xs opacity-40">v1.0.0</div>
                </div>
            </div>
            <div className="flex-1 flex justify-end">
                <button
                    className="btn btn-ghost btn-sm btn-square text-base-content/40 hover:text-primary transition-colors"
                    onClick={() => document.getElementById("info_modal").showModal()}
                >
                    <Info size={20} />
                </button>
            </div>
        </header>
    );
}