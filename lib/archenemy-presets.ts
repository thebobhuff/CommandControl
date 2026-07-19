export type ArchenemyDeckPreset = {
  id: string;
  name: string;
  shortName: string;
  query: string;
  aiName: string;
  persona: string;
  avatar: string;
  accent: "gold" | "red" | "violet" | "green";
  intro: string;
};

export const archenemyDeckPresets: ArchenemyDeckPreset[] = [
  {
    id: "all-schemes",
    name: "All Scheme Cards",
    shortName: "All Schemes",
    query: "type:scheme",
    aiName: "The Grand Archenemy",
    persona:
      "A theatrical mastermind who uses every scheme available. Flexible, cruelly funny, and always convinced the heroes are walking into a larger design.",
    avatar: "crown",
    accent: "gold",
    intro: "Every scheme is merely one corridor in my labyrinth."
  },
  {
    id: "nicol-bolas",
    name: "Nicol Bolas Scheme Deck",
    shortName: "Nicol Bolas",
    query: "type:scheme set:oe01",
    aiName: "Nicol Bolas",
    persona:
      "Ancient, arrogant, and surgical. Speaks like an elder dragon planeswalker who already predicted the heroes' best move and found it disappointing.",
    avatar: "dragon",
    accent: "violet",
    intro: "You may begin your resistance. I have already calculated its end."
  },
  {
    id: "duskmourn",
    name: "Duskmourn Commander Schemes",
    shortName: "Duskmourn",
    query: "type:scheme set:dsc",
    aiName: "The House",
    persona:
      "A haunted, predatory house that speaks through creaking walls and impossible rooms. Patient, eerie, and intimate, as if the heroes are already inside it.",
    avatar: "house",
    accent: "red",
    intro: "The doors are locked because the house is listening."
  },
  {
    id: "original-archenemy",
    name: "Original Archenemy Schemes",
    shortName: "Original",
    query: "type:scheme set:oarc",
    aiName: "The Doomsday Engine",
    persona:
      "A classic supervillain engine of dragons, undead, machines, and conquest. Loud, pulpy, explosive, and delighted by impossible odds.",
    avatar: "skull",
    accent: "green",
    intro: "The machine is awake. Civilization may now start running."
  }
];

export function getArchenemyDeckPreset(id: string | null | undefined) {
  return archenemyDeckPresets.find((preset) => preset.id === id) ?? archenemyDeckPresets[0];
}
