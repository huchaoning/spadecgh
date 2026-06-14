import { motion } from "framer-motion";
import { InfoIcon, X } from "lucide-react";

export default function RestoreToast({ show, onClose, onReset }) {
    return (
        <motion.div
            initial={{ opacity: 0, x: 50, scale: 0.9 }}
            animate={show ? { opacity: 1, x: 0, scale: 1 } : { opacity: 0, x: 20, scale: 0.95 }}
            className="fixed bottom-12 right-12 z-100"
        >
            {show && (
                <div className="bg-base-100 border border-base-200 shadow-2xl rounded-full px-3 py-3 flex items-center gap-5">
                    <div className="flex items-center gap-3">
                        <div className="bg-none text-primary ml-4">
                            <InfoIcon size={18} />
                        </div>
                        <div className="flex flex-col">
                            <div className="text-[10px] font-bold text-primary">Welcome back!</div>
                            <div className="text-xs font-bold text-base-content">Previous configuration loaded.</div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button onClick={onReset} className="btn btn-ghost btn-sm text-primary">
                            Reset
                        </button>
                        <button
                            onClick={onClose}
                            className="group btn btn-ghost btn-xs btn-circle transition-all duration-75"
                        >
                            <X size={14} className="opacity-20 group-hover:opacity-100 transition-all duration-75" />
                        </button>
                    </div>
                </div>
            )}
        </motion.div>
    );
}