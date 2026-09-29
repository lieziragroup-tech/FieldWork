/**
 * Sidebar — FIELDWORK & ERP Integration
 */

import React, { useState, useMemo, useEffect } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { signOut } from "../../lib/firebase";
import { auth } from "../../lib/firebase";
import { useAuthStore } from "../../store/authStore";
import type { UserRole } from "../../types";
import { ROLE_LABELS, cn } from "../../lib/utils";
import { DEMO_USERS, setStoredUser } from "../../hooks/useAuth";
import {
    Send, ClipboardList, LayoutDashboard, FileText, Users,
    DollarSign, Settings, LogOut, ShieldCheck,
    TrendingUp, User, Hash, Menu, X, ChevronRight,
    ShoppingBag, BarChart3, Cog, UserCircle,
    HardHat, MapPin, Ruler, CheckCircle2, ChevronDown
} from "lucide-react";

// ─── TYPES ────────────────────────────────────────────────────────────────────

interface NavItem {
    to: string;
    icon: React.ReactNode;
    label: string;
    roles: UserRole[];
    badge?: string;
}

interface NavGroupDef {
    type: "group";
    label: string;
    icon: React.ReactNode;
    items: NavItem[];
}

interface NavStandalone extends NavItem {
    type?: undefined;
}

type NavSection = NavGroupDef | NavStandalone;

// ─── NAV STRUCTURE ────────────────────────────────────────────────────────────

const NAV_SECTIONS: NavSection[] = [
    {
        type: "group",
        label: "Operasional Lapangan",
        icon: <HardHat size={16} />,
        items: [
            { to: "/field/dashboard", icon: <MapPin size={15} />, label: "Dashboard Lapangan", roles: ["administrator", "admin_ops", "marketing", "teknisi"], badge: "GPS" },
            { to: "/field/jobs", icon: <ClipboardList size={15} />, label: "Tugas & SPK Kerja", roles: ["administrator", "admin_ops", "marketing", "teknisi"] },
            { to: "/field/ar-measure", icon: <Ruler size={15} />, label: "Meteran Kamera AR", roles: ["administrator", "admin_ops", "marketing", "teknisi"], badge: "SNI" },
        ],
    },
    {
        to: "/dashboard",
        icon: <LayoutDashboard size={17} />,
        label: "Dashboard ERP",
        roles: ["administrator", "admin_ops", "marketing", "teknisi"],
    },
    {
        type: "group",
        label: "Penjualan & Penawaran",
        icon: <ShoppingBag size={16} />,
        items: [
            { to: "/quotations", icon: <FileText size={15} />, label: "Quotation / Surat", roles: ["administrator", "marketing", "admin_ops"] },
            { to: "/status-ph", icon: <Send size={15} />, label: "Status Penawaran", roles: ["administrator", "admin_ops"] },
            { to: "/tracking", icon: <ClipboardList size={15} />, label: "Tracking Order", roles: ["administrator", "admin_ops"] },
        ],
    },
    {
        type: "group",
        label: "Klien & Pelanggan",
        icon: <Users size={16} />,
        items: [
            { to: "/customers", icon: <Users size={15} />, label: "Data Pelanggan", roles: ["administrator", "admin_ops", "marketing"] },
        ],
    },
    {
        type: "group",
        label: "Laporan & Dokumen",
        icon: <BarChart3 size={16} />,
        items: [
            { to: "/cashflow", icon: <DollarSign size={15} />, label: "Cashflow", roles: ["administrator"] },
            { to: "/performance", icon: <TrendingUp size={15} />, label: "Performa Tim", roles: ["administrator"] },
            { to: "/nomor-surat-log", icon: <Hash size={15} />, label: "Log Nomor Surat", roles: ["administrator", "admin_ops"] },
        ],
    },
    {
        type: "group",
        label: "Manajemen & Tim",
        icon: <Cog size={16} />,
        items: [
            { to: "/team", icon: <Users size={15} />, label: "Tim & Teknisi", roles: ["administrator"] },
            { to: "/settings", icon: <Settings size={15} />, label: "Pengaturan Sistem", roles: ["administrator"] },
        ],
    },
    {
        type: "group",
        label: "Akun Pengguna",
        icon: <UserCircle size={16} />,
        items: [
            { to: "/profile", icon: <User size={15} />, label: "Profil Saya", roles: ["administrator", "admin_ops", "marketing", "teknisi"] },
        ],
    },
];

