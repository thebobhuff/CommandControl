import { cn } from "@/lib/utils";

/** Quiet shared surface; gameplay and card art carry the visual emphasis. */
export function BackgroundBeams({ className }: { className?: string }) {
  return <div className={cn("pointer-events-none absolute inset-0 bg-background", className)} aria-hidden="true" />;
}
