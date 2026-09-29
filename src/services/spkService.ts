/**
 * SPK Service - Supabase PostgreSQL with Offline LocalStorage Fallback
 */
import { supabase } from "../lib/supabase";
import type { SPK } from "../types";
import { useOfflineStore } from "../store/offlineStore";

const SPK_STORAGE_KEY = "fieldwork_spk_data";

export const DEFAULT_MOCK_SPKS: SPK[] = [
    {
        id: "spk-001",
        quotationId: "quo-001",
        quotationNoSurat: "GP-AR/U/2026/03/0001",
        customerId: "cust-001",
        customerName: "PT Topindo Atlas Asia",
        technicianId: "demo_teknisi_01",
        technicianName: "Budi Santoso",
        scheduleDate: new Date(),
        status: "in_progress",
        actualStart: new Date(Date.now() - 3600000 * 1.5),
        serviceType: "anti_rayap",
        perihal: "Anti Rayap Injeksi Pondasi & Pipanisasi Barrier",
        lokasi: "Jl. Gatot Subroto Kav. 45, Jakarta Selatan (Gedung Wisma Mulia Lt. 3)",
        notes: "Gunakan termitisida Imidakloprid 200 SL. Kedalaman lubang bor 35cm pada sekeliling perimeter dinding.",
        companyId: "comp_guci_01",
        createdAt: new Date(Date.now() - 86400000),
        createdBy: "demo_ops_01",
        createdByName: "Agus Setiawan",
        gpsStart: { lat: -6.2301, lng: 106.8227 },
    },
    {
        id: "spk-002",
        quotationId: "quo-002",
        quotationNoSurat: "GP-PCO/U/2026/03/0002",
        customerId: "cust-002",
        customerName: "Ibu Dita (Rumah Tinggal)",
        technicianId: "demo_teknisi_01",
        technicianName: "Budi Santoso",
        scheduleDate: new Date(Date.now() + 3600000 * 3),
        status: "assigned",
        serviceType: "pest_control",
        perihal: "Pemberantasan Nyamuk DBD (Cold Fogger ULV) & Spraying",
        lokasi: "Jl. Kemang Timur No. 18B, Bangka, Mampang Prapatan, Jakarta Selatan",
        notes: "Pemilik minta penanganan khusus pada area taman belakang & saluran pembuangan air. Mohon hubungi 1 jam sebelum tiba.",
        companyId: "comp_guci_01",
        createdAt: new Date(Date.now() - 43200000),
        createdBy: "demo_ops_01",
        createdByName: "Agus Setiawan",
    },
    {
        id: "spk-003",
        quotationId: "quo-003",
        quotationNoSurat: "GP-AR/K/2026/03/0003",
        customerId: "cust-003",
        customerName: "PT Oreka Solusi Kreatif",
        technicianId: "demo_teknisi_01",
        technicianName: "Budi Santoso",
        scheduleDate: new Date(Date.now() - 86400000),
        status: "done",
        actualStart: new Date(Date.now() - 86400000 - 7200000),
        actualEnd: new Date(Date.now() - 86400000 - 1800000),
        durationMin: 90,
        serviceType: "anti_rayap",
        perihal: "Inspeksi Berkala & Penggantian Baiting Umpan Rayap",
        lokasi: "The Breeze BSD Blok B1, BSD City, Tangerang Selatan",
        notes: "12 Stasiun Baiting diperiksa. Kondisi kayu kering terlindungi, tidak ditemukan koloni baru.",
        companyId: "comp_guci_01",
        createdAt: new Date(Date.now() - 172800000),
        createdBy: "demo_ops_01",
        createdByName: "Agus Setiawan",
        gpsStart: { lat: -6.3023, lng: 106.6521 },
        gpsEnd: { lat: -6.3025, lng: 106.6524 },
    },
];

function getLocalSPKs(): SPK[] {
    try {
        const raw = localStorage.getItem(SPK_STORAGE_KEY);
        if (raw) {
            const parsed = JSON.parse(raw);
            return parsed.map((item: any) => ({
                ...item,
                scheduleDate: new Date(item.scheduleDate),
                createdAt: new Date(item.createdAt),
                actualStart: item.actualStart ? new Date(item.actualStart) : undefined,
                actualEnd: item.actualEnd ? new Date(item.actualEnd) : undefined,
            }));
        }
    } catch {
        // ignore
    }
    localStorage.setItem(SPK_STORAGE_KEY, JSON.stringify(DEFAULT_MOCK_SPKS));
    return DEFAULT_MOCK_SPKS;
}

function saveLocalSPKs(spks: SPK[]) {
    try {
        localStorage.setItem(SPK_STORAGE_KEY, JSON.stringify(spks));
    } catch (e) {
        console.error("Failed to save SPKs to localStorage", e);
    }
}

function toSPK(data: any): SPK {
    return {
        id: data.id,
        ...data.payload,
        companyId: data.company_id,
        status: data.status,
        technicianId: data.technician_id,
        scheduleDate: new Date(data.schedule_date),
        createdAt: new Date(data.created_at),
        actualStart: data.payload?.actualStart ? new Date(data.payload.actualStart) : undefined,
        actualEnd: data.payload?.actualEnd ? new Date(data.payload.actualEnd) : undefined,
    };
}

export interface CreateSPKParams {
    quotationId: string;
    quotationNoSurat: string;
    customerName: string;
    technicianId: string;
    technicianName: string;
    scheduleDate: Date;
    serviceType: SPK["serviceType"];
    perihal: string;
    lokasi: string;
    notes: string;
    companyId: string;
    createdBy: string;
    createdByName: string;
}

