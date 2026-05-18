import Link from "next/link";
import { HeartHandshake } from "lucide-react";

export default function VeilFooter({
  aboutHref = "#about",
  privacyHref = "#privacy",
  termsHref = "#terms",
  twitterHref = "#twitter",
}: {
  aboutHref?: string;
  privacyHref?: string;
  termsHref?: string;
  twitterHref?: string;
}) {
  return (
    <footer className="w-full bg-white border-t border-black/5 pt-20 pb-10 z-10 relative">
      <div className="max-w-[1400px] mx-auto px-6 md:px-10">
        <div className="flex flex-col md:flex-row justify-between items-center md:items-start gap-12 mb-16">
          <div className="flex flex-col items-center md:items-start gap-4">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-8 h-8 rounded-xl bg-veil-text flex items-center justify-center text-white shadow-sm group-hover:scale-105 group-hover:rotate-6 transition-transform">
                <HeartHandshake className="w-4 h-4" />
              </div>
              <span className="font-heading font-black text-2xl tracking-tighter text-veil-text">Veil</span>
            </Link>
            <p className="text-veil-muted text-sm font-medium max-w-[250px] text-center md:text-left">
              Privacy-first creator patronage built on Solana. Fund your work, keep your community safe.
            </p>
          </div>
          
          <div className="flex flex-wrap justify-center md:justify-end gap-x-12 gap-y-6">
            <div className="flex flex-col gap-3 items-center md:items-start">
              <span className="font-bold text-veil-text text-sm uppercase tracking-wider mb-1">Product</span>
              <Link href="/explore" className="text-sm font-medium text-veil-muted hover:text-veil-text transition-colors">Explore Creators</Link>
              <Link href="/onboard" className="text-sm font-medium text-veil-muted hover:text-veil-text transition-colors">Claim Page</Link>
              <Link href="/login" className="text-sm font-medium text-veil-muted hover:text-veil-text transition-colors">Dashboard</Link>
            </div>
            
            <div className="flex flex-col gap-3 items-center md:items-start">
              <span className="font-bold text-veil-text text-sm uppercase tracking-wider mb-1">Legal</span>
              <a href={privacyHref} className="text-sm font-medium text-veil-muted hover:text-veil-text transition-colors">Privacy Policy</a>
              <a href={termsHref} className="text-sm font-medium text-veil-muted hover:text-veil-text transition-colors">Terms of Service</a>
            </div>
            
            <div className="flex flex-col gap-3 items-center md:items-start">
              <span className="font-bold text-veil-text text-sm uppercase tracking-wider mb-1">Social</span>
              <a href={twitterHref} className="text-sm font-medium text-veil-muted hover:text-veil-text transition-colors">Twitter (X)</a>
              <a href={aboutHref} className="text-sm font-medium text-veil-muted hover:text-veil-text transition-colors">About Us</a>
            </div>
          </div>
        </div>
        
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 pt-8 border-t border-black/5 text-sm font-medium text-veil-muted">
          <p>&copy; {new Date().getFullYear()} Veil. All rights reserved.</p>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            Operational on Solana Devnet
          </div>
        </div>
      </div>
    </footer>
  );
}
