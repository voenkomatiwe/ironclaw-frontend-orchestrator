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

const TABS = ["Inference", "Agent", "Network", "Channels", "MCP", "Skills", "General"] as const;
type Tab = (typeof TABS)[number];

const TAB_BY_SLUG: Record<string, Tab> = {
  inference: "Inference",
  agent: "Agent",
  networking: "Network",
  network: "Network",
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
    <div className="mx-auto p-6">
      {/* Tab pills */}
      <div className="mb-6 flex w-fit gap-1 overflow-x-auto rounded-2xl bg-white p-1.5 shadow-xs">
        {TABS.map((tab) => (
          <button
            className={cn(
              "shrink-0 rounded-xl px-4 py-2 font-medium text-[13px] transition-colors",
              activeTab === tab ? "bg-primary text-white" : "text-muted-foreground hover:text-foreground"
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
          description="Agent loop, sandbox, routines, safety, skills, search, and embeddings."
          prefixes={AGENT_PREFIXES}
        />
      )}
      {activeTab === "Network" && <NetworkingSettingsTab />}
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
