import { ChevronLeft, ExternalLink, Play, RotateCcw, Save, Square, Terminal, Trash2 } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { hasEmbeddedAddonUi } from "@/addons/addon-ui-registry";
import { cn } from "@/common/lib/utils";
import type { AddonInstance, AddonManifest, EnvVarDef } from "../api-types";
import { StatusBadge } from "../components/status-badge";
import {
  useAddon,
  useAddonLogs,
  useRemoveAddon,
  useRestartAddon,
  useStartAddon,
  useStopAddon,
  useUpdateConfig,
} from "../queries";

function LogViewer({ name, services }: { name: string; services?: string[] }) {
  const [service, setService] = useState<string | undefined>(services?.[0]);
  const { data: logs } = useAddonLogs(name, service);

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-surface-high">
      <div className="flex items-center justify-between border-border border-b px-4 py-3">
        <div className="flex items-center gap-2 font-medium text-foreground text-sm">
          <Terminal size={14} /> Logs
        </div>
        {services && services.length > 1 && (
          <select
            className="rounded border border-border bg-surface-highest px-2 py-1 text-foreground text-xs focus:border-primary focus:outline-none"
            onChange={(e) => setService(e.target.value)}
            value={service}
          >
            {services.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        )}
      </div>
      <pre className="max-h-72 overflow-auto whitespace-pre-wrap break-all bg-surface-low p-4 font-mono text-muted-foreground text-xs">
        {logs ?? "No logs yet."}
      </pre>
    </div>
  );
}

function ConfigForm({ addon, manifest }: { addon: AddonInstance; manifest: AddonManifest }) {
  const updateConfig = useUpdateConfig();
  const allVars: EnvVarDef[] = manifest.services ? manifest.services.flatMap((s) => s.envVars) : manifest.envVars;

  const [values, setValues] = useState<Record<string, string>>(addon.envOverrides);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateConfig.mutate({ name: addon.name, envOverrides: values });
  };

  if (allVars.length === 0) return null;

  return (
    <form className="overflow-hidden rounded-xl border border-border bg-surface-high" onSubmit={handleSave}>
      <div className="border-border border-b px-5 py-4">
        <h2 className="font-semibold text-foreground text-sm">Configuration</h2>
        <p className="mt-0.5 text-muted-foreground text-xs">Environment variable overrides</p>
      </div>
      <div className="flex flex-col gap-4 p-5">
        {allVars.map((env) => (
          <div key={env.name}>
            <label className="mb-1 flex items-center gap-1 font-medium text-muted-foreground text-xs">
              {env.name}
              {env.required && <span className="text-destructive">*</span>}
            </label>
            <input
              className="w-full rounded-lg border border-border bg-surface-low px-3 py-2 text-foreground text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              onChange={(e) => setValues((v) => ({ ...v, [env.name]: e.target.value }))}
              placeholder={env.description}
              type={env.secret ? "password" : "text"}
              value={values[env.name] ?? env.default ?? ""}
            />
            {env.description && <p className="mt-1 text-muted-foreground text-xs">{env.description}</p>}
          </div>
        ))}
      </div>
      <div className="flex items-center gap-3 px-5 pb-5">
        <button
          className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 font-medium text-on-primary-fixed text-sm transition-colors hover:bg-primary/90 disabled:opacity-50"
          disabled={updateConfig.isPending}
          type="submit"
        >
          <Save size={14} /> {updateConfig.isPending ? "Saving…" : "Save Changes"}
        </button>
        {updateConfig.isSuccess && <span className="text-success text-xs">Saved successfully</span>}
        {updateConfig.error && <span className="text-destructive text-xs">{updateConfig.error.message}</span>}
      </div>
    </form>
  );
}

