import { ChevronLeft, ExternalLink } from "lucide-react";
import { Link, Navigate, useParams } from "react-router";
import { hasEmbeddedAddonUi } from "@/addons/addon-ui-registry";
import { ExtensionBrandAvatar } from "@/common/components/extension-brand-avatar";
import { Badge } from "@/common/components/ui";

type InfoRowProps = {
  label: string;
  value: string;
};

function InfoRow({ label, value }: InfoRowProps) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-foreground">{value}</span>
    </div>
  );
}

export function AddonDetail() {
  const { name } = useParams<{ name: string }>();
  if (!name) return <Navigate replace to="/dashboard" />;

  const isEmbedded = hasEmbeddedAddonUi(name);

  return (
    <div className="flex flex-col gap-6 px-4 py-6">
      <Link
        className="flex w-fit items-center gap-1 text-muted-foreground text-xs transition-colors hover:text-foreground"
        to="/dashboard"
      >
        <ChevronLeft size={12} />
        Dashboard
      </Link>

      <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
        {/* Left column */}
        <div className="flex shrink-0 flex-row items-center gap-3 sm:w-24 sm:flex-col">
          <ExtensionBrandAvatar className="size-16 rounded-xl" iconSize={28} name={name} />
          <div className="flex flex-1 flex-col items-start gap-3 sm:w-full sm:flex-none sm:items-center">
            <Badge variant={isEmbedded ? "primary" : "destructive"}>
              {isEmbedded ? "Bundled UI" : "Unknown"}
            </Badge>
            {isEmbedded && (
              <Link
                className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-primary px-3 py-2 font-semibold text-on-primary-fixed text-xs transition-colors hover:bg-primary/90"
                to={`/addons/${name}/start`}
              >
                <ExternalLink size={13} />
                Open UI
              </Link>
            )}
          </div>
        </div>

        {/* Right column */}
        <div className="flex flex-1 flex-col gap-4">
          <h1 className="font-display font-bold text-xl text-foreground">{name}</h1>

          {isEmbedded ? (
            <p className="text-muted-foreground text-sm leading-relaxed">
              This add-on is a <span className="font-medium text-foreground">bundled UI</span> shipped inside the
              orchestrator. There is no container or <span className="font-mono text-xs">/api/addons</span> management
              API on the gateway — the UI runs entirely client-side.
            </p>
          ) : (
            <p className="text-muted-foreground text-sm leading-relaxed">
              No embedded UI is registered for <span className="font-mono text-xs">{name}</span>. Use the{" "}
              <Link className="font-medium text-primary hover:underline" to="/extensions">
                Extension marketplace
              </Link>{" "}
              to install gateway extensions.
            </p>
          )}

          <div className="flex flex-col gap-2 rounded-xl border border-border bg-surface-low p-4">
            <InfoRow label="Type" value={isEmbedded ? "Bundled SPA" : "—"} />
            <hr className="border-border" />
            <InfoRow label="Gateway API" value="None" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AddonDetailPage() {
  return <AddonDetail />;
}
