/**
 * Quotation Service - Supabase PostgreSQL CRUD with LocalStorage Offline Fallback
 */
import { supabase } from "../lib/supabase";
import type { Quotation, QuotationStatus, KategoriSurat, TipeKontrak } from "../types";
import { useOfflineStore } from "../store/offlineStore";

const QUO_STORAGE_KEY = "fieldwork_quotations_data";

export const DEFAULT_MOCK_QUOTATIONS: Quotation[] = [
    {
        id: "quo-001",
        noSurat: "GP-AR/U/2026/03/0001",
        kategori: "AR",
        tipeKontrak: "U",
        jenisLayanan: "anti_rayap_injeksi",
        perihal: "Penawaran Pekerjaan Anti Rayap Sistem Injeksi & Barrier",
        kepadaNama: "PT Topindo Atlas Asia",
        kepadaAlamatLines: ["Jl. Gatot Subroto Kav. 45", "Jakarta Selatan 12930"],
        kepadaUp: "Bpk. Bambang Wijaya (Facility Head)",
        kepadaWa: "081298765001",
        tanggal: new Date(),
        items: [
            { desc: "Pengeboran & Injeksi Termitisida Pondasi Keliling", qty: 180, unit: "m'", harga: 85000 },
            { desc: "Pemasangan Barrier Kimia Lantai Dasar", qty: 350, unit: "m2", harga: 45000 },
            { desc: "Perlindungan Kusen Pintu & Jendela Kayu", qty: 24, unit: "titik", harga: 35000 },
        ],
        biayaTambahan: [{ label: "Mobilisasi & Uji Kelembapan Tanah", amount: 350000 }],
        diskonPct: 5,
        ppn: true,
        garansiTahun: 3,
        jenisGaransi: "Garansi Sertifikat Resmi 3 Tahun Retreatment Bebas Biaya",
        subtotal: 31890000,
        diskonRp: 1594500,
        ppnRp: 3332505,
        total: 33978005,
        marketingUid: "demo_marketing_01",
        marketingNama: "Siti Rahma",
        marketingWa: "081298765432",
        status: "deal",
        approvedBy: "Hendra Wijaya",
        approvedAt: new Date(Date.now() - 86400000 * 2),
        dealAt: new Date(Date.now() - 86400000),
        companyId: "comp_guci_01",
        createdAt: new Date(Date.now() - 86400000 * 3),
        surveyPhotos: [],
        chemicals: [
            { bahanAktif: "Imidakloprid 200 SL", merkDagang: "Safe 1 200 SL" },
            { bahanAktif: "Cypermethrin 100 EC", merkDagang: "Cypergard" },
        ],
    },
    {
        id: "quo-002",
        noSurat: "GP-PCO/U/2026/03/0002",
        kategori: "PCO",
        tipeKontrak: "U",
        jenisLayanan: "pest_fogging",
        perihal: "Penawaran Jasa Pengendalian Hama & Nyamuk DBD",
        kepadaNama: "Ibu Dita (Rumah Tinggal)",
        kepadaAlamatLines: ["Jl. Kemang Timur No. 18B", "Mampang Prapatan, Jakarta Selatan"],
        kepadaUp: "Ibu Dita",
        kepadaWa: "081188992211",
        tanggal: new Date(),
        items: [
            { desc: "Thermal Fogging Area Luar & Selokan", qty: 1, unit: "paket", harga: 650000 },
            { desc: "Cold Fogging ULV Indoor Koridor & Ruang Tamu", qty: 1, unit: "paket", harga: 550000 },
            { desc: "Baiting Umpan Gel Kecoa & Semut", qty: 8, unit: "titik", harga: 25000 },
        ],
        biayaTambahan: [],
        diskonPct: 0,
        ppn: false,
        garansiTahun: 0,
        subtotal: 1400000,
        diskonRp: 0,
        ppnRp: 0,
        total: 1400000,
        marketingUid: "demo_marketing_01",
        marketingNama: "Siti Rahma",
        marketingWa: "081298765432",
        status: "approved",
        approvedBy: "Hendra Wijaya",
        approvedAt: new Date(),
        companyId: "comp_guci_01",
        createdAt: new Date(Date.now() - 86400000),
        surveyPhotos: [],
        chemicals: [{ bahanAktif: "Lambda Cyhalothrin", merkDagang: "Demand CS" }],
    },
    {
        id: "quo-003",
        noSurat: "GP-AR/K/2026/03/0003",
        kategori: "AR",
        tipeKontrak: "K",
        jenisLayanan: "anti_rayap_pipanisasi",
        perihal: "Kontrak Tahunan Pemeliharaan & Monitoring Rayap Gedung Kantor",
        kepadaNama: "PT Oreka Solusi Kreatif",
        kepadaAlamatLines: ["The Breeze BSD Blok B1", "BSD City, Tangerang Selatan"],
        kepadaUp: "Bpk. Kevin Halim",
        kepadaWa: "081399001122",
        tanggal: new Date(),
        items: [
            { desc: "Pemeriksaan Berkala Stasiun Baiting (4x Setahun)", qty: 4, unit: "kunjungan", harga: 2250000 },
            { desc: "Penggantian Kartrid Umpan Selulosa Aktif", qty: 12, unit: "stasiun", harga: 175000 },
        ],
        biayaTambahan: [],
        diskonPct: 10,
        ppn: true,
        garansiTahun: 1,
        subtotal: 11100000,
        diskonRp: 1110000,
        ppnRp: 1098900,
        total: 11088900,
        marketingUid: "demo_marketing_01",
        marketingNama: "Siti Rahma",
        marketingWa: "081298765432",
        status: "pending",
        companyId: "comp_guci_01",
        createdAt: new Date(),
        surveyPhotos: [],
    },
];

