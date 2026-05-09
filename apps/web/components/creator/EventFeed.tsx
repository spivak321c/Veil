"use client";

import { motion, AnimatePresence } from "framer-motion";
import type { SupportEventPublic } from "@veil/db";
import { formatMicroUsdc } from "@/lib/constants";

interface EventFeedProps {
  events: SupportEventPublic[];
}

export function EventFeed({ events }: EventFeedProps) {
  return (
    <div className="bg-canvas border border-iron/10 rounded-[30px] overflow-hidden">
      <AnimatePresence mode="popLayout">
        {events.length === 0 ? (
          <div className="py-[60px] text-center text-[15px] text-iron">No recent activity</div>
        ) : (
          <div className="divide-y divide-iron/10">
            {events.map((event, idx) => (
              <motion.div 
                layout
                key={event.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="flex items-center justify-between p-[24px] hover:bg-iron/5 transition-colors"
              >
                <div className="flex items-center gap-[16px]">
                  <div className={`w-[8px] h-[8px] rounded-full ${event.claimedAt ? 'bg-iron/20' : 'bg-sky-blue'}`} />
                  <div className="font-mono text-[15px] text-ink">
                    {event.id.split('-')[0]}
                  </div>
                  <div className="text-[14px] text-silver-thread hidden sm:block">
                    {new Date(event.createdAt).toLocaleDateString()}
                  </div>
                </div>
                
                <div className="flex items-center gap-[24px]">
                  <div className="font-mono text-[16px] text-ink font-medium">
                    +${formatMicroUsdc(event.amountUsdc)}
                  </div>
                  <div className="w-[80px] text-right text-[14px] font-medium">
                    {event.claimedAt ? (
                      <span className="text-silver-thread">Claimed</span>
                    ) : (
                      <span className="text-sky-blue">Pending</span>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}