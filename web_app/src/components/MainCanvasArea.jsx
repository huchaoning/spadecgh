import { useState, useRef, useEffect } from "react";

export default function MainCanvasArea({ canvasRef, width, height }) {
    const [transform, setTransform] = useState({ scale: 1, x: 0, y: 0 });
    const containerRef = useRef(null);
    const isDragging = useRef(false);
    const lastPos = useRef({ x: 0, y: 0 });

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const onWheel = (e) => {
            e.preventDefault();
            const delta = e.deltaY > 0 ? 0.9 : 1.1;
            setTransform((prev) => ({
                ...prev,
                scale: Math.max(0.1, Math.min(prev.scale * delta, 20)),
            }));
        };

        container.addEventListener("wheel", onWheel, { passive: false });
        return () => container.removeEventListener("wheel", onWheel);
    }, []);

    const handleMouseDown = (e) => {
        if (e.button !== 0) return;
        isDragging.current = true;
        lastPos.current = { x: e.clientX, y: e.clientY };
    };

    const handleMouseMove = (e) => {
        if (!isDragging.current) return;
        const dx = e.clientX - lastPos.current.x;
        const dy = e.clientY - lastPos.current.y;
        setTransform((prev) => ({
            ...prev,
            x: prev.x + dx / prev.scale,
            y: prev.y + dy / prev.scale,
        }));
        lastPos.current = { x: e.clientX, y: e.clientY };
    };

    const handleMouseUp = () => {
        isDragging.current = false;
    };

    return (
        <main className="flex-1 bg-base-300 relative p-8 flex flex-col gap-6">
            <div
                className="absolute inset-0 opacity-[0.03] pointer-events-none"
                style={{
                    backgroundImage: "radial-gradient(circle, #000 2px, transparent 2px)",
                    backgroundSize: "32px 32px",
                }}
            ></div>

            <div
                ref={containerRef}
                onDoubleClick={() => setTransform({ scale: 1, x: 0, y: 0 })}
                className="flex-1 flex flex-col bg-neutral rounded-2xl shadow-2xl border border-white/5 overflow-hidden relative group items-center justify-center p-4 cursor-grab active:cursor-grabbing select-none"
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
            >
                <canvas
                    ref={canvasRef}
                    width={width}
                    height={height}
                    className="max-w-full max-h-full object-contain pointer-events-none"
                    style={{
                        transform: `scale(${transform.scale}) translate(${transform.x}px, ${transform.y}px)`,
                        transition: isDragging.current ? "none" : "transform 0.1s ease-out",
                    }}
                />
            </div>
        </main>
    );
}