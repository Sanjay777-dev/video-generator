import Generator from "@/components/Generator";
import SiteHeader from "@/components/SiteHeader";

export default function HomePage() {
  return (
    <main className="min-h-screen">
      <SiteHeader />
      <section id="studio" className="mx-auto max-w-7xl px-5 pb-16 pt-12 sm:px-8 sm:pt-20">
        <div className="mx-auto mb-10 max-w-3xl text-center">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-violet-300/20 bg-violet-300/[0.07] px-3 py-1.5 text-xs text-violet-200">
            <span className="h-1.5 w-1.5 rounded-full bg-violet-300" /> Your imagination, in motion
          </div>
          <h1 className="text-4xl font-semibold tracking-tight sm:text-6xl">Make videos from <span className="bg-gradient-to-r from-violet-200 to-fuchsia-300 bg-clip-text text-transparent">your ideas.</span></h1>
          <p className="mx-auto mt-5 max-w-xl text-sm leading-6 text-zinc-400 sm:text-base">Describe a moment, upload an image, and create your next visual story. No credits. Just create.</p>
        </div>
        <Generator />
        <footer className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-line pt-5 text-xs text-zinc-600 sm:flex-row">
          <span>VidForge · Made for creative exploration</span>
          <span>Local generation · Your media stays on your machine</span>
        </footer>
      </section>
    </main>
  );
}
