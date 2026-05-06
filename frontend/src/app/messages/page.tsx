"use client";
import { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useApp } from "@/app/layout";
import { messageApi } from "@/lib/api";
import { MessageSquare, Send } from "lucide-react";

function timeStr(date: string) {
  return new Date(date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function MessagesPage() {
  return <Suspense fallback={<div className="skeleton" style={{ height: 400 }} />}><MessagesContent /></Suspense>;
}

function MessagesContent() {
  const { currentUser } = useApp();
  const searchParams = useSearchParams();
  const toParam = searchParams.get("to");
  const [conversations, setConversations] = useState<any[]>([]);
  const [activeConv, setActiveConv] = useState<string | null>(toParam);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMsg, setNewMsg] = useState("");
  const [sending, setSending] = useState(false);
  const messagesEnd = useRef<HTMLDivElement>(null);

  const fetchConversations = async () => {
    if (!currentUser) return;
    try {
      const data = await messageApi.conversations(currentUser.id);
      setConversations(data);
      if (toParam && !data.find((c: any) => c.participant_id === toParam)) {
        setActiveConv(toParam);
      }
    } catch {}
  };

  const fetchMessages = async () => {
    if (!currentUser || !activeConv) return;
    try {
      const data = await messageApi.messages(activeConv, currentUser.id);
      setMessages(data);
      setTimeout(() => messagesEnd.current?.scrollIntoView({ behavior: "smooth" }), 100);
    } catch {}
  };

  useEffect(() => { fetchConversations(); }, [currentUser]);
  useEffect(() => { fetchMessages(); }, [activeConv, currentUser]);

  const handleSend = async () => {
    if (!currentUser || !activeConv || !newMsg.trim()) return;
    setSending(true);
    try {
      await messageApi.send(currentUser.id, activeConv, newMsg);
      setNewMsg("");
      fetchMessages();
      fetchConversations();
    } catch {} finally { setSending(false); }
  };

  const activeParticipant = conversations.find((c) => c.participant_id === activeConv);

  return (
    <div className="chat-container" style={{ margin: "-32px", height: "calc(100vh - var(--topbar-height))" }}>
      <div className="chat-sidebar">
        <div style={{ padding: "16px", borderBottom: "1px solid var(--border-light)" }}>
          <h3 style={{ fontSize: "1rem", fontWeight: 700 }}>Messages</h3>
        </div>
        {conversations.length === 0 ? (
          <div style={{ padding: 32, textAlign: "center", color: "var(--text-tertiary)", fontSize: "0.85rem" }}>No conversations yet</div>
        ) : (
          conversations.map((conv) => (
            <div key={conv.participant_id} className={`conversation-item ${activeConv === conv.participant_id ? "active" : ""}`} onClick={() => setActiveConv(conv.participant_id)}>
              <div className="avatar avatar-sm"><img src={conv.participant_avatar || `https://api.dicebear.com/9.x/initials/svg?seed=${conv.participant_name}`} alt="" /></div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="conv-name">{conv.participant_name}</div>
                <div className="conv-preview">{conv.last_message}</div>
              </div>
              {conv.unread_count > 0 && <div className="conv-unread">{conv.unread_count}</div>}
            </div>
          ))
        )}
      </div>
      <div className="chat-main">
        {activeConv ? (
          <>
            <div style={{ padding: "12px 24px", borderBottom: "1px solid var(--border-light)", background: "var(--bg-primary)", display: "flex", alignItems: "center", gap: 12 }}>
              <div className="avatar avatar-sm"><img src={activeParticipant?.participant_avatar || `https://api.dicebear.com/9.x/initials/svg?seed=${activeParticipant?.participant_name || "U"}`} alt="" /></div>
              <div>
                <div style={{ fontWeight: 600, fontSize: "0.9rem" }}>{activeParticipant?.participant_name || "User"}</div>
                <div style={{ fontSize: "0.75rem", color: "var(--text-tertiary)", textTransform: "capitalize" }}>{activeParticipant?.participant_role || ""}</div>
              </div>
            </div>
            <div className="chat-messages">
              {messages.map((msg) => (
                <div key={msg.id}>
                  <div className={`message-bubble ${msg.sender_id === currentUser?.id ? "message-sent" : "message-received"}`}>{msg.content}</div>
                  <div className={`message-time ${msg.sender_id === currentUser?.id ? "message-time-sent" : ""}`} style={{ textAlign: msg.sender_id === currentUser?.id ? "right" : "left" }}>{timeStr(msg.created_at)}</div>
                </div>
              ))}
              <div ref={messagesEnd} />
            </div>
            <div className="chat-input-area">
              <input className="form-input" placeholder="Type a message..." value={newMsg} onChange={(e) => setNewMsg(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleSend()} style={{ flex: 1 }} />
              <button className="btn btn-primary" onClick={handleSend} disabled={sending}>{sending ? "..." : <><Send size={16} /> Send</>}</button>
            </div>
          </>
        ) : (
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div className="empty-state"><div className="empty-icon"><MessageSquare size={48} strokeWidth={1} /></div><h3>Select a conversation</h3><p>Choose a conversation from the sidebar to start chatting.</p></div>
          </div>
        )}
      </div>
    </div>
  );
}
