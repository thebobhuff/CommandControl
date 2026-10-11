import Link from "next/link";
import { ArrowRight, ArrowUpRight, Mail, Monitor, PlayCircle, Shield, ScrollText, Swords } from "lucide-react";
import { ActiveGamesList } from "@/components/active-games-list";
import { HomeNav } from "@/components/home-nav";
import { ModeSelection } from "@/components/mode-selection";
import { Button } from "@/components/ui/button";
import { siteConfig } from "@/lib/site";

export default function Home() {
  const jsonLd = { "@context": "https://schema.org", "@type": "SoftwareApplication", name: siteConfig.name, applicationCategory: "GameApplication", operatingSystem: "Web", url: siteConfig.url, description: siteConfig.description, offers: { "@type": "Offer", price: "0", priceCurrency: "USD" }, featureList: ["Tablet Commander life tracker", "TV display", "Saved player profiles with Scryfall art", "Commander damage", "Planechase and Archenemy", "Shareable view-only game links"] };
  return (
    <main id="main-content" className="home-page">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="home-container">
        <HomeNav />
        <section className="home-hero">
          <div className="hero-copy">
            <h1>Less counting.<br />More <em>Commander.</em></h1>
            <p>Your MTG Commander life tracker for tablet and TV. Track the whole table, keep every counter in view, and get back to the game.</p>
            <div className="flex flex-wrap items-center gap-3">
              <Button asChild size="lg"><Link href="/tablet">Start playing <ArrowRight className="size-4" /></Link></Button>
              <a href="#how-to" className="text-link px-2 py-3">See how it works <ArrowUpRight className="size-4" /></a>
            </div>
            <p className="hero-note">Free to play. No account needed for local games.</p>
          </div>
          <div className="hero-art">
            <img src="/hero-commander-display.png" alt="Commander Control game display showing player boards and life totals" width="2048" height="1263" fetchPriority="high" />
            <div className="hero-art-caption"><Monitor className="size-4 text-primary" /><span>The whole table. One shared view.</span></div>
          </div>
        </section>
        <ActiveGamesList />
        <section id="play" className="home-section">
          <div className="section-heading"><h2>Pick your setup.</h2><p>From a quick round to the full living-room experience.</p></div>
          <ModeSelection />
        </section>
        <section className="variant-section home-section">
          <div><h2>A little chaos<br />goes a long way.</h2><p className="mt-4 max-w-sm text-muted-foreground leading-7">Keep Commander damage, planar decks, and schemes alongside the game. Less bookkeeping. More table politics.</p></div>
          <div className="variant-links">
            <ToolLink href="/commander-damage-tracker" title="Commander damage" description="Track damage from every opponent." icon={<Swords className="size-5" />} />
            <ToolLink href="/planechase" title="Planechase" description="Reveal planes and roll the planar die." icon={<ScrollText className="size-5" />} />
            <ToolLink href="/archenemy" title="Archenemy" description="Set schemes in motion. Take on the table." icon={<Shield className="size-5" />} />
            <Link href="/mtg-commander-life-tracker" className="text-link mt-4">Explore the life tracker <ArrowRight className="size-4" /></Link>
          </div>
        </section>
        <section id="how-to" className="home-section how-to-section">
          <div className="section-heading"><h2>Cards out. Game on.</h2><p>Three steps to a table that keeps up.</p></div>
          <div className="how-to-grid">
            <HowToStep step="1" title="Set your table" body="Open table setup, choose your starting life, and add your players. Sign in if you want to save games and profiles." href="/control" action="Table setup" />
            <HowToStep step="2" title="Choose your screen" body="Play directly on a tablet, or open the TV display on another device for a shared view of the game." href="/display" action="TV display" />
            <HowToStep step="3" title="Let the game unfold" body="Tap life totals, track Commander damage and poison, and mark the monarch without losing your place." href="/tablet" action="Tablet mode" />
          </div>
          <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2"><a href="https://www.youtube.com/watch?v=eaNjXcAqCAY" target="_blank" rel="noreferrer" className="text-link"><PlayCircle className="size-4" />Learn Commander</a><a href="https://www.youtube.com/watch?v=wC98RS2YvJk" target="_blank" rel="noreferrer" className="text-link"><PlayCircle className="size-4" />Learn Planechase</a><a href="https://www.youtube.com/watch?v=HRT9PeDnX1E" target="_blank" rel="noreferrer" className="text-link"><PlayCircle className="size-4" />Learn Archenemy</a></div>
        </section>
        <footer className="home-footer"><span>Commander Control <span className="text-muted-foreground">by Shiny Spells!</span></span><a href="mailto:bob@thebobhuff.com" className="text-link"><Mail className="size-4" />Support</a></footer>
      </div>
    </main>
  );
}
function ToolLink({ href, title, description, icon }: { href: string; title: string; description: string; icon: React.ReactNode }) { return <Link href={href} className="tool-link"><span className="tool-icon">{icon}</span><span><strong className="block font-medium">{title}</strong><span className="mt-1 block text-sm text-muted-foreground">{description}</span></span><ArrowUpRight className="ml-auto size-4 shrink-0 text-muted-foreground" /></Link>; }
function HowToStep({ step, title, body, href, action }: { step: string; title: string; body: string; href: string; action: string }) { return <article className="how-to-step"><span className="step-number">{step}</span><h3>{title}</h3><p>{body}</p><Link href={href} className="text-link">{action}<ArrowRight className="size-4" /></Link></article>; }
