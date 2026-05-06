"use client";
import { useState, useEffect } from "react";
import { useApp } from "@/app/layout";
import { userApi } from "@/lib/api";
import { GraduationCap, Clock, Building, XCircle } from "lucide-react";

export default function SwitchAlumniPage() {
  const { currentUser } = useApp();
  const [form, setForm] = useState({ graduation_year: "", current_company: "", linkedin_url: "" });
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<any>(null);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    if (currentUser) {
      userApi.transferStatus(currentUser.id).then(setStatus).catch(() => {});
    }
  }, [currentUser]);

  const handleSubmit = async () => {
    if (!currentUser || !form.graduation_year || !form.linkedin_url) { setMsg("Please fill required fields"); return; }
    setLoading(true);
    try {
      await userApi.switchToAlumni(currentUser.id, {
        graduation_year: parseInt(form.graduation_year),
        current_company: form.current_company || undefined,
        linkedin_url: form.linkedin_url,
      });
      setMsg("Transfer request submitted! An admin will review your application.");
      userApi.transferStatus(currentUser.id).then(setStatus).catch(() => {});
    } catch (e: any) { setMsg(e.message || "Failed to submit"); } finally { setLoading(false); }
  };

  if (currentUser?.role !== "student") {
    return <div className="empty-state"><div className="empty-icon"><GraduationCap size={48} strokeWidth={1} /></div><h3>Already an Alumni</h3><p>You already have alumni access.</p></div>;
  }

  return (
    <div style={{ maxWidth: 560 }}>
      {status?.status === "pending" ? (
        <div className="card animate-in">
          <div className="card-body" style={{ textAlign: "center", padding: 48 }}>
            <div style={{ fontSize: "3rem", marginBottom: 16, display: "flex", justifyContent: "center", color: "var(--accent-warning)" }}><Clock size={48} strokeWidth={1} /></div>
            <h3 style={{ fontWeight: 700, marginBottom: 8 }}>Verification Pending</h3>
            <p style={{ color: "var(--text-secondary)", marginBottom: 16 }}>Your alumni transfer request is under review. You&apos;ll be notified once an admin reviews it.</p>
            <div style={{ display: "flex", justifyContent: "center", gap: 16, fontSize: "0.85rem", color: "var(--text-tertiary)", alignItems: "center" }}>
              <span style={{ display:"flex", alignItems:"center", gap:4 }}><GraduationCap size={14} /> Batch: {status.graduation_year}</span>
              {status.current_company && <span style={{ display:"flex", alignItems:"center", gap:4 }}><Building size={14} /> {status.current_company}</span>}
            </div>
          </div>
        </div>
      ) : status?.status === "rejected" ? (
        <div className="card animate-in" style={{ marginBottom: 24 }}>
          <div className="card-body" style={{ background: "var(--accent-danger-light)", borderRadius: "var(--radius-lg)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <XCircle size={16} />
              <strong>Previous request was rejected</strong>
            </div>
            <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>Reason: {status.rejection_reason || "Not specified"}</p>
            <p style={{ fontSize: "0.8rem", color: "var(--text-tertiary)", marginTop: 8 }}>You can submit a new request below.</p>
          </div>
        </div>
      ) : null}

      {status?.status !== "pending" && (
        <div className="card animate-in">
          <div className="card-header"><h3>Switch to Alumni</h3></div>
          <div className="card-body">
            <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", marginBottom: 24 }}>
              Submit your details to verify your alumni status. Once approved, you&apos;ll be able to post referral opportunities and help current students.
            </p>
            {msg && (
              <div style={{ padding: "10px 16px", borderRadius: "var(--radius-md)", background: msg.includes("submitted") ? "var(--accent-success-light)" : "var(--accent-danger-light)", color: msg.includes("submitted") ? "var(--accent-success)" : "var(--accent-danger)", fontSize: "0.85rem", fontWeight: 500, marginBottom: 20 }}>{msg}</div>
            )}
            <div className="form-group">
              <label className="form-label">Graduation Year *</label>
              <input className="form-input" type="number" placeholder="e.g. 2023" value={form.graduation_year} onChange={(e) => setForm({ ...form, graduation_year: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">Current Company (optional)</label>
              <input className="form-input" placeholder="e.g. Google" value={form.current_company} onChange={(e) => setForm({ ...form, current_company: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">LinkedIn Profile URL *</label>
              <input className="form-input" placeholder="https://linkedin.com/in/..." value={form.linkedin_url} onChange={(e) => setForm({ ...form, linkedin_url: e.target.value })} />
            </div>
          </div>
          <div className="card-footer" style={{ display: "flex", justifyContent: "flex-end" }}>
            <button className="btn btn-primary" onClick={handleSubmit} disabled={loading}>{loading ? "Submitting..." : "Submit for Verification"}</button>
          </div>
        </div>
      )}
    </div>
  );
}
