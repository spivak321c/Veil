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
    <footer className="w-full bg-white border-t border-black/5 pt-16 pb-8 z-10 relative">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <div className="flex flex-col md:flex-row justify-between items-center gap-8 mb-12">
          <div className="flex items-center gap-2">
            <HeartHandshake className="w-6 h-6 text-veil-primary" />
            <span className="font-heading font-black text-2xl tracking-tight text-veil-text">Veil</span>
          </div>
          
          <div className="flex flex-wrap justify-center gap-8">
            <a href={aboutHref} className="text-base font-bold text-veil-muted hover:text-veil-primary transition-colors">About</a>
            <a href={privacyHref} className="text-base font-bold text-veil-muted hover:text-veil-primary transition-colors">Privacy Policy</a>
            <a href={termsHref} className="text-base font-bold text-veil-muted hover:text-veil-primary transition-colors">Terms of Service</a>
            <a href={twitterHref} className="text-base font-bold text-veil-muted hover:text-veil-primary transition-colors flex items-center gap-2">
              <span className="text-sm">Twitter</span>
            </a>
          </div>
        </div>
        
        <div className="text-center text-sm font-medium text-veil-muted">
          &copy; 2024 Veil. Making creator support private and friendly.
        </div>
      </div>
    </footer>
  );
}
