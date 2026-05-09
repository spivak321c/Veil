"use client";

import { ProfileForm } from "@/components/creator/ProfileForm";
import { TierForm } from "@/components/creator/TierForm";
import { toast } from "sonner";

export default function SettingsPage() {
  const handleProfileSubmit = async (data: any) => {
    // Implement PATCH /api/creators/:slug
    toast.success("Profile updated");
  };

  const handleTiersSubmit = async (data: any) => {
    // Implement PUT /api/creators/:slug/tiers
    toast.success("Tiers updated");
  };

  return (
    <div className="space-y-[48px] pb-[48px] pt-[24px] font-sans">
      <div>
        <h1 className="text-[40px] tracking-[-0.78px] text-ink font-medium mb-[8px]">Settings</h1>
        <p className="text-[16px] text-iron tracking-[-0.28px]">Manage your public profile and support tiers.</p>
      </div>

      <section>
        <h2 className="text-[26px] tracking-[-0.52px] text-ink font-medium mb-[24px] border-b border-iron/10 pb-[8px]">Profile Information</h2>
        <ProfileForm onSubmit={handleProfileSubmit} />
      </section>

      <section>
        <h2 className="text-[26px] tracking-[-0.52px] text-ink font-medium mb-[24px] border-b border-iron/10 pb-[8px]">Support Tiers</h2>
        <TierForm onSubmit={handleTiersSubmit} />
      </section>
    </div>
  );
}
