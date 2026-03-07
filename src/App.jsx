import { useState } from 'react';
import { Layers, History, Menu, Box, Play, Info, Plus, Trash2, Settings2, Sliders } from 'lucide-react';

export default function CGHTool() {
  const [showSidebar, setShowSidebar] = useState(true);
  const [activeTab, setActiveTab] = useState('modes');
  
  // 对应 Python 中的 CGH(sigma)
  const [sigma, setSigma] = useState(100);
  // 对应 add_modes 中的列表数据
  const [modes, setModes] = useState([
    { id: 1, n: 0, m: 1, nx: 500, ny: 0, type: 'HG' }
  ]);

  const addMode = () => {
    const newId = modes.length > 0 ? Math.max(...modes.map(m => m.id)) + 1 : 1;
    setModes([...modes, { id: newId, n: 0, m: 0, nx: 500, ny: 0, type: 'HG' }]);
  };

  const removeMode = (id) => setModes(modes.filter(m => m.id !== id));

  const updateMode = (id, field, value) => {
    setModes(modes.map(m => m.id === id ? { ...m, [field]: parseInt(value) || 0 } : m));
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
          <span className="text-lg font-black tracking-tight">CGH Generator <span className="text-xs font-normal opacity-50">v1.0</span></span>
        </div>
        <div className="flex-1 flex justify-end gap-2">
          <div className="badge badge-outline gap-2 opacity-70">
            <div className="w-2 h-2 rounded-full bg-success animate-pulse"></div>
            SLM: HoloEye PLUTO-2
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className={`bg-base-100 border-r border-base-300 flex flex-col transition-all duration-300 ${showSidebar ? 'w-96' : 'w-0 overflow-hidden'}`}>
          
          <div className="p-4 bg-base-200/50">
            <div role="tablist" className="tabs tabs-boxed bg-base-300">
              <button className={`tab tab-sm flex-1 ${activeTab === 'modes' ? 'tab-active' : ''}`} onClick={() => setActiveTab('modes')}>
                <Layers size={14} className="mr-2" /> 模式配置
              </button>
              <button className={`tab tab-sm flex-1 ${activeTab === 'history' ? 'tab-active' : ''}`} onClick={() => setActiveTab('history')}>
                <History size={14} className="mr-2" /> 运行历史
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {activeTab === 'modes' ? (
              <div className="p-4 space-y-6">
                
                {/* 全局物理参数 */}
                <section>
                  <div className="flex items-center gap-2 mb-3 text-primary font-bold">
                    <Settings2 size={16} /> <span>全局参数 (Global)</span>
                  </div>
                  <div className="bg-base-200 p-3 rounded-xl space-y-3">
                    <div className="form-control w-full">
                      <label className="label py-1 px-0">
                        <span className="label-text font-medium text-xs">束腰半径 (Sigma)</span>
                        <span className="label-text-alt text-primary font-mono">{sigma}</span>
                      </label>
                      <input 
                        type="range" min="10" max="500" value={sigma} 
                        onChange={(e) => setSigma(e.target.value)} 
                        className="range range-xs range-primary" 
                      />
                    </div>
                  </div>
                </section>

                {/* 模式叠加列表 */}
                <section>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2 text-primary font-bold">
                      <Sliders size={16} /> <span>叠加模式 (Modes)</span>
                    </div>
                    <button onClick={addMode} className="btn btn-xs btn-circle btn-primary"><Plus size={14} /></button>
                  </div>

                  <div className="space-y-3">
                    {modes.map((mode, index) => (
                      <div key={mode.id} className="collapse collapse-arrow bg-base-200 border border-base-300 rounded-xl overflow-visible">
                        <input type="checkbox" defaultChecked /> 
                        <div className="collapse-title flex items-center gap-3 pr-12">
                          <span className="badge badge-sm badge-ghost">{index + 1}</span>
                          <span className="font-mono text-xs font-bold">HG({mode.n}, {mode.m})</span>
                          <span className="text-[10px] opacity-50">freq: {mode.nx}, {mode.ny}</span>
                        </div>
                        <div className="collapse-content space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="form-control">
                              <label className="label-text text-[10px] mb-1">阶数 N (Order N)</label>
                              <input type="number" value={mode.n} onChange={(e) => updateMode(mode.id, 'n', e.target.value)} className="input input-bordered input-xs" />
                            </div>
                            <div className="form-control">
                              <label className="label-text text-[10px] mb-1">阶数 M (Order M)</label>
                              <input type="number" value={mode.m} onChange={(e) => updateMode(mode.id, 'm', e.target.value)} className="input input-bordered input-xs" />
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4 border-t border-base-300 pt-3">
                            <div className="form-control">
                              <label className="label-text text-[10px] mb-1 text-secondary">频率 NX</label>
                              <input type="number" value={mode.nx} onChange={(e) => updateMode(mode.id, 'nx', e.target.value)} className="input input-bordered input-xs" />
                            </div>
                            <div className="form-control">
                              <label className="label-text text-[10px] mb-1 text-secondary">频率 NY</label>
                              <input type="number" value={mode.ny} onChange={(e) => updateMode(mode.id, 'ny', e.target.value)} className="input input-bordered input-xs" />
                            </div>
                          </div>
                          <button onClick={() => removeMode(mode.id)} className="btn btn-error btn-outline btn-xs btn-block mt-2">
                            <Trash2 size={12} /> 删除该模式
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              </div>
            ) : (
              <div className="p-4 italic opacity-40 text-center mt-10 text-xs">暂无历史记录</div>
            )}
          </div>

          <div className="p-4 border-t border-base-300 bg-base-100">
            <button className="btn btn-primary btn-block shadow-lg shadow-primary/20">
              <Play size={16} fill="currentColor" /> 执行仿真计算 (Cal)
            </button>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 bg-base-300 relative p-8 flex flex-col gap-6">
          {/* 网格背景 */}
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
            style={{ backgroundImage: 'radial-gradient(circle, #000 2px, transparent 2px)', backgroundSize: '32px 32px' }}>
          </div>

          {/* 实时预览卡片 */}
          <div className="flex-1 flex flex-col bg-neutral rounded-2xl shadow-2xl border border-white/10 overflow-hidden relative group">
             <div className="absolute top-4 left-4 z-10">
                <span className="badge badge-neutral bg-black/50 text-white/70 backdrop-blur-md border-none px-3 py-3">
                  RESULT_VIEWER (1920 × 1080)
                </span>
             </div>
             <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <Box size={60} className="mx-auto mb-4 opacity-10 text-white animate-pulse" />
                  <p className="text-white/20 font-mono text-xs uppercase tracking-widest">Waiting for calculation...</p>
                </div>
             </div>
             {/* 底部缩放控制栏 */}
             <div className="bg-black/40 backdrop-blur-md p-3 flex justify-between items-center border-t border-white/5">
                <div className="flex gap-2">
                  <button className="btn btn-xs btn-ghost text-white/50">Save Image</button>
                  <button className="btn btn-xs btn-ghost text-white/50">Copy Data</button>
                </div>
                <span className="text-[10px] font-mono text-white/30">HOLO_ENGINE_READY</span>
             </div>
          </div>
        </main>
      </div>
    </div>
  );
}