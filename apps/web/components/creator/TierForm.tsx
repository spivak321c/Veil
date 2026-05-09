"use client";

import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Trash2, Plus } from "lucide-react";

const tierSchema = z.object({
  name: z.string().min(1).max(30),
  amountUsdc: z.coerce.number().min(1, "Minimum 1 USDC").max(10000, "Maximum 10,000 USDC"),
  description: z.string().max(200),
});

const formSchema = z.object({
  tiers: z.array(tierSchema).min(1, "At least one tier is required").max(5, "Maximum 5 tiers"),
});

type TiersFormValues = z.infer<typeof formSchema>;

export function TierForm({ onSubmit, defaultTiers }: { onSubmit: (data: TiersFormValues) => Promise<void>, defaultTiers?: TiersFormValues["tiers"] }) {
  const { register, control, handleSubmit, formState: { errors, isSubmitting } } = useForm<TiersFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      tiers: defaultTiers || [{ name: "Supporter", amountUsdc: 5, description: "Thanks for your support!" }]
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "tiers",
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-[24px]">
      <div className="space-y-[16px]">
        {fields.map((field, index) => (
          <div key={field.id} className="p-[32px] rounded-[30px] border border-iron/10 bg-canvas relative group hover:border-iron/30 transition-colors">
            {fields.length > 1 && (
              <button 
                type="button" 
                onClick={() => remove(index)}
                className="absolute top-[24px] right-[24px] text-iron hover:text-vivid-pink transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink rounded-md"
              >
                <Trash2 className="w-[20px] h-[20px]" />
              </button>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-[24px] mb-[24px] pr-[32px]">
              <div>
                <label className="block text-[15px] font-medium text-ink mb-[8px]">Tier Name</label>
                <Input {...register(`tiers.${index}.name`)} placeholder="e.g. Believer" error={errors.tiers?.[index]?.name?.message} />
              </div>
              <div>
                <label className="block text-[15px] font-medium text-ink mb-[8px]">Amount (USDC)</label>
                <div className="relative">
                  <span className="absolute left-[24px] top-1/2 -translate-y-1/2 text-silver-thread font-mono">$</span>
                  <Input 
                    type="number"
                    className="pl-[44px] font-mono"
                    {...register(`tiers.${index}.amountUsdc`)} 
                    error={errors.tiers?.[index]?.amountUsdc?.message}
                  />
                </div>
              </div>
            </div>
            
            <div>
              <label className="block text-[15px] font-medium text-ink mb-[8px]">Description</label>
              <Input {...register(`tiers.${index}.description`)} placeholder="What does this tier represent?" error={errors.tiers?.[index]?.description?.message} />
            </div>
          </div>
        ))}
      </div>

      {fields.length < 5 && (
        <Button 
          type="button" 
          variant="secondary" 
          onClick={() => append({ name: "", amountUsdc: 10, description: "" })}
          className="w-full border-dashed border-iron/20"
        >
          <Plus className="w-[20px] h-[20px] mr-[8px]" />
          Add Another Tier
        </Button>
      )}

      {errors.tiers?.root?.message && (
        <p className="text-vivid-pink text-[14px] font-medium text-center">{errors.tiers.root.message}</p>
      )}

      <div className="pt-[16px] border-t border-iron/10 mt-[32px]">
        <Button type="submit" size="lg" className="w-full">
          Save Tiers
        </Button>
      </div>
    </form>
  );
}
