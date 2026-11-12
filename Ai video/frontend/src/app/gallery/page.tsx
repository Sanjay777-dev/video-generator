import SiteHeader from "@/components/SiteHeader";
import VideoGrid from "@/components/VideoGrid";
import { getGallery } from "@/lib/api";

export default function GalleryPage() {
  return (
    <main className="min-h-screen">
      <SiteHeader />
      <section className="mx-auto max-w-7xl px-5 pb-16 pt-8 sm:px-8">
        <div className="mb-8">
          <p className="text-xs uppercase tracking-[0.2em] text-violet-200">Community canvas</p>
          <h1 className="mt-3 text-3xl font-semibold">Video gallery</h1>
          <p className="mt-2 text-sm text-zinc-500">Recently generated videos from this VidForge instance.</p>
        </div>
        <VideoGrid load={getGallery} />
      </section>
    </main>
  );
}
