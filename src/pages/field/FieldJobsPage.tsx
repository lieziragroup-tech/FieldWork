import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { getSPKList, updateSPKStatus } from "../../services/spkService";
import type { SPK } from "../../types";
import { FieldSignatureModal } from "../../components/common/FieldSignatureModal";
import {
    ClipboardList, MapPin, Navigation, Phone, CheckCircle2,
    Clock, RefreshCw, PenTool, Search, Filter, Plus, ExternalLink
} from "lucide-react";

export function FieldJobsPage() {
    const { user } = useAuth();
    const [spks, setSpks] = useState<SPK[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState<"all" | "assigned" | "in_progress" | "done">("all");
    const [searchQuery, setSearchQuery] = useState("");
    const [signingSPK, setSigningSPK] = useState<SPK | null>(null);

    const loadData = async () => {
        setLoading(true);
        try {
            const list = await getSPKList({
                companyId: user?.companyId || "comp_guci_01",
            });
            setSpks(list);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [user]);

    const filtered = spks.filter(s => {
        if (filterStatus !== "all" && s.status !== filterStatus) return false;
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            return (
                s.customerName.toLowerCase().includes(q) ||
                s.lokasi.toLowerCase().includes(q) ||
                (s.quotationNoSurat || "").toLowerCase().includes(q) ||
                s.perihal.toLowerCase().includes(q)
            );
        }
        return true;
    });

    return (
        <div className="max-w-4xl mx-auto p-3 sm:p-5 space-y-4 pb-24">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/90 shadow-sm">
                <div>
                    <div className="flex items-center gap-2">
                        <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                            <ClipboardList size={18} />
                        </div>
                        <div>
                            <h1 className="text-lg font-bold text-slate-900">Daftar Tugas Lapangan (SPK)</h1>
                            <p className="text-xs text-slate-500">
                                Jadwal pengerjaan operasional pest control & anti rayap
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={loadData}
                        className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
                        title="Segarkan data"
                    >
                        <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
                    </button>
                    <Link
                        to="/quotations/new"
                        className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm active:scale-95"
                    >
                        <Plus size={15} /> Buat Penawaran / SPK
                    </Link>
                </div>
            </div>

            {/* Filter and Search */}
            <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                    <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Cari nama klien, lokasi, nomor surat..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                    />
                </div>

                <div className="flex bg-white p-1 rounded-2xl border border-slate-200 text-xs font-bold overflow-x-auto">
                    {(["all", "assigned", "in_progress", "done"] as const).map((st) => (
                        <button
                            key={st}
                            onClick={() => setFilterStatus(st)}
                            className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition-all ${
                                filterStatus === st ? "bg-slate-900 text-white shadow-sm" : "text-slate-600 hover:text-slate-900"
                            }`}
                        >
                            {st === "all" ? "Semua" : st === "assigned" ? "Siap" : st === "in_progress" ? "Berjalan" : "Selesai"}
                        </button>
                    ))}
                </div>
            </div>

            {/* List */}
            <div className="space-y-3">
                {loading ? (
                    <div className="p-8 text-center bg-white rounded-2xl border border-slate-100">
                        <RefreshCw size={24} className="animate-spin mx-auto text-emerald-600 mb-2" />
                        <p className="text-xs text-slate-500">Memuat penugasan SPK...</p>
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="p-8 text-center bg-white rounded-2xl border border-slate-100">
                        <p className="text-xs text-slate-500">Tidak ada penugasan yang sesuai filter.</p>
                    </div>
                ) : (
                    filtered.map((spk) => (
                        <div
                            key={spk.id}
                            className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-sm space-y-3 hover:border-slate-300 transition-all"
                        >
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span
                                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                                spk.status === "in_progress"
                                                    ? "bg-amber-100 text-amber-800"
                                                    : spk.status === "done"
                                                    ? "bg-emerald-100 text-emerald-800"
                                                    : "bg-blue-100 text-blue-800"
                                            }`}
                                        >
                                            {spk.status}
                                        </span>
                                        <span className="text-xs font-mono font-medium text-slate-400">
                                            {spk.quotationNoSurat || spk.id}
                                        </span>
                                    </div>
                                    <h3 className="text-base font-bold text-slate-900 mt-1">{spk.customerName}</h3>
                                </div>
                                <span className="text-xs font-semibold text-slate-500 shrink-0">
                                    {new Date(spk.scheduleDate).toLocaleDateString("id-ID", {
                                        day: "numeric",
                                        month: "short",
                                        year: "numeric",
                                    })}
                                </span>
                            </div>

                            <div className="text-xs text-slate-700 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                                <div className="font-semibold text-emerald-700">🛠️ {spk.perihal}</div>
                                {spk.notes && <div className="text-slate-500 mt-1">{spk.notes}</div>}
                            </div>

                            <div className="flex items-start gap-2 text-xs text-slate-600">
                                <MapPin size={14} className="text-red-500 shrink-0 mt-0.5" />
                                <div className="flex-1">
                                    <span>{spk.lokasi}</span>
                                    <div className="flex items-center gap-3 mt-1">
                                        <a
                                            href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
                                                spk.lokasi
                                            )}`}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="text-[11px] font-bold text-blue-600 hover:underline flex items-center gap-1"
                                        >
                                            <Navigation size={12} /> Navigasi Peta
                                        </a>
                                        <a
                                            href="https://wa.me/6281298765001"
                                            target="_blank"
                                            rel="noreferrer"
                                            className="text-[11px] font-bold text-emerald-600 hover:underline flex items-center gap-1"
                                        >
                                            <Phone size={12} /> Kontak WhatsApp
                                        </a>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                                <span className="text-[11px] text-slate-400">
                                    Petugas: <strong className="text-slate-600">{spk.technicianName}</strong>
                                </span>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setSigningSPK(spk)}
                                        className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1"
                                    >
                                        <PenTool size={13} /> TTD
                                    </button>
                                    <Link
                                        to="/field/dashboard"
                                        className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1"
                                    >
                                        Buka Lapangan
                                    </Link>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {signingSPK && (
                <FieldSignatureModal
                    isOpen={true}
                    title={`Tanda Tangan Klien - ${signingSPK.customerName}`}
                    subtitle={`Pekerjaan: ${signingSPK.perihal}`}
                    onClose={() => setSigningSPK(null)}
                    onSave={() => setSigningSPK(null)}
                />
            )}
        </div>
    );
}