function getActiveGroup(pathname: string): string | null {
    for (const section of NAV_SECTIONS) {
        if (section.type === "group") {
            if ((section as NavGroupDef).items.some(i => pathname.startsWith(i.to))) {
                return section.label;
            }
        }
    }
    return null;
}

export function SidebarContent({ onNavClick }: { onNavClick?: () => void }) {
    const { user, setUser } = useAuthStore();
    const navigate = useNavigate();
    const location = useLocation();

    const [openGroups, setOpenGroups] = useState<Set<string>>(() => {
        const ag = getActiveGroup(location.pathname);
        return new Set(ag ? [ag, "Operasional Lapangan"] : ["Operasional Lapangan"]);
    });

    const [showRoleSelector, setShowRoleSelector] = useState(false);

    useEffect(() => {
        const ag = getActiveGroup(location.pathname);
        if (ag) {
            setOpenGroups(prev => {
                if (prev.has(ag)) return prev;
                return new Set([...prev, ag]);
            });
        }
    }, [location.pathname]);

    const toggleGroup = (label: string) => {
        setOpenGroups(prev => {
            const next = new Set(prev);
            if (next.has(label)) next.delete(label);
            else next.add(label);
            return next;
        });
    };

    const handleSwitchRole = (key: keyof typeof DEMO_USERS) => {
        const target = DEMO_USERS[key];
        setUser(target);
        setStoredUser(target);
        setShowRoleSelector(false);
        if (target.role === "teknisi") {
            navigate("/field/dashboard");
        }
        if (onNavClick) onNavClick();
    };

    const handleLogout = async () => {
        await signOut(auth);
        setUser(null);
        setStoredUser(null);
        navigate("/login");
    };

    return (
        <div className="flex flex-col h-full bg-slate-900 text-slate-100">
            {/* ── Brand ──────────────────────────────────────────────────────── */}
            <div className="flex items-center gap-3 px-4 h-16 border-b border-slate-800 shrink-0 bg-slate-950/60">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center shrink-0 shadow-md shadow-emerald-950">
                    <ShieldCheck size={19} className="text-white" />
                </div>
                <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                        <span className="text-[14px] font-black text-white leading-tight tracking-wider">FIELDWORK</span>
                        <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            ERP
                        </span>
                    </div>
                    <p className="text-[10px] text-slate-400 leading-tight mt-0.5 truncate">Pest & Termite Control</p>
                </div>
            </div>

            {/* ── Quick Mode Pill ────────────────────────────────────────────── */}
            <div className="p-3 border-b border-slate-800/80 bg-slate-900/80">
                <div className="grid grid-cols-2 gap-1 bg-slate-950 p-1 rounded-xl text-[11px] font-bold">
                    <NavLink
                        to="/field/dashboard"
                        onClick={onNavClick}
                        className={({ isActive }) => cn(
                            "py-1.5 px-2 text-center rounded-lg transition-all flex items-center justify-center gap-1.5",
                            location.pathname.startsWith("/field")
                                ? "bg-emerald-600 text-white shadow-sm"
                                : "text-slate-400 hover:text-white"
                        )}
                    >
                        <HardHat size={13} />
                        <span>Lapangan</span>
                    </NavLink>

                    <NavLink
                        to="/dashboard"
                        onClick={onNavClick}
                        className={({ isActive }) => cn(
                            "py-1.5 px-2 text-center rounded-lg transition-all flex items-center justify-center gap-1.5",
                            !location.pathname.startsWith("/field")
                                ? "bg-slate-800 text-white shadow-sm"
                                : "text-slate-400 hover:text-white"
                        )}
                    >
                        <LayoutDashboard size={13} />
                        <span>Kantor ERP</span>
                    </NavLink>
                </div>
            </div>

            {/* ── Scrollable nav ─────────────────────────────────────────────── */}
            <nav
                className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5"
                style={{ scrollbarWidth: "none" }}
            >
                {NAV_SECTIONS.map((section, idx) => {
                    // Standalone item
                    if (section.type !== "group") {
                        const item = section as NavStandalone;
                        if (!user || !item.roles.includes(user.role)) return null;
                        return (
                            <NavLink
                                key={item.to}
                                to={item.to}
                                onClick={onNavClick}
                                className={({ isActive }) => cn(
                                    "flex items-center gap-3 h-9 px-3 rounded-xl text-[13px] font-medium transition-all duration-150 group",
                                    isActive
                                        ? "bg-emerald-600 text-white font-semibold shadow-sm shadow-emerald-950"
                                        : "text-slate-300 hover:bg-slate-800 hover:text-white"
                                )}
                            >
                                {({ isActive }) => (
                                    <>
                                        <span className={cn(
                                            "shrink-0 transition-colors",
                                            isActive ? "text-white" : "text-slate-400 group-hover:text-slate-200"
                                        )}>
                                            {item.icon}
                                        </span>
                                        <span className="truncate flex-1">{item.label}</span>
                                        {item.badge && (
                                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                                                {item.badge}
                                            </span>
                                        )}
                                    </>
                                )}
                            </NavLink>
                        );
                    }

                    // Group item
                    const group = section as NavGroupDef;
                    const visibleItems = group.items.filter(i => user && i.roles.includes(user.role));
                    if (visibleItems.length === 0) return null;

                    const isOpen = openGroups.has(group.label);
                    const hasActive = visibleItems.some(i => location.pathname.startsWith(i.to));

                    return (
                        <div key={`group-${idx}`} className="mt-1.5 first:mt-0">
                            {/* Group toggle button */}
                            <button
                                onClick={() => toggleGroup(group.label)}
                                className={cn(
                                    "w-full flex items-center gap-2.5 h-8 px-3 rounded-lg text-left transition-all duration-150 select-none",
                                    isOpen
                                        ? "text-slate-200"
                                        : hasActive
                                        ? "text-emerald-400 font-semibold"
                                        : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
                                )}
                            >
                                <span className={cn(
                                    "shrink-0 transition-colors",
                                    hasActive ? "text-emerald-400" : "text-slate-400"
                                )}>
                                    {group.icon}
                                </span>

                                <span className="flex-1 text-[11px] font-bold uppercase tracking-wider truncate">
                                    {group.label}
                                </span>

                                {hasActive && !isOpen && (
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                                )}

                                <ChevronRight
                                    size={13}
                                    className={cn(
                                        "shrink-0 text-slate-500 transition-transform duration-200",
                                        isOpen ? "rotate-90" : ""
                                    )}
                                />
                            </button>

                            {/* Sub-items */}
                            <div
                                className="overflow-hidden transition-all duration-200 ease-in-out"
                                style={{ maxHeight: isOpen ? `${visibleItems.length * 44}px` : "0px" }}
                            >
                                <div className="mt-0.5 ml-3.5 pl-2.5 border-l border-slate-800 space-y-0.5 pb-1">
                                    {visibleItems.map(item => (
                                        <NavLink
                                            key={item.to}
                                            to={item.to}
                                            onClick={onNavClick}
                                            className={({ isActive }) => cn(
                                                "flex items-center gap-2.5 h-8 px-2.5 rounded-lg text-[12px] font-medium transition-all duration-150",
                                                isActive
                                                    ? "bg-emerald-600 text-white font-semibold shadow-sm"
                                                    : "text-slate-300 hover:bg-slate-800 hover:text-white"
                                            )}
                                        >
                                            {({ isActive }) => (
                                                <>
                                                    <span className={cn(
                                                        "shrink-0 transition-colors",
                                                        isActive ? "text-white" : "text-slate-400"
                                                    )}>
                                                        {item.icon}
                                                    </span>
                                                    <span className="truncate flex-1">{item.label}</span>
                                                    {item.badge && (
                                                        <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300">
                                                            {item.badge}
                                                        </span>
                                                    )}
                                                </>
                                            )}
                                        </NavLink>
                                    ))}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </nav>

            {/* ── User & Quick Switcher ───────────────────────────────────────── */}
            <div className="shrink-0 p-2.5 border-t border-slate-800 bg-slate-950/70 space-y-2">
                {/* Role Switcher Popover */}
                {showRoleSelector && (
                    <div className="p-2 bg-slate-900 rounded-xl border border-slate-700 text-xs space-y-1 mb-2 animate-in slide-in-from-bottom-2">
                        <div className="text-[10px] uppercase font-bold text-slate-400 px-2 py-1">
                            Ganti Peran Pengguna (Demo):
                        </div>
                        {(Object.keys(DEMO_USERS) as Array<keyof typeof DEMO_USERS>).map((key) => {
                            const u = DEMO_USERS[key];
                            const isCurrent = user?.role === u.role;
                            return (
                                <button
                                    key={key}
                                    onClick={() => handleSwitchRole(key)}
                                    className={`w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between text-xs transition-colors ${
                                        isCurrent
                                            ? "bg-emerald-600 text-white font-bold"
                                            : "hover:bg-slate-800 text-slate-300"
                                    }`}
                                >
                                    <span>{u.name} ({u.role})</span>
                                    {isCurrent && <CheckCircle2 size={13} />}
                                </button>
                            );
                        })}
                    </div>
                )}

                <div className="flex items-center justify-between gap-2 p-1.5 rounded-xl bg-slate-900/90 border border-slate-800">
                    <button
                        onClick={() => setShowRoleSelector(!showRoleSelector)}
                        className="flex items-center gap-2 min-w-0 text-left hover:opacity-80 transition-opacity"
                        title="Klik untuk ganti peran / demo mode"
                    >
                        <div className="w-8 h-8 rounded-lg bg-emerald-700 text-white flex items-center justify-center font-bold text-xs shrink-0">
                            {user?.name?.[0] || "U"}
                        </div>
                        <div className="min-w-0">
                            <div className="text-xs font-bold text-white truncate flex items-center gap-1">
                                {user?.name || "Pengguna"}
                                <ChevronDown size={11} className="text-slate-400 shrink-0" />
                            </div>
                            <div className="text-[10px] text-emerald-400 truncate">
                                {ROLE_LABELS[user?.role || "teknisi"]}
                            </div>
                        </div>
                    </button>

                    <button
                        onClick={handleLogout}
                        className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-red-400 transition-colors shrink-0"
                        title="Keluar"
                    >
                        <LogOut size={16} />
                    </button>
                </div>
            </div>
        </div>
    );
}

export function Sidebar() {
    const [mobileOpen, setMobileOpen] = useState(false);

    return (
        <>
            {/* Desktop Sticky Sidebar */}
            <aside className="hidden md:flex flex-col w-64 shrink-0 h-screen sticky top-0 border-r border-slate-800 z-30 shadow-xl">
                <SidebarContent />
            </aside>

            {/* Mobile Topbar */}
            <div className="md:hidden fixed top-0 left-0 right-0 h-14 bg-slate-900 border-b border-slate-800 z-40 flex items-center justify-between px-3">
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setMobileOpen(true)}
                        className="p-2 rounded-xl text-slate-300 hover:bg-slate-800 transition-colors"
                        aria-label="Buka Menu"
                    >
                        <Menu size={20} />
                    </button>
                    <div className="flex items-center gap-1.5">
                        <div className="w-7 h-7 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-bold text-xs">
                            <ShieldCheck size={16} />
                        </div>
                        <span className="font-black text-sm text-white tracking-wide">FIELDWORK</span>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <NavLink
                        to="/field/dashboard"
                        className={({ isActive }) => cn(
                            "px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1",
                            isActive ? "bg-emerald-600 text-white" : "bg-slate-800 text-slate-300"
                        )}
                    >
                        <HardHat size={13} /> Lapangan
                    </NavLink>
                </div>
            </div>

            {/* Mobile Drawer Backdrop */}
            {mobileOpen && (
                <div
                    className="md:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
                    onClick={() => setMobileOpen(false)}
                />
            )}

            {/* Mobile Drawer Panel */}
            <div
                className={cn(
                    "md:hidden fixed inset-y-0 left-0 z-50 w-72 bg-slate-900 transition-transform duration-300 ease-in-out shadow-2xl flex flex-col",
                    mobileOpen ? "translate-x-0" : "-translate-x-full"
                )}
            >
                <div className="p-3 border-b border-slate-800 flex justify-between items-center bg-slate-950">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Navigasi Lengkap</span>
                    <button
                        onClick={() => setMobileOpen(false)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                    >
                        <X size={18} />
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto">
                    <SidebarContent onNavClick={() => setMobileOpen(false)} />
                </div>
            </div>
        </>
    );
}
