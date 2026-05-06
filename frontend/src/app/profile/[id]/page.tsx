"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useApp } from "@/app/layout";
import { userApi, connectionApi, postApi } from "@/lib/api";
import { UserX, Check, Mail, GraduationCap, Calendar, Building, Briefcase, ExternalLink, Edit3, MessageSquare, Clock, UserPlus, Send, Heart, MessageCircle } from "lucide-react";

function timeAgo(date: string) {
  const s = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

export default function ProfilePage() {
  const { id } = useParams();
  const { currentUser } = useApp();
  const [user, setUser] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState<string | null>(null);
  const isOwn = currentUser?.id === id;

  useEffect(() => {
    const load = async () => {
      try {
        const u = await userApi.get(id as string);
        setUser(u);
        if (u.role === "alumni") {
          const p = await postApi.list({ author_id: id as string });
          setPosts(p);
        }
        if (currentUser && !isOwn) {
          const conns = await connectionApi.list(currentUser.id);
          const conn = conns.find((c: any) =>
            (c.requester_id === currentUser.id && c.receiver_id === id) ||
            (c.requester_id === id && c.receiver_id === currentUser.id)
          );
          setConnectionStatus(conn?.status || null);
        }
      } catch {} finally { setLoading(false); }
    };
    if (id) load();
  }, [id, currentUser]);

  const handleConnect = async () => {
    if (!currentUser) return;
    try {
      await connectionApi.send(currentUser.id, id as string);
      setConnectionStatus("pending");
    } catch {}
  };

  const handleToggleReferrals = async () => {
    if (!user) return;
    try {
      const res = await userApi.toggleReferrals(user.id);
      setUser({ ...user, open_to_referrals: res.open_to_referrals });
    } catch {}
  };

  if (loading) return <div className="skeleton" style={{ height: 300 }} />;
  if (!user) return <div className="empty-state"><div className="empty-icon"><UserX size={48} strokeWidth={1} /></div><h3>User not found</h3></div>;

  return (
    <div>
      <div className="profile-header animate-in">
        <div className="avatar avatar-xl">
          <img src={user.avatar_url || `https://api.dicebear.com/9.x/initials/svg?seed=${user.name}`} alt="" />
        </div>
        <div className="profile-info">
          <h2>{user.name}</h2>
          <div className="profile-role">
            <span className={`badge-status badge-${user.role}`}>{user.role}</span>
            {user.role === "alumni" && user.open_to_referrals && (
              <span className="badge-status badge-accepted"><Check size={12} style={{marginRight:4}} /> Open to Referrals</span>
            )}
          </div>
          {user.bio && <p className="profile-bio">{user.bio}</p>}
          <div className="profile-details">
            {user.email && <span><Mail size={14} style={{marginRight:6}} /> {user.email}</span>}
            {user.branch && <span><GraduationCap size={14} style={{marginRight:6}} /> {user.branch}</span>}
            {user.year && <span><Calendar size={14} style={{marginRight:6}} /> Year {user.year}</span>}
            {user.batch && <span><GraduationCap size={14} style={{marginRight:6}} /> Batch of {user.batch}</span>}
            {user.company && <span><Building size={14} style={{marginRight:6}} /> {user.company}</span>}
            {user.role_title && <span><Briefcase size={14} style={{marginRight:6}} /> {user.role_title}</span>}
            {user.linkedin_url && (
              <a href={user.linkedin_url} target="_blank" rel="noopener" style={{ color: "var(--accent-primary)", display:"inline-flex", alignItems:"center" }}>
                <ExternalLink size={14} style={{marginRight:6}} /> LinkedIn
              </a>
            )}
          </div>
          {user.skills?.length > 0 && (
            <div className="skills-list" style={{ marginTop: 12 }}>
              {user.skills.map((s: string) => <span key={s} className="tag">{s}</span>)}
            </div>
          )}
        </div>
        <div className="profile-actions">
          {isOwn ? (
            <>
              <Link href="/profile/edit" className="btn btn-secondary btn-sm"><Edit3 size={14} /> Edit Profile</Link>
              {user.role === "alumni" && (
                <button className={`btn btn-sm ${user.open_to_referrals ? "btn-success" : "btn-secondary"}`} onClick={handleToggleReferrals}>
                  {user.open_to_referrals ? <><Check size={14} /> Open to Referrals</> : "Closed to Referrals"}
                </button>
              )}
            </>
          ) : (
            <>
              {connectionStatus === "accepted" ? (
                <>
                  <span className="badge-status badge-accepted"><Check size={12} style={{marginRight:4}} /> Connected</span>
                  <Link href={`/messages?to=${user.id}`} className="btn btn-primary btn-sm"><MessageSquare size={14} /> Message</Link>
                </>
              ) : connectionStatus === "pending" ? (
                <span className="badge-status badge-pending"><Clock size={12} style={{marginRight:4}} /> Pending</span>
              ) : (
                <button className="btn btn-primary btn-sm" onClick={handleConnect}><UserPlus size={14} /> Connect</button>
              )}
              {user.role === "alumni" && user.open_to_referrals && currentUser?.role === "student" && (
                <Link href={`/referrals?new=${user.id}`} className="btn btn-success btn-sm"><Send size={14} /> Request Referral</Link>
              )}
            </>
          )}
        </div>
      </div>

      {posts.length > 0 && (
        <div style={{ marginTop: 24 }}>
          <h3 style={{ marginBottom: 16, fontWeight: 700 }}>Posts by {user.name}</h3>
          {posts.map((p) => (
            <div key={p.id} className="card animate-in" style={{ marginBottom: 12 }}>
              <div className="card-body">
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                  <span className={`post-type-badge post-type-${p.type}`}>{p.type}</span>
                  <span style={{ fontSize: "0.8rem", color: "var(--text-tertiary)" }}>{timeAgo(p.created_at)}</span>
                </div>
                <h4 style={{ fontWeight: 600, marginBottom: 4 }}>{p.title}</h4>
                <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{p.content}</p>
                <div style={{ display: "flex", gap: 16, marginTop: 12, fontSize: "0.85rem", color: "var(--text-tertiary)", alignItems: "center" }}>
                  <span style={{ display:"flex", alignItems:"center", gap:6 }}><Heart size={14} /> {p.like_count}</span>
                  <span style={{ display:"flex", alignItems:"center", gap:6 }}><MessageCircle size={14} /> {p.comment_count}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
