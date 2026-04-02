const COLOR_PAIRS = [
  { bg: "bg-violet-500/20", text: "text-violet-300" },
  { bg: "bg-blue-500/20", text: "text-blue-300" },
  { bg: "bg-amber-500/20", text: "text-amber-300" },
  { bg: "bg-rose-500/20", text: "text-rose-300" },
  { bg: "bg-teal-500/20", text: "text-teal-300" },
  { bg: "bg-orange-500/20", text: "text-orange-300" },
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
