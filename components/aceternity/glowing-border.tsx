import { cn } from "@/lib/utils";

export function GlowingBorder({
  children,
  className
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("relative rounded-lg p-px", className)}>
      <div className="absolute inset-0 rounded-lg bg-[linear-gradient(110deg,rgba(244,184,64,0.9),rgba(30,150,136,0.7),rgba(185,43,79,0.75),rgba(244,184,64,0.9))] bg-[length:200%_100%] opacity-80 blur-[1px] animate-shimmer" />
      <div className="relative rounded-lg bg-card">{children}</div>
    </div>
  );
}
