import { useState, useEffect, useRef } from "react";
import createModule from "../../public/wasm/hducgh_backend_web.js";
import { DEFAULT_CONFIG } from "./constants.js";
import { formatInputValue } from "./formatInput.js";
import { formatConfig } from "./formatConfig.js";
import { exportBmp } from "./exportBmp.js";

export function useCGHCore(canvasRef) {
    const [wasmInstance, setWasmInstance] = useState(null);
    useEffect(() => {
        createModule().then((inst) => {
            setWasmInstance(inst);
            console.log("wasm ready");
        });
    }, []);

    const [sigma, setSigma] = useState(DEFAULT_CONFIG.sigma);
    const [pixelSize, setPixelSize] = useState(DEFAULT_CONFIG.pixelSize);
    const [resX, setResX] = useState(DEFAULT_CONFIG.resX);
    const [resY, setResY] = useState(DEFAULT_CONFIG.resY);
    const [modes, setModes] = useState(DEFAULT_CONFIG.modes);
    const [fileName, setFileName] = useState(DEFAULT_CONFIG.fileName);
    const [algo, setAlgo] = useState(DEFAULT_CONFIG.algo);
    const [showRestoreToast, setShowRestoreToast] = useState(false);
    const lastPixelsRef = useRef(null);

    const isResetting = useRef(false);
    useEffect(() => {
        const savedConfig = localStorage.getItem("cgh_last_config");
        if (savedConfig) {
            const config = JSON.parse(savedConfig);
            if (config.sigma) setSigma(config.sigma);
            if (config.pixelSize) setPixelSize(config.pixelSize);
            if (config.resX) setResX(config.resX);
            if (config.resY) setResY(config.resY);
            if (config.modes) setModes(config.modes);
            if (config.fileName) setFileName(config.fileName);
            if (config.algo) setAlgo(config.algo);
            setShowRestoreToast(true);
            const timer = setTimeout(() => setShowRestoreToast(false), 5000);
            return () => clearTimeout(timer);
        }
    }, []);

    useEffect(() => {
        if (isResetting.current) return;
        const timer = setTimeout(() => {
            const hasChanged =
                sigma != DEFAULT_CONFIG.sigma ||
                pixelSize != DEFAULT_CONFIG.pixelSize ||
                resX != DEFAULT_CONFIG.resX ||
                resY != DEFAULT_CONFIG.resY ||
                fileName != DEFAULT_CONFIG.fileName ||
                algo != DEFAULT_CONFIG.algo ||
                JSON.stringify(modes) !== JSON.stringify(DEFAULT_CONFIG.modes);
            if (hasChanged) {
                localStorage.setItem("cgh_last_config", JSON.stringify({
                    sigma, pixelSize, resX, resY, modes, fileName, algo
                }));
            } else {
                localStorage.removeItem("cgh_last_config");
            }
        }, 500);
        return () => clearTimeout(timer);
    }, [sigma, pixelSize, resX, resY, modes, fileName, algo]);

    const resetToDefault = () => {
        isResetting.current = true;
        setSigma(DEFAULT_CONFIG.sigma);
        setPixelSize(DEFAULT_CONFIG.pixelSize);
        setResX(DEFAULT_CONFIG.resX);
        setResY(DEFAULT_CONFIG.resY);
        setModes(DEFAULT_CONFIG.modes);
        setFileName(DEFAULT_CONFIG.fileName);
        setAlgo(DEFAULT_CONFIG.algo);
        localStorage.removeItem("cgh_last_config");
        setShowRestoreToast(false);
        setTimeout(() => { isResetting.current = false; }, 500);
    };

    const addMode = () => {
        const newId = modes.length > 0 ? Math.max(...modes.map(m => m.id)) + 1 : 1;
        setModes([...modes, { ...DEFAULT_CONFIG.modes[0], id: newId }]);
    };

    const removeMode = (id) => setModes(modes.filter(m => m.id !== id));

    const updateMode = (id, field, value) => {
        setModes(modes.map(mode => {
            if (mode.id === id) {
                if (field === "type" && value === "PM") {
                    return { ...mode, type: value, plusModes: [], minusModes: [] };
                }
                const val = (field === "type") ? value : formatInputValue(value);
                return { ...mode, [field]: val };
            }
            return mode;
        }));
    };

    const addSubMode = (parentId, groupKey, type) => {
        setModes(modes.map(mode => {
            if (mode.id === parentId) {
                const subId = Date.now() + Math.random();
                return {
                    ...mode,
                    [groupKey]: [...(mode[groupKey] || []), { id: subId, type, o1: 0, o2: 0, sx: 0, sy: 0 }]
                };
            }
            return mode;
        }));
        if (document.activeElement) document.activeElement.blur();
    };

    const removeSubMode = (parentId, groupKey, subId) => {
        setModes(modes.map(mode =>
            mode.id === parentId
                ? { ...mode, [groupKey]: mode[groupKey].filter(s => s.id !== subId) }
                : mode
        ));
    };

    const updateSubMode = (parentId, groupKey, subId, field, value) => {
        setModes(modes.map(mode => {
            if (mode.id === parentId) {
                const newList = mode[groupKey].map(s => {
                    if (s.id === subId) {
                        const val = (field === "type") ? value : formatInputValue(value);
                        return { ...s, [field]: val };
                    }
                    return s;
                });
                return { ...mode, [groupKey]: newList };
            }
            return mode;
        }));
    };

    const handleRun = () => {
        if (modes.length === 0 || !wasmInstance || !canvasRef.current) return;
        const config = formatConfig({ sigma, pixelSize, resX, resY, modes, algo });
        const width = config.global.resolution[0];
        const height = config.global.resolution[1];
        try {
            const startTime = performance.now();
            const pixels = wasmInstance.cal(JSON.stringify(config));
            console.log(`wasm payload: ${JSON.stringify(config, null, 2)}`)
            console.log(`time used: ${performance.now() - startTime} ms`);
            lastPixelsRef.current = pixels;
            const ctx = canvasRef.current.getContext("2d");
            const image = ctx.createImageData(width, height);
            for (let i = 0; i < pixels.length; i++) {
                const g = pixels[i];
                const offset = i * 4;
                image.data[offset] = g;
                image.data[offset + 1] = g;
                image.data[offset + 2] = g;
                image.data[offset + 3] = 255;
            }
            ctx.putImageData(image, 0, 0);
        } catch {
            document.getElementById("error_modal").showModal();
        }
    };

    const handleSave = async () => {
        const pixels = lastPixelsRef.current;
        if (!pixels) return;
        await exportBmp(pixels, parseInt(resX), parseInt(resY), fileName);
    };

    return {
        sigma, setSigma,
        pixelSize, setPixelSize,
        resX, setResX,
        resY, setResY,
        fileName, setFileName,
        modes, addMode, removeMode, updateMode,
        addSubMode, removeSubMode, updateSubMode,
        showRestoreToast, setShowRestoreToast,
        algo, setAlgo,
        resetToDefault, handleRun, handleSave,
        clearModes: () => setModes([]),
    };
}