import React from 'react';
import { Settings2, Sliders, Plus, Trash2, Save, Play } from 'lucide-react';

export default function Sidebar({
  showSidebar, sigma, setSigma, pixelSize, setPixelSize, modes,
  addMode, removeMode, updateMode, handleAddSubMode, removeSubMode, updateSubMode, setModes
}) {
  return (
    <aside className={`bg-base-200/50 border-r border-base-300 flex flex-col transition-all duration-300 ease-in-out ${showSidebar ? 'w-96' : 'w-0'} overflow-hidden`}>
      <div className="w-96 flex flex-col h-full shrink-0">
        <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">
          {/* 全局物理参数 */}
          <section>
            <div className="flex items-center gap-2 mb-3 text-primary font-bold"><Settings2 size={16} /> <span>全局参数</span></div>
            <div className="bg-base-100 border border-base-300 shadow-sm p-4 rounded-xl space-y-4">
              <div className="form-control w-full">
                <label className="label py-1 px-0"><span className="label-text font-medium text-xs">特征宽度 (Sigma, μm)</span></label>
                <input type="number" value={sigma} onChange={(e) => setSigma(e.target.value)} className="input input-sm input-bordered focus:input-primary w-full font-mono" />
              </div>
              <div className="divider my-1 opacity-50"></div>
              <div className="space-y-3">
                <span className="text-[10px] text-base-content/50 font-bold uppercase tracking-widest">SLM 设备参数</span>
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
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-primary font-bold"><Sliders size={16} /> <span>模式列表</span></div>
              <button onClick={addMode} className="btn btn-xs btn-circle btn-primary shadow-md hover:scale-110 active:scale-90 transition-all"><Plus size={14} /></button>
            </div>

            <div className="space-y-3">
              {modes.length === 0 ? (
                <div className="border-2 border-dashed border-base-300 rounded-2xl p-10 text-center flex flex-col items-center gap-3 opacity-30">
                  <Sliders size={32} />
                  <p className="text-xs font-bold tracking-tight">列表为空，点击 + 号开始添加</p>
                </div>
              ) : (
                modes.map((mode, index) => (
                  <div key={mode.id} className="collapse collapse-arrow bg-base-100 border border-base-300 rounded-xl shadow-sm overflow-hidden">
                    <input type="checkbox" defaultChecked />
                    <div className="collapse-title flex items-center gap-3 pr-12 min-h-0">
                      <span className="badge badge-sm badge-ghost font-mono shrink-0">{index + 1}</span>
                      <span className="font-mono text-xs font-bold uppercase text-primary truncate">
                        {mode.type === 'PM' ? `PM (${(mode.plusModes?.length || 0) + (mode.minusModes?.length || 0)})` : `${mode.type}(${mode.n},${mode.m})`}
                      </span>
                    </div>

                    <div className="collapse-content transition-all duration-300 ease-in-out">
                      <div className="pt-4 space-y-4">
                        <div className="join w-full bg-base-200 p-0.5 rounded-lg">
                          {['HG', 'LG', 'PM'].map((t) => (
                            <button key={t} className={`join-item btn btn-xs flex-1 border-none ${mode.type === t ? 'btn-primary shadow-sm' : 'btn-ghost text-base-content/60'}`} onClick={() => updateMode(mode.id, 'type', t)}> {t} </button>
                          ))}
                        </div>

                        {mode.type === 'PM' ? (
                          <div className="space-y-4">
                            {[{ label: 'Plus Modes (+)', key: 'plusModes', color: 'text-success' }, { label: 'Minus Modes (-)', key: 'minusModes', color: 'text-error' }].map(group => (
                              <div key={group.key} className="space-y-2">
                                <div className="flex justify-between items-center px-1">
                                  <span className={`text-[10px] font-bold uppercase tracking-wider ${group.color}`}>{group.label}</span>
                                  <div className="dropdown dropdown-end">
                                    <div tabIndex={0} role="button" className="btn btn-circle btn-ghost btn-xs text-primary bg-base-200 hover:bg-primary hover:text-white transition-all"><Plus size={14} /></div>
                                    <ul tabIndex={0} className="dropdown-content z-100 menu p-2 shadow-2xl bg-base-100 rounded-box w-32 text-xs border border-base-300">
                                      <li><a className="hover:bg-primary hover:text-white py-2" onClick={() => handleAddSubMode(mode.id, group.key, 'HG')}>HG Mode</a></li>
                                      <li><a className="hover:bg-primary hover:text-white py-2" onClick={() => handleAddSubMode(mode.id, group.key, 'LG')}>LG Mode</a></li>
                                    </ul>
                                  </div>
                                </div>
                                <div className="space-y-1.5 min-h-2.5 border-l-2 border-base-300 ml-1 pl-3">
                                  {mode[group.key]?.map((sub) => (
                                    <div key={sub.id} className="flex items-center gap-2 bg-base-200/50 p-2 rounded-lg border border-base-300">
                                      <span className="text-[9px] font-black opacity-40 w-5 shrink-0">{sub.type}</span>
                                      <input type="number" className="input input-bordered input-xs w-12 font-mono" value={sub.n} onChange={(e) => updateSubMode(mode.id, group.key, sub.id, 'n', e.target.value)} />
                                      <input type="number" className="input input-bordered input-xs w-12 font-mono" value={sub.m} onChange={(e) => updateSubMode(mode.id, group.key, sub.id, 'm', e.target.value)} />
                                      <button className="btn btn-ghost btn-xs btn-square text-error/40 hover:text-error hover:bg-error/10" onClick={() => removeSubMode(mode.id, group.key, sub.id)}><Trash2 size={12} /></button>
                                    </div>
                                  ))}
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
                        <button onClick={() => removeMode(mode.id)} className="btn btn-error btn-outline btn-xs btn-block hover:shadow-md"><Trash2 size={12} /> 删除该模式</button>
                      </div>
                    </div>
                  </div>
                ))
              )}
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
  );
}