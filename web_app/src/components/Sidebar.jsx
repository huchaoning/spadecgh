import { Play, Trash2, Save } from "lucide-react";
import GlobalSettings from "./GlobalSettings";
import ModeList from "./ModeList";

export default function Sidebar({
    showSidebar,
    // 全局参数
    sigma, setSigma,
    pixelSize, setPixelSize,
    resX, setResX,
    resY, setResY,
    fileName, setFileName,
    // 模式列表
    modes,
    onAddMode,
    onRemoveMode,
    onUpdateMode,
    onAddSubMode,
    onRemoveSubMode,
    onUpdateSubMode,
    // 操作
    onRun,
    onSave,
    onClearModes,
}) {
    const handleKeyDown = (e) => {
        if (e.key === "Enter") {
            onRun();
            if (document.activeElement) document.activeElement.blur();
        }
    };

    return (
        <aside
            onKeyDown={handleKeyDown}
            className={`bg-base-200/40 border-r border-base-300 flex flex-col transition-all duration-300 ease-in-out ${showSidebar ? "w-96" : "w-0"
                } overflow-hidden`}
        >
            <div className="w-96 flex flex-col h-full shrink-0">
                <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">
                    <GlobalSettings
                        sigma={sigma}
                        setSigma={setSigma}
                        pixelSize={pixelSize}
                        setPixelSize={setPixelSize}
                        resX={resX}
                        setResX={setResX}
                        resY={resY}
                        setResY={setResY}
                        fileName={fileName}
                        setFileName={setFileName}
                    />
                    <ModeList
                        modes={modes}
                        onAddMode={onAddMode}
                        onRemoveMode={onRemoveMode}
                        onUpdateMode={onUpdateMode}
                        onAddSubMode={onAddSubMode}
                        onRemoveSubMode={onRemoveSubMode}
                        onUpdateSubMode={onUpdateSubMode}
                    />
                </div>

                <div className="p-4 border-t border-base-200 bg-base-100 space-y-3">
                    <button
                        onClick={onRun}
                        className="btn btn-primary btn-block shadow-lg shadow-primary/20 active:scale-95 transition-all"
                    >
                        <Play size={16} fill="currentColor" /> 走你！！
                    </button>
                    <div className="grid grid-cols-2 gap-3">
                        <button
                            className="btn btn-outline btn-error btn-sm"
                            onClick={onClearModes}
                        >
                            <Trash2 size={14} /> 清空列表
                        </button>
                        <button className="btn btn-outline btn-sm" onClick={onSave}>
                            <Save size={14} /> 保存结果
                        </button>
                    </div>
                </div>
            </div>
        </aside>
    );
}