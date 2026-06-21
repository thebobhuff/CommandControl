import Link from "next/link";
import { Gamepad2, Monitor, Save, Tablet, TabletSmartphone } from "lucide-react";
import { BackgroundBeams } from "@/components/aceternity/background-beams";
import { ActiveGamesList } from "@/components/active-games-list";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-background">
      <BackgroundBeams />
      <section className="relative z-10 mx-auto flex min-h-screen w-full max-w-5xl flex-col justify-center gap-8 px-6 py-12">
        <div className="flex items-center gap-3 text-primary">
          <Gamepad2 className="h-9 w-9" />
          <span className="text-sm font-semibold uppercase tracking-wider">Commander Control</span>
        </div>
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
          <Button asChild size="lg" variant="outline">
            <Link href="/games">
              <Save className="h-5 w-5" />
              Saved Games
            </Link>
          </Button>
        </div>
        <ActiveGamesList />
      </section>
    </main>
  );
}