function getLocalQuotations(): Quotation[] {
    try {
        const raw = localStorage.getItem(QUO_STORAGE_KEY);
        if (raw) {
            const parsed = JSON.parse(raw);
            return parsed.map((item: any) => ({
                ...item,
                tanggal: new Date(item.tanggal),
                createdAt: new Date(item.createdAt),
                approvedAt: item.approvedAt ? new Date(item.approvedAt) : undefined,
                dealAt: item.dealAt ? new Date(item.dealAt) : undefined,
                sentToClientAt: item.sentToClientAt ? new Date(item.sentToClientAt) : undefined,
                signedAt: item.signedAt ? new Date(item.signedAt) : undefined,
            }));
        }
    } catch {
        // ignore
    }
    localStorage.setItem(QUO_STORAGE_KEY, JSON.stringify(DEFAULT_MOCK_QUOTATIONS));
    return DEFAULT_MOCK_QUOTATIONS;
}

function saveLocalQuotations(quos: Quotation[]) {
    try {
        localStorage.setItem(QUO_STORAGE_KEY, JSON.stringify(quos));
    } catch (e) {
        console.error("Failed to save Quotations to localStorage", e);
    }
}

export async function blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload  = () => resolve((reader.result as string).split(",")[1]);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
}

export function base64ToBlob(base64: string, type = "application/pdf"): Blob {
    const bytes = Uint8Array.from(atob(base64), c => c.charCodeAt(0));
    return new Blob([bytes], { type });
}

function toQuotation(data: any): Quotation {
    return {
        id: data.id,
        ...data.payload,
        companyId: data.company_id,
        marketingUid: data.marketing_uid,
        status: data.status,
        createdAt: new Date(data.created_at),
        tanggal: data.payload?.tanggal ? new Date(data.payload.tanggal) : new Date(),
        approvedAt: data.payload?.approvedAt ? new Date(data.payload.approvedAt) : undefined,
        dealAt: data.payload?.dealAt ? new Date(data.payload.dealAt) : undefined,
        sentToClientAt: data.payload?.sentToClientAt ? new Date(data.payload.sentToClientAt) : undefined,
        signedAt: data.payload?.signedAt ? new Date(data.payload.signedAt) : undefined,
    };
}

