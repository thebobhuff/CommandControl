"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Gamepad2, Home, LogIn, Save, UsersRound, UserRound } from "lucide-react";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { createClient } from "@/utils/supabase/client";

type NavProfile = {
  email: string;
  displayName: string;
  favoriteCommander: string;
  profileImage: string;
};

type AuthUser = {
  email?: string;
  user_metadata?: Record<string, unknown>;
};

function readTextMetadata(metadata: Record<string, unknown>, key: string) {
  const value = metadata[key];
  return typeof value === "string" ? value : "";
}

function getNavProfile(user: AuthUser | null | undefined): NavProfile | null {
  if (!user?.email) {
    return null;
  }

  const metadata = user.user_metadata ?? {};

  return {
    email: user.email,
    displayName: readTextMetadata(metadata, "display_name"),
    favoriteCommander: readTextMetadata(metadata, "favorite_commander"),
    profileImage: readTextMetadata(metadata, "profile_image")
  };
}

export function InteriorNav() {
  const pathname = usePathname();
  const [profile, setProfile] = useState<NavProfile | null>(null);

  useEffect(() => {
    const supabase = createClient();

    void supabase.auth.getUser().then(({ data }) => {
      setProfile(getNavProfile(data.user));
    });

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setProfile(getNavProfile(session?.user));
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <nav className="rounded-lg border border-border bg-background/80 p-3 backdrop-blur">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Link href="/" className="flex items-center gap-3 text-primary">
          <Gamepad2 className="h-8 w-8" />
          <div>
            <span className="block text-sm font-semibold uppercase tracking-wider">Commander Control</span>
            <span className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">By Shiny Spells!</span>
          </div>
        </Link>
        <div className="flex flex-wrap items-center gap-2">
          <Button asChild size="sm" variant={pathname === "/" ? "secondary" : "ghost"}>
            <Link href="/">
              <Home className="h-4 w-4" />
              Home
            </Link>
          </Button>
          <Button asChild size="sm" variant={pathname === "/games" ? "secondary" : "ghost"}>
            <Link href="/games">
              <Save className="h-4 w-4" />
              Games
            </Link>
          </Button>
          <Button asChild size="sm" variant={pathname === "/players" ? "secondary" : "ghost"}>
            <Link href="/players">
              <UsersRound className="h-4 w-4" />
              Players
            </Link>
          </Button>
          {profile ? (
            <Button asChild size="sm" variant={pathname === "/profile" ? "secondary" : "outline"}>
              <Link href="/profile" aria-label="Open profile">
                {profile.profileImage ? (
                  <span
                    aria-hidden="true"
                    className="h-6 w-6 shrink-0 rounded-full border border-primary/35 bg-muted bg-cover bg-center"
                    style={{ backgroundImage: `url(${profile.profileImage})` }}
                  />
                ) : (
                  <UserRound className="h-4 w-4" />
                )}
                <span className="max-w-32 truncate">
                  {profile.displayName || profile.favoriteCommander || profile.email}
                </span>
              </Link>
            </Button>
          ) : (
            <Button asChild size="sm" variant={pathname === "/login" ? "secondary" : "default"}>
              <Link href="/login">
                <LogIn className="h-4 w-4" />
                Login
              </Link>
            </Button>
          )}
        </div>
      </div>
    </nav>
  );
}
