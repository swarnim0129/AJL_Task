"use client";
import { useState, useEffect } from "react";
import { useApp } from "@/app/layout";
import { adminApi } from "@/lib/api";
import { Lock, CheckCircle, GraduationCap, Building, ExternalLink, Check, X } from "lucide-react";

function timeAgo(date: string) {
  const s = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

export default function AdminPage() {
  const { currentUser } = useApp();
  const [tab, setTab] = useState("verifications");
  const [stats, setStats] = useState<any>(null);
  const [pending, setPending] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const fetchData = async () => {
    try {
      const [s, p, u] = await Promise.all([adminApi.stats(), adminApi.pendingVerifications(), adminApi.users()]);
      setStats(s); setPending(p); setUsers(u);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleVerify = async (id: string, approved: boolean) => {
    try {
      await adminApi.verify(id, approved, approved ? undefined : rejectReason);
      setRejectId(null); setRejectReason("");
      fetchData();
    } catch {}
  };

  const handleRemoveUser = async (id: string) => {
    if (!confirm("Remove this user?")) return;
    try { await adminApi.removeUser(id); fetchData(); } catch {}
  };

  if (currentUser?.role !== "admin") {
    return <div className="empty-state"><div className="empty-icon"><Lock size={48} strokeWidth={1} /></div><h3>Access Denied</h3><p>Only admins can access this page.</p></div>;
  }

  return (
    <div>
      {stats && (
        <div className="stats-grid">
          {[
            { label: "Total Users", value: stats.total_users, color: "var(--accent-primary)" },
            { label: "Students", value: stats.students, color: "var(--accent-primary)" },
            { label: "Alumni", value: stats.alumni, color: "var(--accent-purple)" },
            { label: "Total Posts", value: stats.total_posts, color: "var(--accent-success)" },
            { label: "Pending Referrals", value: stats.pending_referrals, color: "var(--accent-warning)" },
            { label: "Pending Transfers", value: stats.pending_transfers, color: "var(--accent-danger)" },
          ].map((s) => (
            <div key={s.label} className="card stat-card"><div className="card-body"><div className="stat-value" style={{ color: s.color }}>{s.value}</div><div className="stat-label">{s.label}</div></div></div>
          ))}
        </div>
      )}

      <div className="tabs">
        <button className={`tab ${tab === "verifications" ? "active" : ""}`} onClick={() => setTab("verifications")}>
          Alumni Verifications {pending.length > 0 && <span style={{ background: "var(--accent-danger)", color: "white", borderRadius: "var(--radius-full)", fontSize: "0.6rem", padding: "2px 6px", marginLeft: 4 }}>{pending.length}</span>}
        </button>
        <button className={`tab ${tab === "users" ? "active" : ""}`} onClick={() => setTab("users")}>All Users</button>
      </div>

      {loading ? (
        <div>{[1, 2].map((i) => <div key={i} className="skeleton" style={{ height: 100, marginBottom: 12 }} />)}</div>
      ) : tab === "verifications" ? (
        pending.length === 0 ? (
          <div className="empty-state"><div className="empty-icon"><CheckCircle size={48} strokeWidth={1} /></div><h3>No pending verifications</h3></div>
        ) : (
          pending.map((t) => (
            <div key={t.id} className="card animate-in" style={{ marginBottom: 12 }}>
              <div className="card-body">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div style={{ display: "flex", gap: 12 }}>
                    <div className="avatar"><img src={t.user_avatar || ""} alt="" /></div>
                    <div>
                      <div style={{ fontWeight: 600 }}>{t.user_name}</div>
                      <div style={{ fontSize: "0.8rem", color: "var(--text-tertiary)" }}>{t.user_email}</div>
                      <div style={{ fontSize: "0.85rem", marginTop: 8, display: "flex", gap: 16, color: "var(--text-secondary)", alignItems:"center" }}>
                        <span style={{ display:"flex", alignItems:"center", gap:4 }}><GraduationCap size={14} /> Batch: {t.graduation_year}</span>
                        {t.current_company && <span style={{ display:"flex", alignItems:"center", gap:4 }}><Building size={14} /> {t.current_company}</span>}
                        <a href={t.linkedin_url} target="_blank" rel="noopener" style={{ color: "var(--accent-primary)", display:"flex", alignItems:"center", gap:4 }}><ExternalLink size={14} /> LinkedIn</a>
                      </div>
                      <div style={{ fontSize: "0.75rem", color: "var(--text-tertiary)", marginTop: 4 }}>Submitted {timeAgo(t.created_at)}</div>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button className="btn btn-success btn-sm" onClick={() => handleVerify(t.id, true)}><Check size={14} /> Approve</button>
                    <button className="btn btn-danger btn-sm" onClick={() => setRejectId(rejectId === t.id ? null : t.id)}><X size={14} /> Reject</button>
                  </div>
                </div>
                {rejectId === t.id && (
                  <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
                    <input className="form-input" placeholder="Reason for rejection..." value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} style={{ flex: 1 }} />
                    <button className="btn btn-danger btn-sm" onClick={() => handleVerify(t.id, false)}>Confirm Reject</button>
                  </div>
                )}
              </div>
            </div>
          ))
        )
      ) : (
        <div className="card">
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border-light)" }}>
                  {["User", "Email", "Role", "Company", "Actions"].map((h) => (
                    <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontWeight: 600, color: "var(--text-tertiary)", fontSize: "0.75rem", textTransform: "uppercase" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} style={{ borderBottom: "1px solid var(--border-light)" }}>
                    <td style={{ padding: "12px 16px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div className="avatar avatar-sm"><img src={u.avatar_url || ""} alt="" /></div>
                        <span style={{ fontWeight: 500 }}>{u.name}</span>
                      </div>
                    </td>
                    <td style={{ padding: "12px 16px", color: "var(--text-tertiary)" }}>{u.email}</td>
                    <td style={{ padding: "12px 16px" }}><span className={`badge-status badge-${u.role}`}>{u.role}</span></td>
                    <td style={{ padding: "12px 16px", color: "var(--text-secondary)" }}>{u.company || "—"}</td>
                    <td style={{ padding: "12px 16px" }}>
                      {u.role !== "admin" && <button className="btn btn-danger btn-sm" onClick={() => handleRemoveUser(u.id)}>Remove</button>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
