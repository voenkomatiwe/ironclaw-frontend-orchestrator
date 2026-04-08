import { NearLogo } from "@/common/icons/near-logo";

const EXAMPLE_PROMPTS = [
  "Analyze my smart contract for vulnerabilities",
  "Check the gas usage of my latest transaction",
  "Help me deploy a contract to testnet",
  "Explain the NEAR storage staking model",
];

type ChatEmptyStateProps = {
  onSelectPrompt: (prompt: string) => void;
};

export function ChatEmptyState({ onSelectPrompt }: ChatEmptyStateProps) {
  return (
    <div className="flex h-full flex-col items-center justify-center px-6">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary-darker shadow-lg shadow-primary/20">
        <NearLogo className="h-8 w-8" fill="white" />
      </div>

      <h2 className="mb-2 font-display font-semibold text-foreground text-lg">Start a conversation</h2>
      <p className="mb-6 text-center text-muted-foreground text-sm">Ask IronClaw anything about NEAR Protocol</p>

      <div className="grid w-full max-w-md gap-2 sm:grid-cols-2">
        {EXAMPLE_PROMPTS.map((prompt) => (
          <button
            className="rounded-xl border border-border bg-surface-low p-3 text-left text-foreground text-sm transition-colors hover:bg-surface-high hover:shadow-sm"
            key={prompt}
            onClick={() => onSelectPrompt(prompt)}
            type="button"
          >
            {prompt}
          </button>
        ))}
      </div>
    </div>
  );
}
