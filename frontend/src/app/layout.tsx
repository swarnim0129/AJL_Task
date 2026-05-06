"use client";
import { useState, useEffect, createContext, useContext } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { userApi, notificationApi } from "@/lib/api";
import { Newspaper, User, Users, Link as LinkIcon, MessageSquare, Bell, Settings, Bookmark, ArrowRightLeft, Menu, LogOut, ChevronDown } from "lucide-react";
import "./globals.css";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar_url?: string;
  company?: string;
  [key: string]: any;
}

interface AppContextType {
  currentUser: User | null;
  setCurrentUser: (u: User | null) => void;
  users: User[];
  refreshUsers: () => void;
  unreadCount: number;
  refreshNotifications: () => void;
}

const AppContext = createContext<AppContextType>({
  currentUser: null,
  setCurrentUser: () => {},
  users: [],
  refreshUsers: () => {},
  unreadCount: 0,
  refreshNotifications: () => {},
});

export const useApp = () => useContext(AppContext);

function NavIcon({ name }: { name: string }) {
  const icons: Record<string, any> = {
    feed: Newspaper, profile: User, referrals: LinkIcon, connections: Users,
    messages: MessageSquare, notifications: Bell, admin: Settings, switch: ArrowRightLeft, saved: Bookmark,
  };
  const Icon = icons[name] || Newspaper;
  return <Icon className="nav-icon" size={20} />;
}

