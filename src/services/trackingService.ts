/**
 * Tracking Service - Supabase PostgreSQL with Offline Fallback
 */
import { supabase } from "../lib/supabase";
import type { Quotation } from "../types";

export type StatusPembayaran = "belum_bayar" | "dp" | "lunas" | "nunggak";
export type StatusPengerjaan  = "pending" | "berlanjut" | "selesai" | "dibatalkan";

export interface TerminAR {
    nominalDP: number;
    tanggalDP?: Date;
    dibayarDP: boolean;
    tanggalBayarDP?: Date;
    catatanDP?: string;
    nominalPelunasan: number;
    tanggalPelunasan?: Date;
    dibayarPelunasan: boolean;
    tanggalBayarPelunasan?: Date;
    catatanPelunasan?: string;
}

export interface CicilanPCO {
    bulan: number;
    label: string;
    nominal: number;
    tanggalJatuhTempo?: Date;
    dibayar: boolean;
    tanggalBayar?: Date;
    catatan?: string;
}

export interface OrderTracking {
    id?: string;
    quotationId: string;
    noSurat: string;
    kepadaNama: string;
    total: number;
    kategori: "AR" | "PCO";
    companyId: string;
    marketingUid: string;
    marketingNama: string;
    tanggalDeal?: Date;
    statusPembayaran: StatusPembayaran;
    nominalDibayar: number;
    terminAR?: TerminAR;
    cicilanBulanan?: CicilanPCO[];
    durasiKontrak?: number;
    tanggalMulaiKontrak?: Date;
    statusPengerjaan: StatusPengerjaan;
    catatanPengerjaan?: string;
    tanggalMulai?: Date;
    tanggalSelesai?: Date;
    updatedAt: Date;
    createdAt: Date;
}

const DEFAULT_TRACKING_MOCKS: OrderTracking[] = [
    {
        id: "quo-001",
        quotationId: "quo-001",
        noSurat: "GP-AR/U/2026/03/0001",
        kepadaNama: "PT Topindo Atlas Asia",
        total: 33978005,
        kategori: "AR",
        companyId: "comp_guci_01",
        marketingUid: "demo_marketing_01",
        marketingNama: "Siti Rahma",
        tanggalDeal: new Date(Date.now() - 86400000),
        statusPembayaran: "dp",
        nominalDibayar: 16989002,
        statusPengerjaan: "berlanjut",
        catatanPengerjaan: "SPK telah diterbitkan dan teknisi sedang melakukan injeksi pondasi.",
        updatedAt: new Date(),
        createdAt: new Date(Date.now() - 86400000 * 2),
    },
    {
        id: "quo-002",
        quotationId: "quo-002",
        noSurat: "GP-PCO/U/2026/03/0002",
        kepadaNama: "Ibu Dita (Rumah Tinggal)",
        total: 1400000,
        kategori: "PCO",
        companyId: "comp_guci_01",
        marketingUid: "demo_marketing_01",
        marketingNama: "Siti Rahma",
        statusPembayaran: "belum_bayar",
        nominalDibayar: 0,
        statusPengerjaan: "pending",
        updatedAt: new Date(),
        createdAt: new Date(Date.now() - 86400000),
    },
];

function parseDates(payload: any): any {
    if (!payload) return payload;
    const res = { ...payload };
    if (res.tanggalDeal) res.tanggalDeal = new Date(res.tanggalDeal);
    if (res.tanggalMulaiKontrak) res.tanggalMulaiKontrak = new Date(res.tanggalMulaiKontrak);
    if (res.tanggalMulai) res.tanggalMulai = new Date(res.tanggalMulai);
    if (res.tanggalSelesai) res.tanggalSelesai = new Date(res.tanggalSelesai);
    if (res.updatedAt) res.updatedAt = new Date(res.updatedAt);
    if (res.createdAt) res.createdAt = new Date(res.createdAt);

    if (res.terminAR) {
        if (res.terminAR.tanggalDP) res.terminAR.tanggalDP = new Date(res.terminAR.tanggalDP);
        if (res.terminAR.tanggalBayarDP) res.terminAR.tanggalBayarDP = new Date(res.terminAR.tanggalBayarDP);
        if (res.terminAR.tanggalPelunasan) res.terminAR.tanggalPelunasan = new Date(res.terminAR.tanggalPelunasan);
        if (res.terminAR.tanggalBayarPelunasan) res.terminAR.tanggalBayarPelunasan = new Date(res.terminAR.tanggalBayarPelunasan);
    }

    if (res.cicilanBulanan) {
        res.cicilanBulanan = res.cicilanBulanan.map((c: any) => ({
            ...c,
            tanggalJatuhTempo: c.tanggalJatuhTempo ? new Date(c.tanggalJatuhTempo) : undefined,
            tanggalBayar: c.tanggalBayar ? new Date(c.tanggalBayar) : undefined,
        }));
    }

    return res;
}

