"use client";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useApp } from "@/app/layout";
import { referralApi, userApi } from "@/lib/api";
import { Send, ClipboardList, ExternalLink } from "lucide-react";

function timeAgo(date: string) {
  const s = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

export default function ReferralsPage() {
  return <Suspense fallback={<div className="skeleton" style={{ height: 300 }} />}><ReferralsContent /></Suspense>;
}

function ReferralsContent() {
  const { currentUser, refreshNotifications } = useApp();
  const searchParams = useSearchParams();
  const newAlumniId = searchParams.get("new");
  const [requests, setRequests] = useState<any[]>([]);
  const [tab, setTab] = useState("all");
  const [showForm, setShowForm] = useState(!!newAlumniId);
  const [alumni, setAlumni] = useState<any[]>([]);
  const [form, setForm] = useState({ alumni_id: newAlumniId || "", job_link: "", company: "", role_title: "", message: "", resume_url: "" });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const isAlumni = currentUser?.role === "alumni";

  const fetchRequests = async () => {
    if (!currentUser) return;
    try {
      const params = isAlumni ? { alumni_id: currentUser.id } : { student_id: currentUser.id };
      const data = await referralApi.list(params);
      setRequests(data);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { fetchRequests(); }, [currentUser]);
  useEffect(() => {
    if (showForm) { userApi.list("alumni").then(setAlumni).catch(() => {}); }
  }, [showForm]);

  const handleSubmit = async () => {
    if (!currentUser || !form.alumni_id || !form.job_link || !form.message) return;
    setSubmitting(true);
    try {
      await referralApi.create(currentUser.id, form);
      setShowForm(false);
      setForm({ alumni_id: "", job_link: "", company: "", role_title: "", message: "", resume_url: "" });
      fetchRequests();
    } catch {} finally { setSubmitting(false); }
  };

  const handleStatus = async (id: string, status: string) => {
    try {
      await referralApi.updateStatus(id, status);
      fetchRequests();
      refreshNotifications();
    } catch {}
  };

  const filtered = tab === "all" ? requests : requests.filter((r) => r.status === tab);

  return (
    <div>
      {!isAlumni && (
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)} style={{ marginBottom: 20 }}>
          {showForm ? "Cancel" : <><Send size={16} /> New Referral Request</>}
        </button>
      )}

      {showForm && (
        <div className="card animate-in" style={{ marginBottom: 24 }}>
          <div className="card-header"><h3>Send Referral Request</h3></div>
          <div className="card-body">
            <div className="form-group">
              <label className="form-label">Select Alumni</label>
              <select className="form-select" value={form.alumni_id} onChange={(e) => setForm({ ...form, alumni_id: e.target.value })}>
                <option value="">Choose an alumni...</option>
                {alumni.filter((a) => a.open_to_referrals).map((a) => (
                  <option key={a.id} value={a.id}>{a.name} — {a.company} ({a.role_title})</option>
                ))}
              </select>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div className="form-group"><label className="form-label">Company</label><input className="form-input" placeholder="e.g. Google" value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} /></div>
              <div className="form-group"><label className="form-label">Role Title</label><input className="form-input" placeholder="e.g. SDE Intern" value={form.role_title} onChange={(e) => setForm({ ...form, role_title: e.target.value })} /></div>
            </div>
            <div className="form-group"><label className="form-label">Job Link *</label><input className="form-input" placeholder="https://..." value={form.job_link} onChange={(e) => setForm({ ...form, job_link: e.target.value })} /></div>
            <div className="form-group"><label className="form-label">Message *</label><textarea className="form-textarea" placeholder="Introduce yourself and why you'd be a good fit..." value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} /></div>
            <div className="form-group"><label className="form-label">Resume URL</label><input className="form-input" placeholder="https://..." value={form.resume_url} onChange={(e) => setForm({ ...form, resume_url: e.target.value })} /></div>
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button className="btn btn-primary" onClick={handleSubmit} disabled={submitting}>{submitting ? "Sending..." : "Send Request"}</button>
            </div>
          </div>
        </div>
      )}

      <div className="tabs">
        {["all", "pending", "accepted", "rejected"].map((t) => (
          <button key={t} className={`tab ${tab === t ? "active" : ""}`} onClick={() => setTab(t)}>
            {t.charAt(0).toUpperCase() + t.slice(1)} ({t === "all" ? requests.length : requests.filter((r) => r.status === t).length})
          </button>
        ))}
      </div>

      {loading ? (
        <div>{[1, 2].map((i) => <div key={i} className="skeleton" style={{ height: 120, marginBottom: 12 }} />)}</div>
      ) : filtered.length === 0 ? (
        <div className="empty-state"><div className="empty-icon"><ClipboardList size={48} strokeWidth={1} /></div><h3>No referral requests</h3><p>{isAlumni ? "You haven't received any requests yet." : "Send your first referral request to get started."}</p></div>
      ) : (
        filtered.map((r) => (
          <div key={r.id} className="card animate-in" style={{ marginBottom: 12 }}>
            <div className="card-body">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div style={{ display: "flex", gap: 12 }}>
                  <Link href={`/profile/${isAlumni ? r.student_id : r.alumni_id}`}>
                    <div className="avatar"><img src={isAlumni ? r.student_avatar : r.alumni_avatar || ""} alt="" /></div>
                  </Link>
                  <div>
                    <div style={{ fontWeight: 600 }}>{isAlumni ? r.student_name : r.alumni_name}</div>
                    <div style={{ fontSize: "0.8rem", color: "var(--text-tertiary)" }}>
                      {isAlumni ? `${r.student_branch || ""} · Year ${r.student_year || ""}` : r.alumni_company}
                    </div>
                    <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginTop: 8 }}>
                      {r.company && <strong>{r.company}</strong>} {r.role_title && `— ${r.role_title}`}
                    </div>
                    <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginTop: 4 }}>{r.message}</p>
                    {r.job_link && <a href={r.job_link} target="_blank" rel="noopener" style={{ color: "var(--accent-primary)", fontSize: "0.8rem", display:"inline-flex", alignItems:"center", gap:4, marginTop:4 }}><ExternalLink size={12} /> Job Link</a>}
                    <div style={{ fontSize: "0.75rem", color: "var(--text-tertiary)", marginTop: 6 }}>{timeAgo(r.created_at)}</div>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span className={`badge-status badge-${r.status}`}>{r.status}</span>
                  {isAlumni && r.status === "pending" && (
                    <>
                      <button className="btn btn-success btn-sm" onClick={() => handleStatus(r.id, "accepted")}>Accept</button>
                      <button className="btn btn-danger btn-sm" onClick={() => handleStatus(r.id, "rejected")}>Reject</button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
