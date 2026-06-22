import Image from "next/image";
import { cn } from "@/lib/utils";

export function BrandIcon({ className }: { className?: string }) {
  return (
    <span className={cn("relative block shrink-0 overflow-hidden rounded-md border border-primary/35 bg-black", className)}>
      <Image
        src="/icons/commander-control-icon.png"
        alt=""
        fill
        sizes="48px"
        className="object-cover"
        priority
      />
    </span>
  );
}
