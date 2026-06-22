"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BookOpenCheck, LogIn, Monitor, Save, Tablet, TabletSmartphone, UserRound } from "lucide-react";
import { BrandIcon } from "@/components/brand-icon";
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

export function HomeNav() {
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
    <nav className="flex flex-col gap-3 rounded-lg border border-border bg-background/75 p-3 backdrop-blur md:flex-row md:items-center md:justify-between">
      <Link href="/" className="flex items-center gap-3 text-primary">
        <BrandIcon className="h-10 w-10" />
        <div>
          <span className="block text-sm font-semibold uppercase tracking-wider">Commander Control</span>
          <span className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">By Shiny Spells!</span>
        </div>
      </Link>
      <div className="flex flex-wrap items-center gap-2">
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
          <a href="#how-to">
            <BookOpenCheck className="h-4 w-4" />
            How-to
          </a>
        </Button>
        {profile ? (
          <>
            <Button asChild size="sm" variant="ghost">
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
            <Button asChild size="sm" variant="ghost">
              <Link href="/players">
                <UserRound className="h-4 w-4" />
                Players
              </Link>
            </Button>
            <Button asChild size="sm" variant="outline">
              <Link href="/games">
                <Save className="h-4 w-4" />
                Games
              </Link>
            </Button>
          </>
        ) : (
          <Button asChild size="sm">
            <Link href="/login">
              <LogIn className="h-4 w-4" />
              Login
            </Link>
          </Button>
        )}
      </div>
    </nav>
  );
}
