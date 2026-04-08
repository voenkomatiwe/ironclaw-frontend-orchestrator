import { cn } from "@/common/lib/utils";

type SuggestionsMarqueeProps = {
  topRow: string[];
  bottomRow: string[];
  onSelect: (suggestion: string) => void;
};

function MarqueeRow({
  items,
  direction,
  onSelect,
}: {
  items: string[];
  direction: "left" | "right";
  onSelect: (s: string) => void;
}) {
  const doubled = [...items, ...items];
  const speed = direction === "left" ? "30s" : "28s";
  const animationName = direction === "left" ? "marquee-left" : "marquee-right";

  return (
    <div className="relative mask-[linear-gradient(to_right,transparent,black_5%,black_95%,transparent)] overflow-hidden">
      <div
        className="inline-flex gap-2 hover:[animation-play-state:paused]"
        style={{
          animation: `${animationName} ${speed} linear infinite`,
        }}
      >
        {doubled.map((text, i) => (
          <button
            className={cn(
              "shrink-0 whitespace-nowrap rounded-full",
              "bg-surface-low px-3.5 py-1.5 text-xs text-muted-foreground",
              "border border-transparent transition-colors",
              "hover:border-primary/30 hover:text-foreground"
            )}
            key={`${text}-${i}`}
            onClick={() => onSelect(text)}
            type="button"
          >
            {text}
          </button>
        ))}
      </div>
    </div>
  );
}

export function SuggestionsMarquee({ topRow, bottomRow, onSelect }: SuggestionsMarqueeProps) {
  if (topRow.length === 0 && bottomRow.length === 0) return null;

  return (
    <div className="space-y-2 border-border/50 border-t pt-4">
      {topRow.length > 0 && (
        <MarqueeRow direction="left" items={topRow} onSelect={onSelect} />
      )}
      {bottomRow.length > 0 && (
        <MarqueeRow direction="right" items={bottomRow} onSelect={onSelect} />
      )}
    </div>
  );
}
