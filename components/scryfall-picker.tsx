"use client";

import { useState } from "react";
import { ImageIcon, Loader2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type ScryfallCard = {
  id: string;
  name: string;
  image_uris?: {
    art_crop?: string;
    normal?: string;
  };
  card_faces?: Array<{
    image_uris?: {
      art_crop?: string;
      normal?: string;
    };
  }>;
};

type SearchResult = {
  data?: ScryfallCard[];
};

export function ScryfallPicker({
  onSelect
}: {
  onSelect: (imageUrl: string, cardName: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [cards, setCards] = useState<ScryfallCard[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function search() {
    const trimmed = query.trim();
    if (!trimmed) {
      return;
    }

    setLoading(true);
    setError("");
    try {
      const response = await fetch(
        `https://api.scryfall.com/cards/search?q=${encodeURIComponent(trimmed)}&unique=cards&order=name`
      );
      if (!response.ok) {
        throw new Error("No matching cards found.");
      }
      const result = (await response.json()) as SearchResult;
      setCards((result.data ?? []).slice(0, 8));
    } catch (searchError) {
      setCards([]);
      setError(searchError instanceof Error ? searchError.message : "Search failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              void search();
            }
          }}
          placeholder="Search Scryfall card art"
        />
        <Button type="button" size="icon" onClick={() => void search()} aria-label="Search Scryfall">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
        </Button>
      </div>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {cards.length > 0 ? (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {cards.map((card) => {
            const imageUrl =
              card.image_uris?.art_crop ??
              card.card_faces?.[0]?.image_uris?.art_crop ??
              card.image_uris?.normal ??
              card.card_faces?.[0]?.image_uris?.normal ??
              "";

            return (
              <button
                key={card.id}
                type="button"
                className="group overflow-hidden rounded-md border border-border bg-muted text-left transition hover:border-primary"
                onClick={() => imageUrl && onSelect(imageUrl, card.name)}
                disabled={!imageUrl}
              >
                {imageUrl ? (
                  <img src={imageUrl} alt="" className="h-24 w-full object-cover transition group-hover:scale-105" />
                ) : (
                  <div className="flex h-24 items-center justify-center text-muted-foreground">
                    <ImageIcon className="h-5 w-5" />
                  </div>
                )}
                <span className="block truncate px-2 py-1 text-xs">{card.name}</span>
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
