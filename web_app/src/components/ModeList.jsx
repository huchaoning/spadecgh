import { motion, AnimatePresence } from "framer-motion";
import { Sliders, Plus, Trash2 } from "lucide-react";
import { formatInputValue } from "../utils/formatInput";

export default function ModeList({
  modes,
  onAddMode,
  onRemoveMode,
  onUpdateMode,
  onAddSubMode,
  onRemoveSubMode,
  onUpdateSubMode,
}) {
  return (
    <section className="w-full">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 text-primary font-bold">
          <Sliders size={16} /> <div>Target modes</div>
        </div>
        <button
          onClick={onAddMode}
          className="btn btn-xs btn-circle btn-primary shadow-md hover:scale-110 active:scale-90 transition-all"
        >
          <Plus size={14} />
        </button>
      </div>

      <div className="space-y-3 relative">
        <AnimatePresence mode="popLayout">
          {modes.length === 0 ? (
            <motion.div
              key="empty-state"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="border-2 border-dashed border-base-300 rounded-2xl p-10 text-center flex flex-col items-center gap-3"
            >
              <Sliders size={32} className="opacity-20" />
              <div className="font-medium text-xs opacity-40">
                List is empty. Click + to start.
              </div>
            </motion.div>
          ) : (
            modes.map((mode, index) => (
              <motion.div
                key={mode.id}
                layout
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8, x: -30 }}
                className="collapse collapse-arrow bg-base-100 border border-base-200 rounded-xl shadow-sm overflow-hidden"
              >
                <input type="checkbox" defaultChecked />
                <div className="collapse-title flex items-center gap-3 pr-12 min-h-0">
                  <div className="badge badge-sm badge-ghost shrink-0">{index + 1}</div>
                  <div className="text-xs font-bold text-primary">
                    {mode.type === "PM"
                      ? `PM (${(mode.plusModes?.length || 0) + (mode.minusModes?.length || 0)}); Shift(${mode.sx}, ${mode.sy})`
                      : `${mode.type}(${mode.o1}, ${mode.o2}); Shift(${mode.sx}, ${mode.sy})`}
                  </div>
                </div>

                <div className="collapse-content">
                  <div className="pt-4 space-y-4">
                    <div className="join w-full bg-base-200 p-0.5 rounded-lg">
                      {["HG", "LG", "PM"].map((t) => (
                        <button
                          key={t}
                          className={`join-item btn btn-xs flex-1 border-none ${mode.type === t ? "btn-primary shadow-sm" : "btn-ghost opacity-40"}`}
                          onClick={() => onUpdateMode(mode.id, "type", t)}
                        >
                          {t}
                        </button>
                      ))}
                    </div>

                    {mode.type === "PM" ? (
                      <div className="space-y-4">
                        {[
                          { label: "Plus modes (+)", key: "plusModes", color: "text-success" },
                          { label: "Minus modes (-)", key: "minusModes", color: "text-error" },
                        ].map((group) => (
                          <div key={group.key} className="space-y-2">
                            <div className="flex justify-between items-center px-1">
                              <div className={`text-[10px] font-bold ${group.color}`}>
                                {group.label}
                              </div>
                              <div className="dropdown dropdown-end">
                                <div
                                  tabIndex={0}
                                  role="button"
                                  className="btn btn-circle btn-ghost btn-xs text-primary bg-base-200"
                                >
                                  <Plus size={14} />
                                </div>
                                <ul
                                  tabIndex={0}
                                  className="dropdown-content z-100 menu p-2 shadow-2xl bg-base-100 rounded-box w-32 text-xs border border-base-200"
                                >
                                  <li>
                                    <a onClick={() => onAddSubMode(mode.id, group.key, "HG")}>
                                      HG mode
                                    </a>
                                  </li>
                                  <li>
                                    <a onClick={() => onAddSubMode(mode.id, group.key, "LG")}>
                                      LG mode
                                    </a>
                                  </li>
                                </ul>
                              </div>
                            </div>

                            <div className="space-y-1.5 border-l-2 border-base-200 ml-1 pl-3">
                              <AnimatePresence mode="popLayout">
                                {mode[group.key]?.map((sub) => (
                                  <motion.div
                                    key={sub.id}
                                    layout
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, scale: 0.8 }}
                                    className="bg-base-200/50 p-2.5 rounded-xl border border-base-200 flex flex-col gap-2 relative group w-full"
                                  >
                                    <div className="flex justify-between items-center border-b border-base-300/60 pb-1">
                                      <span className="text-[10px] font-black text-primary/80 tracking-wider">
                                        {`${sub.type}(${sub.o1}, ${sub.o2}); Shift(${sub.sx}, ${sub.sy})`}
                                      </span>
                                      <button
                                        className="btn btn-ghost btn-xs btn-square text-error/60 hover:text-error min-h-0 h-4 w-4"
                                        onClick={() => onRemoveSubMode(mode.id, group.key, sub.id)}
                                      >
                                        <Trash2 size={10} />
                                      </button>
                                    </div>

                                    <div className="grid grid-cols-4 gap-3 text-[9px]">
                                      <div className="form-control">
                                        <label className="label p-0 mb-0.5">
                                          <span className="label-text text-[9px] font-medium opacity-80 truncate" title={sub.type === "LG" ? "Azimuthal (L)" : "Horizontal (N)"}>
                                            {sub.type === "LG" ? "Azimuthal (L)" : "Horizontal (N)"}
                                          </span>
                                        </label>
                                        <input
                                          type="text"
                                          className="input input-bordered input-primary/30 h-5 px-1.5 rounded text-xs"
                                          value={sub.o1}
                                          onChange={(e) => onUpdateSubMode(mode.id, group.key, sub.id, "o1", e.target.value)}
                                        />
                                      </div>

                                      <div className="form-control">
                                        <label className="label p-0 mb-0.5">
                                          <span className="label-text text-[9px] font-medium opacity-80 truncate" title={sub.type === "LG" ? "Radial (P)" : "Vertical (M)"}>
                                            {sub.type === "LG" ? "Radial (P)" : "Vertical (M)"}
                                          </span>
                                        </label>
                                        <input
                                          type="text"
                                          className="input input-bordered input-primary/30 h-5 px-1.5 rounded text-xs"
                                          value={sub.o2}
                                          onChange={(e) => onUpdateSubMode(mode.id, group.key, sub.id, "o2", e.target.value)}
                                        />
                                      </div>

                                      <div className="form-control">
                                        <label className="label p-0 mb-0.5">
                                          <span className="label-text text-[9px] opacity-80 truncate">Shift X (μm)</span>
                                        </label>
                                        <input
                                          type="text"
                                          className="input input-bordered h-5 px-1.5 rounded text-xs"
                                          value={sub.sx}
                                          onChange={(e) => onUpdateSubMode(mode.id, group.key, sub.id, "sx", e.target.value)}
                                        />
                                      </div>

                                      <div className="form-control">
                                        <label className="label p-0 mb-0.5">
                                          <span className="label-text text-[9px] opacity-80 truncate">Shift Y (μm)</span>
                                        </label>
                                        <input
                                          type="text"
                                          className="input input-bordered h-5 px-1.5 rounded text-xs"
                                          value={sub.sy}
                                          onChange={(e) => onUpdateSubMode(mode.id, group.key, sub.id, "sy", e.target.value)}
                                        />
                                      </div>
                                    </div>
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
                          <label className="label">
                            <div className="label-text text-[10px] mb-1">
                              {mode.type === "LG" ? "Azimuthal index L" : "Horizontal index N"}
                            </div>
                          </label>
                          <input
                            type="text"
                            value={mode.o1}
                            onChange={(e) => onUpdateMode(mode.id, "o1", e.target.value)}
                            className="input input-bordered input-xs"
                          />
                        </div>
                        <div className="form-control">
                          <label className="label">
                            <div className="label-text text-[10px] mb-1">
                              {mode.type === "LG" ? "Radial index P" : "Vertical index M"}
                            </div>
                          </label>
                          <input
                            type="text"
                            value={mode.o2}
                            onChange={(e) => onUpdateMode(mode.id, "o2", e.target.value)}
                            className="input input-bordered input-xs"
                          />
                        </div>
                      </div>
                    )}

                    <div className="divider my-1 opacity-50"></div>
                    <div className="grid grid-cols-2 gap-4">
                      {["nx", "ny", "sx", "sy"].map((field) => (
                        <div className="form-control" key={field}>
                          <label className="label">
                            <div className="label-text text-[10px] mb-1">
                              {field === "nx"
                                ? "Carrier X"
                                : field === "ny"
                                  ? "Carrier Y"
                                  : field === "sx"
                                    ? "Shift X (μm)"
                                    : "Shift Y (μm)"}
                            </div>
                          </label>
                          <input
                            type="text"
                            value={mode[field]}
                            onChange={(e) => onUpdateMode(mode.id, field, e.target.value)}
                            className="input input-bordered input-xs"
                          />
                        </div>
                      ))}
                    </div>

                    <button
                      onClick={() => onRemoveMode(mode.id)}
                      className="btn btn-error btn-outline btn-xs btn-block"
                    >
                      <Trash2 size={12} /> Delete
                    </button>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}