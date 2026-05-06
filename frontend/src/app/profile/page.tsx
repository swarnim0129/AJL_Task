"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/app/layout";

export default function ProfileRedirectPage() {
  const { currentUser } = useApp();
  const router = useRouter();

  useEffect(() => {
    if (currentUser) {
      router.replace(`/profile/${currentUser.id}`);
    } else {
      router.replace("/");
    }
  }, [currentUser, router]);

  return (
    <div className="card animate-in">
      <div className="card-body" style={{ textAlign: "center", padding: 48 }}>
        <div className="skeleton" style={{ width: 80, height: 80, borderRadius: "50%", margin: "0 auto 20px" }}></div>
        <div className="skeleton" style={{ height: 24, width: "60%", margin: "0 auto 12px" }}></div>
        <div className="skeleton" style={{ height: 16, width: "40%", margin: "0 auto" }}></div>
        <p style={{ marginTop: 24, color: "var(--text-tertiary)" }}>Redirecting to your profile...</p>
      </div>
    </div>
  );
}
