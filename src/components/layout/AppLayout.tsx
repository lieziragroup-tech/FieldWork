import React from "react";
import { Outlet, Navigate, NavLink, useLocation } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
import { Sidebar } from "./Sidebar";
import { OfflineStatusBar } from "../common/OfflineStatusBar";
import { Loader2, HardHat, ClipboardList, FileText, Ruler, LayoutDashboard } from "lucide-react";
import { cn } from "../../lib/utils";

export function AppLayout() {
    const { user, loading } = useAuthStore();
    const location = useLocation();

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-900 flex items-center justify-center">
                <div className="text-center">
                    <Loader2 size={36} className="animate-spin text-emerald-500 mx-auto mb-3" />
                    <p className="text-slate-400 text-sm font-semibold tracking-wide">Memuat FIELDWORK...</p>
                </div>
            </div>
        );
    }

    if (!user) return <Navigate to="/login" replace />;
    if (user.role === "super_admin") return <Navigate to="/super-admin/companies" replace />;

    const isARMeasure = location.pathname === "/field/ar-measure";

    return (
        <div className="flex min-h-screen bg-slate-50 text-slate-900 font-sans">
            {!isARMeasure && <Sidebar />}

            <div className="flex-1 flex flex-col min-w-0">
                {/* Main Content Area */}
                <main className={cn(
                    "flex-1 min-w-0 overflow-x-hidden",
                    !isARMeasure && "pt-14 md:pt-0 pb-20 md:pb-6"
                )}>
                    <Outlet />
                </main>

                {/* Floating Offline / Sync Toast Notification */}
                <OfflineStatusBar />

                {/* Mobile Bottom Navigation Bar */}
                {!isARMeasure && (
                    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 flex items-center justify-around py-2 px-1 text-[10px] font-bold text-slate-400 shadow-2xl pb-safe">
                        <NavLink
                            to="/field/dashboard"
                            className={({ isActive }) => cn(
                                "flex flex-col items-center gap-1 py-1 px-2.5 rounded-xl transition-all",
                                isActive ? "text-emerald-400 scale-105" : "hover:text-slate-200"
                            )}
                        >
                            <HardHat size={18} />
                            <span>Lapangan</span>
                        </NavLink>

                        <NavLink
                            to="/field/jobs"
                            className={({ isActive }) => cn(
                                "flex flex-col items-center gap-1 py-1 px-2.5 rounded-xl transition-all",
                                isActive ? "text-emerald-400 scale-105" : "hover:text-slate-200"
                            )}
                        >
                            <ClipboardList size={18} />
                            <span>Tugas SPK</span>
                        </NavLink>

                        <NavLink
                            to="/quotations"
                            className={({ isActive }) => cn(
                                "flex flex-col items-center gap-1 py-1 px-2.5 rounded-xl transition-all",
                                isActive ? "text-emerald-400 scale-105" : "hover:text-slate-200"
                            )}
                        >
                            <FileText size={18} />
                            <span>Quotation</span>
                        </NavLink>

                        <NavLink
                            to="/field/ar-measure"
                            className={({ isActive }) => cn(
                                "flex flex-col items-center gap-1 py-1 px-2.5 rounded-xl transition-all",
                                isActive ? "text-emerald-400 scale-105" : "hover:text-slate-200"
                            )}
                        >
                            <Ruler size={18} />
                            <span>Meteran AR</span>
                        </NavLink>

                        <NavLink
                            to="/dashboard"
                            className={({ isActive }) => cn(
                                "flex flex-col items-center gap-1 py-1 px-2.5 rounded-xl transition-all",
                                isActive ? "text-blue-400 scale-105" : "hover:text-slate-200"
                            )}
                        >
                            <LayoutDashboard size={18} />
                            <span>Kantor ERP</span>
                        </NavLink>
                    </nav>
                )}
            </div>
        </div>
    );
}
