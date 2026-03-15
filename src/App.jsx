import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Jimp } from "jimp";
import createModule from "../public/wasm/cgh_wasm.js";
import {
  Box, Play, AlertTriangle, Info, Save, Plus,
  Trash2, Settings2, Sliders, Menu, InfoIcon, X
} from "lucide-react";


export default function App() {
  /* --- WASM 实例状态 --- */
  const [wasmInstance, setWasmInstance] = useState(null);

  // 初始化 WASM
  useEffect(() => {
    createModule().then((instance) => {
      setWasmInstance(instance);
      console.log("WASM 模块就绪");
    });
  }, []);

  const DEFAULT_CONFIG = {
    sigma: 100,
    pixelSize: 8,
    resX: 1920,
    resY: 1080,
    fileName: "untitled",
    modes: [{ id: 1, type: "HG", o1: 0, o2: 0, nx: 500, ny: 0, sx: 0, sy: 0 }]
  };

  /* --- 状态管理 --- */
  const [showSidebar, setShowSidebar] = useState(true);
  const [sigma, setSigma] = useState(DEFAULT_CONFIG.sigma);
  const [pixelSize, setPixelSize] = useState(DEFAULT_CONFIG.pixelSize);
  const [resX, setResX] = useState(DEFAULT_CONFIG.resX);
  const [resY, setResY] = useState(DEFAULT_CONFIG.resY);
  const [modes, setModes] = useState(DEFAULT_CONFIG.modes);
  const [showRestoreToast, setShowRestoreToast] = useState(false);
  const [fileName, setFileName] = useState("untitled");

  const lastPixelsRef = useRef(null);
  const canvasRef = useRef(null);

  const [transform, setTransform] = useState({ scale: 1, x: 0, y: 0 });
  const containerRef = useRef(null);
  const isDragging = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });

  /* --- 状态持久化与恢复逻辑 --- */
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
        JSON.stringify(modes) !== JSON.stringify(DEFAULT_CONFIG.modes);

      if (hasChanged) {
        const configToSave = { sigma, pixelSize, resX, resY, modes, fileName };
        localStorage.setItem("cgh_last_config", JSON.stringify(configToSave));
      } else {
        localStorage.removeItem("cgh_last_config");
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [sigma, pixelSize, resX, resY, modes, fileName]);


  const resetToDefault = () => {
    isResetting.current = true;

    setSigma(DEFAULT_CONFIG.sigma);
    setPixelSize(DEFAULT_CONFIG.pixelSize);
    setResX(DEFAULT_CONFIG.resX);
    setResY(DEFAULT_CONFIG.resY);
    setModes(DEFAULT_CONFIG.modes);
    setFileName(DEFAULT_CONFIG.fileName);

    localStorage.removeItem("cgh_last_config");
    setShowRestoreToast(false);
    setTimeout(() => {
      isResetting.current = false;
    }, 500);
  };

  /* --- 画布操作逻辑 --- */
  const handleWheel = (e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setTransform(prev => ({
      ...prev,
      scale: Math.max(0.1, Math.min(prev.scale * delta, 20))
    }));
  };

  const handleMouseDown = (e) => {
    if (e.button !== 0) return;
    isDragging.current = true;
    lastPos.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e) => {
    if (!isDragging.current) return;
    const dx = e.clientX - lastPos.current.x;
    const dy = e.clientY - lastPos.current.y;

    setTransform(prev => ({
      ...prev,
      x: prev.x + dx / prev.scale,
      y: prev.y + dy / prev.scale
    }));
    lastPos.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseUp = () => {
    isDragging.current = false;
  };


  /* --- 导出参数为 JSON, 准备传给 WASM --- */
  const loadConfig = () => {
    return {
      global: {
        sigma: parseFloat(sigma),
        pixelSize: parseFloat(pixelSize),
        resolution: [parseInt(resX), parseInt(resY)]
      },
      modeList: modes.map(mode => ({
        type: mode.type,
        o1: mode.o1,
        o2: mode.o2,
        nx: mode.nx,
        ny: mode.ny,
        sx: mode.sx,
        sy: mode.sy,

        subModes: mode.type === "PM" ? {
          plus: mode.plusModes || [],
          minus: mode.minusModes || []
        } : null
      }))
    };
  };


  /* --- RUN --- */
  const handleRun = () => {
    if (modes.length === 0 || !wasmInstance || !canvasRef.current) return;

    const config = loadConfig();
    const width = config.global.resolution[0];
    const height = config.global.resolution[1];

    console.log(`即将传给 WASM 的参数：${JSON.stringify(config, null, 2)}`)
    try {
      const startTime = performance.now();
      const res = wasmInstance.generateCGH(JSON.stringify(config));
      console.log(`计算 CGH 用时：${performance.now() - startTime} ms`);

      const pixels = res;
      lastPixelsRef.current = pixels;

      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");

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


  /* --- 保存功能 --- */
  const handleSave = async () => {
    const pixels = lastPixelsRef.current;

    const w = parseInt(resX);
    const h = parseInt(resY);

    const image = new Jimp({ width: w, height: h });

    for (let i = 0; i < pixels.length; i++) {
      const g = pixels[i];
      const offset = i * 4;

      image.bitmap.data[offset] = g;
      image.bitmap.data[offset + 1] = g;
      image.bitmap.data[offset + 2] = g;
      image.bitmap.data[offset + 3] = 255;
    }

    const buffer = await image.getBuffer("image/bmp");
    const blob = new Blob([buffer], { type: "image/bmp" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = (fileName.trim() || "untitled") + ".bmp";

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 60);
  };


  /* --- 模式列表操作函数 --- */
  const formatInputValue = (value) => {
    return (value === "-" || value === "") ? value : (parseFloat(value) || 0);
  };

  const addMode = () => {
    const newId = modes.length > 0 ? Math.max(...modes.map(mode => mode.id)) + 1 : 1;
    setModes([...modes, { ...DEFAULT_CONFIG.modes[0], id: newId }]);
  };

  const removeMode = (id) => setModes(modes.filter(mode => mode.id !== id));

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

  const handleAddSubMode = (parentId, groupKey, type) => {
    setModes(modes.map(mode => {
      if (mode.id === parentId) {
        const subId = Date.now() + Math.random();
        return { ...mode, [groupKey]: [...(mode[groupKey] || []), { id: subId, type, o1: 0, o2: 0 }] };
      }
      return mode;
    }));
    if (document.activeElement) document.activeElement.blur();
  };

  const removeSubMode = (parentId, groupKey, subId) => {
    setModes(modes.map(mode => (mode.id === parentId ? { ...mode, [groupKey]: mode[groupKey].filter(s => s.id !== subId) } : mode)));
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

  return (
    <div className="flex flex-col h-screen bg-base-200 overflow-hidden text-sm select-none font-sans cursor-default">

      {/* --- 顶部导航栏 --- */}
      <header className="navbar bg-base-100 shadow-sm z-30 px-4 border-b border-base-200">
        <div className="flex-none">
          <button className="btn btn-ghost btn-sm btn-square" onClick={() => setShowSidebar(!showSidebar)}>
            <Menu size={20} />
          </button>
        </div>
        <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2">
          <div className="bg-primary p-1 rounded-lg"><Box size={18} className="text-primary-content" /></div>
          <div className="items-baseline flex gap-2">
            <div className="text-lg font-black">
              CGH Generator
            </div>
            <div className="font-mono text-xs opacity-40">v0.2-dev</div>
          </div>
        </div>
        <div className="flex-1 flex justify-end">
          <button className="btn btn-ghost btn-sm btn-square text-base-content/40 hover:text-primary transition-colors"
            onClick={() => document.getElementById("info_modal").showModal()}>
            <Info size={20} />
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">

        {/* --- 左侧侧边栏 --- */}
        <aside onKeyDown={(e) => {
          if (e.key === "Enter") {
            handleRun();
            if (document.activeElement) document.activeElement.blur();
          }
        }}
          className={`bg-base-200/40 border-r border-base-300 flex flex-col transition-all duration-300 ease-in-out ${showSidebar ? "w-96" : "w-0"} overflow-hidden`}>
          <div className="w-96 flex flex-col h-full shrink-0">
            <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">

              {/* 全局物理参数配置 */}
              <section>
                <div className="flex items-center gap-2 mb-3 text-primary font-bold">
                  <Settings2 size={16} /> <div>全局参数</div>
                </div>
                <div className="bg-base-100 border border-base-200 shadow-sm p-4 rounded-xl space-y-4">
                  <div className="form-control w-full">
                    <label className="label py-1 px-0"><div className="label-text font-medium text-xs">特征宽度 (σ, μm)</div></label>
                    <input type="text" value={sigma} onChange={(e) => setSigma(formatInputValue(e.target.value))} className="input input-sm input-bordered w-full " />
                  </div>
                  <div className="divider my-1 opacity-50"></div>
                  <div className="space-y-3">
                    <label className="label py-1 px-0"><div className="label-text font-medium text-xs">SLM 设备参数</div></label>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="form-control">
                        <label className="label py-1 px-0"><div className="label-text text-[10px]">分辨率 X</div></label>
                        <input type="text" value={resX} onChange={(e) => setResX(formatInputValue(e.target.value))} className="input input-sm input-bordered " />
                      </div>
                      <div className="form-control">
                        <label className="label py-1 px-0"><div className="label-text text-[10px]">分辨率 Y</div></label>
                        <input type="text" value={resY} onChange={(e) => setResY(formatInputValue(e.target.value))} className="input input-sm input-bordered " />
                      </div>
                    </div>
                    <div className="form-control w-full">
                      <label className="label py-1 px-0"><div className="label-text text-[10px]">像素尺寸 (Pixel Size, μm)</div></label>
                      <input type="text" value={pixelSize} onChange={(e) => setPixelSize(formatInputValue(e.target.value))} className="input input-sm input-bordered " />
                    </div>

                    <div className="divider my-1 opacity-50"></div>
                    <div className="form-control w-full">
                      <label className="label py-1 px-0"><div className="label-text font-medium text-xs">保存文件名 (.bmp)</div></label>
                      <div className="relative">
                        <input
                          type="text"
                          value={fileName}
                          onChange={(e) => {
                            const val = e.target.value.replace(/[\\/:*?"<>|]/g, "");
                            setFileName(val);
                          }
                          }
                          className="input input-sm input-bordered w-full  pr-12"
                        />
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] opacity-40 pointer-events-none">.bmp</div>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              {/* 模式叠加列表 */}
              <section className="w-full">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2 text-primary font-bold">
                    <Sliders size={16} /> <div>模式列表</div>
                  </div>
                  <button onClick={addMode} className="btn btn-xs btn-circle btn-primary shadow-md hover:scale-110 active:scale-90 transition-all">
                    <Plus size={14} />
                  </button>
                </div>

                <div className="space-y-3 relative">
                  <AnimatePresence mode="popLayout">
                    {modes.length === 0 ? (
                      <motion.div key="empty-state" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="border-2 border-dashed border-base-300 rounded-2xl p-10 text-center flex flex-col items-center gap-3">
                        <Sliders size={32} className="opacity-20" />
                        <div className="font-medium text-xs opacity-40">列表为空，点击上方 + 号开始</div>
                      </motion.div>
                    ) : (
                      modes.map((mode, index) => (
                        <motion.div key={mode.id} layout initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.8, x: -30 }}
                          className="collapse collapse-arrow bg-base-100 border border-base-200 rounded-xl shadow-sm overflow-hidden"
                        >
                          <input type="checkbox" defaultChecked />
                          <div className="collapse-title flex items-center gap-3 pr-12 min-h-0">
                            <div className="badge badge-sm badge-ghost  shrink-0">{index + 1}</div>
                            <div className=" text-xs font-bold text-primary truncate">
                              {mode.type === "PM" ? `PM (${(mode.plusModes?.length || 0) + (mode.minusModes?.length || 0)})` : `${mode.type}(${mode.o1},${mode.o2})`}
                            </div>
                          </div>

                          <div className="collapse-content">
                            <div className="pt-4 space-y-4">
                              <div className="join w-full bg-base-200 p-0.5 rounded-lg">
                                {["HG", "LG", "PM"].map((t) => (
                                  <button key={t} className={`join-item btn btn-xs flex-1 border-none ${mode.type === t ? "btn-primary shadow-sm" : "btn-ghost opacity-40"}`}
                                    onClick={() => updateMode(mode.id, "type", t)}>
                                    {t}
                                  </button>
                                ))}
                              </div>

                              {mode.type === "PM" ? (
                                <div className="space-y-4">
                                  {[{ label: "Plus 模式 (+)", key: "plusModes", color: "text-success" }, { label: "Minus 模式 (-)", key: "minusModes", color: "text-error" }].map(group => (
                                    <div key={group.key} className="space-y-2">
                                      <div className="flex justify-between items-center px-1">
                                        <div className={`text-[10px] font-bold ${group.color}`}>{group.label}</div>
                                        <div className="dropdown dropdown-end">
                                          <div tabIndex={0} role="button" className="btn btn-circle btn-ghost btn-xs text-primary bg-base-200"><Plus size={14} /></div>
                                          <ul tabIndex={0} className="dropdown-content z-100 menu p-2 shadow-2xl bg-base-100 rounded-box w-32 text-xs border border-base-200">
                                            <li><a onClick={() => handleAddSubMode(mode.id, group.key, "HG")}>HG 模式</a></li>
                                            <li><a onClick={() => handleAddSubMode(mode.id, group.key, "LG")}>LG 模式</a></li>
                                          </ul>
                                        </div>
                                      </div>
                                      <div className="space-y-1.5 border-l-2 border-base-200 ml-1 pl-3">
                                        <AnimatePresence mode="popLayout">
                                          {mode[group.key]?.map((sub) => (
                                            <motion.div key={sub.id} layout initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, scale: 0.8 }}
                                              className="flex items-center gap-2 bg-base-200/40 p-2 rounded-lg border border-base-200">
                                              <div className="text-[10px] font-bold opacity-40 w-5 shrink-0">{sub.type}</div>
                                              <input type="text" className="input input-bordered input-xs w-12" value={sub.o1} onChange={(e) => updateSubMode(mode.id, group.key, sub.id, "o1", e.target.value)} />
                                              <input type="text" className="input input-bordered input-xs w-12" value={sub.o2} onChange={(e) => updateSubMode(mode.id, group.key, sub.id, "o2", e.target.value)} />
                                              <button className="btn btn-ghost btn-xs btn-square text-error/40" onClick={() => removeSubMode(mode.id, group.key, sub.id)}><Trash2 size={12} /></button>
                                            </motion.div>
                                          ))}
                                        </AnimatePresence>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div className="grid grid-cols-2 gap-4">
                                  <div className="form-control">
                                    <label className="label"><div className="label-text text-[10px] mb-1">{mode.type === "LG" ? "角向阶数 L" : "水平阶数 N"}</div></label>
                                    <input type="text" value={mode.o1} onChange={(e) => updateMode(mode.id, "o1", e.target.value)} className="input input-bordered input-xs " />
                                  </div>
                                  <div className="form-control">
                                    <label className="label"><div className="label-text text-[10px] mb-1">{mode.type === "LG" ? "径向阶数 P" : "垂直阶数 M"}</div></label>
                                    <input type="text" value={mode.o2} onChange={(e) => updateMode(mode.id, "o2", e.target.value)} className="input input-bordered input-xs " />
                                  </div>
                                </div>
                              )}

                              <div className="divider my-1 opacity-50"></div>
                              <div className="grid grid-cols-2 gap-4">
                                <div className="form-control">
                                  <label className="label"><div className="label-text text-[10px] mb-1">载波 Nx</div></label>
                                  <input type="text" value={mode.nx} onChange={(e) => updateMode(mode.id, "nx", e.target.value)} className="input input-bordered input-xs" />
                                </div>
                                <div className="form-control">
                                  <label className="label"><div className="label-text text-[10px] mb-1">载波 Ny</div></label>
                                  <input type="text" value={mode.ny} onChange={(e) => updateMode(mode.id, "ny", e.target.value)} className="input input-bordered input-xs" />
                                </div>
                                <div className="form-control">
                                  <label className="label"><div className="label-text text-[10px] mb-1">X 偏移 (μm)</div></label>
                                  <input type="text" value={mode.sx} onChange={(e) => updateMode(mode.id, "sx", e.target.value)} className="input input-bordered input-xs" />
                                </div>
                                <div className="form-control">
                                  <label className="label"><div className="label-text text-[10px] mb-1">Y 偏移 (μm)</div></label>
                                  <input type="text" value={mode.sy} onChange={(e) => updateMode(mode.id, "sy", e.target.value)} className="input input-bordered input-xs" />
                                </div>
                              </div>

                              <button onClick={() => removeMode(mode.id)} className="btn btn-error btn-outline btn-xs btn-block">
                                <Trash2 size={12} /> 删除该模式
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      ))
                    )}
                  </AnimatePresence>
                </div>
              </section>
            </div>

            {/* 侧边栏底部操作区 */}
            <div className="p-4 border-t border-base-200 bg-base-100 space-y-3">
              <button onClick={handleRun} className="btn btn-primary btn-block shadow-lg shadow-primary/20 active:scale-95 transition-all">
                <Play size={16} fill="currentColor" /> 走你！！
              </button>
              <div className="grid grid-cols-2 gap-3">
                <button className="btn btn-outline btn-error btn-sm" onClick={() => document.getElementById("clear_modal").showModal()}>
                  <Trash2 size={14} /> 清空列表
                </button>
                <button className="btn btn-outline btn-sm" onClick={handleSave}>
                  <Save size={14} /> 保存结果
                </button>
              </div>
            </div>
          </div>
        </aside>

        {/* --- 主内容显示区 --- */}
        <main className="flex-1 bg-base-300 relative p-8 flex flex-col gap-6">
          <div
            className="absolute inset-0 opacity-[0.03] pointer-events-none"
            style={{ backgroundImage: "radial-gradient(circle, #000 2px, transparent 2px)", backgroundSize: "32px 32px" }}
          ></div>

          <div
            ref={containerRef}
            onDoubleClick={() => setTransform({ scale: 1, x: 0, y: 0 })}
            className="flex-1 flex flex-col bg-neutral rounded-2xl shadow-2xl border border-white/5 overflow-hidden relative group items-center justify-center p-4 cursor-grab active:cursor-grabbing select-none"
            onWheel={handleWheel}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            <canvas
              ref={canvasRef}
              width={resX}
              height={resY}
              className="max-w-full max-h-full object-contain pointer-events-none"
              style={{
                transform: `scale(${transform.scale}) translate(${transform.x}px, ${transform.y}px)`,
                transition: isDragging.current ? "none" : "transform 0.1s ease-out",
              }}
            />
          </div>
        </main>

      </div>

      {/* --- 弹窗与对话框 --- */}
      {/* 确认清空对话框 */}
      <dialog id="clear_modal" className="modal modal-bottom sm:modal-middle">
        <div className="modal-box">
          <h3 className="font-bold text-lg text-error flex items-center gap-2"><AlertTriangle size={20} /> 确认清除？</h3>
          <p className="py-4 text-sm text-base-content/60">此操作将清空所有已配置的模式。该操作不可撤销。</p>
          <div className="modal-action">
            <form method="dialog" className="flex gap-2 w-full flex-row-reverse">
              <button className="btn btn-error btn-sm w-20" onClick={() => setModes([])}>确认</button>
              <button className="btn btn-ghost btn-sm w-20">取消</button>
            </form>
          </div>
        </div>
      </dialog>

      {/* 关于项目信息 */}
      <dialog id="info_modal" className="modal modal-bottom sm:modal-middle">
        <div className="modal-box">
          <h3 className="font-bold text-lg text-primary flex items-center gap-2"><InfoIcon size={20} /> 关于本工具</h3>
          <p className="py-4 text-sm text-base-content/60 leading-relaxed">
            这是一个基于 Arrizon 2 算法的全息图生成工具，该算法可以用于生成非平凡模式，也可以用于实现空间模式分解（SPADE）测量。
            本工具的具体名称、图标、域名以及许可证均处于待定状态。
            作者来自杭州电子科技大学理学院，量子精密测量实验室。
          </p>
          <div className="modal-action">
            <form method="dialog" className="flex gap-2 w-full flex-row-reverse">
              <button className="btn btn-primary btn-sm w-20">确定</button>
              <a className="btn btn-ghost btn-sm w-20" target="_blank" rel="noopener noreferrer" href="https://gitee.com/vxyi/cgh-app">Gitee</a>
            </form>
          </div>
        </div>
      </dialog>

      {/* 错误提示 */}
      <dialog id="error_modal" className="modal modal-bottom sm:modal-middle">
        <div className="modal-box">
          <h3 className="font-bold text-lg text-error flex items-center gap-2"><AlertTriangle size={20} /> 输入错误</h3>
          <p className="py-4 text-sm text-base-content/60">非法的输入参数，请检查输入是否有误。如果确认无误但错误继续存在，请报告问题。</p>
          <div className="modal-action">
            <form method="dialog" className="flex gap-2 w-full flex-row-reverse">
              <button className="btn btn-primary btn-sm w-20">关闭</button>
              <a className="btn btn-ghost btn-sm w-20" target="_blank" rel="noopener noreferrer" href="https://gitee.com/vxyi/cgh-app/issues">Issues</a>
            </form>
          </div>
        </div>
      </dialog>

      <AnimatePresence>
        {showRestoreToast && (
          <motion.div
            initial={{ opacity: 0, x: 50, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 20, scale: 0.95 }}
            className="fixed bottom-12 right-12 z-100"
          >
            <div className="bg-base-100 border border-base-200 shadow-2xl rounded-full px-3 py-3 flex items-center gap-5">
              <div className="flex items-center gap-3">
                <div className="bg-none text-primary ml-4">
                  <InfoIcon size={18} />
                </div>
                <div className="flex flex-col">
                  <div className="text-[10px] font-bold text-primary">欢迎回来</div>
                  <div className="text-xs font-bold text-base-content">已载入上次参数配置</div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={resetToDefault}
                  className="btn btn-ghost btn-sm text-primary"
                >
                  恢复默认
                </button>

                <button
                  onClick={() => setShowRestoreToast(false)}
                  className="group btn btn-ghost btn-xs btn-circle transition-all duration-75"
                >
                  <X size={14} className="opacity-20 group-hover:opacity-100 transition-all duration-75" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}