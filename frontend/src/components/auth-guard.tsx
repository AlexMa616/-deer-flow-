"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { getToken } from "@/lib/auth";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [checked, setChecked] = useState(false);
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const syncAuth = () => {
      const token = getToken();
      setAuthed(Boolean(token));
      setChecked(true);
    };

    syncAuth();
    window.addEventListener("storage", syncAuth);
    window.addEventListener("focus", syncAuth);
    return () => {
      window.removeEventListener("storage", syncAuth);
      window.removeEventListener("focus", syncAuth);
    };
  }, []);

  if (!checked) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex items-center gap-3 text-muted-foreground">
          <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          验证登录状态...
        </div>
      </div>
    );
  }

  if (!authed) {
    return (
      <div className="flex h-screen items-center justify-center bg-background p-6">
        <div className="max-w-md rounded-2xl border border-slate-200 bg-white/90 p-5 text-center shadow-[0_16px_40px_rgba(15,23,42,0.08)]">
          <h2 className="text-lg font-semibold text-slate-900">登录状态已失效</h2>
          <p className="mt-2 text-sm text-slate-600">
            为了避免页面来回跳转，这里已改为手动登录。点击下面按钮重新进入登录页。
          </p>
          <button
            type="button"
            className="mt-4 inline-flex items-center justify-center rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
            onClick={() => router.replace("/login")}
          >
            前往登录
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
