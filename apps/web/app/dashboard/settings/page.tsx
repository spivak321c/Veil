"use client";

import { useState, useEffect } from "react";
import { ProfileForm } from "@/components/creator/ProfileForm";
import { TierForm } from "@/components/creator/TierForm";
import { toast } from "sonner";
import type { CreatorFull } from "@veil/db";

export default function SettingsPage() {
  const [creator, setCreator] = useState<CreatorFull | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProfile() {
      try {
        const res = await fetch("/api/dashboard");
        if (res.ok) {
          const json = await res.json();
          setCreator(json.data);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    fetchProfile();
  }, []);

  const handleProfileSubmit = async (data: { displayName: string; bio: string; category: string }) => {
    if (!creator) return;
    try {
      const res = await fetch(`/api/creators/${creator.slug}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName: data.displayName,
          bio: data.bio,
          category: data.category,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error || "Failed to update profile");
        return;
      }
      toast.success("Profile updated");
      const json = await res.json();
      setCreator((prev) => prev ? { ...prev, ...json.data } : json.data);
    } catch (e) {
      toast.error("Failed to update profile");
    }
  };

  const handleTiersSubmit = async (data: { tiers: { name: string; amountUsdc: number; description: string }[] }) => {
    if (!creator) return;
    try {
      const tiersPayload = data.tiers.map((t) => ({
        name: t.name,
        amountUsdc: t.amountUsdc * 1_000_000,
        description: t.description,
      }));
      const res = await fetch(`/api/creators/${creator.slug}/tiers`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tiers: tiersPayload }),
      });
      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error || "Failed to update tiers");
        return;
      }
      toast.success("Tiers updated");
    } catch (e) {
      toast.error("Failed to update tiers");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[40vh]">
        <div className="w-8 h-8 rounded-full border-2 border-iron/20 border-t-ink animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-[48px] pb-[48px] pt-[24px] font-sans">
      <div>
        <h1 className="text-[40px] tracking-[-0.78px] text-ink font-medium mb-[8px]">Settings</h1>
        <p className="text-[16px] text-iron tracking-[-0.28px]">Manage your public profile and support tiers.</p>
      </div>

      <section>
        <h2 className="text-[26px] tracking-[-0.52px] text-ink font-medium mb-[24px] border-b border-iron/10 pb-[8px]">Profile Information</h2>
        <ProfileForm
          onSubmit={handleProfileSubmit}
          creatorSlug={creator?.slug}
          defaultValues={creator ? {
            displayName: creator.displayName,
            bio: creator.bio,
            category: creator.category,
          } : undefined}
        />
      </section>

      <section>
        <h2 className="text-[26px] tracking-[-0.52px] text-ink font-medium mb-[24px] border-b border-iron/10 pb-[8px]">Support Tiers</h2>
        <TierForm
          onSubmit={handleTiersSubmit}
          defaultTiers={creator?.tiers.map(t => ({
            name: t.name,
            amountUsdc: t.amountUsdc / 1_000_000,
            description: t.description,
          }))}
        />
      </section>
    </div>
  );
}
