"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useApp } from "./layout";
import { postApi } from "@/lib/api";
import { ExternalLink, Edit3, X, Mailbox, Heart, MessageSquare, Bookmark } from "lucide-react";

function timeAgo(date: string) {
  const s = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

function PostCard({ post, currentUser, onRefresh }: { post: any; currentUser: any; onRefresh: () => void }) {
  const [showComments, setShowComments] = useState(false);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const isLiked = post.likes?.includes(currentUser?.id);
  const isSaved = post.saved_by?.includes(currentUser?.id);

  const handleLike = async () => {
    if (!currentUser) return;
    try { await postApi.like(post.id, currentUser.id); onRefresh(); } catch {}
  };
  const handleSave = async () => {
    if (!currentUser) return;
    try { await postApi.save(post.id, currentUser.id); onRefresh(); } catch {}
  };
  const handleComment = async () => {
    if (!currentUser || !comment.trim()) return;
    setLoading(true);
    try { await postApi.comment(post.id, currentUser.id, { content: comment }); setComment(""); onRefresh(); } catch {} finally { setLoading(false); }
  };

  const typeClass = post.type === "referral" ? "post-type-referral" : post.type === "opportunity" ? "post-type-opportunity" : "post-type-guidance";

  return (
    <div className="card post-card animate-in">
      <div className="card-body">
        <div className="post-header">
          <Link href={`/profile/${post.author_id}`}>
            <div className="avatar"><img src={post.author_avatar || `https://api.dicebear.com/9.x/initials/svg?seed=${post.author_name}`} alt="" /></div>
          </Link>
          <div className="post-meta">
            <Link href={`/profile/${post.author_id}`}><span className="post-author">{post.author_name}</span></Link>
            <div className="post-info">
              <span className={`post-type-badge ${typeClass}`}>{post.type}</span>
              {post.author_company && <span>at {post.author_company}</span>}
              <span>·</span>
              <span>{timeAgo(post.created_at)}</span>
            </div>
          </div>
        </div>
        <h3 className="post-title">{post.title}</h3>
        <p className="post-content">{post.content}</p>
        {post.job_link && (
          <a href={post.job_link} target="_blank" rel="noopener" style={{ display: "inline-flex", alignItems: "center", gap: 6, marginTop: 12, color: "var(--accent-primary)", fontSize: "0.85rem", fontWeight: 600 }}>
            <ExternalLink size={14} /> View Job Posting
          </a>
        )}
        {post.tags?.length > 0 && (
          <div className="post-tags">{post.tags.map((t: string) => <span key={t} className="tag">{t}</span>)}</div>
        )}
        <div className="post-actions">
          <button className={`post-action-btn ${isLiked ? "liked" : ""}`} onClick={handleLike}>
            {isLiked ? <Heart size={16} fill="currentColor" color="var(--accent-danger)" /> : <Heart size={16} />} {post.like_count || 0}
          </button>
          <button className="post-action-btn" onClick={() => setShowComments(!showComments)}>
            <MessageSquare size={16} /> {post.comment_count || 0}
          </button>
          <button className={`post-action-btn ${isSaved ? "active" : ""}`} onClick={handleSave}>
            {isSaved ? <Bookmark size={16} fill="currentColor" color="var(--accent-primary)" /> : <Bookmark size={16} />} Save
          </button>
        </div>
        {showComments && (
          <div style={{ marginTop: 16 }}>
            {post.comments?.map((c: any) => (
              <div key={c.id} style={{ display: "flex", gap: 10, marginBottom: 12, padding: "8px 0", borderBottom: "1px solid var(--border-light)" }}>
                <div className="avatar avatar-sm"><img src={c.user_avatar || `https://api.dicebear.com/9.x/initials/svg?seed=${c.user_name}`} alt="" /></div>
                <div>
                  <span style={{ fontWeight: 600, fontSize: "0.8rem" }}>{c.user_name}</span>
                  <span style={{ fontSize: "0.7rem", color: "var(--text-tertiary)", marginLeft: 8 }}>{timeAgo(c.created_at)}</span>
                  <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginTop: 2 }}>{c.content}</p>
                </div>
              </div>
            ))}
            <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
              <input className="form-input" placeholder="Write a comment..." value={comment} onChange={(e) => setComment(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleComment()} style={{ borderRadius: "var(--radius-full)", fontSize: "0.85rem" }} />
              <button className="btn btn-primary btn-sm" onClick={handleComment} disabled={loading}>{loading ? "..." : "Post"}</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function PostComposer({ currentUser, onCreated }: { currentUser: any; onCreated: () => void }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ type: "referral", title: "", content: "", company: "", job_link: "", tags: "" });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!form.title.trim() || !form.content.trim()) return;
    setLoading(true);
    try {
      await postApi.create(currentUser.id, { ...form, tags: form.tags.split(",").map((t: string) => t.trim()).filter(Boolean) });
      setForm({ type: "referral", title: "", content: "", company: "", job_link: "", tags: "" });
      setOpen(false);
      onCreated();
    } catch {} finally { setLoading(false); }
  };

  if (!open) return <button className="btn btn-primary" onClick={() => setOpen(true)} style={{ marginBottom: 20 }}><Edit3 size={16} /> Create Post</button>;

  return (
    <div className="card animate-in" style={{ marginBottom: 20 }}>
      <div className="card-header"><h3>Create Post</h3><button className="btn-ghost" onClick={() => setOpen(false)}><X size={20} /></button></div>
      <div className="card-body">
        <div className="form-group">
          <label className="form-label">Post Type</label>
          <select className="form-select" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
            <option value="referral">Referral</option><option value="opportunity">Opportunity</option><option value="guidance">Guidance</option>
          </select>
        </div>
        <div className="form-group"><label className="form-label">Title</label><input className="form-input" placeholder="Post title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
        <div className="form-group"><label className="form-label">Content</label><textarea className="form-textarea" placeholder="Write your post..." value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} /></div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div className="form-group"><label className="form-label">Company</label><input className="form-input" placeholder="e.g. Google" value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} /></div>
          <div className="form-group"><label className="form-label">Job Link</label><input className="form-input" placeholder="https://..." value={form.job_link} onChange={(e) => setForm({ ...form, job_link: e.target.value })} /></div>
        </div>
        <div className="form-group"><label className="form-label">Tags (comma-separated)</label><input className="form-input" placeholder="e.g. SDE, Intern, Google" value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} /></div>
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button className="btn btn-secondary" onClick={() => setOpen(false)}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={loading}>{loading ? "Posting..." : "Publish"}</button>
        </div>
      </div>
    </div>
  );
}

