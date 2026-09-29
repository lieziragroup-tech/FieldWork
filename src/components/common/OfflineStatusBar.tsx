import React, { useState, useEffect } from "react";
import { useOfflineStore } from "../../store/offlineStore";
import { WifiOff, RefreshCw, CheckCircle2, CloudUpload, X, Layers, AlertCircle } from "lucide-react";

export function OfflineStatusBar() {
    const { isOnline, isSyncing, pendingQueue, syncAll, initNetworkListeners, clearQueue } = useOfflineStore();
    const [showModal, setShowModal] = useState(false);
    const [toastDismissed, setToastDismissed] = useState(false);

    useEffect(() => {
        const cleanup = initNetworkListeners();
        return cleanup;
    }, [initNetworkListeners]);

    // Reset dismissed state when network status flips
    useEffect(() => {
        setToastDismissed(false);
    }, [isOnline, pendingQueue.length]);

    // If completely online and queue empty, keep UI minimal (no floating alert)
    if (isOnline && pendingQueue.length === 0 && !isSyncing) {
        return null;
    }

    if (toastDismissed && !showModal) {
        return (
            <button
                onClick={() => setShowModal(true)}
                className="fixed bottom-20 md:bottom-6 right-4 z-40 bg-slate-900/90 text-white backdrop-blur text-xs px-3 py-1.5 rounded-full shadow-lg border border-slate-700 flex items-center gap-1.5 hover:bg-slate-800 transition-transform active:scale-95"
            >
                {!isOnline ? (
                    <span className="flex h-2 w-2 relative">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                    </span>
                ) : (
                    <span className="h-2 w-2 rounded-full bg-amber-400"></span>
                )}
                <span>{pendingQueue.length} antrean</span>
            </button>
        );
    }

    return (
        <>
            {/* Subtle Floating Status Notification Toast */}
            <div className="fixed bottom-18 md:bottom-6 left-1/2 -translate-x-1/2 z-40 w-[92%] max-w-md animate-in fade-in slide-in-from-bottom-3 duration-300">
                <div
                    className={`rounded-2xl p-3 shadow-xl backdrop-blur-md border text-xs sm:text-sm flex items-center justify-between gap-3 ${
                        !isOnline
                            ? "bg-slate-900/95 border-amber-500/40 text-amber-200"
                            : isSyncing
                            ? "bg-blue-900/95 border-blue-400/40 text-blue-100"
                            : "bg-emerald-900/95 border-emerald-500/40 text-emerald-100"
                    }`}
                >
                    <div className="flex items-center gap-2.5 min-w-0">
                        {!isOnline ? (
                            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                                <WifiOff size={16} />
                            </div>
                        ) : isSyncing ? (
                            <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
                                <RefreshCw size={16} className="animate-spin text-blue-300" />
                            </div>
                        ) : (
                            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                                <CloudUpload size={16} />
                            </div>
                        )}

                        <div className="truncate">
                            <div className="font-semibold flex items-center gap-1.5 leading-tight">
                                {!isOnline ? (
                                    <span>Mode Lapangan Luring (Offline)</span>
                                ) : isSyncing ? (
                                    <span>Menyinkronkan Data Lapangan...</span>
                                ) : (
                                    <span>{pendingQueue.length} Perubahan Siap Dikirim</span>
                                )}
                            </div>
                            <div className="text-[11px] opacity-80 truncate">
                                {!isOnline
                                    ? pendingQueue.length > 0
                                        ? `${pendingQueue.length} data tersimpan di HP, akan dikirim saat online`
                                        : "Bekerja tanpa sinyal, data tersimpan aman di perangkat"
                                    : isSyncing
                                    ? "Mengunggah data pengerjaan ke server..."
                                    : "Koneksi terhubung kembali"}
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                        {isOnline && pendingQueue.length > 0 && !isSyncing && (
                            <button
                                onClick={() => syncAll()}
                                className="px-2.5 py-1 bg-emerald-500 text-slate-950 font-bold rounded-lg hover:bg-emerald-400 active:scale-95 transition-all text-xs"
                            >
                                Kirim
                            </button>
                        )}

                        {pendingQueue.length > 0 && (
                            <button
                                onClick={() => setShowModal(true)}
                                className="p-1.5 hover:bg-white/10 rounded-lg text-slate-300 transition-colors"
                                title="Lihat detail antrean"
                            >
                                <Layers size={15} />
                            </button>
                        )}

                        <button
                            onClick={() => setToastDismissed(true)}
                            className="p-1 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white"
                            title="Tutup notifikasi"
                        >
                            <X size={15} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Offline Queue Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-lg max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                        {/* Modal Header */}
                        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                                    <CloudUpload size={18} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-800 text-sm sm:text-base">Antrean Sinkronisasi Lapangan</h3>
                                    <p className="text-xs text-slate-500">
                                        Status: {isOnline ? "🟢 Online" : "🔴 Offline"} • {pendingQueue.length} data tersimpan
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowModal(false)}
                                className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-400"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-4 flex-1 overflow-y-auto space-y-2.5">
                            {pendingQueue.length === 0 ? (
                                <div className="text-center py-10 text-slate-400">
                                    <CheckCircle2 size={40} className="mx-auto text-emerald-500 mb-2 opacity-80" />
                                    <p className="font-semibold text-slate-700 text-sm">Semua data telah tersinkronisasi</p>
                                    <p className="text-xs text-slate-400">Tidak ada data tertunda di perangkat lokal.</p>
                                </div>
                            ) : (
                                pendingQueue.map((item, idx) => (
                                    <div
                                        key={item.id}
                                        className="p-3 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between gap-3 text-xs"
                                    >
                                        <div className="space-y-0.5 min-w-0">
                                            <div className="font-semibold text-slate-800 truncate">
                                                {idx + 1}. {item.title}
                                            </div>
                                            <div className="text-[11px] text-slate-500">
                                                {new Date(item.timestamp).toLocaleTimeString("id-ID", {
                                                    hour: "2-digit",
                                                    minute: "2-digit",
                                                    second: "2-digit",
                                                })}{" "}
                                                • Tipe: <span className="font-mono uppercase">{item.type}</span>
                                            </div>
                                        </div>
                                        <span className="shrink-0 text-[10px] font-medium px-2 py-0.5 bg-amber-100 text-amber-800 rounded-full">
                                            Menunggu Server
                                        </span>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Modal Footer */}
                        <div className="p-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between gap-2">
                            {pendingQueue.length > 0 && (
                                <button
                                    onClick={() => clearQueue()}
                                    className="text-xs text-red-600 hover:text-red-700 px-3 py-1.5"
                                >
                                    Hapus Antrean
                                </button>
                            )}
                            <div className="flex items-center gap-2 ml-auto">
                                <button
                                    onClick={() => setShowModal(false)}
                                    className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700"
                                >
                                    Tutup
                                </button>
                                {isOnline && pendingQueue.length > 0 && (
                                    <button
                                        disabled={isSyncing}
                                        onClick={async () => {
                                            await syncAll();
                                        }}
                                        className="px-4 py-2 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 shadow-sm active:scale-95 disabled:opacity-50"
                                    >
                                        {isSyncing ? (
                                            <>
                                                <RefreshCw size={14} className="animate-spin" />
                                                Menyinkronkan...
                                            </>
                                        ) : (
                                            <>
                                                <RefreshCw size={14} />
                                                Sinkronkan Sekarang
                                            </>
                                        )}
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
