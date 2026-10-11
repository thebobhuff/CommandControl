"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, Gamepad2, Menu, Monitor, Settings2, Tablet, UsersRound, UserRound, X } from "lucide-react";
import { BrandIcon } from "@/components/brand-icon";
import { SharedLayoutBg } from "@/components/motion/shared-layout-bg";
import { Button } from "@/components/ui/button";
import { createClient } from "@/utils/supabase/client";
import { cn } from "@/lib/utils";

const links = [
  { href: "/games", label: "Games", icon: Gamepad2 },
  { href: "/players", label: "Players", icon: UsersRound },
  { href: "/control", label: "Table setup", icon: Settings2 },
  { href: "/tablet", label: "Tablet", icon: Tablet },
  { href: "/display", label: "TV display", icon: Monitor },
];

export function AppNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [profile, setProfile] = useState<{ email: string; name: string; image: string } | null>(null);
  useEffect(() => {
    const supabase = createClient();
    const update = (user: { email?: string; user_metadata?: Record<string, unknown> } | null) => {
      if (!user?.email) { setProfile(null); return; }
      const data = user.user_metadata ?? {};
      setProfile({ email: user.email, name: typeof data.display_name === "string" && data.display_name ? data.display_name : typeof data.favorite_commander === "string" && data.favorite_commander ? data.favorite_commander : user.email, image: typeof data.profile_image === "string" ? data.profile_image : "" });
    };
    void supabase.auth.getUser().then(({ data }) => update(data.user));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => update(session?.user ?? null));
    return () => subscription.unsubscribe();
  }, []);
  useEffect(() => { setOpen(false); }, [pathname]);
  return (
    <nav aria-label="Main navigation" className="app-nav">
      <div className="flex min-w-0 items-center justify-between gap-4">
        <Link href="/" className="brand-link" aria-label="Commander Control home">
          <BrandIcon className="size-10 shrink-0" />
          <span><span className="block font-display text-2xl font-semibold leading-none text-foreground">Commander Control</span><span className="mt-1 block text-[10px] uppercase tracking-[0.18em] text-muted-foreground">By Shiny Spells!</span></span>
        </Link>
        <Button variant="ghost" size="icon" className="lg:hidden" aria-label={open ? "Close navigation" : "Open navigation"} aria-expanded={open} aria-controls="navigation-links" onClick={() => setOpen(!open)}>{open ? <X className="size-5" /> : <Menu className="size-5" />}</Button>
      </div>
      <div id="navigation-links" className={cn("nav-links", open && "nav-links-open")}>
        <SharedLayoutBg inset={0} className="nav-primary" pillClassName="rounded-md bg-muted" aria-label="App screens">
          {links.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href} aria-current={pathname === href ? "page" : undefined} className={cn("nav-item", pathname === href && "nav-item-active")}><span className="flex items-center gap-2"><Icon className="size-4" aria-hidden="true" />{label}</span></Link>
          ))}
        </SharedLayoutBg>
        <div className="flex flex-wrap items-center gap-2">
          {profile?.email.toLowerCase() === "bob@thebobhuff.com" && <Button asChild variant="ghost" size="sm"><Link href="/admin" aria-current={pathname === "/admin" ? "page" : undefined}><BarChart3 className="size-4" />Admin</Link></Button>}
          <Button asChild variant={profile ? "outline" : "default"} size="sm"><Link href={profile ? "/profile" : "/login"} aria-current={pathname === (profile ? "/profile" : "/login") ? "page" : undefined}>{profile ? <>{profile.image ? <img src={profile.image} alt="" className="size-6 rounded-full object-cover" /> : <UserRound className="size-4" />}<span className="max-w-28 truncate">{profile.name}</span></> : "Sign in"}</Link></Button>
        </div>
      </div>
    </nav>
  );
}
