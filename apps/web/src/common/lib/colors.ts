const COLOR_PAIRS = [
  { bg: "bg-chart-1/20", text: "text-chart-1" },
  { bg: "bg-chart-2/20", text: "text-chart-2" },
  { bg: "bg-chart-3/20", text: "text-chart-3" },
  { bg: "bg-chart-4/20", text: "text-chart-4" },
  { bg: "bg-chart-5/20", text: "text-chart-5" },
  { bg: "bg-primary-container/80", text: "text-primary" },
];

export function hashColor(name: string): { bg: string; text: string } {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return COLOR_PAIRS[h % COLOR_PAIRS.length]!;
}

export function initials(name: string): string {
  return name
    .split("-")
    .map((w) => w[0]?.toUpperCase() ?? "")
    .slice(0, 2)
    .join("");
}