function DangerZone({ addon }: { addon: AddonInstance }) {
  const navigate = useNavigate();
  const remove = useRemoveAddon();
  const isBusy = ["starting", "stopping", "removing"].includes(addon.status);

  return (
    <div className="overflow-hidden rounded-xl border border-destructive/20 bg-surface-high">
      <div className="border-destructive/20 border-b px-5 py-4">
        <h2 className="font-semibold text-destructive text-sm">Danger Zone</h2>
      </div>
      <div className="flex flex-col gap-3 p-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="font-medium text-foreground text-sm">Remove add-on</p>
            <p className="text-muted-foreground text-xs">Stops and removes the container. Volumes are kept.</p>
          </div>
          <button
            className="flex shrink-0 items-center gap-1.5 rounded-lg border border-destructive/20 bg-destructive-muted px-4 py-2 text-destructive text-sm transition-colors hover:bg-destructive/20 disabled:opacity-40"
            disabled={isBusy}
            onClick={() => {
              if (confirm(`Remove ${addon.name}?`))
                remove.mutate({ name: addon.name }, { onSuccess: () => navigate("/dashboard") });
            }}
          >
            <Trash2 size={14} /> Remove
          </button>
        </div>
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="font-medium text-foreground text-sm">Remove &amp; purge data</p>
            <p className="text-muted-foreground text-xs">Also deletes all associated volumes and data.</p>
          </div>
          <button
            className="flex shrink-0 items-center gap-1.5 rounded-lg bg-destructive px-4 py-2 text-on-primary-fixed text-sm transition-colors hover:bg-destructive/90 disabled:opacity-40"
            disabled={isBusy}
            onClick={() => {
              if (confirm(`Permanently remove ${addon.name} and all its data?`))
                remove.mutate({ name: addon.name, purge: true }, { onSuccess: () => navigate("/dashboard") });
            }}
          >
            <Trash2 size={14} /> Purge
          </button>
        </div>
      </div>
    </div>
  );
}

