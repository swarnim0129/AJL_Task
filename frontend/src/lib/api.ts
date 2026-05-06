const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

async function request(url: string, options?: RequestInit) {
  const res = await fetch(`${API_BASE}${url}`, {
    headers: { "Content-Type": "application/json", ...options?.headers },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Request failed" }));
    throw new Error(err.detail || "Request failed");
  }
  return res.json();
}

// ── Users ──
export const userApi = {
  list: (role?: string) => request(`/users${role ? `?role=${role}` : ""}`),
  get: (id: string) => request(`/users/${id}`),
  create: (data: any) => request("/users", { method: "POST", body: JSON.stringify(data) }),
  update: (id: string, data: any) => request(`/users/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  toggleReferrals: (id: string) => request(`/users/${id}/toggle-referrals`, { method: "PATCH" }),
  switchToAlumni: (id: string, data: any) => request(`/users/${id}/switch-to-alumni`, { method: "POST", body: JSON.stringify(data) }),
  transferStatus: (id: string) => request(`/users/${id}/transfer-status`),
};

// ── Posts ──
export const postApi = {
  list: (params?: { post_type?: string; author_id?: string; limit?: number; skip?: number }) => {
    const q = new URLSearchParams();
    if (params?.post_type) q.set("post_type", params.post_type);
    if (params?.author_id) q.set("author_id", params.author_id);
    if (params?.limit) q.set("limit", String(params.limit));
    if (params?.skip) q.set("skip", String(params.skip));
    return request(`/posts?${q.toString()}`);
  },
  get: (id: string) => request(`/posts/${id}`),
  create: (authorId: string, data: any) => request(`/posts?author_id=${authorId}`, { method: "POST", body: JSON.stringify(data) }),
  like: (postId: string, userId: string) => request(`/posts/${postId}/like?user_id=${userId}`, { method: "POST" }),
  comment: (postId: string, userId: string, data: any) => request(`/posts/${postId}/comment?user_id=${userId}`, { method: "POST", body: JSON.stringify(data) }),
  save: (postId: string, userId: string) => request(`/posts/${postId}/save?user_id=${userId}`, { method: "POST" }),
  saved: (userId: string) => request(`/posts/saved/${userId}`),
  delete: (id: string) => request(`/posts/${id}`, { method: "DELETE" }),
};

// ── Referrals ──
export const referralApi = {
  list: (params?: { student_id?: string; alumni_id?: string; status?: string }) => {
    const q = new URLSearchParams();
    if (params?.student_id) q.set("student_id", params.student_id);
    if (params?.alumni_id) q.set("alumni_id", params.alumni_id);
    if (params?.status) q.set("status", params.status);
    return request(`/referrals?${q.toString()}`);
  },
  get: (id: string) => request(`/referrals/${id}`),
  create: (studentId: string, data: any) => request(`/referrals?student_id=${studentId}`, { method: "POST", body: JSON.stringify(data) }),
  updateStatus: (id: string, status: string) => request(`/referrals/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) }),
};

// ── Connections ──
export const connectionApi = {
  list: (userId: string, status?: string) => request(`/connections?user_id=${userId}${status ? `&status=${status}` : ""}`),
  accepted: (userId: string) => request(`/connections/accepted?user_id=${userId}`),
  pending: (userId: string) => request(`/connections/pending?user_id=${userId}`),
  send: (requesterId: string, receiverId: string) => request(`/connections?requester_id=${requesterId}`, { method: "POST", body: JSON.stringify({ receiver_id: receiverId }) }),
  updateStatus: (id: string, status: string) => request(`/connections/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) }),
};

// ── Messages ──
export const messageApi = {
  conversations: (userId: string) => request(`/messages/conversations?user_id=${userId}`),
  messages: (otherUserId: string, userId: string) => request(`/messages/${otherUserId}?user_id=${userId}`),
  send: (senderId: string, receiverId: string, content: string) => request(`/messages?sender_id=${senderId}`, { method: "POST", body: JSON.stringify({ receiver_id: receiverId, content }) }),
};

// ── Notifications ──
export const notificationApi = {
  list: (userId: string) => request(`/notifications?user_id=${userId}`),
  unreadCount: (userId: string) => request(`/notifications/unread-count?user_id=${userId}`),
  markRead: (id: string) => request(`/notifications/${id}/read`, { method: "PATCH" }),
  markAllRead: (userId: string) => request(`/notifications/read-all?user_id=${userId}`, { method: "PATCH" }),
};

// ── Admin ──
export const adminApi = {
  pendingVerifications: () => request("/admin/pending-verifications"),
  verify: (transferId: string, approved: boolean, reason?: string) => request(`/admin/verify/${transferId}?approved=${approved}${reason ? `&rejection_reason=${encodeURIComponent(reason)}` : ""}`, { method: "PATCH" }),
  users: (role?: string) => request(`/admin/users${role ? `?role=${role}` : ""}`),
  removeUser: (id: string) => request(`/admin/users/${id}`, { method: "DELETE" }),
  removePost: (id: string) => request(`/admin/posts/${id}`, { method: "DELETE" }),
  stats: () => request("/admin/stats"),
};
