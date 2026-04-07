import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { cn } from "@/common/lib/utils";
import { AdvancedSettings } from "../components/advanced-settings";
import { ChannelsSettingsTab } from "../components/channels-settings-tab";
import { InferenceTab } from "../components/inference-tab";
import { McpTab } from "../components/mcp-tab";
import { NetworkingSettingsTab } from "../components/networking-settings-tab";
import { SettingsExportImport } from "../components/settings-export-import";
import { SettingsKeysTab } from "../components/settings-keys-tab";
import { SkillsTab } from "../components/skills-tab";

const TABS = ["Inference", "Agent", "Network", "Channels", "MCP", "Skills"] as const;
type Tab = (typeof TABS)[number];

const TAB_BY_SLUG: Record<string, Tab> = {
  inference: "Inference",
  agent: "Agent",
  networking: "Network",
  network: "Network",
  channels: "Channels",
  mcp: "MCP",
  skills: "Skills",
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
      {/* Header: title + export/import */}
      <div className="mb-4 flex items-center justify-end">
        <SettingsExportImport />
      </div>

      {/* Underline tabs */}
      <div
        className={cn(
          "mb-6 flex overflow-x-auto border-border border-b-2",
          "[scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
          "[mask-image:linear-gradient(to_right,black_85%,transparent)] md:[mask-image:none]"
        )}
      >
        {TABS.map((tab) => (
          <button
            className={cn(
              "shrink-0 whitespace-nowrap px-4 py-2.5 font-medium text-[13px] transition-colors",
              activeTab === tab
                ? "-mb-[2px] border-primary border-b-2 text-primary"
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

      {/* Tab content */}
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

      {/* Advanced section */}
      <AdvancedSettings />
    </div>
  );
}

export default function SettingsPage() {
  return <SettingsView />;
}
