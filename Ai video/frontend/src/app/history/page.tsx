import SiteHeader from "@/components/SiteHeader";
import VideoGrid from "@/components/VideoGrid";
import { getHistory } from "@/lib/api";

export default function HistoryPage() {
  return (
    <main className="min-h-screen">
      <SiteHeader />
      <section className="mx-auto max-w-7xl px-5 pb-16 pt-8 sm:px-8">
        <div className="mb-8">
          <p className="text-xs uppercase tracking-[0.2em] text-violet-200">Your library</p>
          <h1 className="mt-3 text-3xl font-semibold">My creations</h1>
          <p className="mt-2 text-sm text-zinc-500">Your account-linked jobs and completed videos.</p>
        </div>
        <VideoGrid load={getHistory} canDelete />
      </section>
    </main>
  );
}
