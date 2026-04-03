import {
  SiActivitypub,
  SiAnthropic,
  SiAsana,
  SiBluesky,
  SiBrave,
  SiBytedance,
  SiCloudflare,
  SiDiscord,
  SiElement,
  SiGithub,
  SiGmail,
  SiGooglecalendar,
  SiGooglechat,
  SiGoogledocs,
  SiGoogledrive,
  SiGooglesheets,
  SiGoogleslides,
  SiIntercom,
  SiLine,
  SiLinear,
  SiMastodon,
  SiMatrix,
  SiMattermost,
  SiN8n,
  SiNotion,
  SiReddit,
  SiRocketdotchat,
  SiSentry,
  SiSignal,
  SiStripe,
  SiTelegram,
  SiTwitch,
  SiWechat,
  SiWhatsapp,
  SiX,
  SiZoom,
} from "@icons-pack/react-simple-icons";
import { MessagesSquare, Package } from "lucide-react";
import type { ComponentType, SVGProps } from "react";
import { hashColor, initials } from "@/common/lib/colors";
import { cn } from "@/common/lib/utils";

type SimpleIcon = ComponentType<SVGProps<SVGSVGElement> & { title?: string; color?: string; size?: string | number }>;

type BrandRule = {
  test: RegExp;
  Icon: SimpleIcon;
  title: string;
};

/** Exact gateway extension `name` → brand (avoids false positives from descriptions). */
const EXTENSION_ID_ICONS: Record<string, { Icon: SimpleIcon; title: string }> = {
  asana: { Icon: SiAsana, title: "Asana" },
  cloudflare: { Icon: SiCloudflare, title: "Cloudflare" },
  discord: { Icon: SiDiscord, title: "Discord" },
  /** Lark / Feishu; Simple Icons has no Feishu — ByteDance parent brand. */
  feishu: { Icon: SiBytedance, title: "Feishu / Lark" },
  github: { Icon: SiGithub, title: "GitHub" },
  gmail: { Icon: SiGmail, title: "Gmail" },
  "google-calendar": { Icon: SiGooglecalendar, title: "Google Calendar" },
  "google-docs": { Icon: SiGoogledocs, title: "Google Docs" },
  "google-drive": { Icon: SiGoogledrive, title: "Google Drive" },
  "google-sheets": { Icon: SiGooglesheets, title: "Google Sheets" },
  "google-slides": { Icon: SiGoogleslides, title: "Google Slides" },
  intercom: { Icon: SiIntercom, title: "Intercom" },
  linear: { Icon: SiLinear, title: "Linear" },
  "llm-context": { Icon: SiBrave, title: "Brave" },
  notion: { Icon: SiNotion, title: "Notion" },
  sentry: { Icon: SiSentry, title: "Sentry" },
  stripe: { Icon: SiStripe, title: "Stripe" },
  telegram: { Icon: SiTelegram, title: "Telegram" },
  "telegram-mtproto": { Icon: SiTelegram, title: "Telegram" },
  "web-search": { Icon: SiBrave, title: "Brave" },
  whatsapp: { Icon: SiWhatsapp, title: "WhatsApp" },
};

/** Slack logo is not in @icons-pack/react-simple-icons — use a tinted chat glyph. */
const SLACK_EXTENSION_IDS = new Set(["slack", "slack-tool", "slack-relay"]);

