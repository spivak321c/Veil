"use client";

import { ViewingKeyExport } from "@/components/umbra/ViewingKeyExport";

export default function CompliancePage() {
  return (
    <div className="space-y-[48px] pb-[48px] pt-[24px] font-sans">
      <div>
        <h1 className="text-[40px] tracking-[-0.78px] text-ink font-medium mb-[8px]">Compliance</h1>
        <p className="text-[16px] text-iron tracking-[-0.28px]">Generate viewing keys to cryptographically prove your revenue.</p>
      </div>

      <div className="max-w-2xl">
        <ViewingKeyExport />
      </div>
    </div>
  );
}
