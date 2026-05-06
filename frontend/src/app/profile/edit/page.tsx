"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/app/layout";
import { userApi } from "@/lib/api";

export default function EditProfilePage() {
  const { currentUser, refreshUsers } = useApp();
  const router = useRouter();
  const [form, setForm] = useState({ name: "", bio: "", branch: "", year: "", skills: "", resume_url: "", batch: "", company: "", role_title: "", linkedin_url: "" });
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    if (currentUser) {
      setForm({
        name: currentUser.name || "", bio: currentUser.bio || "",
        branch: currentUser.branch || "", year: currentUser.year?.toString() || "",
        skills: currentUser.skills?.join(", ") || "", resume_url: currentUser.resume_url || "",
        batch: currentUser.batch?.toString() || "", company: currentUser.company || "",
        role_title: currentUser.role_title || "", linkedin_url: currentUser.linkedin_url || "",
      });
    }
  }, [currentUser]);

  const handleSubmit = async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      const data: any = { name: form.name, bio: form.bio };
      if (currentUser.role === "student") {
        data.branch = form.branch; data.year = form.year ? parseInt(form.year) : undefined;
        data.skills = form.skills.split(",").map((s: string) => s.trim()).filter(Boolean);
        data.resume_url = form.resume_url;
      } else if (currentUser.role === "alumni") {
        data.batch = form.batch ? parseInt(form.batch) : undefined;
        data.company = form.company; data.role_title = form.role_title; data.linkedin_url = form.linkedin_url;
      }
      await userApi.update(currentUser.id, data);
      setMsg("Profile updated successfully!");
      refreshUsers();
      setTimeout(() => router.push(`/profile/${currentUser.id}`), 1000);
    } catch { setMsg("Failed to update profile"); } finally { setLoading(false); }
  };

  return (
    <div style={{ maxWidth: 600 }}>
      <div className="card animate-in">
        <div className="card-header"><h3>Edit Profile</h3></div>
        <div className="card-body">
          {msg && <div style={{ padding: "10px 16px", borderRadius: "var(--radius-md)", background: msg.includes("success") ? "var(--accent-success-light)" : "var(--accent-danger-light)", color: msg.includes("success") ? "var(--accent-success)" : "var(--accent-danger)", fontSize: "0.85rem", fontWeight: 500, marginBottom: 20 }}>{msg}</div>}
          <div className="form-group"><label className="form-label">Name</label><input className="form-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
          <div className="form-group"><label className="form-label">Bio</label><textarea className="form-textarea" value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} /></div>
          {currentUser?.role === "student" && (<>
            <div className="form-group"><label className="form-label">Branch</label><input className="form-input" value={form.branch} onChange={(e) => setForm({ ...form, branch: e.target.value })} /></div>
            <div className="form-group"><label className="form-label">Year</label><input className="form-input" type="number" value={form.year} onChange={(e) => setForm({ ...form, year: e.target.value })} /></div>
            <div className="form-group"><label className="form-label">Skills (comma-separated)</label><input className="form-input" value={form.skills} onChange={(e) => setForm({ ...form, skills: e.target.value })} /></div>
            <div className="form-group"><label className="form-label">Resume URL</label><input className="form-input" value={form.resume_url} onChange={(e) => setForm({ ...form, resume_url: e.target.value })} /></div>
          </>)}
          {currentUser?.role === "alumni" && (<>
            <div className="form-group"><label className="form-label">Batch (Graduation Year)</label><input className="form-input" type="number" value={form.batch} onChange={(e) => setForm({ ...form, batch: e.target.value })} /></div>
            <div className="form-group"><label className="form-label">Company</label><input className="form-input" value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} /></div>
            <div className="form-group"><label className="form-label">Role / Title</label><input className="form-input" value={form.role_title} onChange={(e) => setForm({ ...form, role_title: e.target.value })} /></div>
            <div className="form-group"><label className="form-label">LinkedIn URL</label><input className="form-input" value={form.linkedin_url} onChange={(e) => setForm({ ...form, linkedin_url: e.target.value })} /></div>
          </>)}
        </div>
        <div className="card-footer" style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
          <button className="btn btn-secondary" onClick={() => router.back()}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={loading}>{loading ? "Saving..." : "Save Changes"}</button>
        </div>
      </div>
    </div>
  );
}
