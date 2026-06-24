import { Settings2 } from "lucide-react";
import { formatInputValue, formatInputZeta } from "../utils/formatInput";

export default function GlobalSettings({
    sigma, setSigma,
    pixelSize, setPixelSize,
    resX, setResX,
    resY, setResY,
    fileName, setFileName,
    algo, setAlgo,
    zeta, setZeta,
}) {
    return (
        <section>
            <div className="flex items-center gap-2 mb-3 text-primary font-bold">
                <Settings2 size={16} /> <div>Global settings</div>
            </div>
            <div className="bg-base-100 border border-base-200 shadow-sm p-4 rounded-xl space-y-4">
                <div className="form-control w-full">
                    <label className="label py-1 px-0">
                        <div className="label-text font-medium text-xs">Characteristic width (σ, μm)</div>
                    </label>
                    <input
                        type="text"
                        value={sigma}
                        onChange={(e) => setSigma(formatInputValue(e.target.value))}
                        className="input input-sm input-bordered w-full"
                    />
                </div>

                <div className="divider my-1 opacity-50"></div>

                <div className="space-y-3">
                    <label className="label py-1 px-0">
                        <div className="label-text font-medium text-xs">SLM parameters</div>
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="form-control">
                            <label className="label py-1 px-0">
                                <div className="label-text text-[10px]">Resolution X</div>
                            </label>
                            <input
                                type="text"
                                value={resX}
                                onChange={(e) => setResX(formatInputValue(e.target.value))}
                                className="input input-sm input-bordered"
                            />
                        </div>
                        <div className="form-control">
                            <label className="label py-1 px-0">
                                <div className="label-text text-[10px]">Resolution Y</div>
                            </label>
                            <input
                                type="text"
                                value={resY}
                                onChange={(e) => setResY(formatInputValue(e.target.value))}
                                className="input input-sm input-bordered"
                            />
                        </div>
                    </div>
                    <div className="form-control w-full">
                        <label className="label py-1 px-0">
                            <div className="label-text text-[10px]">Pixel size (μm)</div>
                        </label>
                        <input
                            type="text"
                            value={pixelSize}
                            onChange={(e) => setPixelSize(formatInputValue(e.target.value))}
                            className="input input-sm input-bordered"
                        />
                    </div>

                    <div className="divider my-1 opacity-50"></div>

                    <div className="space-y-3">
                        <div className="form-control w-full">
                            <label className="label py-1 px-0">
                                <div className="label-text font-medium text-xs">Algorithm</div>
                            </label>
                            <select
                                value={algo}
                                onChange={(e) => setAlgo(e.target.value)}
                                className="select select-sm select-bordered w-full font-normal text-xs"
                            >
                                <option value="davis">Davis</option>
                                <option value="arrizon">Arrizón</option>
                                <option value="hybrid">Hybrid</option>
                            </select>
                        </div>

                        {algo === "hybrid" && (
                            <div className="bg-base-200/50 p-2.5 rounded-xl border border-base-200 w-full">
                                <label className="label py-1 px-0">
                                    <div className="label-text text-[10px]">Hybrid factor (ζ)</div>
                                </label>
                                <div className="flex items-center gap-3">
                                    <input
                                        type="range"
                                        min="0" max="1" step="0.01"
                                        value={zeta}
                                        onChange={(e) => setZeta(parseFloat(e.target.value))}
                                        className="range range-xs range-primary flex-1"
                                    />
                                    <input
                                        type="text"
                                        value={zeta}
                                        onChange={(e) => setZeta(formatInputZeta(e.target.value))}
                                        onBlur={(e) => {
                                            const final = formatInputZeta(e.target.value);
                                            setZeta(final);
                                        }}
                                        className="input input-xs input-bordered w-14 px-1 text-center"
                                    />
                                </div>
                            </div>
                        )}

                        <div className="form-control w-full">
                            <label className="label py-1 px-0">
                                <div className="label-text font-medium text-xs">Save file name (.bmp)</div>
                            </label>
                            <div className="relative">
                                <input
                                    type="text"
                                    value={fileName}
                                    onChange={(e) => {
                                        const val = e.target.value.replace(/[\\/:*?"<>|]/g, "");
                                        setFileName(val);
                                    }}
                                    className="input input-sm input-bordered w-full pr-12"
                                />
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] opacity-40 pointer-events-none">
                                    .bmp
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}