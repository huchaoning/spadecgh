import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Jimp } from "jimp";
import createModule from '../public/wasm/cgh_wasm.js';
import {
  Box, Play, AlertTriangle, Info, Save, Plus,
  Trash2, Settings2, Sliders, Menu, InfoIcon
} from 'lucide-react';


export default function CGHTool() {
  /* --- WASM 实例状态 --- */
  const [wasmInstance, setWasmInstance] = useState(null);

  // 初始化 WASM
  useEffect(() => {
    createModule().then((instance) => {
      setWasmInstance(instance);
      console.log("WASM Ready");
    });
  }, []);


  /* --- 状态管理 --- */
  const [showSidebar, setShowSidebar] = useState(true);
  const [sigma, setSigma] = useState(100);
  const [pixelSize, setPixelSize] = useState(8);
  const [resX, setResX] = useState(1920);
  const [resY, setResY] = useState(1080);
  const [modes, setModes] = useState([
    { id: 1, type: 'HG', n: 0, m: 0, nx: 500, ny: 0 }
  ]);

  const lastPixelsRef = useRef(null);
  const canvasRef = useRef(null);

  const [transform, setTransform] = useState({ scale: 1, x: 0, y: 0 });
  const containerRef = useRef(null);
  const isDragging = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });

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



  // 生成可导出给 WASM 的 JSON 数据
  const loadConfig = () => {
    return {
      global: {
        sigma: parseFloat(sigma),
        pixelSize: parseFloat(pixelSize),
        resolution: [parseInt(resX), parseInt(resY)]
      },
      // 将 React 内部状态转化为扁平化的模式数组
      modeList: modes.map(m => ({
        type: m.type,
        n: m.n,
        m: m.m,
        nx: m.nx,
        ny: m.ny,
        // 如果是 PM (叠加模式)，递归或扁平化子模式
        subModes: m.type === 'PM' ? {
          plus: m.plusModes || [],
          minus: m.minusModes || []
        } : null
      }))
    };
  };


  const handleRun = () => {
    if (!wasmInstance || !canvasRef.current) return;

    const config = loadConfig();
    const width = config.global.resolution[0];
    const height = config.global.resolution[1];

    const pixels = wasmInstance.generateCGH(JSON.stringify(config));
    lastPixelsRef.current = pixels;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

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
  };



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
    link.download = "untitled.bmp";

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 60);
  };



  /* --- 模式列表操作函数 --- */
  const addMode = () => {
    const newId = modes.length > 0 ? Math.max(...modes.map(m => m.id)) + 1 : 1;
    setModes([...modes, { id: newId, type: 'HG', n: 0, m: 0, nx: 500, ny: 0 }]);
  };

  const removeMode = (id) => setModes(modes.filter(m => m.id !== id));

  const updateMode = (id, field, value) => {
    setModes(modes.map(m => {
      if (m.id === id) {
        if (field === 'type' && value === 'PM') {
          return { ...m, type: value, plusModes: [], minusModes: [] };
        }
        const val = (field === 'type')
          ? value
          : (value === '-' || value === '')
            ? value
            : (parseFloat(value) || 0);
        return { ...m, [field]: val };
      }
      return m;
    }));
  };

  const handleAddSubMode = (parentId, groupKey, type) => {
    setModes(modes.map(m => {
      if (m.id === parentId) {
        const subId = Date.now() + Math.random();
        return { ...m, [groupKey]: [...(m[groupKey] || []), { id: subId, type, n: 0, m: 0 }] };
      }
      return m;
    }));
    if (document.activeElement) document.activeElement.blur();
  };

  const removeSubMode = (parentId, groupKey, subId) => {
    setModes(modes.map(m => (m.id === parentId ? { ...m, [groupKey]: m[groupKey].filter(s => s.id !== subId) } : m)));
  };

  const updateSubMode = (parentId, groupKey, subId, field, value) => {
    setModes(modes.map(m => {
      if (m.id === parentId) {
        const newList = m[groupKey].map(s => s.id === subId ? { ...s, [field]: parseFloat(value) || 0 } : s);
        return { ...m, [groupKey]: newList };
      }
      return m;
    }));
  };

  return (
    <div className="flex flex-col h-screen bg-base-200 overflow-hidden text-sm font-sans">

      {/* --- 顶部导航栏 --- */}
      <header className="navbar bg-base-100 shadow-sm z-30 px-4 border-b border-base-300">
        <div className="flex-none">
          <button className="btn btn-ghost btn-sm btn-square" onClick={() => setShowSidebar(!showSidebar)}>
            <Menu size={20} />
          </button>
        </div>
        <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2">
          <div className="bg-primary p-1 rounded-lg"><Box size={18} className="text-primary-content" /></div>
          <span className="text-lg font-black tracking-tight uppercase">
            CGH Generator <span className="text-[10px] font-normal opacity-50 ml-1">v1.0</span>
          </span>
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
          if (e.key === 'Enter') {
            handleRun();
            if (document.activeElement) document.activeElement.blur();
          }
        }}
          className={`bg-base-200/50 border-r border-base-300 flex flex-col transition-all duration-300 ease-in-out ${showSidebar ? 'w-96' : 'w-0'} overflow-hidden`}>
          <div className="w-96 flex flex-col h-full shrink-0">
            <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">

              {/* 全局物理参数配置 */}
              <section>
                <div className="flex items-center gap-2 mb-3 text-primary font-bold">
                  <Settings2 size={16} /> <span>全局参数</span>
                </div>
                <div className="bg-base-100 border border-base-300 shadow-sm p-4 rounded-xl space-y-4">
                  <div className="form-control w-full">
                    <label className="label py-1 px-0"><span className="label-text font-medium text-xs">特征宽度 (σ, μm)</span></label>
                    <input type="text" value={sigma} onChange={(e) => setSigma(e.target.value)} className="input input-sm input-bordered focus:input-primary w-full font-mono" />
                  </div>
                  <div className="divider my-1 opacity-50"></div>
                  <div className="space-y-3">
                    <label className="label py-1 px-0"><span className="label-text font-medium text-xs">SLM 设备参数</span></label>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="form-control">
                        <label className="label py-1 px-0"><span className="label-text-alt text-[10px]">分辨率 X (px)</span></label>
                        <input type="text" value={resX} onChange={(e) => setResX(e.target.value)} className="input input-sm input-bordered font-mono" />
                      </div>
                      <div className="form-control">
                        <label className="label py-1 px-0"><span className="label-text-alt text-[10px]">分辨率 Y (px)</span></label>
                        <input type="text" value={resY} onChange={(e) => setResY(e.target.value)} className="input input-sm input-bordered font-mono" />
                      </div>
                    </div>
                    <div className="form-control w-full">
                      <label className="label py-1 px-0"><span className="label-text-alt text-[10px]">像素尺寸 (Pixel Size, μm)</span></label>
                      <input type="text" value={pixelSize} onChange={(e) => setPixelSize(e.target.value)} className="input input-sm input-bordered font-mono" />
                    </div>
                  </div>
                </div>
              </section>

              {/* 模式叠加列表 */}
              <section className="w-full">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2 text-primary font-bold">
                    <Sliders size={16} /> <span>模式列表</span>
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
                        <span className="label-text font-medium text-xs">列表为空，点击上方 + 号开始</span>
                      </motion.div>
                    ) : (
                      modes.map((mode, index) => (
                        <motion.div key={mode.id} layout initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.8, x: -30 }}
                          className="collapse collapse-arrow bg-base-100 border border-base-300 rounded-xl shadow-sm overflow-hidden"
                        >
                          <input type="checkbox" defaultChecked />
                          <div className="collapse-title flex items-center gap-3 pr-12 min-h-0">
                            <span className="badge badge-sm badge-ghost font-mono shrink-0">{index + 1}</span>
                            <span className="font-mono text-xs font-bold uppercase text-primary truncate">
                              {mode.type === 'PM' ? `PM (${(mode.plusModes?.length || 0) + (mode.minusModes?.length || 0)})` : `${mode.type}(${mode.n},${mode.m})`}
                            </span>
                          </div>

                          <div className="collapse-content">
                            <div className="pt-4 space-y-4">
                              <div className="join w-full bg-base-200 p-0.5 rounded-lg">
                                {['HG', 'LG', 'PM'].map((t) => (
                                  <button key={t} className={`join-item btn btn-xs flex-1 border-none ${mode.type === t ? 'btn-primary shadow-sm' : 'btn-ghost text-base-content/60'}`}
                                    onClick={() => updateMode(mode.id, 'type', t)}>
                                    {t}
                                  </button>
                                ))}
                              </div>

                              {mode.type === 'PM' ? (
                                <div className="space-y-4">
                                  {[{ label: 'Plus Modes (+)', key: 'plusModes', color: 'text-success' }, { label: 'Minus Modes (-)', key: 'minusModes', color: 'text-error' }].map(group => (
                                    <div key={group.key} className="space-y-2">
                                      <div className="flex justify-between items-center px-1">
                                        <span className={`text-[10px] font-bold uppercase tracking-wider ${group.color}`}>{group.label}</span>
                                        <div className="dropdown dropdown-end">
                                          <div tabIndex={0} role="button" className="btn btn-circle btn-ghost btn-xs text-primary bg-base-200"><Plus size={14} /></div>
                                          <ul tabIndex={0} className="dropdown-content z-100 menu p-2 shadow-2xl bg-base-100 rounded-box w-32 text-xs border border-base-300">
                                            <li><a onClick={() => handleAddSubMode(mode.id, group.key, 'HG')}>HG 模式</a></li>
                                            <li><a onClick={() => handleAddSubMode(mode.id, group.key, 'LG')}>LG 模式</a></li>
                                          </ul>
                                        </div>
                                      </div>
                                      <div className="space-y-1.5 border-l-2 border-base-300 ml-1 pl-3">
                                        <AnimatePresence mode="popLayout">
                                          {mode[group.key]?.map((sub) => (
                                            <motion.div key={sub.id} layout initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, scale: 0.8 }}
                                              className="flex items-center gap-2 bg-base-200/50 p-2 rounded-lg border border-base-300">
                                              <span className="text-[9px] font-black opacity-40 w-5 shrink-0">{sub.type}</span>
                                              <input type="text" className="input input-bordered input-xs w-12 font-mono" value={sub.n} onChange={(e) => updateSubMode(mode.id, group.key, sub.id, 'n', e.target.value)} />
                                              <input type="text" className="input input-bordered input-xs w-12 font-mono" value={sub.m} onChange={(e) => updateSubMode(mode.id, group.key, sub.id, 'm', e.target.value)} />
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
                                    <label className="label-text text-[10px] mb-1">{mode.type === 'LG' ? '角向阶数 L' : '水平阶数 M'}</label>
                                    <input type="text" value={mode.n} onChange={(e) => updateMode(mode.id, 'n', e.target.value)} className="input input-bordered input-xs font-mono" />
                                  </div>
                                  <div className="form-control">
                                    <label className="label-text text-[10px] mb-1">{mode.type === 'LG' ? '径向阶数 P' : '垂直阶数 N'}</label>
                                    <input type="text" value={mode.m} onChange={(e) => updateMode(mode.id, 'm', e.target.value)} className="input input-bordered input-xs font-mono" />
                                  </div>
                                </div>
                              )}

                              <div className="grid grid-cols-2 gap-4 border-t border-base-300 pt-3">
                                <div className="form-control">
                                  <label className="label-text text-[10px] mb-1">载波 Nx</label>
                                  <input type="text" value={mode.nx} onChange={(e) => updateMode(mode.id, 'nx', e.target.value)} className="input input-bordered input-xs font-mono" />
                                </div>
                                <div className="form-control">
                                  <label className="label-text text-[10px] mb-1">载波 Ny</label>
                                  <input type="text" value={mode.ny} onChange={(e) => updateMode(mode.id, 'ny', e.target.value)} className="input input-bordered input-xs font-mono" />
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
            <div className="p-4 border-t border-base-300 bg-base-100 space-y-3">
              <button onClick={handleRun} className="btn btn-primary btn-block shadow-lg shadow-primary/20 active:scale-95 transition-all">
                <Play size={16} fill="currentColor" /> RUN !
              </button>
              <div className="grid grid-cols-2 gap-3">
                <button className="btn btn-outline btn-error btn-sm" onClick={() => document.getElementById('clear_modal').showModal()}>
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
            style={{ backgroundImage: 'radial-gradient(circle, #000 2px, transparent 2px)', backgroundSize: '32px 32px' }}
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
                transition: isDragging.current ? 'none' : 'transform 0.1s ease-out',
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
            <form method="dialog" className="flex gap-2 w-full justify-end">
              <button className="btn btn-ghost btn-sm w-20">取消</button>
              <button className="btn btn-error btn-sm w-20" onClick={() => setModes([])}>确认</button>
            </form>
          </div>
        </div>
      </dialog>

      {/* 关于项目信息 */}
      <dialog id="info_modal" className="modal modal-bottom sm:modal-middle">
        <div className="modal-box">
          <h3 className="font-bold text-lg text-primary flex items-center gap-2"><InfoIcon size={20} /> 关于 CGH Tool</h3>
          <p className="py-4 text-sm text-base-content/60 leading-relaxed">
            基于 Arrizon 2 算法的全息图生成工具。
            实时预览的图片仅供参考，生成的 CGH 以保存下来的为准。
          </p>
          <div className="modal-action">
            <form method="dialog" className="flex gap-2 w-full justify-end">
              <a className="btn btn-ghost btn-sm w-20" target="_blank" rel="noopener noreferrer" href="https://gitee.com/vxyi/cgh-app">Gitee</a>
              <button className="btn btn-primary btn-sm w-20">确定</button>
            </form>
          </div>
        </div>
      </dialog>

    </div>
  );
}