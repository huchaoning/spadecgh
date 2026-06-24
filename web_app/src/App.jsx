import { useState, useRef } from "react";
import { useCGHCore } from "./utils/useCGHCore";
import Navbar from "./components/Navbar";
import Sidebar from "./components/Sidebar";
import MainCanvasArea from "./components/MainCanvasArea";
import Modals from "./components/Modals";
import RestoreToast from "./components/RestoreToast";

export default function App() {
    const canvasRef = useRef(null);
    const core = useCGHCore(canvasRef);
    const [showSidebar, setShowSidebar] = useState(true);

    return (
        <div className="flex flex-col h-screen bg-base-200 overflow-hidden text-sm select-none font-sans cursor-default">
            <Navbar showSidebar={showSidebar} setShowSidebar={setShowSidebar} />
            <div className="flex flex-1 overflow-hidden">
                <Sidebar
                    showSidebar={showSidebar}
                    sigma={core.sigma} setSigma={core.setSigma}
                    pixelSize={core.pixelSize} setPixelSize={core.setPixelSize}
                    resX={core.resX} setResX={core.setResX}
                    resY={core.resY} setResY={core.setResY}
                    fileName={core.fileName} setFileName={core.setFileName}
                    algo={core.algo} setAlgo={core.setAlgo}
                    zeta={core.zeta} setZeta={core.setZeta}
                    modes={core.modes}
                    onAddMode={core.addMode}
                    onRemoveMode={core.removeMode}
                    onUpdateMode={core.updateMode}
                    onAddSubMode={core.addSubMode}
                    onRemoveSubMode={core.removeSubMode}
                    onUpdateSubMode={core.updateSubMode}
                    onRun={core.handleRun}
                    onSave={core.handleSave}
                    onClearModes={core.clearModes}
                />
                <MainCanvasArea canvasRef={canvasRef} width={core.resX} height={core.resY} />
            </div>
            <Modals onClearModes={core.clearModes} />
            <RestoreToast
                show={core.showRestoreToast}
                onClose={() => core.setShowRestoreToast(false)}
                onReset={core.resetToDefault}
            />
        </div>
    );
}