"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import {
    BarChart3,
    CalendarDays,
    ChevronDown,
    CircleDollarSign,
    CookingPot,
    LayoutDashboard,
    LogOut,
    Menu,
    Settings,
    ShieldCheck,
    Sparkles,
    Users,
    X,
} from "lucide-react";
import { useState } from "react";
import { hasFullAccess, roleLabels } from "@/auth/authConfig";
import type { AuthenticatedUser } from "@/auth/authTypes";
import { useDashboardSummary, useShellData } from "@/hooks/useDashboardData";
import { WorkspaceView } from "@/components/dashboard/WorkspaceViews";
import { GoogleTranslateControl } from "@/components/layout/GoogleTranslateControl";
import { formatCurrency } from "@/lib/formatters";
import { ProfileEditor } from "@/components/layout/ProfileEditor";
import { ThemePicker } from "@/components/layout/ThemePicker";
import { MessProfileEditor } from "@/components/layout/MessProfileEditor";

type AppShellProps = {
    user: AuthenticatedUser;
    onSignOut: () => void;
};

const allNavigation = [
    { label: "Dashboard", icon: LayoutDashboard },
    { label: "Users", icon: Users },
    { label: "Meals", icon: CookingPot },
    { label: "Guest Meals", icon: CalendarDays },
    { label: "Expenses", icon: CircleDollarSign },
    { label: "Reports", icon: BarChart3 },
    { label: "Settings", icon: Settings },
];

const memberNavigation = [
    { label: "Dashboard", icon: LayoutDashboard },
    { label: "My Details", icon: Users },
    { label: "Meals", icon: CookingPot },
    { label: "Guest Meals", icon: CalendarDays },
    { label: "Expense Summary", icon: CircleDollarSign },
    { label: "Reports", icon: BarChart3 },
];

