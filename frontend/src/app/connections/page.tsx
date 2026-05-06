"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useApp } from "@/app/layout";
import { connectionApi } from "@/lib/api";
import { Users, MessageSquare, Mailbox } from "lucide-react";

export default function ConnectionsPage() {
  const { currentUser, refreshNotifications } = useApp();
  const [connections, setConnections] = useState<any[]>([]);
  const [pending, setPending] = useState<any[]>([]);
  const [tab, setTab] = useState("connected");
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    if (!currentUser) return;
    try {
      const [accepted, pend] = await Promise.all([
        connectionApi.accepted(currentUser.id),
        connectionApi.pending(currentUser.id),
      ]);
      setConnections(accepted);
      setPending(pend);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, [currentUser]);

  const handleStatus = async (id: string, status: string) => {
    try { await connectionApi.updateStatus(id, status); fetchData(); refreshNotifications(); } catch {}
  };

  const getOther = (conn: any) => {
    if (conn.requester_id === currentUser?.id) return { id: conn.receiver_id, name: conn.receiver_name, avatar: conn.receiver_avatar, role: conn.receiver_role };
    return { id: conn.requester_id, name: conn.requester_name, avatar: conn.requester_avatar, role: conn.requester_role };
  };

  return (
    <div>
      <div className="tabs">
        <button className={`tab ${tab === "connected" ? "active" : ""}`} onClick={() => setTab("connected")}>Connected ({connections.length})</button>
        <button className={`tab ${tab === "pending" ? "active" : ""}`} onClick={() => setTab("pending")}>
          Pending ({pending.length}) {pending.length > 0 && <span style={{ background: "var(--accent-danger)", color: "white", borderRadius: "var(--radius-full)", fontSize: "0.6rem", padding: "2px 6px", marginLeft: 4 }}>{pending.length}</span>}
        </button>
      </div>
      {loading ? (
        <div>{[1, 2, 3].map((i) => <div key={i} className="skeleton" style={{ height: 80, marginBottom: 12 }} />)}</div>
      ) : tab === "connected" ? (
        connections.length === 0 ? (
          <div className="empty-state"><div className="empty-icon"><Users size={48} strokeWidth={1} /></div><h3>No connections yet</h3><p>Connect with alumni and students to grow your network.</p></div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
            {connections.map((conn) => {
              const other = getOther(conn);
              return (
                <div key={conn.id} className="card animate-in">
                  <div className="card-body" style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <Link href={`/profile/${other.id}`}><div className="avatar"><img src={other.avatar || ""} alt="" /></div></Link>
                    <div style={{ flex: 1 }}>
                      <Link href={`/profile/${other.id}`}><span style={{ fontWeight: 600 }}>{other.name}</span></Link>
                      <div><span className={`badge-status badge-${other.role}`} style={{ fontSize: "0.65rem" }}>{other.role}</span></div>
                    </div>
                    <Link href={`/messages?to=${other.id}`} className="btn btn-secondary btn-sm"><MessageSquare size={16} /></Link>
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : (
        pending.length === 0 ? (
          <div className="empty-state"><div className="empty-icon"><Mailbox size={48} strokeWidth={1} /></div><h3>No pending requests</h3></div>
        ) : (
          pending.map((conn) => (
            <div key={conn.id} className="card animate-in" style={{ marginBottom: 12 }}>
              <div className="card-body" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <Link href={`/profile/${conn.requester_id}`}><div className="avatar"><img src={conn.requester_avatar || ""} alt="" /></div></Link>
                  <div>
                    <Link href={`/profile/${conn.requester_id}`}><span style={{ fontWeight: 600 }}>{conn.requester_name}</span></Link>
                    <div><span className={`badge-status badge-${conn.requester_role}`} style={{ fontSize: "0.65rem" }}>{conn.requester_role}</span></div>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button className="btn btn-success btn-sm" onClick={() => handleStatus(conn.id, "accepted")}>Accept</button>
                  <button className="btn btn-danger btn-sm" onClick={() => handleStatus(conn.id, "rejected")}>Decline</button>
                </div>
              </div>
            </div>
          ))
        )
      )}
    </div>
  );
}
