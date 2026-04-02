export type AddonStatus =
  | "installed"
  | "installing"
  | "starting"
  | "running"
  | "stopping"
  | "stopped"
  | "error"
  | "removing";
export type HealthStatus = "healthy" | "unhealthy" | "unknown";

export type ServiceContainer = {
  service: string;
  containerId: string;
};

export type AddonInstance = {
  id: string;
  name: string;
  manifestVersion: string;
  manifestJson: string;
  containerId: string | null;
  containerIds: ServiceContainer[] | null;
  status: AddonStatus;
  hostPort: number | null;
  envOverrides: Record<string, string>;
  createdAt: string;
  updatedAt: string;
  lastHealthCheck: string | null;
  healthStatus: HealthStatus;
};

export type EnvVarDef = {
  name: string;
  description: string;
  default?: string;
  required: boolean;
  secret?: boolean;
};

export type VolumeDef = {
  name: string;
  containerPath: string;
  description: string;
};

export type ServiceDef = {
  name: string;
  image: string;
  uiPort?: number;
  exposed?: boolean;
  envVars: EnvVarDef[];
  volumes: VolumeDef[];
};

export type AddonManifest = {
  name: string;
  displayName: string;
  version: string;
  description: string;
  icon?: string;
  image?: string;
  uiPort?: number;
  envVars: EnvVarDef[];
  volumes: VolumeDef[];
  services?: ServiceDef[];
  composeFile?: string;
  dependencies?: string[];
};
