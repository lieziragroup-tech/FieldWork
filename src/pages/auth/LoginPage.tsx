import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { signInWithEmailAndPassword, signOut } from "../../lib/firebase";
import { doc, getDoc } from "../../lib/firebase";
import { auth, db } from "../../lib/firebase";
import { useAuthStore } from "../../store/authStore";
import { isCompanyActive } from "../../services/companyService";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { AlertCircle, Loader2, ShieldCheck, HardHat, Compass, Briefcase, UserCheck } from "lucide-react";
import type { AppUser } from "../../types";
import { DEMO_USERS, setStoredUser } from "../../hooks/useAuth";

export function LoginPage() {
    const navigate = useNavigate();
    const { setUser } = useAuthStore();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleQuickLogin = (demoKey: keyof typeof DEMO_USERS) => {
        const selected = DEMO_USERS[demoKey];
        setUser(selected);
        setStoredUser(selected);
        if (selected.role === "teknisi") {
            navigate("/field/dashboard");
        } else {
            navigate("/dashboard");
        }
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            // 1. Firebase Auth
            const credential = await signInWithEmailAndPassword(auth, email, password);
            const uid = credential.user.uid;

            // 2. Ambil data user dari Firestore
            const userSnap = await getDoc(doc(db, "users", uid));
            if (!userSnap.exists()) {
                await signOut(auth);
                setError("Data akun tidak ditemukan. Hubungi administrator.");
                return;
            }
            const userData = userSnap.data() as AppUser;

            // 3. Cek isActive user
            if (!userData.isActive) {
                await signOut(auth);
                setError("Akun Anda dinonaktifkan. Hubungi administrator perusahaan.");
                return;
            }

            // 4. Cek company aktif (skip untuk super_admin)
            if (userData.role !== "super_admin") {
                const companyOk = await isCompanyActive(userData.companyId);
                if (!companyOk) {
                    await signOut(auth);
                    setError("Langganan perusahaan Anda tidak aktif. Hubungi Super Admin.");
                    return;
                }
            }

            // 5. inject uid dari firebaseUser
            const finalUser = { ...userData, uid };
            setUser(finalUser);
            setStoredUser(finalUser);

            if (userData.role === "super_admin") {
                navigate("/super-admin/companies");
            } else if (userData.role === "teknisi") {
                navigate("/field/dashboard");
            } else {
                navigate("/dashboard");
            }
        } catch {
            setError("Email atau password salah. Silakan coba lagi atau gunakan Akses Demo di bawah.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                {/* Logo / Brand */}
                <div className="text-center mb-6">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 text-white mb-3 shadow-xl shadow-emerald-900/50">
                        <ShieldCheck size={36} />
                    </div>
                    <div className="flex items-center justify-center gap-2">
                        <h1 className="text-2xl font-black tracking-tight text-white">FIELDWORK</h1>
                        <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            Pest ERP
                        </span>
                    </div>
                    <p className="text-slate-400 text-xs sm:text-sm mt-1">
                        Sistem Dokumentasi Lapangan, Penugasan SPK & ERP Pest Control
                    </p>
                </div>

                {/* Form Card */}
                <div className="bg-white rounded-3xl shadow-2xl p-6 sm:p-7 border border-slate-100">
                    <form onSubmit={handleLogin} className="space-y-4">
                        <div className="space-y-1">
                            <Label htmlFor="email" className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                                Email Pengguna
                            </Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="nama@perusahaan.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="h-11 text-sm rounded-xl border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition-all"
                                autoComplete="email"
                            />
                        </div>

                        <div className="space-y-1">
                            <Label htmlFor="password" className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                                Kata Sandi
                            </Label>
                            <Input
                                id="password"
                                type="password"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="h-11 text-sm rounded-xl border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition-all"
                                autoComplete="current-password"
                            />
                        </div>

                        {error && (
                            <div className="flex items-start gap-2 text-red-600 bg-red-50 border border-red-200 rounded-xl p-3 text-xs">
                                <AlertCircle size={16} className="shrink-0 mt-0.5" />
                                <span>{error}</span>
                            </div>
                        )}

                        <Button
                            type="submit"
                            className="w-full h-11 text-sm font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white transition-all shadow-md shadow-emerald-600/30 active:scale-[0.98]"
                            disabled={loading}
                        >
                            {loading ? (
                                <><Loader2 size={16} className="animate-spin mr-2" /> Masuk ke Sistem...</>
                            ) : (
                                "Masuk dengan Email"
                            )}
                        </Button>
                    </form>

                    {/* Quick Demo Switcher */}
                    <div className="mt-6 pt-5 border-t border-slate-100">
                        <div className="text-center mb-3">
                            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                                Atau Masuk Instan (Mode Demo)
                            </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <button
                                type="button"
                                onClick={() => handleQuickLogin("teknisi")}
                                className="p-2.5 rounded-xl border border-emerald-200 bg-emerald-50/50 hover:bg-emerald-100/60 text-emerald-900 text-xs font-medium flex items-center gap-2 transition-all text-left"
                            >
                                <HardHat size={18} className="text-emerald-600 shrink-0" />
                                <div className="truncate">
                                    <div className="font-bold">Teknisi Lapangan</div>
                                    <div className="text-[10px] text-emerald-700 truncate">Eksekusi SPK, GPS, AR</div>
                                </div>
                            </button>

                            <button
                                type="button"
                                onClick={() => handleQuickLogin("marketing")}
                                className="p-2.5 rounded-xl border border-blue-200 bg-blue-50/50 hover:bg-blue-100/60 text-blue-900 text-xs font-medium flex items-center gap-2 transition-all text-left"
                            >
                                <Compass size={18} className="text-blue-600 shrink-0" />
                                <div className="truncate">
                                    <div className="font-bold">Marketing / Surveyor</div>
                                    <div className="text-[10px] text-blue-700 truncate">Survey & Quotation</div>
                                </div>
                            </button>

                            <button
                                type="button"
                                onClick={() => handleQuickLogin("admin_ops")}
                                className="p-2.5 rounded-xl border border-amber-200 bg-amber-50/50 hover:bg-amber-100/60 text-amber-900 text-xs font-medium flex items-center gap-2 transition-all text-left"
                            >
                                <Briefcase size={18} className="text-amber-600 shrink-0" />
                                <div className="truncate">
                                    <div className="font-bold">Admin Operasional</div>
                                    <div className="text-[10px] text-amber-700 truncate">Status PH & Tracking</div>
                                </div>
                            </button>

                            <button
                                type="button"
                                onClick={() => handleQuickLogin("administrator")}
                                className="p-2.5 rounded-xl border border-purple-200 bg-purple-50/50 hover:bg-purple-100/60 text-purple-900 text-xs font-medium flex items-center gap-2 transition-all text-left"
                            >
                                <UserCheck size={18} className="text-purple-600 shrink-0" />
                                <div className="truncate">
                                    <div className="font-bold">Administrator / Direksi</div>
                                    <div className="text-[10px] text-purple-700 truncate">Akses Penuh Semua Modul</div>
                                </div>
                            </button>
                        </div>
                    </div>
                </div>

                <p className="text-center text-xs text-slate-400 mt-5">
                    FIELDWORK System • Terintegrasi Offline-Ready & Geolocation
                </p>
            </div>
        </div>
    );
}
