import { Menu, Info, BookIcon } from "lucide-react";
import logo from "../logo.png"
import pkg from "../../package.json";

export default function Navbar({ showSidebar, setShowSidebar }) {
    const subTitle = __IS_ELECTRON__ ? "offline-app" : "web-app";

    return (
        <header
            className={`grid grid-cols-3 items-center navbar bg-base-100 shadow-sm z-30 px-4 border-b border-base-200 ${__IS_ELECTRON__ ? "pt-10" : ""}`}
            style={__IS_ELECTRON__ ? { WebkitAppRegion: "drag" } : {}}
        >
            <div
                className="justify-self-start"
                style={__IS_ELECTRON__ ? { WebkitAppRegion: "no-drag" } : {}}
            >
                <button
                    className="btn btn-ghost btn-sm btn-square"
                    onClick={() => setShowSidebar(!showSidebar)}
                >
                    <Menu size={20} />
                </button>
            </div>

            <div className="justify-self-center flex items-center gap-2">

                <div className="w-8 h-8 flex items-center justify-center bg-base-100 rounded-xl border border-base-300 shadow-sm overflow-hidden p-1.5">
                    <img
                        src={logo}
                        alt="logo"
                        draggable="false"
                        className="w-full h-full object-contain"
                    />
                </div>

                <div className="items-baseline flex gap-2">
                    <div className="text-lg">
                        <span className="font-mono font-black">{pkg.name}</span>
                        <span> / </span>
                        <span className="font-serif italic">{subTitle}</span>
                    </div>

                    <div className="font-mono text-xs opacity-40">v{pkg.version}</div>
                </div>
            </div>

            <div
                className="justify-self-end flex items-center gap-2"
                style={__IS_ELECTRON__ ? { WebkitAppRegion: "no-drag" } : {}}
            >
                {!__IS_ELECTRON__ && (
                    <>
                        <button
                            className="btn btn-ghost btn-sm btn-square text-base-content/40 hover:text-primary transition-colors"
                            onClick={() => window.open("https://spadecgh.researchi.group/", "_blank")}
                        >
                            <BookIcon size={20} />
                        </button>

                        <div className="divider divider-horizontal m-0 py-2"></div>
                    </>
                )}

                <button
                    className="btn btn-ghost btn-sm btn-square text-base-content/40 hover:text-primary transition-colors"
                    onClick={() => document.getElementById("info_modal").showModal()}
                >
                    <Info size={20} />
                </button>
            </div>
        </header>
    );
}