import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { cn } from "@/common/lib/utils";
import { ChannelsSettingsTab } from "../components/channels-settings-tab";
import { GeneralTab } from "../components/general-tab";
import { InferenceTab } from "../components/inference-tab";
import { McpTab } from "../components/mcp-tab";
import { NetworkingSettingsTab } from "../components/networking-settings-tab";
import { SettingsKeysTab } from "../components/settings-keys-tab";
import { SkillsTab } from "../components/skills-tab";

const TABS = ["Inference", "Agent", "Networking", "Channels", "MCP", "Skills", "General"] as const;
type Tab = (typeof TABS)[number];

const TAB_BY_SLUG: Record<string, Tab> = {
  inference: "Inference",
  agent: "Agent",
  networking: "Networking",
  channels: "Channels",
  mcp: "MCP",
  skills: "Skills",
  general: "General",
};

const AGENT_PREFIXES = [
  "agent.",
  "heartbeat.",
  "sandbox.",
  "routines.",
  "safety.",
  "skills.",
  "search.",
  "embeddings.",
];

export function SettingsView() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>("Inference");

  useEffect(() => {
    const raw = searchParams.get("tab")?.toLowerCase();
    if (raw === "extensions") {
      navigate("/extensions", { replace: true });
      return;
    }
    if (!raw) return;
    const next = TAB_BY_SLUG[raw];
    if (next) setActiveTab(next);
  }, [searchParams, navigate]);

  return (
    <div className="mx-auto max-w-6xl p-6">
      <div className="mb-6">
        <h1 className="font-bold text-foreground text-xl">Settings</h1>
        <p className="mt-0.5 text-muted-foreground text-sm">
          Configure inference, agent behavior, networking, and more
        </p>
      </div>

      <div className="mb-6 flex flex-wrap gap-0 border-border border-b">
        {TABS.map((tab) => (
          <button
            className={cn(
              "-mb-px cursor-pointer px-3 py-2.5 text-sm transition-colors sm:px-4",
              activeTab === tab
                ? "border-primary border-b-2 font-medium text-primary"
                : "text-muted-foreground hover:text-foreground"
            )}
            key={tab}
            onClick={() => setActiveTab(tab)}
            type="button"
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === "Inference" && <InferenceTab />}
      {activeTab === "Agent" && (
        <SettingsKeysTab
          description="Agent loop, sandbox, routines, safety, skills, search, and embeddings (keys from settings export)."
          prefixes={AGENT_PREFIXES}
        />
      )}
      {activeTab === "Networking" && <NetworkingSettingsTab />}
      {activeTab === "Channels" && <ChannelsSettingsTab />}
      {activeTab === "MCP" && <McpTab />}
      {activeTab === "Skills" && <SkillsTab />}
      {activeTab === "General" && <GeneralTab />}
    </div>
  );
}

export default function SettingsPage() {
  return <SettingsView />;
}