const BRAND_RULES: BrandRule[] = [
  { test: /\btelegram\b|[-_]tg[-_]|^tg-/i, Icon: SiTelegram, title: "Telegram" },
  { test: /\bdiscord\b/i, Icon: SiDiscord, title: "Discord" },
  { test: /\bmattermost\b/i, Icon: SiMattermost, title: "Mattermost" },
  { test: /\bmatrix\b/i, Icon: SiMatrix, title: "Matrix" },
  { test: /\brocket\.?chat\b|rocketchat/i, Icon: SiRocketdotchat, title: "Rocket.Chat" },
  { test: /\bgoogle[\s-]?chat\b|googlechat/i, Icon: SiGooglechat, title: "Google Chat" },
  { test: /\belement\b.*\bmatrix\b|\bmatrix\b.*\belement\b/i, Icon: SiElement, title: "Element" },
  { test: /\bwhatsapp\b|\bwa[\s_-]?api\b/i, Icon: SiWhatsapp, title: "WhatsApp" },
  { test: /\bsignal\b/i, Icon: SiSignal, title: "Signal" },
  { test: /\bwechat\b|weixin/i, Icon: SiWechat, title: "WeChat" },
  { test: /(^|[-_\s/])line([-_/]|$)|linemessenger|line[-_]bot/i, Icon: SiLine, title: "LINE" },
  { test: /\bzoom\b/i, Icon: SiZoom, title: "Zoom" },
  { test: /\bmastodon\b/i, Icon: SiMastodon, title: "Mastodon" },
  { test: /\bbluesky\b|bsky\./i, Icon: SiBluesky, title: "Bluesky" },
  { test: /\bactivitypub\b|fediverse\b/i, Icon: SiActivitypub, title: "ActivityPub" },
  { test: /\breddit\b/i, Icon: SiReddit, title: "Reddit" },
  { test: /\btwitch\b/i, Icon: SiTwitch, title: "Twitch" },
  { test: /\btwitter\b|\bx\.com\b/i, Icon: SiX, title: "X" },
  { test: /\bgithub\b|gh[-_]/i, Icon: SiGithub, title: "GitHub" },
  { test: /\bn8n\b/i, Icon: SiN8n, title: "n8n" },
  { test: /\banthropic\b|\bclaude\b/i, Icon: SiAnthropic, title: "Anthropic" },
  { test: /\bbrave\b/i, Icon: SiBrave, title: "Brave" },
  { test: /\basana\b/i, Icon: SiAsana, title: "Asana" },
  { test: /\bcloudflare\b/i, Icon: SiCloudflare, title: "Cloudflare" },
  { test: /\bnotion\b/i, Icon: SiNotion, title: "Notion" },
  { test: /\bstripe\b/i, Icon: SiStripe, title: "Stripe" },
  { test: /\bsentry\b/i, Icon: SiSentry, title: "Sentry" },
  { test: /\bintercom\b/i, Icon: SiIntercom, title: "Intercom" },
  { test: /\bgmail\b/i, Icon: SiGmail, title: "Gmail" },
  { test: /\blinear\b/i, Icon: SiLinear, title: "Linear" },
];

function extensionBrandBlob(
  name: string,
  displayName?: string,
  description?: string | null,
  keywords?: string[]
): string {
  return [name, displayName ?? "", description ?? "", ...(keywords ?? [])].join(" ").toLowerCase();
}

function matchSimpleBrand(blob: string): BrandRule | null {
  for (const rule of BRAND_RULES) {
    if (rule.test.test(blob)) return rule;
  }
  return null;
}

export type ExtensionBrandAvatarProps = {
  name: string;
  displayName?: string;
  description?: string | null;
  keywords?: string[];
  className?: string;
};

export function ExtensionBrandAvatar({
  name,
  displayName,
  description,
  keywords,
  className,
}: ExtensionBrandAvatarProps) {
  const idEntry = EXTENSION_ID_ICONS[name];
  if (idEntry) {
    const Icon = idEntry.Icon;
    return (
      <div
        className={cn(
          "flex size-10 shrink-0 items-center justify-center rounded-lg bg-surface-low ring-1 ring-border",
          className
        )}
      >
        <Icon aria-hidden color="default" size={20} title={idEntry.title} />
      </div>
    );
  }

  if (SLACK_EXTENSION_IDS.has(name)) {
    return (
      <div
        aria-label="Slack"
        className={cn(
          "flex size-10 shrink-0 items-center justify-center rounded-lg bg-surface-low ring-1 ring-border",
          className
        )}
      >
        <MessagesSquare aria-hidden className="size-5 text-[#4A154B]" strokeWidth={2} />
      </div>
    );
  }

  const blob = extensionBrandBlob(name, displayName, description, keywords);
  const brand = matchSimpleBrand(blob);

  if (brand) {
    const Icon = brand.Icon;
    return (
      <div
        className={cn(
          "flex size-10 shrink-0 items-center justify-center rounded-lg bg-surface-low ring-1 ring-border",
          className
        )}
      >
        <Icon aria-hidden color="default" size={20} title={brand.title} />
      </div>
    );
  }

  const avatar = hashColor(name);
  return (
    <div
      className={cn(
        "flex size-10 shrink-0 items-center justify-center rounded-lg font-bold text-xs",
        avatar.bg,
        avatar.text,
        className
      )}
    >
      {initials(name) || <Package aria-hidden className="size-4" strokeWidth={1.75} />}
    </div>
  );
}
