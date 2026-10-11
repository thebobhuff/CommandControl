"use client";
import Link from "next/link";
import { ArrowUpRight, Monitor, Settings2, Tablet } from "lucide-react";
import { BentoGrid, BentoGridItem } from "@/components/aceternity/bento-grid";
import { ButtonLink } from "@/components/motion/button/base";

export function ModeSelection() {
  return (
    <BentoGrid className="mode-grid md:auto-rows-auto">
      <BentoGridItem className="mode-primary" title="Just your table." icon={<Tablet className="size-6 text-primary" />} header={<div className="mode-illustration" aria-hidden="true"><div className="mini-tablet"><span>40</span><span>40</span><span>40</span><span>40</span></div></div>} description={<><p>One tablet. Four players. Life totals, damage, and counters right where you need them.</p><ButtonLink href="/tablet" className="mt-5 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">Play on a tablet <ArrowUpRight className="size-4" /></ButtonLink></>} />
      <BentoGridItem title="Make it a game night." icon={<Monitor className="size-6 text-primary" />} header={<div className="mode-illustration" aria-hidden="true"><div className="mini-display"><span>40</span><span>40</span><span>40</span><span>40</span></div></div>} description={<><p>Control from your device. Put the whole table’s life totals and card art on the big screen.</p><Link href="/control" className="text-link mt-5">Set up tablet + TV <ArrowUpRight className="size-4" /></Link></>} />
      <BentoGridItem title="Your table, your rules." icon={<Settings2 className="size-6 text-primary" />} header={<div className="flex flex-1 flex-col justify-center gap-3 py-5" aria-hidden="true"><div className="preview-setting"><span>Starting life</span><strong>40</strong></div><div className="preview-setting"><span>Players</span><strong>Your pod</strong></div><div className="preview-setting"><span>Game variants</span><strong>Ready</strong></div></div>} description={<><p>Add players, choose commanders, and bring Planechase or Archenemy to the table.</p><Link href="/control" className="text-link mt-5">Customize your table <ArrowUpRight className="size-4" /></Link></>} />
    </BentoGrid>
  );
}
