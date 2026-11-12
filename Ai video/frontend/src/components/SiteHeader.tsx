"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSession } from "@/components/SessionProvider";

export default function SiteHeader() {
  const { session, setSession } = useSession();
  const [theme, setTheme] = useState("dark");
  useEffect(() => {
    const saved = localStorage.getItem("vidforge_theme") ?? "dark";
    setTheme(saved);
    document.documentElement.dataset.theme = saved;
  }, []);
  function toggleTheme() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    localStorage.setItem("vidforge_theme", next);
    document.documentElement.dataset.theme = next;
  }
  return (
    <header className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 sm:px-8">
      <Link href="/" className="flex items-center gap-2.5 text-lg font-bold tracking-tight">
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-violet text-sm text-[#16111f]">V</span>
        VidForge
      </Link>
      <nav className="flex items-center gap-3 text-sm text-zinc-400 sm:gap-5">
        <button type="button" onClick={toggleTheme} aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`} className="rounded-lg border border-line px-2.5 py-2 text-xs text-zinc-300">{theme === "dark" ? "☼" : "☾"}</button>
        <Link href="/gallery" className="transition hover:text-white">Gallery</Link>
        {session && <Link href="/history" className="transition hover:text-white">My creations</Link>}
        {session?.isAdmin && <Link href="/admin" className="transition hover:text-white">Admin</Link>}
        {session ? (
          <button type="button" onClick={() => setSession(null)} className="rounded-lg border border-line px-3 py-2 text-xs text-zinc-300 hover:bg-white/5">
            Sign out
          </button>
        ) : (
          <Link href="/login" className="rounded-lg border border-line px-3 py-2 text-xs text-zinc-200 hover:bg-white/5">Sign in</Link>
        )}
      </nav>
    </header>
  );
}
