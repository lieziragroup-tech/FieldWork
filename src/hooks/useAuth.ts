import { useEffect } from "react";
import { supabase } from "../lib/supabase";
import { useAuthStore } from "../store/authStore";
import type { AppUser, UserRole } from "../types";

export const DEMO_USERS: Record<string, AppUser> = {
    teknisi: {
        uid: "demo_teknisi_01",
        email: "budi.teknisi@fieldwork.id",
        name: "Budi Santoso",
        role: "teknisi",
        companyId: "comp_guci_01",
        isActive: true,
        wa: "081234567890",
        jabatan: "Senior Field Technician",
    },
    marketing: {
        uid: "demo_marketing_01",
        email: "siti.marketing@fieldwork.id",
        name: "Siti Rahma",
        role: "marketing",
        companyId: "comp_guci_01",
        isActive: true,
        wa: "081298765432",
        jabatan: "Sales & Field Surveyor",
    },
    admin_ops: {
        uid: "demo_ops_01",
        email: "agus.ops@fieldwork.id",
        name: "Agus Setiawan",
        role: "admin_ops",
        companyId: "comp_guci_01",
        isActive: true,
        wa: "081211223344",
        jabatan: "Supervisor Operasional",
    },
    administrator: {
        uid: "demo_admin_01",
        email: "hendra.admin@fieldwork.id",
        name: "Hendra Wijaya",
        role: "administrator",
        companyId: "comp_guci_01",
        isActive: true,
        wa: "081377889900",
        jabatan: "Director / Administrator",
    },
};

export function getStoredUser(): AppUser | null {
    try {
        const stored = localStorage.getItem("fieldwork_active_user");
        if (stored) return JSON.parse(stored);
    } catch {
        // ignore
    }
    return null;
}

export function setStoredUser(user: AppUser | null) {
    try {
        if (user) {
            localStorage.setItem("fieldwork_active_user", JSON.stringify(user));
        } else {
            localStorage.removeItem("fieldwork_active_user");
        }
    } catch {
        // ignore
    }
}

export function useAuth() {
    const { user, loading, setUser, setLoading } = useAuthStore();

    useEffect(() => {
        let mounted = true;

        async function fetchUserProfile(userId: string) {
            try {
                const { data: userData, error } = await supabase
                    .from("users")
                    .select("*, companies(status, subscription_plan)")
                    .eq("id", userId)
                    .single();

                if (error || !userData) {
                    return null;
                }

                let role: UserRole = "teknisi";
                switch (userData.role) {
                    case "SUPERADMIN": role = "super_admin"; break;
                    case "ADMIN_PERUSAHAAN": role = "administrator"; break;
                    case "MARKETING": role = "marketing"; break;
                    case "TEKNISI": role = "teknisi"; break;
                    case "SPV": role = "admin_ops"; break;
                    case "GUDANG": role = "admin_ops"; break;
                }

                const appUser: AppUser = {
                    uid: userData.id,
                    email: userData.email,
                    name: userData.name,
                    role: role,
                    companyId: userData.company_id,
                    isActive: userData.is_active,
                    wa: userData.phone,
                    jabatan: userData.role,
                };

                return appUser;
            } catch {
                return null;
            }
        }

        async function initAuth() {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                
                if (session?.user) {
                    const profile = await fetchUserProfile(session.user.id);
                    if (mounted && profile) {
                        setUser(profile);
                        setStoredUser(profile);
                        setLoading(false);
                        return;
                    }
                }
            } catch {
                // Supabase not reachable, proceed to local/fallback
            }

            // Check cached demo user or fallback to standard default
            const cached = getStoredUser();
            if (mounted) {
                if (cached) {
                    setUser(cached);
                } else {
                    // Default to Administrator so full ERP & FieldWork features are unlocked
                    setUser(DEMO_USERS.administrator);
                    setStoredUser(DEMO_USERS.administrator);
                }
                setLoading(false);
            }
        }

        initAuth();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (event === 'SIGNED_IN' && session?.user) {
                const profile = await fetchUserProfile(session.user.id);
                if (mounted && profile) {
                    setUser(profile);
                    setStoredUser(profile);
                }
            } else if (event === 'SIGNED_OUT') {
                if (mounted) {
                    setUser(null);
                    setStoredUser(null);
                }
            }
            if (mounted) setLoading(false);
        });

        return () => {
            mounted = false;
            subscription.unsubscribe();
        };
    }, [setUser, setLoading]);

    return { user, loading };
}
