import { AlertTriangle, InfoIcon } from "lucide-react";

export default function Modals({ onClearModes }) {
    return (
        <>
            <dialog id="clear_modal" className="modal modal-bottom sm:modal-middle">
                <div className="modal-box">
                    <h3 className="font-bold text-lg text-error flex items-center gap-2">
                        <AlertTriangle size={20} /> 确认清除？
                    </h3>
                    <p className="py-4 text-sm text-base-content/60">
                        此操作将清空所有已配置的模式。该操作不可撤销。
                    </p>
                    <div className="modal-action">
                        <form method="dialog" className="flex gap-2 w-full flex-row-reverse">
                            <button className="btn btn-error btn-sm w-20" onClick={onClearModes}>
                                确认
                            </button>
                            <button className="btn btn-ghost btn-sm w-20">取消</button>
                        </form>
                    </div>
                </div>
            </dialog>

            <dialog id="info_modal" className="modal modal-bottom sm:modal-middle">
                <div className="modal-box">
                    <h3 className="font-bold text-lg text-primary flex items-center gap-2">
                        <InfoIcon size={20} /> 关于本工具
                    </h3>
                    <p className="py-4 text-sm text-base-content/60 leading-relaxed">
                        这是一个基于 Arrizon 2 算法的全息图生成工具，该算法可以用于生成非平凡模式，也可以用于实现空间模式分解（SPADE）测量。
                        本工具的具体名称、图标、域名以及许可证均处于待定状态。
                        作者来自杭州电子科技大学理学院，量子精密测量实验室。
                    </p>
                    <div className="modal-action">
                        <form method="dialog" className="flex gap-2 w-full flex-row-reverse">
                            <button className="btn btn-primary btn-sm w-20">确定</button>
                            <a
                                className="btn btn-ghost btn-sm w-20"
                                target="_blank"
                                rel="noopener noreferrer"
                                href="https://gitee.com/vxyi/cgh-app"
                            >
                                Gitee
                            </a>
                        </form>
                    </div>
                </div>
            </dialog>

            <dialog id="error_modal" className="modal modal-bottom sm:modal-middle">
                <div className="modal-box">
                    <h3 className="font-bold text-lg text-error flex items-center gap-2">
                        <AlertTriangle size={20} /> 输入错误
                    </h3>
                    <p className="py-4 text-sm text-base-content/60">
                        非法的输入参数，请检查输入是否有误。如果确认无误但错误继续存在，请报告问题。
                    </p>
                    <div className="modal-action">
                        <form method="dialog" className="flex gap-2 w-full flex-row-reverse">
                            <button className="btn btn-primary btn-sm w-20">关闭</button>
                            <a
                                className="btn btn-ghost btn-sm w-20"
                                target="_blank"
                                rel="noopener noreferrer"
                                href="https://gitee.com/vxyi/cgh-app/issues"
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