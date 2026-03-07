import { useState } from 'react';
import { Layers, History, Menu, Box, Play, AlertTriangle, Info, Save, Plus, Trash2, Settings2, Sliders } from 'lucide-react';

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
        {/* 左侧：菜单开关 */}
        <div className="flex-none">
          <button
            className="btn btn-ghost btn-sm btn-square"
            onClick={() => setShowSidebar(!showSidebar)}
          >
            <Menu size={20} />
          </button>
        </div>

        {/* 中间：标题 (绝对居中) */}
        <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2">
          <div className="bg-primary p-1 rounded-lg">
            <Box size={18} className="text-primary-content" />
          </div>
          <span className="text-lg font-black tracking-tight">
            CGH Generator <span className="text-xs font-normal opacity-50 uppercase ml-1">v1.0</span>
          </span>
        </div>

        {/* 右侧：信息按钮 */}
        <div className="flex-1 flex justify-end">
          <button
            className="btn btn-ghost btn-sm btn-square text-base-content/60 hover:text-primary transition-colors"
            title="系统信息"
            onClick={() => {/* 触发弹窗 */ }}
          >
            <Info size={20} />
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className={`bg-base-100 border-r border-base-300 flex flex-col transition-all duration-300 ${showSidebar ? 'w-96' : 'w-0 overflow-hidden'}`}>

          <div className="p-4 bg-base-200/50">
            <div role="tablist" className="tabs tabs-boxed bg-base-300">
              <button className={`tab tab-sm flex-1 ${activeTab === 'modes' ? 'tab-active' : ''}`} onClick={() => setActiveTab('modes')}>
                <Layers size={14} className="mr-2" /> 参数配置
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
                <div className="space-y-4">
                  {/* 全局参数分区 */}
                  <section>
                    <div className="flex items-center gap-2 mb-3 text-primary font-bold">
                      <Settings2 size={16} /> <span>全局参数</span>
                    </div>
                    <div className="bg-base-200 p-4 rounded-xl space-y-4">
                      {/* 特征宽度改为输入框 */}
                      <div className="form-control w-full">
                        <label className="label py-1 px-0">
                          <span className="label-text font-medium text-xs">特征宽度 (Sigma, μm)</span>
                        </label>
                        <input
                          type="number"
                          value={sigma}
                          onChange={(e) => setSigma(e.target.value)}
                          placeholder="请输入宽度..."
                          className="input input-sm input-bordered focus:input-primary w-full font-mono"
                        />
                      </div>

                      <div className="divider my-1 opacity-50"></div>

                      {/* 空间光调制器 (SLM) 参数子分区 */}
                      <div className="space-y-3">
                        <div className="flex items-center gap-1.5 text-base-content/70 font-semibold text-xs uppercase tracking-wider">
                          <span>空间光调制器 (SLM) 参数</span>
                        </div>

                        {/* 分辨率配置：X 和 Y 并排 */}
                        <div className="grid grid-cols-2 gap-3">
                          <div className="form-control">
                            <label className="label py-1 px-0">
                              <span className="label-text-alt text-xs">分辨率 X (px)</span>
                            </label>
                            <input
                              type="number"
                              defaultValue={1920}
                              className="input input-sm input-bordered font-mono"
                            />
                          </div>
                          <div className="form-control">
                            <label className="label py-1 px-0">
                              <span className="label-text-alt text-xs">分辨率 Y (px)</span>
                            </label>
                            <input
                              type="number"
                              defaultValue={1080}
                              className="input input-sm input-bordered font-mono"
                            />
                          </div>
                        </div>

                        {/* 像素尺寸 */}
                        <div className="form-control w-full">
                          <label className="label py-1 px-0">
                            <span className="label-text-alt text-xs">像素尺寸 (Pixel Size, μm)</span>
                          </label>
                          <input
                            type="number"
                            defaultValue={8}
                            className="input input-sm input-bordered font-mono"
                          />
                        </div>
                      </div>
                    </div>
                  </section>
                </div>

                {/* 模式叠加列表 */}
                <section>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2 text-primary font-bold">
                      <Sliders size={16} /> <span>模式列表</span>
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
                              <label className="label-text text-[10px] mb-1">频率 Nx</label>
                              <input type="number" value={mode.nx} onChange={(e) => updateMode(mode.id, 'nx', e.target.value)} className="input input-bordered input-xs" />
                            </div>
                            <div className="form-control">
                              <label className="label-text text-[10px] mb-1">频率 Ny</label>
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

          <div className="p-4 border-t border-base-300 bg-base-100 space-y-3">
            {/* 主运行按钮 */}
            <button className="btn btn-primary btn-block shadow-lg shadow-primary/20">
              <Play size={16} fill="currentColor" /> RUN !
            </button>

            <div className="grid grid-cols-2 gap-3">
              {/* Clear 按钮：使用 btn-error 红色 */}
              <button
                className="btn btn-outline btn-error btn-sm gap-2"
                onClick={() => document.getElementById('clear_modal').showModal()}
              >
                <Trash2 size={14} /> Clear
              </button>

              <button className="btn btn-outline btn-sm gap-2">
                <Save size={14} /> Save
              </button>
            </div>

            {/* DaisyUI 确认模态框 */}
            <dialog id="clear_modal" className="modal modal-bottom sm:modal-middle">
              <div className="modal-box">
                <h3 className="font-bold text-lg text-error flex items-center gap-2">
                  <AlertTriangle size={20} /> 确认清除数据？
                </h3>
                <p className="py-4 text-sm text-base-content/70">
                  此操作将重置所有全局参数和 SLM 设置为默认值，该操作无法撤销。
                </p>
                <div className="modal-action">
                  <form method="dialog" className="flex gap-2">
                    <button className="btn btn-error">取消</button>
                    <button
                      className="btn"
                      onClick={() => {
                        /* 在这里调用你的重置逻辑，例如 setSigma(100) 等 */
                        console.log("Data cleared");
                      }}
                    >
                      确认清除
                    </button>
                  </form>
                </div>
              </div>
              <form method="dialog" className="modal-backdrop">
                <button>close</button>
              </form>
            </dialog>
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
            </div>
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <Box size={60} className="mx-auto mb-4 opacity-10 text-white animate-pulse" />
                <p className="text-white/20 font-mono text-xs uppercase tracking-widest">Waiting for calculation...</p>
              </div>
            </div>
            {/* 底部缩放控制栏 */}
            <div className="bg-black/40 backdrop-blur-md p-3 flex justify-between items-center border-t border-white/5">
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}