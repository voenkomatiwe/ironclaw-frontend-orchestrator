import { useState } from "react";
import { generateNonce, getSignMessageParams, type NearAuthResult, signInWithNearAi } from "@/auth/lib/near-auth";
import { hotKit } from "@/auth/lib/near-kit";

type NearSignInButtonProps = {
  onSuccess: (result: NearAuthResult) => void;
};

export function NearSignInButton({ onSuccess }: NearSignInButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignIn = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const nonce = generateNonce();
      const signParams = getSignMessageParams(nonce);

      await hotKit.connect();

      const nearWallet = hotKit.near;
      if (!nearWallet) {
        throw new Error("No NEAR wallet connected");
      }

      const signed = await nearWallet.signMessage(signParams);

      const result = await signInWithNearAi(
        {
          accountId: nearWallet.address,
          publicKey: signed.publicKey ?? `ed25519:${nearWallet.publicKey}`,
          signature: signed.signature,
        },
        nonce
      );

      onSuccess(result);
    } catch (err) {
      if (err instanceof Error && err.message.includes("User rejected")) {
        setError(null);
      } else {
        setError(err instanceof Error ? err.message : "Sign-in failed");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <button
        className="flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 font-medium text-on-primary-fixed text-sm transition-colors hover:bg-primary/90 disabled:opacity-50"
        disabled={isLoading}
        onClick={handleSignIn}
        type="button"
      >
        {isLoading ? "Connecting…" : "Sign in with NEAR"}
      </button>

      {error ? <p className="text-destructive text-sm">{error}</p> : null}
    </div>
  );
}
