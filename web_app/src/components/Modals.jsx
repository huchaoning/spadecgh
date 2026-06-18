import { AlertTriangle, InfoIcon } from "lucide-react";

export default function Modals({ onClearModes }) {
    return (
        <>
            <dialog id="clear_modal" className="modal modal-bottom sm:modal-middle">
                <div className="modal-box">
                    <h3 className="font-bold text-lg text-error flex items-center gap-2">
                        <AlertTriangle size={20} /> Confirm?
                    </h3>
                    <p className="py-4 text-sm text-base-content/60">
                        This action will clear all configured modes. 
                        This operation cannot be undone.
                    </p>
                    <div className="modal-action">
                        <form method="dialog" className="flex gap-2 w-full flex-row-reverse">
                            <button className="btn btn-error btn-sm w-20" onClick={onClearModes}>
                                Confirm
                            </button>
                            <button className="btn btn-ghost btn-sm w-20">Cancel</button>
                        </form>
                    </div>
                </div>
            </dialog>

            <dialog id="info_modal" className="modal modal-bottom sm:modal-middle">
                <div className="modal-box">
                    <h3 className="font-bold text-lg text-primary flex items-center gap-2">
                        <InfoIcon size={20} /> About
                    </h3>
                    <p className="py-4 text-sm text-base-content/60 leading-relaxed">
                        This is a hologram generation toolkit, which can be used to implement spatial mode demultiplexing (SPADE) measurements or generate non-trivial modes.
                        The specific name, icon, domain, and license of this tool are currently TBD.
                        The author is from the Quantum Metrology Laboratory, School of Science, Hangzhou Dianzi University.
                    </p>
                    <div className="modal-action">
                        <form method="dialog" className="flex gap-2 w-full flex-row-reverse">
                            <button className="btn btn-primary btn-sm w-20">OK</button>
                            <a
                                className="btn btn-ghost btn-sm w-20"
                                target="_blank"
                                rel="noopener noreferrer"
                                href="https://github.com/huchaoning/hducgh"
                            >
                                GitHub
                            </a>
                        </form>
                    </div>
                </div>
            </dialog>

            <dialog id="error_modal" className="modal modal-bottom sm:modal-middle">
                <div className="modal-box">
                    <h3 className="font-bold text-lg text-error flex items-center gap-2">
                        <AlertTriangle size={20} /> Input error
                    </h3>
                    <p className="py-4 text-sm text-base-content/60">
                        Invalid input parameters. 
                        Please check your entries for errors. 
                        If you have confirmed they are correct but the error persists, please report the issue.
                    </p>
                    <div className="modal-action">
                        <form method="dialog" className="flex gap-2 w-full flex-row-reverse">
                            <button className="btn btn-primary btn-sm w-20">Close</button>
                            <a
                                className="btn btn-ghost btn-sm w-20"
                                target="_blank"
                                rel="noopener noreferrer"
                                href="https://github.com/huchaoning/hducgh/issues"
                            >
                                Issues
                            </a>
                        </form>
                    </div>
                </div>
            </dialog>
        </>
    );
}