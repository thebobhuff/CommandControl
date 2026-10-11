import { cn } from "@/lib/utils";

export function GlowingBorder({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("player-control-shell relative overflow-hidden rounded-xl border border-border bg-card", className)}>{children}</div>;
}
