"use client";
import { useState, useEffect } from "react";
import { useApp } from "@/app/layout";
import { notificationApi } from "@/lib/api";

import { Send, Check, X, UserPlus, Users, GraduationCap, AlertTriangle, Newspaper, MessageSquare, Heart, Bell, Pin } from "lucide-react";

function timeAgo(date: string) {
  const s = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

const typeIcons: Record<string, any> = {
  referral_request: Send, referral_accepted: Check, referral_rejected: X,
  connection_request: UserPlus, connection_accepted: Users,
  alumni_verified: GraduationCap, alumni_rejected: AlertTriangle, new_post: Newspaper, comment: MessageSquare, like: Heart,
};

export default function NotificationsPage() {
  const { currentUser, refreshNotifications } = useApp();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    if (!currentUser) return;
    try {
      const data = await notificationApi.list(currentUser.id);
      setNotifications(data);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { fetchNotifications(); }, [currentUser]);

  const handleMarkRead = async (id: string) => {
    try { await notificationApi.markRead(id); fetchNotifications(); refreshNotifications(); } catch {}
  };

  const handleMarkAll = async () => {
    if (!currentUser) return;
    try { await notificationApi.markAllRead(currentUser.id); fetchNotifications(); refreshNotifications(); } catch {}
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div>
      {unreadCount > 0 && (
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16 }}>
          <button className="btn btn-secondary btn-sm" onClick={handleMarkAll}><Check size={14} /> Mark all as read</button>
        </div>
      )}
      <div className="card">
        {loading ? (
          <div className="card-body">{[1, 2, 3].map((i) => <div key={i} className="skeleton" style={{ height: 60, marginBottom: 12 }} />)}</div>
        ) : notifications.length === 0 ? (
          <div className="card-body"><div className="empty-state"><div className="empty-icon"><Bell size={48} strokeWidth={1} /></div><h3>No notifications</h3><p>You&apos;re all caught up!</p></div></div>
        ) : (
          notifications.map((n) => (
            <div key={n.id} className={`notif-item ${!n.read ? "unread" : ""}`} onClick={() => !n.read && handleMarkRead(n.id)} style={{ cursor: !n.read ? "pointer" : "default" }}>
              {!n.read && <div className="notif-dot" />}
              <div style={{ flexShrink: 0, color: "var(--text-tertiary)" }}>
                {typeIcons[n.type] ? (() => { const Icon = typeIcons[n.type]; return <Icon size={20} />; })() : <Pin size={20} />}
              </div>
              <div style={{ flex: 1 }}>
                <div className="notif-title">{n.title}</div>
                <div className="notif-content">{n.content}</div>
                <div className="notif-time">{timeAgo(n.created_at)}</div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