export async function saveQuotationBatch(
    data: Omit<Quotation, "id" | "createdAt">,
    nomorSuratLogId: string,
    pdfBlob: Blob,
): Promise<Quotation> {
    const pdfBase64 = await blobToBase64(pdfBlob);
    const now = new Date();
    const newId = `quo-${Date.now()}`;

    const payload = {
        ...data,
        pdfBase64,
        pdfUrl: null,
        tanggal: data.tanggal.toISOString(),
        approvedAt: data.approvedAt ? data.approvedAt.toISOString() : null,
    };

    try {
        const { data: quoDoc, error: quoErr } = await supabase
            .from("quotations")
            .insert({
                company_id: data.companyId,
                marketing_uid: data.marketingUid,
                status: data.status,
                payload
            })
            .select()
            .single();

        if (!quoErr && quoDoc) {
            await supabase
                .from("nomor_surat_logs")
                .update({ status: "pending", quoId: quoDoc.id })
                .eq("id", nomorSuratLogId);

            const result = toQuotation(quoDoc);
            const current = getLocalQuotations();
            saveLocalQuotations([result, ...current]);
            return result;
        }
    } catch {
        // fallback
    }

    const localQuo: Quotation = {
        ...data,
        id: newId,
        createdAt: now,
        pdfBase64,
    };

    const current = getLocalQuotations();
    saveLocalQuotations([localQuo, ...current]);

    useOfflineStore.getState().addPendingItem({
        type: "survey_quotation",
        title: `Simpan Penawaran: ${data.noSurat} - ${data.kepadaNama}`,
        data: localQuo,
    });

    return localQuo;
}

export interface GetQuotationsFilters {
    companyId: string;
    byUid?: string;
    kategori?: KategoriSurat;
    tipeKontrak?: TipeKontrak;
    status?: QuotationStatus;
}

export async function getQuotations(filters: GetQuotationsFilters): Promise<Quotation[]> {
    try {
        let query = supabase
            .from("quotations")
            .select("*")
            .eq("company_id", filters.companyId);

        if (filters.byUid) query = query.eq("marketing_uid", filters.byUid);
        if (filters.status) query = query.eq("status", filters.status);
        if (filters.kategori) query = query.eq("payload->>kategori", filters.kategori);
        if (filters.tipeKontrak) query = query.eq("payload->>tipeKontrak", filters.tipeKontrak);

        const { data, error } = await query.order("created_at", { ascending: false });
        if (!error && data && data.length > 0) {
            const result = data.map(toQuotation);
            saveLocalQuotations(result);
            return result;
        }
    } catch {
        // fallback
    }

    let local = getLocalQuotations();
    if (filters.byUid && filters.byUid !== "all") {
        local = local.filter(q => q.marketingUid === filters.byUid || q.marketingUid.startsWith("demo_"));
    }
    if (filters.status) {
        local = local.filter(q => q.status === filters.status);
    }
    if (filters.kategori) {
        local = local.filter(q => q.kategori === filters.kategori);
    }
    if (filters.tipeKontrak) {
        local = local.filter(q => q.tipeKontrak === filters.tipeKontrak);
    }
    return local;
}

export async function getQuotationById(id: string): Promise<Quotation | null> {
    try {
        const { data, error } = await supabase.from("quotations").select("*").eq("id", id).single();
        if (!error && data) return toQuotation(data);
    } catch {
        // fallback
    }
    const local = getLocalQuotations();
    return local.find(q => q.id === id) || null;
}