export function AddonDetail() {
  const { name } = useParams<{ name: string }>();
  const { data: addon, isLoading, error } = useAddon(name!);
  const start = useStartAddon();
  const stop = useStopAddon();
  const restart = useRestartAddon();

  if (isLoading) return <div className="p-6 text-muted-foreground">Loading…</div>;
  if (error) return <div className="p-6 text-destructive">{error.message}</div>;
  if (!addon) return null;

  const manifest: AddonManifest = JSON.parse(addon.manifestJson);
  const services = addon.containerIds?.map((c) => c.service);
  const isRunning = addon.status === "running";
  const isBusy = ["starting", "stopping", "removing"].includes(addon.status);
  const embeddedUi = hasEmbeddedAddonUi(addon.name);

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 p-6">
      <div>
        <Link
          className="mb-3 flex w-fit items-center gap-1 text-muted-foreground text-xs transition-colors hover:text-foreground"
          to="/dashboard"
        >
          <ChevronLeft size={12} /> Dashboard
        </Link>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <h1 className="font-bold text-foreground text-xl">{manifest.displayName ?? addon.name}</h1>
            <StatusBadge status={addon.status} />
          </div>
          <div className="flex items-center gap-2">
            {isRunning ? (
              <button
                className="flex items-center gap-1.5 rounded-lg bg-surface-highest px-4 py-2 text-foreground text-sm transition-colors hover:bg-surface-highest/80 disabled:opacity-40"
                disabled={isBusy}
                onClick={() => stop.mutate(addon.name)}
              >
                <Square size={14} /> Stop
              </button>
            ) : (
              <button
                className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 font-medium text-on-primary-fixed text-sm transition-colors hover:bg-primary/90 disabled:opacity-40"
                disabled={isBusy}
                onClick={() => start.mutate(addon.name)}
              >
                <Play size={14} /> Start
              </button>
            )}
            <button
              className="flex items-center gap-1.5 rounded-lg border border-border bg-surface-high px-4 py-2 text-foreground text-sm transition-colors hover:bg-surface-highest disabled:opacity-40"
              disabled={isBusy}
              onClick={() => restart.mutate(addon.name)}
            >
              <RotateCcw size={14} /> Restart
            </button>
            {isRunning && embeddedUi && (
              <Link
                className="flex items-center gap-1.5 rounded-lg border border-border bg-surface-high px-4 py-2 text-foreground text-sm transition-colors hover:bg-surface-highest"
                to={`/addons/${addon.name}/start`}
              >
                <ExternalLink size={14} /> Open UI
              </Link>
            )}
            {isRunning && !embeddedUi && addon.hostPort && (
              <a
                className="flex items-center gap-1.5 rounded-lg border border-border bg-surface-high px-4 py-2 text-foreground text-sm transition-colors hover:bg-surface-highest"
                href={`http://${window.location.hostname}:${addon.hostPort}/`}
                rel="noreferrer"
                target="_blank"
              >
                <ExternalLink size={14} /> Open UI
              </a>
            )}
          </div>
        </div>
        {manifest.description && <p className="mt-1 text-muted-foreground text-sm">{manifest.description}</p>}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="flex flex-col gap-6">
          <ConfigForm addon={addon} manifest={manifest} />
          <DangerZone addon={addon} />
        </div>

        <div className="flex flex-col gap-6">
          <div className="overflow-hidden rounded-xl border border-border bg-surface-high">
            <div className="border-border border-b px-5 py-4">
              <h2 className="font-semibold text-foreground text-sm">Container Info</h2>
            </div>
            <div className="divide-y divide-border/30">
              {[
                { label: "Version", value: addon.manifestVersion },
                { label: "Host Port", value: addon.hostPort ? String(addon.hostPort) : "—" },
                { label: "Health", value: addon.healthStatus },
                {
                  label: "Container ID",
                  value: services ? services.join(", ") : (addon.containerId?.slice(0, 12) ?? "—"),
                },
                { label: "Created", value: new Date(addon.createdAt).toLocaleString() },
              ].map(({ label, value }) => (
                <div className="flex items-center justify-between px-5 py-3" key={label}>
                  <span className="text-muted-foreground text-xs">{label}</span>
                  <span className={cn("max-w-[200px] truncate font-mono text-foreground text-xs")}>{value}</span>
                </div>
              ))}
            </div>
          </div>

          {manifest.volumes && manifest.volumes.length > 0 && (
            <div className="overflow-hidden rounded-xl border border-border bg-surface-high">
              <div className="border-border border-b px-5 py-4">
                <h2 className="font-semibold text-foreground text-sm">Volumes</h2>
              </div>
              <div className="divide-y divide-border/30">
                {manifest.volumes.map((vol) => (
                  <div className="px-5 py-3" key={vol.name}>
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-foreground text-xs">{vol.name}</span>
                      <span className="font-mono text-muted-foreground text-xs">{vol.containerPath}</span>
                    </div>
                    {vol.description && <p className="mt-0.5 text-muted-foreground text-xs">{vol.description}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {addon.status === "running" && embeddedUi && (
        <div className="overflow-hidden rounded-xl border border-border bg-surface-high">
          <div className="flex items-center justify-between border-border border-b px-4 py-3">
            <span className="font-medium text-foreground text-sm">Add-on UI</span>
            <Link
              className="flex items-center gap-1 text-muted-foreground text-xs transition-colors hover:text-foreground"
              to={`/addons/${addon.name}/start`}
            >
              <ExternalLink size={12} /> Open embedded UI
            </Link>
          </div>
          <div className="flex min-h-[200px] items-center justify-center bg-surface-low p-6">
            <Link
              className="rounded-lg bg-primary px-4 py-2 font-medium text-on-primary-fixed text-sm hover:bg-primary/90"
              to={`/addons/${addon.name}/start`}
            >
              Open in orchestrator
            </Link>
          </div>
        </div>
      )}
      {addon.status === "running" && !embeddedUi && addon.hostPort && (
        <div className="overflow-hidden rounded-xl border border-border bg-surface-high">
          <div className="flex items-center justify-between border-border border-b px-4 py-3">
            <span className="font-medium text-foreground text-sm">Add-on UI</span>
            <a
              className="flex items-center gap-1 text-muted-foreground text-xs transition-colors hover:text-foreground"
              href={`http://${window.location.hostname}:${addon.hostPort}/`}
              rel="noreferrer"
              target="_blank"
            >
              <ExternalLink size={12} /> Open in tab
            </a>
          </div>
          <iframe
            className="h-[600px] w-full border-0"
            src={`http://${window.location.hostname}:${addon.hostPort}/`}
            title={`${addon.name} UI`}
          />
        </div>
      )}

      <LogViewer name={addon.name} services={services} />
    </div>
  );
}

export default function AddonDetailPage() {
  return <AddonDetail />;
}
