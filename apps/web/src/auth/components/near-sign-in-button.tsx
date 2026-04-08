import { useState } from "react";
import { generateNonce, getSignMessageParams, type NearAuthResult, signInWithNearAi } from "@/auth/lib/near-auth";
import { hotKit } from "@/auth/lib/near-kit";
import { Button } from "@/common/components/ui";

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
      <Button className="gap-2" disabled={isLoading} onClick={handleSignIn} size="lg" type="button">
        {isLoading ? "Connecting…" : "Sign in with NEAR"}
      </Button>

      {error ? <p className="text-destructive text-sm">{error}</p> : null}
    </div>
  );
}
