import { Shield, EyeOff, Key, Zap } from "lucide-react";

export default function HowItWorksPage() {
  return (
    <div className="min-h-[100dvh] pt-[120px] pb-[80px] px-6 bg-canvas font-sans text-ink">
      <div className="max-w-[800px] mx-auto">
        <h1 className="text-[54px] tracking-[-0.97px] font-medium mb-[24px]">How Veil Works</h1>
        <p className="text-iron text-[18px] mb-[64px] max-w-[65ch] leading-[1.6]">
          Veil leverages the Umbra Privacy SDK to break the on-chain link between patrons and creators. 
          Here is a technical overview of the cryptographic primitives securing the platform.
        </p>

        <div className="space-y-[24px]">
          {/* Section 1 */}
          <div className="p-[40px] rounded-[30px] border border-iron/10 bg-iron/5 flex flex-col md:flex-row gap-[32px] items-start">
            <div className="w-[48px] h-[48px] rounded-full bg-sky-blue/10 flex items-center justify-center shrink-0">
              <EyeOff className="w-[24px] h-[24px] text-sky-blue" />
            </div>
            <div>
              <h2 className="text-[26px] tracking-[-0.52px] font-medium mb-[16px]">1. The Umbra Mixer & Stealth Addresses</h2>
              <p className="text-[16px] text-iron leading-[1.6] mb-[16px]">
                When a patron supports a creator, the funds are not sent directly to the creator's wallet. 
                Instead, the Umbra SDK generates a one-time stealth address derived from the creator's public key.
              </p>
              <p className="text-[16px] text-iron leading-[1.6]">
                The patron deposits USDC into the Umbra Mixer contract, assigning ownership to the stealth address. 
                Only the creator holds the corresponding private key to claim the UTXO (Unspent Transaction Output) from the Merkle tree.
              </p>
            </div>
          </div>

          {/* Section 2 */}
          <div className="p-[40px] rounded-[30px] border border-iron/10 bg-iron/5 flex flex-col md:flex-row gap-[32px] items-start">
            <div className="w-[48px] h-[48px] rounded-full bg-vivid-pink/10 flex items-center justify-center shrink-0">
              <Zap className="w-[24px] h-[24px] text-vivid-pink" />
            </div>
            <div>
              <h2 className="text-[26px] tracking-[-0.52px] font-medium mb-[16px]">2. Arcium MPC & Encrypted Balances</h2>
              <p className="text-[16px] text-iron leading-[1.6] mb-[16px]">
                Claiming a UTXO typically moves funds to a public wallet, exposing the creator's total revenue. 
                Veil avoids this by claiming UTXOs directly into an <strong>Encrypted Balance</strong>.
              </p>
              <p className="text-[16px] text-iron leading-[1.6]">
                The claiming transaction requires a callback to the Arcium Multi-Party Computation (MPC) network. 
                Arcium nodes perform operations on the encrypted state without decrypting it, 
                securely increasing the creator's hidden balance.
              </p>
            </div>
          </div>

          {/* Section 3 */}
          <div className="p-[40px] rounded-[30px] border border-iron/10 bg-iron/5 flex flex-col md:flex-row gap-[32px] items-start">
            <div className="w-[48px] h-[48px] rounded-full bg-sky-blue/10 flex items-center justify-center shrink-0">
              <Key className="w-[24px] h-[24px] text-ink" />
            </div>
            <div>
              <h2 className="text-[26px] tracking-[-0.52px] font-medium mb-[16px]">3. Viewing Keys & Compliance</h2>
              <p className="text-[16px] text-iron leading-[1.6] mb-[16px]">
                Privacy should not preclude accountability. Creators can generate time-scoped 
                <strong> Viewing Keys</strong> (monthly or yearly) via the Umbra SDK.
              </p>
              <p className="text-[16px] text-iron leading-[1.6]">
                These JSON keys can be shared with sponsors, accountants, or tax authorities. 
                They decrypt the total revenue volume for that specific period, but they <strong>never</strong> decrypt 
                the identities of the individual patrons.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
