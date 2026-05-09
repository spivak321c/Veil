import type { Metadata } from "next";
import { cookies } from "next/headers";
import { DM_Sans, Nunito, JetBrains_Mono } from "next/font/google";
import { CryptoPolyfill } from "@/components/crypto/CryptoPolyfill";
import { WalletProvider } from "@/components/wallet/WalletProvider";
import { UmbraProvider } from "@/components/umbra/UmbraProvider";
import { Toaster } from "@/components/ui/Toast";
import { DevnetBanner } from "@/components/ui/DevnetBanner";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { JWT_COOKIE_NAME } from "@/lib/constants";
import "./globals.css";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-heading",
  display: "swap",
  weight: ["400", "700", "900"],
});

const nunito = Nunito({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
  weight: ["400"],
});

export const metadata: Metadata = {
  title: "Veil Patronage",
  description: "Creativity powered by privacy.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const isLoggedIn = cookieStore.has(JWT_COOKIE_NAME);

  return (
    <html lang="en" className={`${dmSans.variable} ${nunito.variable} ${jetbrainsMono.variable}`}>
      <body className="bg-veil-bg text-veil-text font-body antialiased min-h-[100dvh] flex flex-col relative selection:bg-veil-primary selection:text-white">
        <CryptoPolyfill>
          <AuthProvider isLoggedIn={isLoggedIn}>
            <WalletProvider>
              <UmbraProvider>
                <DevnetBanner />
                <main className="flex-grow z-10 flex flex-col">
                  {children}
                </main>
                <Toaster position="bottom-right" theme="light" />
              </UmbraProvider>
            </WalletProvider>
          </AuthProvider>
        </CryptoPolyfill>
      </body>
    </html>
  );
}