function stringifyDates(tracking: OrderTracking): any {
    const res: any = { ...tracking };
    if (res.tanggalDeal) res.tanggalDeal = res.tanggalDeal.toISOString();
    if (res.tanggalMulaiKontrak) res.tanggalMulaiKontrak = res.tanggalMulaiKontrak.toISOString();
    if (res.tanggalMulai) res.tanggalMulai = res.tanggalMulai.toISOString();
    if (res.tanggalSelesai) res.tanggalSelesai = res.tanggalSelesai.toISOString();
    if (res.updatedAt) res.updatedAt = res.updatedAt.toISOString();
    if (res.createdAt) res.createdAt = res.createdAt.toISOString();

    if (res.terminAR) {
        res.terminAR = { ...res.terminAR };
        if (res.terminAR.tanggalDP) res.terminAR.tanggalDP = res.terminAR.tanggalDP.toISOString();
        if (res.terminAR.tanggalBayarDP) res.terminAR.tanggalBayarDP = res.terminAR.tanggalBayarDP.toISOString();
        if (res.terminAR.tanggalPelunasan) res.terminAR.tanggalPelunasan = res.terminAR.tanggalPelunasan.toISOString();
        if (res.terminAR.tanggalBayarPelunasan) res.terminAR.tanggalBayarPelunasan = res.terminAR.tanggalBayarPelunasan.toISOString();
    }

    if (res.cicilanBulanan) {
        res.cicilanBulanan = res.cicilanBulanan.map((c: any) => ({
            ...c,
            tanggalJatuhTempo: c.tanggalJatuhTempo ? c.tanggalJatuhTempo.toISOString() : undefined,
            tanggalBayar: c.tanggalBayar ? c.tanggalBayar.toISOString() : undefined,
        }));
    }

    return res;
}

export async function getTracking(quotationId: string): Promise<OrderTracking | null> {
    try {
        const { data, error } = await supabase.from("order_tracking").select("payload").eq("id", quotationId).single();
        if (!error && data) return parseDates(data.payload) as OrderTracking;
    } catch {
        // ignore
    }
    const mock = DEFAULT_TRACKING_MOCKS.find(t => t.quotationId === quotationId);
    return mock || null;
}

export async function getTrackingByCompany(companyId: string): Promise<OrderTracking[]> {
    try {
        const { data, error } = await supabase.from("order_tracking").select("payload").eq("company_id", companyId);
        if (!error && data && data.length > 0) {
            return data.map((d: any) => parseDates(d.payload) as OrderTracking);
        }
    } catch {
        // ignore
    }
    return DEFAULT_TRACKING_MOCKS;
}

export async function upsertTracking(tracking: OrderTracking): Promise<void> {
    tracking.updatedAt = new Date();
    
    try {
        await supabase.from("order_tracking").upsert({
            id: tracking.quotationId,
            company_id: tracking.companyId,
            payload: stringifyDates(tracking)
        }, { onConflict: 'id' });
    } catch {
        // ignore
    }
}

export function generateTerminAR(total: number): TerminAR {
    const dp = total * 0.5;
    return {
        nominalDP: dp,
        dibayarDP: false,
        nominalPelunasan: total - dp,
        dibayarPelunasan: false,
    };
}

export function generateCicilanBulanan(total: number, durasiBulan: number, startDate?: Date): CicilanPCO[] {
    if (durasiBulan <= 0) return [];
    const perBulan = Math.round(total / durasiBulan);
    const sisa = total - (perBulan * (durasiBulan - 1));
    const cicilan: CicilanPCO[] = [];
    const base = startDate ? new Date(startDate) : new Date();

    for (let i = 1; i <= durasiBulan; i++) {
        const jt = new Date(base.getFullYear(), base.getMonth() + (i - 1), base.getDate());
        cicilan.push({
            bulan: i,
            label: `Bulan ke-${i}`,
            nominal: i === durasiBulan ? sisa : perBulan,
            tanggalJatuhTempo: jt,
            dibayar: false,
        });
    }
    return cicilan;
}

export function computeStatusPembayaran(tracking: {
    kategori: "AR" | "PCO";
    terminAR?: TerminAR;
    cicilanBulanan?: CicilanPCO[];
    statusPembayaran?: StatusPembayaran;
    nominalDibayar?: number;
}): StatusPembayaran {
    if (tracking.kategori === "AR" && tracking.terminAR) {
        const { dibayarDP, dibayarPelunasan } = tracking.terminAR;
        if (dibayarDP && dibayarPelunasan) {
            return "lunas";
        }
        if (dibayarDP) {
            return "dp";
        }
        return "belum_bayar";
    }

    if (tracking.kategori === "PCO" && tracking.cicilanBulanan && tracking.cicilanBulanan.length > 0) {
        const cicilan = tracking.cicilanBulanan;
        const allPaid = cicilan.every(c => c.dibayar);
        const hasOverdue = cicilan.some(c => !c.dibayar && c.tanggalJatuhTempo && new Date(c.tanggalJatuhTempo) < new Date());
        const hasSomePaid = cicilan.some(c => c.dibayar);

        if (allPaid) {
            return "lunas";
        }
        if (hasOverdue) {
            return "nunggak";
        }
        if (hasSomePaid) {
            return "dp";
        }
        return "belum_bayar";
    }

    return tracking.statusPembayaran || "belum_bayar";
}

