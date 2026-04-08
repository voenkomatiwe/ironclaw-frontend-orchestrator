import { useMemo } from "react";
import { useExtensions } from "@/extensions/queries";

const BASE_SUGGESTIONS = [
  "Analyze my portfolio",
  "Set up notifications",
  "Create a routine",
  "Check job status",
  "Search memory",
  "Browse extensions",
  "Run a new task",
  "Show active jobs",
];

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}

export function useSuggestions() {
  const { data: extensions } = useExtensions();

  return useMemo(() => {
    const dynamic = (extensions ?? [])
      .filter((e) => e.active)
      .map((e) => `Use ${e.display_name || e.name}`);

    const all = [...new Set([...BASE_SUGGESTIONS, ...dynamic])];
    const shuffled = shuffle(all);

    const mid = Math.ceil(shuffled.length / 2);
    return {
      topRow: shuffled.slice(0, mid),
      bottomRow: shuffled.slice(mid),
    };
  }, [extensions]);
}
