"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, LogOut, Save, UserRound } from "lucide-react";
import { BackgroundBeams } from "@/components/aceternity/background-beams";
import { InteriorNav } from "@/components/interior-nav";
import { ScryfallPicker } from "@/components/scryfall-picker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/utils/supabase/client";

type ProfileMetadata = {
  display_name?: string;
  favorite_commander?: string;
  profile_image?: string;
};

export default function ProfilePage() {
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [favoriteCommander, setFavoriteCommander] = useState("");
  const [profileImage, setProfileImage] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const supabase = createClient();
    void supabase.auth.getUser().then(({ data }) => {
      const user = data.user;
      setEmail(user?.email ?? "");
      const metadata = (user?.user_metadata ?? {}) as ProfileMetadata;
      setDisplayName(metadata.display_name ?? "");
      setFavoriteCommander(metadata.favorite_commander ?? "");
      setProfileImage(metadata.profile_image ?? "");
      setLoading(false);
    });
  }, []);

  async function saveProfile() {
    setSaving(true);
    setMessage("");
    setError("");

    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({
      data: {
        display_name: displayName,
        favorite_commander: favoriteCommander,
        profile_image: profileImage
      }
    });

    setSaving(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    setMessage("Profile saved.");
  }

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  return (
    <main className="safe-screen relative overflow-hidden bg-background">
      <BackgroundBeams />
      <section className="relative z-10 mx-auto flex w-full max-w-4xl flex-col gap-4 px-4 py-5">
        <InteriorNav />
        <header className="flex flex-col gap-3 rounded-lg border border-border bg-background/75 p-4 backdrop-blur sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-black">Profile setup</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {email || "Login to set up your profile."}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="secondary">
              <Link href="/players">
                <UserRound className="h-4 w-4" />
                Saved Players
              </Link>
            </Button>
            {email ? (
              <Button type="button" variant="outline" onClick={() => void signOut()}>
                <LogOut className="h-4 w-4" />
                Logout
              </Button>
            ) : null}
          </div>
        </header>

        <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
          <div className="overflow-hidden rounded-lg border border-border bg-card">
            <div
              className="h-48 bg-muted bg-cover bg-center"
              style={{ backgroundImage: profileImage ? `url(${profileImage})` : undefined }}
            />
            <div className="p-4">
              <div className="flex items-center gap-2 text-primary">
                <UserRound className="h-4 w-4" />
                <span className="text-sm font-black uppercase tracking-wider">Account</span>
              </div>
              <h2 className="mt-2 truncate text-xl font-black">{displayName || "Your profile"}</h2>
              {favoriteCommander ? <p className="mt-1 truncate text-sm text-muted-foreground">{favoriteCommander}</p> : null}
            </div>
          </div>

          <div className="rounded-lg border border-border bg-card p-4">
            {loading ? (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading profile...
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="display-name">Display name</Label>
                  <Input id="display-name" value={displayName} onChange={(event) => setDisplayName(event.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="favorite-commander">Favorite commander</Label>
                  <Input id="favorite-commander" value={favoriteCommander} onChange={(event) => setFavoriteCommander(event.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="profile-image">Profile image</Label>
                  <div className="grid grid-cols-[1fr_auto] gap-2">
                    <Input id="profile-image" value={profileImage} onChange={(event) => setProfileImage(event.target.value)} placeholder="https://..." />
                    <Button type="button" variant="outline" onClick={() => setProfileImage("")} disabled={!profileImage}>
                      Clear
                    </Button>
                  </div>
                  <ScryfallPicker
                    onSelect={(imageUrl, cardName) => {
                      setProfileImage(imageUrl);
                      if (!favoriteCommander) {
                        setFavoriteCommander(cardName);
                      }
                    }}
                  />
                </div>
                <Button className="w-full" onClick={() => void saveProfile()} disabled={!email || saving}>
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Save profile
                </Button>
                {message ? <p className="text-sm text-emerald-300">{message}</p> : null}
                {error ? <p className="text-sm text-destructive">{error}</p> : null}
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