function Sidebar({ currentUser }: { currentUser: User | null }) {
  const pathname = usePathname();
  const role = currentUser?.role || "student";

  const studentNav = [
    { href: "/", label: "Feed", icon: "feed" },
    { href: `/profile/${currentUser?.id || ""}`, label: "My Profile", icon: "profile" },
    { href: "/referrals", label: "Referral Requests", icon: "referrals" },
    { href: "/connections", label: "Connections", icon: "connections" },
    { href: "/messages", label: "Messages", icon: "messages" },
    { href: "/notifications", label: "Notifications", icon: "notifications" },
    { href: "/saved", label: "Saved Posts", icon: "saved" },
  ];

  const alumniNav = [
    { href: "/", label: "Feed", icon: "feed" },
    { href: `/profile/${currentUser?.id || ""}`, label: "My Profile", icon: "profile" },
    { href: "/referrals", label: "Referral Requests", icon: "referrals" },
    { href: "/connections", label: "Connections", icon: "connections" },
    { href: "/messages", label: "Messages", icon: "messages" },
    { href: "/notifications", label: "Notifications", icon: "notifications" },
  ];

  const adminNav = [
    { href: "/", label: "Feed", icon: "feed" },
    { href: "/admin", label: "Admin Panel", icon: "admin" },
    { href: "/notifications", label: "Notifications", icon: "notifications" },
  ];

  const navItems = role === "admin" ? adminNav : role === "alumni" ? alumniNav : studentNav;
  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <h1>DJS Connect</h1>
        <span>Alumni–Student Platform</span>
      </div>
      <nav className="sidebar-nav">
        <div className="nav-section">
          <div className="nav-section-title">Menu</div>
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} className={`nav-item ${isActive(item.href) ? "active" : ""}`}>
              <NavIcon name={item.icon} />
              {item.label}
            </Link>
          ))}
        </div>
        {role === "student" && (
          <div className="nav-section">
            <div className="nav-section-title">Settings</div>
            <Link href="/switch-alumni" className={`nav-item ${isActive("/switch-alumni") ? "active" : ""}`}>
              <NavIcon name="switch" />
              Switch to Alumni
            </Link>
          </div>
        )}
      </nav>
      <div className="sidebar-footer">
        {currentUser && (
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div className="avatar avatar-sm">
              <img src={currentUser.avatar_url || `https://api.dicebear.com/9.x/initials/svg?seed=${currentUser.name}`} alt="" />
            </div>
            <div>
              <div style={{ fontSize: "0.8rem", fontWeight: 600 }}>{currentUser.name}</div>
              <div style={{ fontSize: "0.7rem", color: "var(--text-tertiary)", textTransform: "capitalize" }}>{currentUser.role}</div>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}

function UserSwitcher({ users, currentUser, onSwitch }: { users: User[]; currentUser: User | null; onSwitch: (u: User) => void }) {
  const [open, setOpen] = useState(false);
  const grouped = {
    student: users.filter((u) => u.role === "student"),
    alumni: users.filter((u) => u.role === "alumni"),
    admin: users.filter((u) => u.role === "admin"),
  };

  return (
    <div className="user-switcher" onClick={() => setOpen(!open)}>
      <div className="avatar avatar-sm">
        <img src={currentUser?.avatar_url || ""} alt="" />
      </div>
      <div>
        <div className="user-switcher-name">{currentUser?.name || "Select User"}</div>
        <div className="user-switcher-role">{currentUser?.role || ""}</div>
      </div>
      <ChevronDown size={14} style={{ color: "var(--text-tertiary)" }} />
      {open && (
        <div className="user-switcher-dropdown" onClick={(e) => e.stopPropagation()}>
          {(["student", "alumni", "admin"] as const).map((role) => (
            <div key={role}>
              <div className="dropdown-header">{role}s ({grouped[role].length})</div>
              {grouped[role].map((u) => (
                <div key={u.id} className={`dropdown-item ${currentUser?.id === u.id ? "selected" : ""}`}
                  onClick={() => { onSwitch(u); setOpen(false); }}>
                  <div className="avatar avatar-sm"><img src={u.avatar_url || ""} alt="" /></div>
                  <div>
                    <div style={{ fontSize: "0.8rem", fontWeight: 600 }}>{u.name}</div>
                    <div style={{ fontSize: "0.7rem", color: "var(--text-tertiary)" }}>{u.company || u.branch || u.email}</div>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function TopBar({ title, users, currentUser, onSwitch, unreadCount }: { title: string; users: User[]; currentUser: User | null; onSwitch: (u: User) => void; unreadCount: number }) {
  return (
    <header className="topbar">
      <div className="topbar-left">
        <h2>{title}</h2>
      </div>
      <div className="topbar-right">
        <Link href="/notifications" className="btn-icon" style={{ position: "relative" }}>
          <Bell size={20} />
          {unreadCount > 0 && (
            <span style={{ position: "absolute", top: "-2px", right: "-2px", background: "var(--accent-danger)", color: "white", fontSize: "0.6rem", fontWeight: 700, minWidth: 16, height: 16, borderRadius: "var(--radius-full)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              {unreadCount}
            </span>
          )}
        </Link>
        <UserSwitcher users={users} currentUser={currentUser} onSwitch={onSwitch} />
      </div>
    </header>
  );
}

const pageTitles: Record<string, string> = {
  "/": "Feed",
  "/referrals": "Referral Requests",
  "/connections": "Connections",
  "/messages": "Messages",
  "/notifications": "Notifications",
  "/admin": "Admin Panel",
  "/switch-alumni": "Switch to Alumni",
  "/saved": "Saved Posts",
  "/profile/edit": "Edit Profile",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const pathname = usePathname();

  const fetchUsers = async () => {
    try {
      const data = await userApi.list();
      setUsers(data);
      const savedId = typeof window !== "undefined" ? localStorage.getItem("currentUserId") : null;
      if (savedId) {
        const found = data.find((u: User) => u.id === savedId);
        if (found) { setCurrentUser(found); return; }
      }
      if (data.length > 0) {
        const firstStudent = data.find((u: User) => u.role === "student") || data[0];
        setCurrentUser(firstStudent);
        localStorage.setItem("currentUserId", firstStudent.id);
      }
    } catch { /* backend not running yet */ }
  };

  const fetchUnread = async () => {
    if (!currentUser) return;
    try {
      const data = await notificationApi.unreadCount(currentUser.id);
      setUnreadCount(data.unread_count);
    } catch { /* ignore */ }
  };

  useEffect(() => { fetchUsers(); }, []);
  useEffect(() => { fetchUnread(); }, [currentUser]);

  const handleSwitch = (u: User | null) => {
    if (!u) return;
    setCurrentUser(u);
    localStorage.setItem("currentUserId", u.id);
  };

  const title = pageTitles[pathname] || (pathname.startsWith("/profile") ? "Profile" : "DJS Connect");

  return (
    <html lang="en">
      <head>
        <title>DJS Connect — Alumni-Student Referral Platform</title>
        <meta name="description" content="Connect DJ Sanghvi alumni with students for referrals, mentorship, and career opportunities." />
      </head>
      <body>
        <AppContext.Provider value={{ currentUser, setCurrentUser: handleSwitch, users, refreshUsers: fetchUsers, unreadCount, refreshNotifications: fetchUnread }}>
          <div className="app-layout">
            <Sidebar currentUser={currentUser} />
            <main className="main-content">
              <TopBar title={title} users={users} currentUser={currentUser} onSwitch={handleSwitch} unreadCount={unreadCount} />
              <div className="page-content">
                {children}
              </div>
            </main>
          </div>
        </AppContext.Provider>
      </body>
    </html>
  );
}
