import React, { useRef, useState, useEffect } from "react";
import { X, RotateCcw, Check, PenTool } from "lucide-react";

interface FieldSignatureModalProps {
    isOpen: boolean;
    title?: string;
    subtitle?: string;
    onClose: () => void;
    onSave: (signatureBase64: string, signerName: string) => void;
}

export function FieldSignatureModal({
    isOpen,
    title = "Tanda Tangan Digital Klien",
    subtitle = "Tanda tangan langsung pada area canvas di bawah ini sebagai bukti penyelesaian pekerjaan.",
    onClose,
    onSave,
}: FieldSignatureModalProps) {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [hasDrawn, setHasDrawn] = useState(false);
    const [signerName, setSignerName] = useState("");

    useEffect(() => {
        if (!isOpen) return;

        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        // Set display and internal resolution
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width * 2;
        canvas.height = rect.height * 2;
        ctx.scale(2, 2);

        ctx.strokeStyle = "#0f172a"; // slate-900
        ctx.lineWidth = 2.5;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
    }, [isOpen]);

    if (!isOpen) return null;

    const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
        setIsDrawing(true);
        setHasDrawn(true);
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const rect = canvas.getBoundingClientRect();
        const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
        const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;

        ctx.beginPath();
        ctx.moveTo(clientX - rect.left, clientY - rect.top);
    };

    const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
        if (!isDrawing) return;
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const rect = canvas.getBoundingClientRect();
        const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
        const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;

        ctx.lineTo(clientX - rect.left, clientY - rect.top);
        ctx.stroke();
    };

    const stopDrawing = () => {
        setIsDrawing(false);
    };

    const clearCanvas = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        setHasDrawn(false);
    };

    const handleSave = () => {
        const canvas = canvasRef.current;
        if (!canvas || !hasDrawn) return;
        const dataUrl = canvas.toDataURL("image/png");
        onSave(dataUrl, signerName || "Klien / PIC Lapangan");
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
            <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                    <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                            <PenTool size={18} />
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-900 text-sm sm:text-base">{title}</h3>
                            <p className="text-[11px] text-slate-500">Berita Acara & Pengesahan Lapangan</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-200 transition-colors"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-4 sm:p-5 space-y-3">
                    <p className="text-xs text-slate-600">{subtitle}</p>

                    <div>
                        <label className="text-[11px] font-bold text-slate-700 block mb-1">
                            Nama Klien / Penandatangan:
                        </label>
                        <input
                            type="text"
                            placeholder="Contoh: Bpk. Bambang Wijaya"
                            value={signerName}
                            onChange={(e) => setSignerName(e.target.value)}
                            className="w-full h-10 px-3 text-xs rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                        />
                    </div>

                    {/* Canvas Container */}
                    <div className="border-2 border-dashed border-slate-300 rounded-2xl bg-slate-50 overflow-hidden relative touch-none select-none">
                        <canvas
                            ref={canvasRef}
                            className="w-full h-48 cursor-crosshair block"
                            onMouseDown={startDrawing}
                            onMouseMove={draw}
                            onMouseUp={stopDrawing}
                            onMouseLeave={stopDrawing}
                            onTouchStart={startDrawing}
                            onTouchMove={draw}
                            onTouchEnd={stopDrawing}
                        />

                        {!hasDrawn && (
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-slate-400 text-xs font-medium">
                                ✍️ Goreskan tanda tangan di sini
                            </div>
                        )}
                    </div>

                    <div className="flex items-center justify-between text-xs">
                        <span className="text-[11px] text-slate-400">
                            {hasDrawn ? "✓ Tanda tangan terdeteksi" : "Area tanda tangan kosong"}
                        </span>
                        <button
                            type="button"
                            onClick={clearCanvas}
                            disabled={!hasDrawn}
                            className="text-xs font-semibold text-slate-600 hover:text-red-600 flex items-center gap-1 disabled:opacity-30 disabled:pointer-events-none"
                        >
                            <RotateCcw size={13} /> Bersihkan Canvas
                        </button>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-2">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700"
                    >
                        Batal
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={!hasDrawn}
                        className="px-5 py-2 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-md active:scale-95 disabled:opacity-40 disabled:pointer-events-none flex items-center gap-1.5"
                    >
                        <Check size={15} /> Simpan TTD & Sahkan
                    </button>
                </div>
            </div>
        </div>
    );
}
