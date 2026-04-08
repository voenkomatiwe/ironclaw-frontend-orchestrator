import { AlertCircle, Bot, Menu } from "lucide-react";
import { cn } from "@/common/lib/utils";

type ChatHeaderProps = {
  isConnected: boolean;
  isLoading: boolean;
  sseFresh: boolean;
  errorMessage?: string;
  onOpenDrawer?: () => void;
};

export function ChatHeader({ isConnected, isLoading, sseFresh, errorMessage, onOpenDrawer }: ChatHeaderProps) {
  return (
    <div>
      <div className="flex items-center justify-between border-border border-b bg-surface-high px-6 py-4">
        <div className="flex items-center gap-3">
          {onOpenDrawer && (
            <button className="mr-1 md:hidden" onClick={onOpenDrawer} type="button">
              <Menu className="text-muted-foreground" size={20} />
            </button>
          )}
          <div>
            <h1 className="flex items-center gap-2 font-display font-bold text-lg text-foreground">
              <Bot size={20} />
              IronClaw Chat
            </h1>
            <p className="mt-0.5 text-muted-foreground text-xs">
              {isLoading
                ? "Checking connection…"
                : isConnected
                  ? sseFresh
                    ? "Live stream connected"
                    : "Connected (syncing…)"
                  : "Disconnected"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className={cn("h-2 w-2 rounded-full", isConnected ? "animate-pulse bg-success" : "bg-destructive")} />
          <span className="text-muted-foreground text-xs">{isConnected ? "Online" : "Offline"}</span>
        </div>
      </div>

      {!isLoading && !isConnected && errorMessage && (
        <div className="mx-6 mt-4 flex items-center gap-2 rounded-xl border border-destructive/20 bg-destructive-muted p-3 text-destructive text-sm">
          <AlertCircle size={16} />
          {errorMessage}
        </div>
      )}
    </div>
  );
}