export function AppShell({ user, onSignOut }: AppShellProps) {
    const [activeView, setActiveView] = useState("Dashboard");
    const [mobileOpen, setMobileOpen] = useState(false);
    const [profileOpen, setProfileOpen] = useState(false);
    // The two documents the chrome itself shows, read once per session.
    const shell = useShellData();
    // The dashboard's own totals, asked for only while the dashboard is on screen.
    const summary = useDashboardSummary(user, activeView === "Dashboard");
    const fullAccess = hasFullAccess(user.role);
    const navigation = fullAccess ? allNavigation : memberNavigation;
    const totalExpenses = summary.expenses.total;
    const todayMeals = summary.meals.todayLunch + summary.meals.todayDinner;

    // Nothing else is rendered until the sidebar has something to name.
    if (shell.status === "loading") {
        return <main className="route-loading" aria-label="Loading BhuriBhoj"><div className="loading-mark">B</div><div className="loading-line loading-line-wide" /><div className="loading-line" /></main>;
    }

    if (shell.status === "error") {
        return <main className="route-loading" aria-label="BhuriBhoj data error"><h1>Could not load the data files</h1><p>{shell.error}</p></main>;
    }

    return (
        <div className="app-shell">
            <aside className={`sidebar ${mobileOpen ? "sidebar-open" : ""}`}>
                <div className="sidebar-topline">
                    <div className="brand-lockup">
                        <div className="brand-mark brand-mark-small">B</div>
                        <div><strong>BhuriBhoj</strong><span>MESS / 01</span></div>
                    </div>
                    <button className="icon-button mobile-close" onClick={() => setMobileOpen(false)} aria-label="Close navigation">
                        <X size={20} />
                    </button>
                </div>
                <div className="mess-switcher">
                    <span className="status-dot" />
                    <div><span>Current mess</span><strong>{shell.mess.name}</strong></div>
                    <ChevronDown size={16} />
                </div>
                <nav className="main-nav" aria-label="Main navigation">
                    <span className="nav-caption">Workspace</span>
                    {navigation.map((item) => {
                        const Icon = item.icon;
                        const selected = activeView === item.label;
                        return (
                            <button
                                key={item.label}
                                className={`nav-item ${selected ? "nav-item-active" : ""}`}
                                onClick={() => { setActiveView(item.label); setMobileOpen(false); }}
                            >
                                <Icon size={18} />
                                <span>{item.label}</span>
                                {selected && <span className="nav-indicator" />}
                            </button>
                        );
                    })}
                </nav>
                <div className="sidebar-bottom">
                    <div className="sidebar-tip"><Sparkles size={17} /><span>September is looking organised.</span></div>
                    <button className="logout-button" onClick={onSignOut}><LogOut size={17} /> Sign out</button>
                </div>
            </aside>

            <div className="shell-main">
                <header className="topbar">
                    <button className="icon-button mobile-menu" onClick={() => setMobileOpen(true)} aria-label="Open navigation"><Menu size={21} /></button>
                    <div className="breadcrumb"><span>Workspace</span><span>/</span><strong>{activeView}</strong></div>
                    <div className="topbar-profile">
                        <GoogleTranslateControl />
                        <div className="profile-copy"><strong>{user.name}</strong><span>{roleLabels[user.role]}</span></div>
                        <button className="avatar avatar-button" onClick={() => setProfileOpen(true)} aria-label="Edit profile">{user.image_url ? <Image src={user.image_url} alt="" width={34} height={34} unoptimized /> : user.name.charAt(0)}</button>
                    </div>
                </header>

                <main className="workspace-content">
                    <motion.div
                        key={activeView}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.25 }}
                    >
                        <div className="page-heading">
                            <div><p className="eyebrow">{shell.mess.month}</p><h1>{activeView}</h1><p>{activeView === "Dashboard" ? "A clear view of what is happening around the mess." : `${activeView} is ready for the next layer of the BhuriBhoj workspace.`}</p></div>
                            <div className="heading-actions">
                                <span className="access-pill">
                                    <ShieldCheck size={15} />
                                    {fullAccess ? "Full access" : "View only"}
                                </span>
                            </div>
                        </div>

                        {activeView === "Dashboard" ? (
                            <>
                                <section className="welcome-panel">
                                    <div><span className="welcome-kicker">Good morning, {user.name.split(" ")[0]}</span><h2>{fullAccess ? "The table is set." : "Your mess, at a glance."}</h2><p>{fullAccess ? "Keep the shared rhythm visible, one day at a time." : "Everything you need to follow your meals and shared mess activity."}</p></div>
                                    <div className="welcome-stamp"><span>{summary.meals.total}</span><small>meals logged<br />in your view</small></div>
                                </section>
                                <section className="stats-grid">
                                    <StatCard label={fullAccess ? "Total users" : "My meals logged"} value={fullAccess ? String(summary.users.total) : String(summary.meals.total)} detail={fullAccess ? "Every registered user" : "Lunch & dinner"} icon={<Users size={19} />} />
                                    <StatCard label={fullAccess ? "Active users" : "My guest meals"} value={fullAccess ? String(summary.users.active) : String(summary.guestMeals.total)} detail={fullAccess ? "Currently active" : "Confirmed this month"} icon={<Users size={19} />} />
                                    <StatCard label="Today's meals" value={String(fullAccess ? todayMeals : summary.meals.todayAll)} detail={`Lunch ${summary.meals.todayLunch} · Dinner ${summary.meals.todayDinner}`} icon={<CookingPot size={19} />} />
                                    <StatCard label="Guest meals" value={String(summary.guestMeals.total)} detail="Confirmed this month" icon={<CalendarDays size={19} />} />
                                    <StatCard label="Monthly expenses" value={formatCurrency(totalExpenses)} detail={`Fixed ${formatCurrency(summary.expenses.fixed)} · Market ${formatCurrency(summary.expenses.market)}`} icon={<CircleDollarSign size={19} />} />
                                </section>
                                <section className="dashboard-grid">
                                    <div className="content-panel"><div className="panel-header"><div><span className="panel-eyebrow">Recent activity</span><h3>Latest meal entries</h3></div><button className="text-button" onClick={() => setActiveView("Meals")}>View all</button></div><div className="activity-list">{summary.meals.recent.map((meal) => <div className="activity-row" key={meal.id}><div className={`activity-icon ${meal.mealType}`}><CookingPot size={17} /></div><div><strong>{meal.mealType === "lunch" ? "Lunch" : "Dinner"} marked as taken</strong><span>{meal.date} · {meal.memberId}</span></div><span className="row-status">Logged</span></div>)}</div></div>
                                    <div className="content-panel quiet-panel"><div className="panel-header"><div><span className="panel-eyebrow">Mess pulse</span><h3>At a glance</h3></div><BarChart3 size={19} /></div><div className="pulse-line"><span>Guest thalis</span><strong>{summary.guestMeals.total}</strong></div><div className="pulse-line"><span>Fixed expenses</span><strong>{formatCurrency(summary.expenses.fixed)}</strong></div><div className="pulse-line"><span>Market / bazar</span><strong>{formatCurrency(summary.expenses.market)}</strong></div><div className="permission-note"><ShieldCheck size={16} /><span>{fullAccess ? "You can manage this workspace." : "Your account has view-only access."}</span></div></div>
                                </section>
                            </>
                            ) : <>{activeView === "Settings" && <><ThemePicker role={user.role} /><MessProfileEditor mess={shell.mess} role={user.role} /></>}<WorkspaceView view={activeView} user={user} mess={shell.mess} settings={shell.settings} /></>}
                        
                    </motion.div>
                </main>
            </div>
            {profileOpen && <ProfileEditor user={user} onClose={() => setProfileOpen(false)} />}
        </div>
    );
}

function StatCard({ label, value, detail, icon }: { label: string; value: string; detail: string; icon: React.ReactNode }) {
    return <article className="stat-card"><div className="stat-icon">{icon}</div><span>{label}</span><strong>{value}</strong><small>{detail}</small></article>;
}
