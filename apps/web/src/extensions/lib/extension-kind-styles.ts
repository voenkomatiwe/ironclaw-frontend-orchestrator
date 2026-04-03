import type { ExtensionKind } from "@/settings/api-types";

export function extensionKindBadgeClass(kind: ExtensionKind): string {
  switch (kind) {
    case "wasm_channel":
      return "bg-warning-muted text-warning";
    case "wasm_tool":
      return "bg-success-muted text-success";
    case "mcp_server":
      return "bg-primary-container/90 text-primary";
    case "channel_relay":
      return "bg-chart-5/20 text-chart-5";
  }
}
