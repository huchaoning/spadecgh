import { OverlayScrollbarsComponent } from "overlayscrollbars-react";
import "overlayscrollbars/overlayscrollbars.css";
import { Play, Trash2, Save } from "lucide-react";
import GlobalSettings from "./GlobalSettings";
import ModeList from "./ModeList";

export default function Sidebar({
    showSidebar,
    sigma, setSigma,
    pixelSize, setPixelSize,
    resX, setResX,
    resY, setResY,
    fileName, setFileName,
    algo, setAlgo,
    modes,
    onAddMode,
    onRemoveMode,
    onUpdateMode,
    onAddSubMode,
    onRemoveSubMode,
    onUpdateSubMode,
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
                <OverlayScrollbarsComponent
                    defer
                    options={{ scrollbars: { autoHide: 'scroll' } }}
                    className="flex-1 p-4"
                >
                    <div className="space-y-8 pb-4">
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
                            algo={algo}
                            setAlgo={setAlgo}
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
                </OverlayScrollbarsComponent>

                <div className="p-4 border-t border-base-200 bg-base-100 space-y-3">
                    <button
                        onClick={onRun}
                        className="btn btn-primary btn-block shadow-lg shadow-primary/20 active:scale-95 transition-all"
                    >
                        <Play size={16} fill="currentColor" /> RUN
                    </button>
                    <div className="grid grid-cols-2 gap-3">
                        <button
                            className="btn btn-outline btn-error btn-sm"
                            onClick={() => document.getElementById("clear_modal").showModal()}
                        >
                            <Trash2 size={14} /> Clear
                        </button>
                        <button className="btn btn-outline btn-sm" onClick={onSave}>
                            <Save size={14} /> Save
                        </button>
                    </div>
                </div>
            </div>
        </aside>
    );
}