export async function createSPK(params: CreateSPKParams): Promise<SPK> {
    const now = new Date();
    const newId = `spk-${Date.now()}`;
    const payload = {
        ...params,
        scheduleDate: params.scheduleDate.toISOString(),
        createdAt: now.toISOString(),
    };

    try {
        const { data, error } = await supabase
            .from("spk")
            .insert({
                company_id: params.companyId,
                technician_id: params.technicianId,
                status: "assigned",
                schedule_date: params.scheduleDate.toISOString(),
                payload,
            })
            .select()
            .single();

        if (!error && data) {
            const spk = toSPK(data);
            const current = getLocalSPKs();
            saveLocalSPKs([spk, ...current]);
            return spk;
        }
    } catch {
        // offline fallback
    }

    const localSPK: SPK = {
        id: newId,
        quotationId: params.quotationId,
        quotationNoSurat: params.quotationNoSurat,
        customerId: `cust-${Date.now()}`,
        customerName: params.customerName,
        technicianId: params.technicianId,
        technicianName: params.technicianName,
        scheduleDate: params.scheduleDate,
        status: "assigned",
        serviceType: params.serviceType,
        perihal: params.perihal,
        lokasi: params.lokasi,
        notes: params.notes,
        companyId: params.companyId,
        createdAt: now,
        createdBy: params.createdBy,
        createdByName: params.createdByName,
    };

    const current = getLocalSPKs();
    saveLocalSPKs([localSPK, ...current]);

    useOfflineStore.getState().addPendingItem({
        type: "spk_checkin",
        title: `Buat SPK Baru: ${params.customerName}`,
        data: localSPK,
    });

    return localSPK;
}

export interface GetSPKFilters {
    companyId: string;
    status?: SPK["status"];
    technicianId?: string;
}

export async function getSPKList(filters: GetSPKFilters): Promise<SPK[]> {
    try {
        let query = supabase
            .from("spk")
            .select("*")
            .eq("company_id", filters.companyId);

        if (filters.status) query = query.eq("status", filters.status);
        if (filters.technicianId) query = query.eq("technician_id", filters.technicianId);

        const { data, error } = await query.order("schedule_date", { ascending: false });
        if (!error && data && data.length > 0) {
            const spks = data.map(toSPK);
            saveLocalSPKs(spks);
            return spks;
        }
    } catch {
        // use fallback
    }

    let local = getLocalSPKs();
    if (filters.status) {
        local = local.filter(s => s.status === filters.status);
    }
    if (filters.technicianId && filters.technicianId !== "all") {
        local = local.filter(s => s.technicianId === filters.technicianId || s.technicianId.startsWith("demo_"));
    }
    return local;
}

export async function getSPKById(id: string): Promise<SPK | null> {
    try {
        const { data, error } = await supabase.from("spk").select("*").eq("id", id).single();
        if (!error && data) return toSPK(data);
    } catch {
        // fallback
    }
    const local = getLocalSPKs();
    return local.find(s => s.id === id) || null;
}

export async function updateSPKStatus(
    id: string,
    status: SPK["status"],
    extra?: { gps?: { lat: number; lng: number }; durationMin?: number; notes?: string }
): Promise<void> {
    const local = getLocalSPKs();
    const item = local.find(s => s.id === id);
    if (!item) return;

    item.status = status;
    if (status === "in_progress") {
        item.actualStart = new Date();
        if (extra?.gps) item.gpsStart = extra.gps;
    }
    if (status === "done") {
        item.actualEnd = new Date();
        if (extra?.gps) item.gpsEnd = extra.gps;
        if (extra?.durationMin) item.durationMin = extra.durationMin;
    }
    if (extra?.notes) {
        item.notes = `${item.notes || ""}\n[Catatan Lapangan]: ${extra.notes}`.trim();
    }

    saveLocalSPKs(local);

    useOfflineStore.getState().addPendingItem({
        type: status === "in_progress" ? "spk_checkin" : "spk_complete",
        title: `Update Status SPK ${item.quotationNoSurat || id} → ${status.toUpperCase()}`,
        data: { id, status, extra, updatedAt: new Date().toISOString() },
    });

    try {
        const { data: current } = await supabase.from("spk").select("payload").eq("id", id).single();
        if (current) {
            const payload = current.payload;
            if (status === "in_progress") payload.actualStart = new Date().toISOString();
            if (status === "done") payload.actualEnd = new Date().toISOString();
            if (extra?.gps && status === "in_progress") payload.gpsStart = extra.gps;
            if (extra?.gps && status === "done") payload.gpsEnd = extra.gps;
            await supabase.from("spk").update({ status, payload }).eq("id", id);
        }
    } catch {
        // logged in offline queue
    }
}

export async function reassignSPK(
    id: string,
    technicianId: string,
    technicianName: string,
    scheduleDate: Date,
): Promise<void> {
    const local = getLocalSPKs();
    const item = local.find(s => s.id === id);
    if (item) {
        item.technicianId = technicianId;
        item.technicianName = technicianName;
        item.scheduleDate = scheduleDate;
        item.status = "assigned";
        saveLocalSPKs(local);
    }

    try {
        const { data: current } = await supabase.from("spk").select("payload").eq("id", id).single();
        if (current) {
            const payload = current.payload;
            payload.technicianId = technicianId;
            payload.technicianName = technicianName;
            payload.scheduleDate = scheduleDate.toISOString();

            await supabase.from("spk").update({
                technician_id: technicianId,
                schedule_date: scheduleDate.toISOString(),
                status: "assigned",
                payload
            }).eq("id", id);
        }
    } catch {
        // handled
    }
}

