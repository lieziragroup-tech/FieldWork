import React, { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Camera, Ruler, Save, ArrowLeft, Check, Sparkles } from "lucide-react";
import { useOfflineStore } from "../../store/offlineStore";

export function ARMeasureTool() {
    const navigate = useNavigate();
    const { addPendingItem } = useOfflineStore();
    const [mode, setMode] = useState<"ar" | "fallback" | null>(null);
    const [distance, setDistance] = useState<number>(0);
    const [lubangBor, setLubangBor] = useState<number>(0);
    const [kebutuhanObat, setKebutuhanObat] = useState<number>(0);
    const [savedNotice, setSavedNotice] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        // Cek support WebXR
        if ("xr" in navigator) {
            (navigator as any).xr.isSessionSupported("immersive-ar")
                .then((supported: boolean) => {
                    setMode(supported ? "ar" : "fallback");
                })
                .catch(() => setMode("fallback"));
        } else {
            setMode("fallback");
        }
    }, []);

    const startCamera = async () => {
        if (!videoRef.current) return;
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: "environment" },
            });
            videoRef.current.srcObject = stream;
        } catch (err) {
            console.error("Camera error:", err);
        }
    };

    useEffect(() => {
        if (mode === "fallback") {
            startCamera();
        }
        return () => {
            if (videoRef.current && videoRef.current.srcObject) {
                const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
                tracks.forEach(t => t.stop());
            }
        };
    }, [mode]);

    const handleMockMeasure = () => {
        // Mock measurement
        const mockDistance = parseFloat((Math.random() * 15 + 4).toFixed(1)); // 4 to 19 meters
        setDistance(mockDistance);

        // Estimasi Lubang Bor Otomatis: Jarak / 0.35 (interval 35cm)
        const lubang = Math.round(mockDistance / 0.35);
        setLubangBor(lubang);

        // Estimasi Obat (SNI 2404: 5 L/m' pondasi)
        setKebutuhanObat(mockDistance * 5);
    };

    const handleSaveMeasurement = () => {
        if (distance <= 0) return;
        addPendingItem({
            type: "survey_quotation",
            title: `Pengukuran AR Meteran: ${distance} m' (${lubangBor} lubang bor)`,
            data: {
                distance,
                lubangBor,
                kebutuhanObat,
                timestamp: new Date().toISOString(),
            },
        });
        setSavedNotice(true);
        setTimeout(() => setSavedNotice(false), 2500);
    };

    return (
        <div className="flex flex-col h-screen bg-black text-white relative select-none">
            {/* Top Bar with Back Button */}
            <div className="absolute top-0 w-full p-4 flex justify-between items-center z-20 bg-gradient-to-b from-black/80 via-black/40 to-transparent">
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => navigate("/field/dashboard")}
                        className="p-2 rounded-xl bg-white/10 hover:bg-white/20 backdrop-blur-md text-white transition-colors"
                        title="Kembali ke Dashboard Lapangan"
                    >
                        <ArrowLeft size={18} />
                    </button>
                    <div>
                        <h1 className="font-bold text-sm sm:text-base leading-tight">Meteran Kamera AR</h1>
                        <p className="text-[10px] text-emerald-400">Kalibrasi Laser & Ubin SNI</p>
                    </div>
                </div>

                <div className="flex items-center gap-1.5">
                    <span className="bg-emerald-600/80 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide">
                        {mode === "ar" ? "WebXR Active" : "Camera Scale"}
                    </span>
                </div>
            </div>

            {/* Saved Toast */}
            {savedNotice && (
                <div className="absolute top-18 left-1/2 -translate-x-1/2 z-30 bg-emerald-600 text-white text-xs font-bold px-4 py-2 rounded-2xl shadow-xl flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
                    <Check size={16} /> Data pengukuran berhasil dicatat ke antrean offline!
                </div>
            )}

            {/* Viewfinder / Camera Surface */}
            <div className="flex-1 relative overflow-hidden flex items-center justify-center">
                {mode === "fallback" ? (
                    <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className="absolute inset-0 w-full h-full object-cover"
                    />
                ) : (
                    <div className="absolute inset-0 w-full h-full object-cover bg-slate-950 flex items-center justify-center">
                        <span className="text-slate-400 text-xs">WebXR Session Active</span>
                    </div>
                )}

                {/* Laser Crosshair */}
                <div className="w-14 h-14 border-2 border-emerald-400/90 rounded-full z-10 flex items-center justify-center pointer-events-none shadow-[0_0_12px_rgba(52,211,153,0.5)]">
                    <div className="w-2.5 h-2.5 bg-emerald-400 rounded-full animate-ping opacity-80" />
                    <div className="w-1.5 h-1.5 bg-white rounded-full absolute" />
                </div>

                {/* Guide lines mock */}
                {distance > 0 && (
                    <div className="absolute bottom-1/3 w-3/4 h-1 bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.8)] z-10 flex items-center justify-center">
                        <span className="bg-slate-950/80 text-amber-300 px-3 py-1 rounded-xl font-black text-xs -mt-8 border border-amber-400/60 shadow-lg">
                            📐 {distance} m' pondasi
                        </span>
                    </div>
                )}
            </div>

            {/* Bottom HUD */}
            <div className="bg-slate-950/95 backdrop-blur-md pb-safe z-10 rounded-t-3xl border-t border-slate-800">
                <div className="p-4 flex gap-3">
                    <div className="flex-1 bg-slate-900 rounded-2xl p-3 border border-slate-800 text-center">
                        <div className="text-slate-400 text-[10px] font-bold uppercase">Panjang Terukur</div>
                        <div className="font-mono text-2xl font-black text-emerald-400 mt-0.5">
                            {distance > 0 ? distance : "--"} <span className="text-xs">m'</span>
                        </div>
                    </div>
                    <div className="flex-1 bg-slate-900 rounded-2xl p-3 border border-slate-800 text-center">
                        <div className="text-slate-400 text-[10px] font-bold uppercase">Estimasi Titik Bor</div>
                        <div className="font-mono text-2xl font-black text-amber-400 mt-0.5">
                            {lubangBor > 0 ? lubangBor : "--"} <span className="text-xs">titik</span>
                        </div>
                    </div>
                </div>

                <div className="px-4 pb-4 space-y-2.5">
                    <div className="text-xs text-center text-slate-300 bg-slate-900/60 p-2 rounded-xl border border-slate-800/80">
                        {distance > 0
                            ? `Kebutuhan obat larutan: ${kebutuhanObat.toFixed(1)} Liter (SNI 2404: 5L/m')`
                            : "Arahkan target kamera ke tepi dinding atau perimeter pondasi, lalu ketuk tombol ukur."}
                    </div>

                    <div className="flex gap-2">
                        <button
                            onClick={handleMockMeasure}
                            className="flex-1 bg-emerald-600 hover:bg-emerald-700 active:scale-95 py-3.5 rounded-2xl flex items-center justify-center font-bold text-xs sm:text-sm gap-2 shadow-lg shadow-emerald-950 transition-all"
                        >
                            <Ruler size={18} />
                            Ukur Titik Kamera
                        </button>

                        {distance > 0 && (
                            <button
                                onClick={handleSaveMeasurement}
                                className="bg-blue-600 hover:bg-blue-700 active:scale-95 px-4 rounded-2xl flex items-center justify-center font-bold text-xs gap-1 shadow-lg shadow-blue-950 transition-all"
                                title="Simpan hasil pengukuran ke antrean"
                            >
                                <Save size={18} />
                                <span className="hidden sm:inline">Simpan</span>
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
