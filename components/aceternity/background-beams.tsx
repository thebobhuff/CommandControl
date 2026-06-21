import { cn } from "@/lib/utils";

export function BackgroundBeams({ className }: { className?: string }) {
  return (
    <div className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)} aria-hidden="true">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(244,184,64,0.18),transparent_28%),radial-gradient(circle_at_80%_0%,rgba(30,150,136,0.18),transparent_30%),linear-gradient(145deg,rgba(11,16,28,0.98),rgba(18,26,35,0.92))]" />
      <div className="absolute left-[-20%] top-1/4 h-28 w-[140%] animate-beam bg-gradient-to-r from-transparent via-primary/25 to-transparent blur-2xl" />
      <div className="absolute bottom-16 right-[-25%] h-24 w-[120%] animate-beam bg-gradient-to-r from-transparent via-accent/20 to-transparent blur-2xl [animation-delay:-6s]" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:64px_64px] opacity-30" />
    </div>
  );
}
