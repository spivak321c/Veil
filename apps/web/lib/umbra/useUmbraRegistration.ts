import { getUserRegistrationFunction, isRegistrationError } from "@umbra-privacy/sdk";
import { getUserRegistrationProver } from "@umbra-privacy/web-zk-prover";
import { useUmbraStore } from "./store";

export function useUmbraRegistration() {
  const client = useUmbraStore((s) => s.client);
  const isInitializing = useUmbraStore((s) => s.isInitializing);
  const initError = useUmbraStore((s) => s.error);

  const register = async (): Promise<void> => {
    console.log("[useUmbraRegistration] Register called");

    if (isInitializing) {
      throw new Error("Umbra client is still initializing. Please wait...");
    }

    if (!client) {
      if (initError) {
        throw new Error(
          `Umbra client failed to initialize: ${initError}. Please disconnect and reconnect your wallet, then try again.`
        );
      }
      throw new Error("Client not initialized. Please connect your Solana wallet first.");
    }

    try {
      console.log("[useUmbraRegistration] Getting registration prover...");
      const zkProver = getUserRegistrationProver();
      console.log("[useUmbraRegistration] Prover created:", typeof zkProver, "has prove:", typeof zkProver.prove);

      console.log("[useUmbraRegistration] Getting registration function...");
      const registerFn = getUserRegistrationFunction(
        { client },
        { zkProver }
      );

      console.log("[useUmbraRegistration] Calling register (confidential=true, anonymous=true)...");
      const result = await registerFn({ confidential: true, anonymous: true });
      console.log("[useUmbraRegistration] Registration completed:", result);
    } catch (err: unknown) {
      console.error("[useUmbraRegistration] Registration failed:", err);
      
      if (isRegistrationError(err)) {
        console.error("[useUmbraRegistration] RegistrationError stage:", err.stage);
        console.error("[useUmbraRegistration] RegistrationError message:", err.message);
        console.error("[useUmbraRegistration] RegistrationError stack:", err.stack);
        
        let userMessage = `Registration failed at stage: ${err.stage}. `;
        switch (err.stage) {
          case "zk-proof-generation":
            userMessage += "The ZK prover failed to generate a proof. This may be due to network issues fetching proving keys from the CDN, or browser compatibility issues. Try refreshing the page and trying again.";
            break;
          case "initialization":
            userMessage += "Failed to initialize registration. Check your network connection.";
            break;
          case "transaction-sign":
            userMessage += "Failed to sign the registration transaction. Please approve the transaction in your wallet.";
            break;
          case "transaction-send":
            userMessage += "Failed to send the registration transaction. Check your network connection.";
            break;
          default:
            userMessage += "Please try again or check the console for more details.";
        }
        
        throw new Error(`Umbra registration failed (${err.stage}): ${userMessage}`);
      }
      
      const sdkError = err instanceof Error ? err.message : "Unknown SDK error";
      throw new Error(`Umbra registration failed: ${sdkError}`);
    }
  };

  return { register, isInitializing, initError };
}