export async function updateQuotationStatus(
    id: string,
    status: QuotationStatus,
    approvedBy?: string,
    rejectionReason?: string,
    notesMarketing?: string,
): Promise<void> {
    const now = new Date();
    const local = getLocalQuotations();
    const item = local.find(q => q.id === id);
    if (item) {
        item.status = status;
        if (status === "approved") {
            item.approvedBy = approvedBy || "Administrator";
            item.approvedAt = now;
        }
        if (status === "rejected") {
            item.rejectionReason = rejectionReason;
            item.notesMarketing = notesMarketing;
        }
        if (status === "sent_to_client") item.sentToClientAt = now;
        if (status === "deal") item.dealAt = now;
        saveLocalQuotations(local);

        useOfflineStore.getState().addPendingItem({
            type: "survey_quotation",
            title: `Update Status Quotation ${item.noSurat} → ${status.toUpperCase()}`,
            data: { id, status },
        });
    }

    try {
        const { data: current } = await supabase.from("quotations").select("payload").eq("id", id).single();
        if (current) {
            const payload = current.payload;
            payload.status = status;
            if (status === "approved") {
                if (approvedBy) payload.approvedBy = approvedBy;
                payload.approvedAt = now.toISOString();
            }
            if (status === "rejected") {
                if (rejectionReason) payload.rejectionReason = rejectionReason;
                if (notesMarketing) payload.notesMarketing = notesMarketing;
            }
            if (status === "sent_to_client") payload.sentToClientAt = now.toISOString();
            if (status === "deal") payload.dealAt = now.toISOString();

            await supabase.from("quotations").update({ status, payload }).eq("id", id);
            await supabase.from("nomor_surat_logs").update({ status }).eq("quoId", id);
        }
    } catch {
        // fallback handled
    }
}

export { saveQuotationBatch as addQuotationDoc };

export async function saveQuotationDraft(
    data: Omit<Quotation, "id" | "createdAt" | "pdfBase64" | "pdfUrl">,
    nomorSuratLogId: string,
): Promise<Quotation> {
    const now = new Date();
    const newId = `quo-${Date.now()}`;
    const payload = {
        ...data,
        pdfBase64: null,
        pdfUrl: null,
        tanggal: data.tanggal.toISOString(),
        approvedAt: data.approvedAt ? data.approvedAt.toISOString() : null,
    };

    try {
        const { data: quoDoc, error: quoErr } = await supabase
            .from("quotations")
            .insert({
                company_id: data.companyId,
                marketing_uid: data.marketingUid,
                status: data.status,
                payload
            })
            .select()
            .single();

        if (!quoErr && quoDoc) {
            await supabase.from("nomor_surat_logs").update({ status: "pending", quoId: quoDoc.id }).eq("id", nomorSuratLogId);
            const result = toQuotation(quoDoc);
            const current = getLocalQuotations();
            saveLocalQuotations([result, ...current]);
            return result;
        }
    } catch {
        // fallback
    }

    const localQuo: Quotation = {
        ...data,
        id: newId,
        createdAt: now,
    };
    const current = getLocalQuotations();
    saveLocalQuotations([localQuo, ...current]);
    return localQuo;
}

export async function updateQuotationData(
    id: string,
    data: Partial<Quotation>
): Promise<void> {
    const local = getLocalQuotations();
    const item = local.find(q => q.id === id);
    if (item) {
        Object.assign(item, data);
        saveLocalQuotations(local);
    }

    try {
        const { data: current } = await supabase.from("quotations").select("payload").eq("id", id).single();
        if (current) {
            const payload = { ...current.payload, ...data };
            await supabase.from("quotations").update({ payload }).eq("id", id);
        }
    } catch {
        // fallback
    }
}

export async function attachPdfToQuotation(id: string, pdfBase64: string): Promise<void> {
    await updateQuotationData(id, { pdfBase64 });
}

export async function deleteQuotation(id: string): Promise<void> {
    const local = getLocalQuotations();
    saveLocalQuotations(local.filter(q => q.id !== id));

    try {
        await supabase.from("quotations").delete().eq("id", id);
    } catch {
        // fallback
    }
}
