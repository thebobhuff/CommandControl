import Link from "next/link";
import { Gamepad2, LogIn, Mail, Monitor, Save, Tablet, TabletSmartphone, UserRound } from "lucide-react";
import { BackgroundBeams } from "@/components/aceternity/background-beams";
import { ActiveGamesList } from "@/components/active-games-list";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-background">
      <BackgroundBeams />
      <section className="relative z-10 mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-8 px-4 py-4 sm:px-6">
        <nav className="flex flex-col gap-3 rounded-lg border border-border bg-background/75 p-3 backdrop-blur md:flex-row md:items-center md:justify-between">
          <Link href="/" className="flex items-center gap-3 text-primary">
            <Gamepad2 className="h-9 w-9" />
            <div>
              <span className="block text-sm font-semibold uppercase tracking-wider">Commander Control</span>
              <span className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">By Shiny Spells!</span>
            </div>
          </Link>
          <div className="flex flex-wrap gap-2">
            <Button asChild size="sm" variant="ghost">
              <Link href="/tablet">
                <Tablet className="h-4 w-4" />
                Tablet
              </Link>
            </Button>
            <Button asChild size="sm" variant="ghost">
              <Link href="/control">
                <TabletSmartphone className="h-4 w-4" />
                Control
              </Link>
            </Button>
            <Button asChild size="sm" variant="ghost">
              <Link href="/display">
                <Monitor className="h-4 w-4" />
                TV
              </Link>
            </Button>
            <Button asChild size="sm" variant="ghost">
              <Link href="/players">
                <UserRound className="h-4 w-4" />
                Profiles
              </Link>
            </Button>
            <Button asChild size="sm" variant="outline">
              <Link href="/games">
                <Save className="h-4 w-4" />
                Games
              </Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/login">
                <LogIn className="h-4 w-4" />
                Login
              </Link>
            </Button>
          </div>
        </nav>

        <div className="flex flex-1 flex-col justify-center gap-8 py-10">
          <div className="max-w-3xl">
            <h1 className="text-5xl font-black leading-tight text-foreground md:text-7xl">
              Life totals built for the table and the big screen.
            </h1>
            <p className="mt-5 max-w-2xl text-lg text-muted-foreground">
              Run the game from a tablet, show player boards on a TV, and pull card art from Scryfall for custom player backgrounds.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg">
              <Link href="/tablet">
                <Tablet className="h-5 w-5" />
                Tablet Mode
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/control">
                <TabletSmartphone className="h-5 w-5" />
                Tablet Control
              </Link>
            </Button>
            <Button asChild size="lg" variant="secondary">
              <Link href="/display">
                <Monitor className="h-5 w-5" />
                TV Display
              </Link>
            </Button>
            <Button asChild size="lg" variant="ghost">
              <a href="mailto:bob@thebobhuff.com">
                <Mail className="h-5 w-5" />
                Support
              </a>
            </Button>
          </div>
          <ActiveGamesList />
        </div>
      </section>
    </main>
  );
}
