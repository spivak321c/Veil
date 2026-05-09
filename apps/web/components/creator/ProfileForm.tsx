"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

const profileSchema = z.object({
  slug: z.string().min(3).max(30).regex(/^[a-z0-9-]+$/, "Only lowercase letters, numbers, and hyphens allowed"),
  displayName: z.string().min(1).max(50),
  bio: z.string().max(500),
  category: z.enum(["MUSIC", "ART", "WRITING", "DEVELOPMENT", "GAMING", "EDUCATION", "OTHER"]),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export function ProfileForm({ onSubmit, defaultValues }: { onSubmit: (data: ProfileFormValues) => Promise<void>, defaultValues?: Partial<ProfileFormValues> }) {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: defaultValues || {
      category: "OTHER"
    }
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-[24px]">
      <div>
        <label className="block text-[15px] font-medium text-ink mb-[8px]">Display Name</label>
        <Input 
          {...register("displayName")} 
          placeholder="Alice Art" 
          error={errors.displayName?.message}
        />
      </div>

      <div>
        <label className="block text-[15px] font-medium text-ink mb-[8px]">URL Slug</label>
        <div className="flex items-center gap-[8px]">
          <span className="text-silver-thread bg-iron/5 px-[24px] h-[54px] flex items-center rounded-[45px] border border-iron/10 font-sans text-[15px]">
            veil.app/c/
          </span>
          <Input 
            {...register("slug")} 
            placeholder="alice-art" 
            className="flex-1"
            error={errors.slug?.message}
          />
        </div>
      </div>

      <div>
        <label className="block text-[15px] font-medium text-ink mb-[8px]">Category</label>
        <select 
          {...register("category")}
          className="flex h-[54px] w-full rounded-[45px] border border-iron/20 bg-canvas px-[24px] py-[12px] text-[15px] text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:border-ink font-sans appearance-none"
        >
          <option value="ART">Art</option>
          <option value="MUSIC">Music</option>
          <option value="WRITING">Writing</option>
          <option value="DEVELOPMENT">Development</option>
          <option value="GAMING">Gaming</option>
          <option value="EDUCATION">Education</option>
          <option value="OTHER">Other</option>
        </select>
        {errors.category?.message && (
          <span className="text-[13px] text-vivid-pink font-medium mt-[8px] px-[16px] block">{errors.category.message}</span>
        )}
      </div>

      <div>
        <label className="block text-[15px] font-medium text-ink mb-[8px]">Bio</label>
        <textarea 
          {...register("bio")} 
          placeholder="Tell your patrons what you're building..."
          className="flex w-full rounded-[30px] border border-iron/20 bg-canvas px-[24px] py-[16px] text-[15px] text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:border-ink resize-none h-[140px] font-sans placeholder:text-silver-thread"
        />
        {errors.bio?.message && (
          <span className="text-[13px] text-vivid-pink font-medium mt-[8px] px-[16px] block">{errors.bio.message}</span>
        )}
      </div>

      <div className="pt-[16px]">
        <Button type="submit" size="lg" className="w-full">
          Save Profile
        </Button>
      </div>
    </form>
  );
}
