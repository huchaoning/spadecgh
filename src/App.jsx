import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Box, Play, AlertTriangle, Info, Save, Plus, Trash2, Settings2, Sliders, Menu, InfoIcon } from 'lucide-react';

export default function CGHTool() {
  const [showSidebar, setShowSidebar] = useState(true);
  const [sigma, setSigma] = useState(100);
  const [pixelSize, setPixelSize] = useState(8);
  const [modes, setModes] = useState([
    { id: 1, type: 'HG', n: 0, m: 1, nx: 500, ny: 0 }
  ]);

  // --- 逻辑处理函数 ---
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
        const val = field === 'type' ? value : (parseInt(value) || 0);
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
        const newList = m[groupKey].map(s => s.id === subId ? { ...s, [field]: parseInt(value) || 0 } : s);
        return { ...m, [groupKey]: newList };
      }
      return m;
    }));
  };

  return (
    <div className="flex flex-col h-screen bg-base-200 overflow-hidden text-sm font-sans">
      {/* Header */}
      <header className="navbar bg-base-100 shadow-sm z-30 px-4 border-b border-base-300">
        <div className="flex-none">
          <button className="btn btn-ghost btn-sm btn-square" onClick={() => setShowSidebar(!showSidebar)}>
            <Menu size={20} />
          </button>
        </div>
        <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2">
          <div className="bg-primary p-1 rounded-lg"><Box size={18} className="text-primary-content" /></div>
          <span className="text-lg font-black tracking-tight uppercase">CGH Generator <span className="text-[10px] font-normal opacity-50 ml-1">v1.0</span></span>
        </div>
        <div className="flex-1 flex justify-end">
          <button className="btn btn-ghost btn-sm btn-square text-base-content/40 hover:text-primary transition-colors" onClick={() => document.getElementById("info_modal").showModal()}>
            <Info size={20} />
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar - 修复动画平滑度 */}
        <aside className={`bg-base-200/50 border-r border-base-300 flex flex-col transition-all duration-300 ease-in-out ${showSidebar ? 'w-96' : 'w-0'} overflow-hidden`}>
          {/* 内部固定宽度容器，防止文字在宽度变小时闪烁换行 */}
          <div className="w-96 flex flex-col h-full shrink-0">
            <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">

              {/* 全局物理参数 */}
              <section>
                <div className="flex items-center gap-2 mb-3 text-primary font-bold"><Settings2 size={16} /> <span>全局参数</span></div>
                <div className="bg-base-100 border border-base-300 shadow-sm p-4 rounded-xl space-y-4">
                  <div className="form-control w-full space-y-3">
                    <label className="label py-1 px-0"><span className="label-text font-medium text-xs">特征宽度 (Sigma, μm)</span></label>
                    <input type="number" value={sigma} onChange={(e) => setSigma(e.target.value)} className="input input-sm input-bordered focus:input-primary w-full font-mono" />
                  </div>
                  <div className="divider my-1 opacity-50"></div>
                  <div className="space-y-3">
                    <label className="label py-1 px-0"><span className="label-text font-medium text-xs">SLM 设备参数</span></label>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="form-control">
                        <label className="label py-1 px-0"><span className="label-text-alt text-[10px]">分辨率 X (px)</span></label>
                        <input type="number" defaultValue={1920} className="input input-sm input-bordered font-mono" />
                      </div>
                      <div className="form-control">
                        <label className="label py-1 px-0"><span className="label-text-alt text-[10px]">分辨率 Y (px)</span></label>
                        <input type="number" defaultValue={1080} className="input input-sm input-bordered font-mono" />
                      </div>
                    </div>
                    <div className="form-control w-full">
                      <label className="label py-1 px-0"><span className="label-text-alt text-[10px]">像素尺寸 (Pixel Size, μm)</span></label>
                      <input type="number" value={pixelSize} onChange={(e) => setPixelSize(e.target.value)} className="input input-sm input-bordered font-mono" />
                    </div>
                  </div>
                </div>
              </section>

              {/* 模式叠加列表 */}
              <section className="w-full">
                {/* 列表头部：标题和添加按钮 */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2 text-primary font-bold">
                    <Sliders size={16} /> <span>模式列表</span>
                  </div>
                  <button
                    onClick={addMode}
                    className="btn btn-xs btn-circle btn-primary shadow-md hover:scale-110 active:scale-90 transition-all"
                  >
                    <Plus size={14} />
                  </button>
                </div>

                <div className="space-y-3 relative">
                  {/* AnimatePresence 必须包裹整个循环逻辑 */}
                  <AnimatePresence mode="popLayout">
                    {modes.length === 0 ? (
                      /* 空状态提示动画 */
                      <motion.div
                        key="empty-state"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="border-2 border-dashed border-base-300 rounded-2xl p-10 text-center flex flex-col items-center gap-3"
                      >
                        <label className="flex flex-col label py-1 px-0">
                          <Sliders size={32} />
                          <span className="label-text font-medium text-xs">列表为空，点击 + 号开始添加</span>
                        </label>
                        
                      </motion.div>
                    ) : (
                      /* 模式卡片循环 */
                      modes.map((mode, index) => (
                        <motion.div
                          key={mode.id} // 动画核心：必须是唯一的 mode.id
                          layout        // 物理补间动画：删除时下方的卡片会平滑滑上来
                          initial={{ opacity: 0, scale: 0.9, y: 20 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.8, x: -30, transition: { duration: 0.2 } }}
                          className="collapse collapse-arrow bg-base-100 border border-base-300 rounded-xl shadow-sm overflow-hidden"
                        >
                          <input type="checkbox" defaultChecked />

                          {/* 卡片头部 */}
                          <div className="collapse-title flex items-center gap-3 pr-12 min-h-0">
                            <span className="badge badge-sm badge-ghost font-mono shrink-0">{index + 1}</span>
                            <span className="font-mono text-xs font-bold uppercase text-primary truncate">
                              {mode.type === 'PM' ? `PM (${(mode.plusModes?.length || 0) + (mode.minusModes?.length || 0)})` : `${mode.type}(${mode.n},${mode.m})`}
                            </span>
                          </div>

                          {/* 卡片展开内容 */}
                          <div className="collapse-content">
                            <div className="pt-4 space-y-4">
                              {/* 模式类型切换 */}
                              <div className="join w-full bg-base-200 p-0.5 rounded-lg">
                                {['HG', 'LG', 'PM'].map((t) => (
                                  <button
                                    key={t}
                                    className={`join-item btn btn-xs flex-1 border-none ${mode.type === t ? 'btn-primary shadow-sm' : 'btn-ghost text-base-content/60'}`}
                                    onClick={() => updateMode(mode.id, 'type', t)}
                                  >
                                    {t}
                                  </button>
                                ))}
                              </div>

                              {/* 根据类型渲染参数输入框 */}
                              {mode.type === 'PM' ? (
                                <div className="space-y-4">
                                  {[{ label: 'Plus Modes (+)', key: 'plusModes', color: 'text-success' }, { label: 'Minus Modes (-)', key: 'minusModes', color: 'text-error' }].map(group => (
                                    <div key={group.key} className="space-y-2">
                                      <div className="flex justify-between items-center px-1">
                                        <span className={`text-[10px] font-bold uppercase tracking-wider ${group.color}`}>{group.label}</span>
                                        <div className="dropdown dropdown-end">
                                          <div tabIndex={0} role="button" className="btn btn-circle btn-ghost btn-xs text-primary bg-base-200 hover:bg-primary hover:text-white transition-all"><Plus size={14} /></div>
                                          <ul tabIndex={0} className="dropdown-content z-100 menu p-2 shadow-2xl bg-base-100 rounded-box w-32 text-xs border border-base-300">
                                            <li><a onClick={() => handleAddSubMode(mode.id, group.key, 'HG')}>HG Mode</a></li>
                                            <li><a onClick={() => handleAddSubMode(mode.id, group.key, 'LG')}>LG Mode</a></li>
                                          </ul>
                                        </div>
                                      </div>

                                      {/* 子模式列表动画 */}
                                      <div className="space-y-1.5 min-h-2.5 border-l-2 border-base-300 ml-1 pl-3">
                                        <AnimatePresence mode="popLayout">
                                          {mode[group.key]?.map((sub) => (
                                            <motion.div
                                              key={sub.id}
                                              layout
                                              initial={{ opacity: 0, x: -10 }}
                                              animate={{ opacity: 1, x: 0 }}
                                              exit={{ opacity: 0, scale: 0.8 }}
                                              className="flex items-center gap-2 bg-base-200/50 p-2 rounded-lg border border-base-300"
                                            >
                                              <span className="text-[9px] font-black opacity-40 w-5 shrink-0">{sub.type}</span>
                                              <input type="number" className="input input-bordered input-xs w-12 font-mono" value={sub.n} onChange={(e) => updateSubMode(mode.id, group.key, sub.id, 'n', e.target.value)} />
                                              <input type="number" className="input input-bordered input-xs w-12 font-mono" value={sub.m} onChange={(e) => updateSubMode(mode.id, group.key, sub.id, 'm', e.target.value)} />
                                              <button className="btn btn-ghost btn-xs btn-square text-error/40 hover:text-error" onClick={() => removeSubMode(mode.id, group.key, sub.id)}><Trash2 size={12} /></button>
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
                                    <label className="label-text text-[10px] mb-1">{mode.type === 'LG' ? 'Radial P' : 'Order N'}</label>
                                    <input type="number" value={mode.n} onChange={(e) => updateMode(mode.id, 'n', e.target.value)} className="input input-bordered input-xs font-mono" />
                                  </div>
                                  <div className="form-control">
                                    <label className="label-text text-[10px] mb-1">{mode.type === 'LG' ? 'Azimuthal L' : 'Order M'}</label>
                                    <input type="number" value={mode.m} onChange={(e) => updateMode(mode.id, 'm', e.target.value)} className="input input-bordered input-xs font-mono" />
                                  </div>
                                </div>
                              )}

                              {/* 公共频率参数 */}
                              <div className="grid grid-cols-2 gap-4 border-t border-base-300 pt-3">
                                <div className="form-control">
                                  <label className="label-text text-[10px] mb-1 font-bold">频率 Nx</label>
                                  <input type="number" value={mode.nx} onChange={(e) => updateMode(mode.id, 'nx', e.target.value)} className="input input-bordered input-xs font-mono" />
                                </div>
                                <div className="form-control">
                                  <label className="label-text text-[10px] mb-1 font-bold">频率 Ny</label>
                                  <input type="number" value={mode.ny} onChange={(e) => updateMode(mode.id, 'ny', e.target.value)} className="input input-bordered input-xs font-mono" />
                                </div>
                              </div>

                              {/* 删除按钮 */}
                              <button
                                onClick={() => removeMode(mode.id)}
                                className="btn btn-error btn-outline btn-xs btn-block hover:shadow-md transition-all active:scale-95"
                              >
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

            {/* 底部按钮 */}
            <div className="p-4 border-t border-base-300 bg-base-100 space-y-3">
              <button className="btn btn-primary btn-block shadow-lg shadow-primary/20 active:scale-95 transition-all">
                <Play size={16} fill="currentColor" /> RUN !
              </button>
              <div className="grid grid-cols-2 gap-3">
                <button className="btn btn-outline btn-error btn-sm" onClick={() => document.getElementById('clear_modal').showModal()}><Trash2 size={14} /> Clear</button>
                <button className="btn btn-outline btn-sm"><Save size={14} /> Save</button>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
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
      </div>

      {/* Clear Confirmation Modal */}
      <dialog id="clear_modal" className="modal modal-bottom sm:modal-middle">
        <div className="modal-box">
          <h3 className="font-bold text-lg text-error flex items-center gap-2"><AlertTriangle size={20} /> 确认清除？</h3>
          <p className="py-4 text-sm text-base-content/60">此操作将清空所有已配置的模式。该操作不可撤销。</p>
          <div className="modal-action">
            <form method="dialog" className="flex gap-2 w-full justify-end">
              <button className="btn btn-ghost btn-sm px-6">取消</button>
              <button className="btn btn-error btn-sm px-6" onClick={() => setModes([])}>确认</button>
            </form>
          </div>
        </div>
      </dialog>

      {/* Info Modal */}
      <dialog id="info_modal" className="modal modal-bottom sm:modal-middle">
        <div className="modal-box">
          <h3 className="font-bold text-lg text-primary flex items-center gap-2"><InfoIcon size={20} />关于</h3>
          <p className="py-4 text-sm text-base-content/60">
            这是一个个人项目, 正在开发中.
            本项目旨在将 Arrizon 2 计算全息图算法 GUI 化, 方便用户使用.
            如果该项目对你有帮助, 请引用他们的文章.
          </p>
          <div className="modal-action">
            <form method="dialog" className="flex gap-2 w-full justify-end">
              <button className="btn btn-ghost btn-sm px-6">GitHub</button>
              <button className="btn btn-primary btn-sm px-6">OK</button>
            </form>
          </div>
        </div>
      </dialog>
    </div>

  );
}