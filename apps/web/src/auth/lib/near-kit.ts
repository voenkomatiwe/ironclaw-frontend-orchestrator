import { HotKit } from "@hot-labs/kit";
import { defaultConnectors } from "@hot-labs/kit/defaults";

export const hotKit = new HotKit({
  connectors: defaultConnectors,
  apiKey: import.meta.env.VITE_HOTKIT_API_KEY ?? "",
});
