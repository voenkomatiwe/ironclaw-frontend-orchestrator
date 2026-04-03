import { ChevronLeft, ExternalLink } from "lucide-react";
import { Link, Navigate, useParams } from "react-router";
import { hasEmbeddedAddonUi } from "@/addons/addon-ui-registry";

export function AddonDetail() {
  const { name } = useParams<{ name: string }>();
  if (!name) {
    return <Navigate replace to="/dashboard" />;
  }

  if (hasEmbeddedAddonUi(name)) {
    return (
      <div className="mx-auto p-6">
        <Link
          className="mb-4 flex w-fit items-center gap-1 text-muted-foreground text-xs transition-colors hover:text-foreground"
          to="/dashboard"
        >
          <ChevronLeft size={12} /> Dashboard
        </Link>
        <h1 className="font-bold text-foreground text-xl">{name}</h1>
        <p className="mt-2 text-muted-foreground text-sm leading-relaxed">
          This add-on is a <span className="font-medium text-foreground">bundled UI</span> in the orchestrator. There is
          no container or <span className="font-mono text-xs">/api/addons</span> management on the gateway.
        </p>
        <Link
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 font-medium text-on-primary-fixed text-sm transition-colors hover:bg-primary/90"
          to={`/addons/${name}/start`}
        >
          <ExternalLink size={16} /> Open UI
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto p-6">
      <Link
        className="mb-4 flex w-fit items-center gap-1 text-muted-foreground text-xs transition-colors hover:text-foreground"
        to="/dashboard"
      >
        <ChevronLeft size={12} /> Dashboard
      </Link>
      <h1 className="font-bold text-foreground text-xl">Unknown add-on</h1>
      <p className="mt-2 text-muted-foreground text-sm leading-relaxed">
        No embedded UI is registered for <span className="font-mono text-xs">{name}</span>. Use the{" "}
        <Link className="text-primary hover:underline" to="/extensions">
          Extension marketplace
        </Link>{" "}
        for gateway extensions.
      </p>
    </div>
  );
}

export default function AddonDetailPage() {
  return <AddonDetail />;
}
