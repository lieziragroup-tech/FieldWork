import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { getSPKList, updateSPKStatus } from "../../services/spkService";
import type { SPK } from "../../types";
import { FieldSignatureModal } from "../../components/common/FieldSignatureModal";
import { useOfflineStore } from "../../store/offlineStore";
import {
    MapPin, Navigation, Phone, CheckCircle2, Clock, AlertTriangle,
    Ruler, FileText, Camera, Shield, RefreshCw, PenTool,
    Sparkles, ArrowRight, Compass, HardHat, Check, Upload, ExternalLink
} from "lucide-react";

export function FieldDashboardPage() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const { isOnline, pendingQueue, addPendingItem } = useOfflineStore();

    const [spks, setSpks] = useState<SPK[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<"tasks" | "calculator" | "tools">("tasks");
    const [currentGPS, setCurrentGPS] = useState<{ lat: number; lng: number } | null>({
        lat: -6.2297,
        lng: 106.8253,
    });
    const [isLocating, setIsLocating] = useState(false);

    // Signature Modal state
    const [signingSPK, setSigningSPK] = useState<SPK | null>(null);

    // Work Completion Modal state
    const [completingSPK, setCompletingSPK] = useState<SPK | null>(null);
    const [workNotes, setWorkNotes] = useState("");
    const [photoBefore, setPhotoBefore] = useState<string | null>(null);
    const [photoAfter, setPhotoAfter] = useState<string | null>(null);

    // SNI Dosage Calculator State
    const [calcService, setCalcService] = useState<"injeksi" | "spraying" | "fogging">("injeksi");
    const [calcLength, setCalcLength] = useState<number>(50); // meter lari or m2
    const [calcConcentration, setCalcConcentration] = useState<number>(0.25); // %

    const loadData = async () => {
        setLoading(true);
        try {
            const list = await getSPKList({
                companyId: user?.companyId || "comp_guci_01",
                technicianId: user?.role === "teknisi" ? user.uid : undefined,
            });
            setSpks(list);
        } catch (e) {
            console.error("Error loading SPKs:", e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [user]);

    const handleRefreshGPS = () => {
        setIsLocating(true);
        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    setCurrentGPS({
                        lat: parseFloat(pos.coords.latitude.toFixed(4)),
                        lng: parseFloat(pos.coords.longitude.toFixed(4)),
                    });
                    setIsLocating(false);
                },
                () => {
                    // fallback standard coordinates
                    setCurrentGPS({ lat: -6.2297, lng: 106.8253 });
                    setIsLocating(false);
                },
                { timeout: 8000 }
            );
        } else {
            setIsLocating(false);
        }
    };

    const handleCheckIn = async (spk: SPK) => {
        const gps = currentGPS || { lat: -6.2297, lng: 106.8253 };
        await updateSPKStatus(spk.id, "in_progress", { gps });
        await loadData();
    };

    const handleFinishJob = async (spk: SPK) => {
        const durationMin = spk.actualStart
            ? Math.max(15, Math.round((Date.now() - new Date(spk.actualStart).getTime()) / 60000))
            : 60;

        await updateSPKStatus(spk.id, "done", {
            gps: currentGPS || undefined,
            durationMin,
            notes: workNotes,
        });

        if (photoBefore || photoAfter) {
            addPendingItem({
                type: "spk_complete",
                title: `Foto Dokumentasi & BAP: ${spk.customerName}`,
                data: {
                    spkId: spk.id,
                    photoBefore,
                    photoAfter,
                    notes: workNotes,
                },
            });
        }

        setCompletingSPK(null);
        setWorkNotes("");
        setPhotoBefore(null);
        setPhotoAfter(null);
        await loadData();
    };

    // Calculate dosage based on Indonesian SNI standards
    const getDosageCalculations = () => {
        if (calcService === "injeksi") {
            // SNI 2404: 5 Liter larutan per meter lari pondasi
            // Lubang bor interval 35-40 cm
            const totalLarutan = calcLength * 5;
            const lubangBor = Math.round(calcLength / 0.35);
            const konsentratMl = (totalLarutan * calcConcentration * 10); // perkiraan ml obat murni
            return {
                satuan: "m' (meter lari pondasi)",
                totalLarutan: `${totalLarutan.toLocaleString()} Liter`,
                kebutuhanBor: `${lubangBor} Titik (interval 35cm)`,
                konsentrat: `${Math.round(konsentratMl)} ml bahan aktif termitisida`,
                keterangan: "Sesuai SNI 2404: Tata cara perlakuan tanah kimiawi anti rayap",
            };
        } else if (calcService === "spraying") {
            // SNI: 200 ml s.d 400 ml larutan per m2
            const totalLarutan = calcLength * 0.3;
            return {
                satuan: "m² (luas permukaan kayu / tanah)",
                totalLarutan: `${totalLarutan.toFixed(1)} Liter`,
                kebutuhanBor: "Metode Semprot Residual Tanpa Pengeboran",
                konsentrat: `${(totalLarutan * 5).toFixed(0)} ml bahan formulasi`,
                keterangan: "Dosis semprot residual permukaan plafon & kusen kayu",
            };
        } else {
            // Thermal Fogging: 10 - 20 Liter solar per hektar atau 1:19 solar:obat
            const totalLarutan = calcLength * 0.1;
            return {
                satuan: "m² (luas area luar & selokan)",
                totalLarutan: `${totalLarutan.toFixed(1)} Liter Campuran Fogging`,
                kebutuhanBor: "Thermal Fogger / Swing Fog",
                konsentrat: `${(totalLarutan * 50).toFixed(0)} ml Insektisida Nyamuk`,
                keterangan: "Rasio standar 1 bagian obat : 19 bagian solar/solvent",
            };
        }
    };

    const dosage = getDosageCalculations();

    const activeTasks = spks.filter(s => s.status === "in_progress");
    const assignedTasks = spks.filter(s => s.status === "assigned");
    const completedTasks = spks.filter(s => s.status === "done");

    return (
        <div className="max-w-4xl mx-auto p-3 sm:p-5 space-y-4 pb-24">
            {/* Top Operational Status Bar */}
            <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 text-white rounded-3xl p-4 sm:p-6 shadow-xl border border-slate-700/60 relative overflow-hidden">
                <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 w-40 h-40 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative z-10">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                <HardHat size={13} />
                                {user?.jabatan || "Teknisi Lapangan"}
                            </span>
                            <span className="text-xs text-slate-400">• {user?.companyId || "PT Guci Emas"}</span>
                        </div>
                        <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                            Halo, {user?.name || "Teknisi"}
                        </h1>
                        <p className="text-xs sm:text-sm text-slate-300 mt-0.5">
                            {activeTasks.length > 0
                                ? `⚠️ Anda sedang mengerjakan 1 tugas aktif di lokasi klien.`
                                : assignedTasks.length > 0
                                ? `Terdapat ${assignedTasks.length} SPK siap dikerjakan hari ini.`
                                : `Semua tugas lapangan hari ini telah selesai dikerjakan.`}
                        </p>
                    </div>

                    {/* GPS Coordinates Chip */}
                    <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800">
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-300 bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-700">
                            <MapPin size={13} className="text-emerald-400 shrink-0" />
                            <span>
                                {currentGPS
                                    ? `${currentGPS.lat.toFixed(4)}, ${currentGPS.lng.toFixed(4)}`
                                    : "Mencari GPS..."}
                            </span>
                            <button
                                onClick={handleRefreshGPS}
                                title="Perbarui titik GPS"
                                className="ml-1 hover:text-white text-slate-400 p-0.5"
                            >
                                <RefreshCw size={11} className={isLocating ? "animate-spin text-emerald-400" : ""} />
                            </button>
                        </div>
                        <span className="text-[10px] text-emerald-400/80 font-medium">
                            {isOnline ? "🟢 Sinyal Terhubung" : "⚡ Berjalan Offline"}
                        </span>
                    </div>
                </div>

                {/* Quick Field Metric Cards */}
                <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-slate-800/80 text-center">
                    <div className="bg-slate-800/60 rounded-xl p-2.5 border border-slate-700/50">
                        <div className="text-lg sm:text-2xl font-black text-amber-400">{activeTasks.length}</div>
                        <div className="text-[10px] sm:text-xs text-slate-300 font-medium">Sedang Berjalan</div>
                    </div>
                    <div className="bg-slate-800/60 rounded-xl p-2.5 border border-slate-700/50">
                        <div className="text-lg sm:text-2xl font-black text-blue-400">{assignedTasks.length}</div>
                        <div className="text-[10px] sm:text-xs text-slate-300 font-medium">Siap Berangkat</div>
                    </div>
                    <div className="bg-slate-800/60 rounded-xl p-2.5 border border-slate-700/50">
                        <div className="text-lg sm:text-2xl font-black text-emerald-400">{completedTasks.length}</div>
                        <div className="text-[10px] sm:text-xs text-slate-300 font-medium">Tugas Selesai</div>
                    </div>
                </div>
            </div>

            {/* Quick Action Shortcuts for Field Workers */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <Link
                    to="/field/ar-measure"
                    className="p-3 bg-white rounded-2xl border border-slate-200/90 shadow-sm hover:shadow-md hover:border-emerald-300 transition-all flex items-center gap-2.5 group"
                >
                    <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                        <Ruler size={18} />
                    </div>
                    <div className="min-w-0">
                        <div className="text-xs font-bold text-slate-800 leading-tight">Meteran AR</div>
                        <div className="text-[10px] text-slate-500 truncate">Laser & Kamera</div>
                    </div>
                </Link>

                <Link
                    to="/quotations/new"
                    className="p-3 bg-white rounded-2xl border border-slate-200/90 shadow-sm hover:shadow-md hover:border-blue-300 transition-all flex items-center gap-2.5 group"
                >
                    <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                        <FileText size={18} />
                    </div>
                    <div className="min-w-0">
                        <div className="text-xs font-bold text-slate-800 leading-tight">Survei Baru</div>
                        <div className="text-[10px] text-slate-500 truncate">Buat Penawaran</div>
                    </div>
                </Link>

                <button
                    onClick={() => {
                        const target = activeTasks[0] || assignedTasks[0] || completedTasks[0];
                        if (target) setSigningSPK(target);
                    }}
                    className="p-3 bg-white rounded-2xl border border-slate-200/90 shadow-sm hover:shadow-md hover:border-amber-300 transition-all flex items-center gap-2.5 text-left group"
                >
                    <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                        <PenTool size={18} />
                    </div>
                    <div className="min-w-0">
                        <div className="text-xs font-bold text-slate-800 leading-tight">Tanda Tangan</div>
                        <div className="text-[10px] text-slate-500 truncate">Digital di Layar</div>
                    </div>
                </button>

                <Link
                    to="/dashboard"
                    className="p-3 bg-white rounded-2xl border border-slate-200/90 shadow-sm hover:shadow-md hover:border-purple-300 transition-all flex items-center gap-2.5 group"
                >
                    <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                        <ExternalLink size={18} />
                    </div>
                    <div className="min-w-0">
                        <div className="text-xs font-bold text-slate-800 leading-tight">Mode ERP</div>
                        <div className="text-[10px] text-slate-500 truncate">Kantor & Laporan</div>
                    </div>
                </Link>
            </div>

            {/* Segmented Tab Navigation */}
            <div className="flex bg-slate-200/80 p-1 rounded-2xl text-xs font-bold">
                <button
                    onClick={() => setActiveTab("tasks")}
                    className={`flex-1 py-2 rounded-xl transition-all ${
                        activeTab === "tasks" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"
                    }`}
                >
                    📋 Tugas Lapangan ({spks.length})
                </button>
                <button
                    onClick={() => setActiveTab("calculator")}
                    className={`flex-1 py-2 rounded-xl transition-all ${
                        activeTab === "calculator" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"
                    }`}
                >
                    🧪 Dosis Obat SNI
                </button>
                <button
                    onClick={() => setActiveTab("tools")}
                    className={`flex-1 py-2 rounded-xl transition-all ${
                        activeTab === "tools" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"
                    }`}
                >
                    ⚙️ Alat & BAP Kerja
                </button>
            </div>

            {/* TAB CONTENT: TASKS */}
            {activeTab === "tasks" && (
                <div className="space-y-3">
                    {loading ? (
                        <div className="p-8 text-center bg-white rounded-2xl border border-slate-100">
                            <RefreshCw size={24} className="animate-spin mx-auto text-emerald-600 mb-2" />
                            <p className="text-xs text-slate-500">Memuat daftar tugas lapangan...</p>
                        </div>
                    ) : spks.length === 0 ? (
                        <div className="p-8 text-center bg-white rounded-2xl border border-slate-100">
                            <CheckCircle2 size={36} className="mx-auto text-emerald-500 mb-2" />
                            <h3 className="font-bold text-slate-800 text-sm">Tidak ada SPK aktif</h3>
                            <p className="text-xs text-slate-500 mt-1">
                                Hubungi admin operasional untuk penjadwalan pengerjaan baru.
                            </p>
                        </div>
                    ) : (
                        spks.map((spk) => {
                            const isWorking = spk.status === "in_progress";
                            const isDone = spk.status === "done";

                            return (
                                <div
                                    key={spk.id}
                                    className={`bg-white rounded-2xl p-4 sm:p-5 border transition-all ${
                                        isWorking
                                            ? "border-amber-400 ring-2 ring-amber-100 shadow-md"
                                            : isDone
                                            ? "border-emerald-200 bg-emerald-50/20"
                                            : "border-slate-200/90 shadow-sm hover:border-slate-300"
                                    }`}
                                >
                                    {/* Card Header */}
                                    <div className="flex items-start justify-between gap-3 mb-2.5">
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span
                                                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                                        isWorking
                                                            ? "bg-amber-100 text-amber-800 border border-amber-300 animate-pulse"
                                                            : isDone
                                                            ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                                                            : "bg-blue-100 text-blue-800 border border-blue-200"
                                                    }`}
                                                >
                                                    {isWorking
                                                        ? "⏳ Sedang Dikerjakan"
                                                        : isDone
                                                        ? "✅ Selesai Dikerjakan"
                                                        : "📍 Menunggu Keberangkatan"}
                                                </span>
                                                <span className="text-xs font-mono font-medium text-slate-500">
                                                    {spk.quotationNoSurat || spk.id}
                                                </span>
                                            </div>
                                            <h2 className="text-base sm:text-lg font-bold text-slate-900 mt-1">
                                                {spk.customerName}
                                            </h2>
                                        </div>

                                        <span className="text-[11px] font-semibold text-slate-500 shrink-0">
                                            {new Date(spk.scheduleDate).toLocaleDateString("id-ID", {
                                                day: "numeric",
                                                month: "short",
                                            })}
                                        </span>
                                    </div>

                                    {/* Service Description */}
                                    <div className="text-xs font-semibold text-emerald-700 bg-emerald-50/80 px-2.5 py-1.5 rounded-xl border border-emerald-100 mb-2.5">
                                        🛠️ {spk.perihal}
                                    </div>

                                    {/* Address & Navigation */}
                                    <div className="flex items-start gap-2 text-xs text-slate-600 mb-3">
                                        <MapPin size={15} className="text-red-500 shrink-0 mt-0.5" />
                                        <div className="flex-1 leading-snug">
                                            <span>{spk.lokasi}</span>
                                            <div className="mt-1 flex items-center gap-3">
                                                <a
                                                    href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
                                                        spk.lokasi
                                                    )}`}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:text-blue-700 underline"
                                                >
                                                    <Navigation size={12} /> Buka Peta Rute
                                                </a>
                                                <a
                                                    href={`https://wa.me/6281298765001?text=${encodeURIComponent(
                                                        `Halo, saya teknisi dari PT Guci Emas Pratama terkait pengerjaan SPK di ${spk.customerName}`
                                                    )}`}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 hover:text-emerald-700"
                                                >
                                                    <Phone size={12} /> Hubungi Klien
                                                </a>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Technician Instructions */}
                                    {spk.notes && (
                                        <div className="p-2.5 bg-slate-50 rounded-xl text-xs text-slate-600 mb-3 border border-slate-100">
                                            <span className="font-bold text-slate-700">Instruksi Kerja: </span>
                                            {spk.notes}
                                        </div>
                                    )}

                                    {/* Action Buttons for Field Flow */}
                                    <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
                                        {spk.status === "assigned" && (
                                            <button
                                                onClick={() => handleCheckIn(spk)}
                                                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all"
                                            >
                                                <Check size={16} />
                                                Saya Sudah Sampai & Mulai Bekerja
                                            </button>
                                        )}

                                        {isWorking && (
                                            <>
                                                <button
                                                    onClick={() => setCompletingSPK(spk)}
                                                    className="flex-1 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all"
                                                >
                                                    <CheckCircle2 size={16} />
                                                    Selesai & Buat Berita Acara
                                                </button>

                                                <button
                                                    onClick={() => setSigningSPK(spk)}
                                                    className="px-3.5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 active:scale-95 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all"
                                                    title="Minta tanda tangan klien di tempat"
                                                >
                                                    <PenTool size={15} />
                                                    TTD Klien
                                                </button>

                                                <Link
                                                    to="/field/ar-measure"
                                                    className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-900 active:scale-95 text-white font-bold text-xs flex items-center gap-1.5 transition-all"
                                                >
                                                    <Ruler size={15} />
                                                    Ukur AR
                                                </Link>
                                            </>
                                        )}

                                        {isDone && (
                                            <div className="flex items-center justify-between w-full text-xs text-slate-500">
                                                <span className="flex items-center gap-1 text-emerald-700 font-semibold">
                                                    <CheckCircle2 size={15} /> Berita Acara & SPK telah dituntaskan
                                                </span>
                                                <button
                                                    onClick={() => setSigningSPK(spk)}
                                                    className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1"
                                                >
                                                    <PenTool size={13} /> Bukti TTD
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            )}

            {/* TAB CONTENT: SNI CHEMICAL CALCULATOR */}
            {activeTab === "calculator" && (
                <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/90 shadow-sm space-y-4">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-sm">
                                🧪
                            </span>
                            <h2 className="text-base font-bold text-slate-800">
                                Kalkulator Dosis Termitisida & Pest Control (SNI)
                            </h2>
                        </div>
                        <p className="text-xs text-slate-500">
                            Estimasi takaran larutan obat, jumlah titik bor, dan konsentrasi aktif saat berada di lokasi proyek.
                        </p>
                    </div>

                    {/* Method Selector */}
                    <div className="grid grid-cols-3 gap-2 text-xs font-bold">
                        <button
                            onClick={() => setCalcService("injeksi")}
                            className={`p-2.5 rounded-xl border transition-all text-left ${
                                calcService === "injeksi"
                                    ? "border-emerald-500 bg-emerald-50 text-emerald-900"
                                    : "border-slate-200 text-slate-600 hover:bg-slate-50"
                            }`}
                        >
                            <div className="font-bold">Anti Rayap Injeksi</div>
                            <div className="text-[10px] text-slate-500 font-normal">Pondasi Keliling (SNI 2404)</div>
                        </button>

                        <button
                            onClick={() => setCalcService("spraying")}
                            className={`p-2.5 rounded-xl border transition-all text-left ${
                                calcService === "spraying"
                                    ? "border-emerald-500 bg-emerald-50 text-emerald-900"
                                    : "border-slate-200 text-slate-600 hover:bg-slate-50"
                            }`}
                        >
                            <div className="font-bold">Spraying Kayu/Plafon</div>
                            <div className="text-[10px] text-slate-500 font-normal">Residual Surface Area</div>
                        </button>

                        <button
                            onClick={() => setCalcService("fogging")}
                            className={`p-2.5 rounded-xl border transition-all text-left ${
                                calcService === "fogging"
                                    ? "border-emerald-500 bg-emerald-50 text-emerald-900"
                                    : "border-slate-200 text-slate-600 hover:bg-slate-50"
                            }`}
                        >
                            <div className="font-bold">Thermal Fogging</div>
                            <div className="text-[10px] text-slate-500 font-normal">Nyamuk DBD & Outdoor</div>
                        </button>
                    </div>

                    {/* Input Slider */}
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-3">
                        <div className="flex justify-between items-center text-xs">
                            <span className="font-bold text-slate-700">Dimensi Lapangan:</span>
                            <span className="font-black text-emerald-700 text-sm">
                                {calcLength} {dosage.satuan}
                            </span>
                        </div>
                        <input
                            type="range"
                            min="5"
                            max="500"
                            step="5"
                            value={calcLength}
                            onChange={(e) => setCalcLength(parseInt(e.target.value))}
                            className="w-full accent-emerald-600 cursor-pointer"
                        />
                        <div className="flex justify-between text-[10px] text-slate-400">
                            <span>5</span>
                            <span>100</span>
                            <span>250</span>
                            <span>500</span>
                        </div>
                    </div>

                    {/* Calculation Results Card */}
                    <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-900 to-slate-900 text-white space-y-3 shadow-lg">
                        <div className="text-xs text-emerald-300 font-bold uppercase tracking-wider">
                            Rekomendasi Takaran & Eksekusi:
                        </div>
                        <div className="grid grid-cols-2 gap-3 text-left">
                            <div className="bg-white/10 rounded-xl p-3 backdrop-blur-sm">
                                <div className="text-[11px] text-slate-300">Total Larutan Siap Pakai:</div>
                                <div className="text-lg font-black text-emerald-400">{dosage.totalLarutan}</div>
                            </div>
                            <div className="bg-white/10 rounded-xl p-3 backdrop-blur-sm">
                                <div className="text-[11px] text-slate-300">Spesifikasi Pengerjaan:</div>
                                <div className="text-sm font-bold text-white">{dosage.kebutuhanBor}</div>
                            </div>
                        </div>

                        <div className="text-xs text-slate-300 pt-2 border-t border-white/10 flex items-center justify-between">
                            <span>Konsentrasi Bahan: <strong className="text-white">{dosage.konsentrat}</strong></span>
                            <span className="text-[10px] text-emerald-300 italic">{dosage.keterangan}</span>
                        </div>
                    </div>
                </div>
            )}

            {/* TAB CONTENT: TOOLS */}
            {activeTab === "tools" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm space-y-2">
                        <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                            <Ruler size={20} />
                        </div>
                        <h3 className="font-bold text-slate-800 text-sm">Meteran Kamera AR (WebXR)</h3>
                        <p className="text-xs text-slate-500 leading-relaxed">
                            Ukur perimeter dinding pondasi atau luas lantai secara langsung melalui kamera HP dengan kalibrasi ubin lantai standar (30x30 / 40x40 / 60x60).
                        </p>
                        <Link
                            to="/field/ar-measure"
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold mt-2"
                        >
                            Buka Meteran Kamera <ArrowRight size={14} />
                        </Link>
                    </div>

                    <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm space-y-2">
                        <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
                            <PenTool size={20} />
                        </div>
                        <h3 className="font-bold text-slate-800 text-sm">Tanda Tangan Digital Klien</h3>
                        <p className="text-xs text-slate-500 leading-relaxed">
                            Minta persetujuan berita acara pengerjaan atau SPK langsung pada layar sentuh ponsel. Hasil TTD tersemat rapi ke PDF laporan resmi.
                        </p>
                        <button
                            onClick={() => {
                                const target = spks[0];
                                if (target) setSigningSPK(target);
                            }}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold mt-2"
                        >
                            Uji Tanda Tangan <ArrowRight size={14} />
                        </button>
                    </div>
                </div>
            )}

            {/* COMPLETION MODAL */}
            {completingSPK && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                            <div>
                                <h3 className="font-bold text-slate-900 text-base">Berita Acara Penyelesaian Kerja</h3>
                                <p className="text-xs text-slate-500">{completingSPK.customerName}</p>
                            </div>
                            <button
                                onClick={() => setCompletingSPK(null)}
                                className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-400"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
                            <div>
                                <label className="text-xs font-bold text-slate-700 mb-1 block">
                                    Catatan Pelaksanaan Lapangan & Rekomendasi
                                </label>
                                <textarea
                                    rows={3}
                                    placeholder="Contoh: Pekerjaan injeksi 180m' pondasi selesai. Tidak ada kebocoran lantai. Kusen jendela terbebas dari serangan rayap."
                                    value={workNotes}
                                    onChange={(e) => setWorkNotes(e.target.value)}
                                    className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                                />
                            </div>

                            {/* Photo Proof Upload */}
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs font-bold text-slate-700 mb-1 block">
                                        Foto Sebelum (Before)
                                    </label>
                                    <div className="h-28 border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center p-2 text-center relative overflow-hidden bg-slate-50 hover:bg-slate-100 cursor-pointer">
                                        {photoBefore ? (
                                            <img src={photoBefore} alt="Before" className="w-full h-full object-cover" />
                                        ) : (
                                            <>
                                                <Camera size={20} className="text-slate-400 mb-1" />
                                                <span className="text-[10px] text-slate-500">Ambil / Unggah Foto</span>
                                            </>
                                        )}
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={(e) => {
                                                const file = e.target.files?.[0];
                                                if (file) {
                                                    const reader = new FileReader();
                                                    reader.onload = (evt) => setPhotoBefore(evt.target?.result as string);
                                                    reader.readAsDataURL(file);
                                                }
                                            }}
                                            className="absolute inset-0 opacity-0 cursor-pointer"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="text-xs font-bold text-slate-700 mb-1 block">
                                        Foto Sesudah (After)
                                    </label>
                                    <div className="h-28 border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center p-2 text-center relative overflow-hidden bg-slate-50 hover:bg-slate-100 cursor-pointer">
                                        {photoAfter ? (
                                            <img src={photoAfter} alt="After" className="w-full h-full object-cover" />
                                        ) : (
                                            <>
                                                <Camera size={20} className="text-slate-400 mb-1" />
                                                <span className="text-[10px] text-slate-500">Ambil / Unggah Foto</span>
                                            </>
                                        )}
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={(e) => {
                                                const file = e.target.files?.[0];
                                                if (file) {
                                                    const reader = new FileReader();
                                                    reader.onload = (evt) => setPhotoAfter(evt.target?.result as string);
                                                    reader.readAsDataURL(file);
                                                }
                                            }}
                                            className="absolute inset-0 opacity-0 cursor-pointer"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-2">
                            <button
                                onClick={() => setCompletingSPK(null)}
                                className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700"
                            >
                                Batal
                            </button>
                            <button
                                onClick={() => handleFinishJob(completingSPK)}
                                className="px-5 py-2 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-md active:scale-95"
                            >
                                Simpan & Selesaikan SPK
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* DIGITAL SIGNATURE MODAL */}
            {signingSPK && (
                <FieldSignatureModal
                    isOpen={true}
                    title={`Tanda Tangan Klien - ${signingSPK.customerName}`}
                    subtitle={`Pekerjaan: ${signingSPK.perihal}`}
                    onClose={() => setSigningSPK(null)}
                    onSave={(sigBase64, signer) => {
                        setSigningSPK(null);
                        addPendingItem({
                            type: "signature_upload",
                            title: `Tanda Tangan Klien (${signer}): ${signingSPK.customerName}`,
                            data: { spkId: signingSPK.id, signer, signature: sigBase64 },
                        });
                    }}
                />
            )}
        </div>
    );
}