export default function FeedPage() {
  const { currentUser } = useApp();
  const [posts, setPosts] = useState<any[]>([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  const fetchPosts = async () => {
    try {
      const params = filter !== "all" ? { post_type: filter } : {};
      const data = await postApi.list(params);
      setPosts(data);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { fetchPosts(); }, [filter]);

  return (
    <div>
      {currentUser?.role === "alumni" && <PostComposer currentUser={currentUser} onCreated={fetchPosts} />}
      <div className="tabs">
        {["all", "referral", "opportunity", "guidance"].map((f) => (
          <button key={f} className={`tab ${filter === f ? "active" : ""}`} onClick={() => setFilter(f)}>
            {f === "all" ? "All Posts" : f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>
      {loading ? (
        <div>{[1, 2, 3].map((i) => <div key={i} className="skeleton" style={{ height: 200, marginBottom: 16 }} />)}</div>
      ) : posts.length === 0 ? (
        <div className="empty-state"><div className="empty-icon"><Mailbox size={48} strokeWidth={1} /></div><h3>No posts yet</h3><p>Check back later for new posts from alumni.</p></div>
      ) : (
        posts.map((p) => <PostCard key={p.id} post={p} currentUser={currentUser} onRefresh={fetchPosts} />)
      )}
    </div>
  );
}
