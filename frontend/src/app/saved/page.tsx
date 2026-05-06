"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useApp } from "@/app/layout";
import { postApi } from "@/lib/api";
import { Bookmark, ExternalLink } from "lucide-react";

function timeAgo(date: string) {
  const s = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

export default function SavedPage() {
  const { currentUser } = useApp();
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentUser) {
      postApi.saved(currentUser.id).then(setPosts).catch(() => {}).finally(() => setLoading(false));
    }
  }, [currentUser]);

  const handleUnsave = async (postId: string) => {
    if (!currentUser) return;
    try { await postApi.save(postId, currentUser.id); setPosts(posts.filter((p) => p.id !== postId)); } catch {}
  };

  return (
    <div>
      {loading ? (
        <div>{[1, 2].map((i) => <div key={i} className="skeleton" style={{ height: 140, marginBottom: 12 }} />)}</div>
      ) : posts.length === 0 ? (
        <div className="empty-state"><div className="empty-icon"><Bookmark size={48} strokeWidth={1} /></div><h3>No saved posts</h3><p>Save posts from the feed to find them here later.</p></div>
      ) : (
        posts.map((p) => (
          <div key={p.id} className="card animate-in" style={{ marginBottom: 12 }}>
            <div className="card-body">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div style={{ display: "flex", gap: 12 }}>
                  <Link href={`/profile/${p.author_id}`}><div className="avatar"><img src={p.author_avatar || ""} alt="" /></div></Link>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                      <span style={{ fontWeight: 600 }}>{p.author_name}</span>
                      <span className={`post-type-badge post-type-${p.type}`}>{p.type}</span>
                      <span style={{ fontSize: "0.75rem", color: "var(--text-tertiary)" }}>{timeAgo(p.created_at)}</span>
                    </div>
                    <h4 style={{ fontWeight: 600, marginBottom: 4 }}>{p.title}</h4>
                    <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{p.content}</p>
                    {p.job_link && <a href={p.job_link} target="_blank" rel="noopener" style={{ color: "var(--accent-primary)", fontSize: "0.8rem", marginTop: 4, display: "inline-flex", alignItems:"center", gap:4 }}><ExternalLink size={12} /> Job Link</a>}
                  </div>
                </div>
                <button className="btn btn-ghost btn-sm" onClick={() => handleUnsave(p.id)} title="Unsave" style={{ color: "var(--accent-primary)" }}><Bookmark size={16} fill="currentColor" /></button>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
