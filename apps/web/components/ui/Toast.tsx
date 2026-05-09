"use client";

import { Toaster as Sonner } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

export function Toaster({ ...props }: ToasterProps) {
  return (
    <Sonner
      theme="light"
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-canvas group-[.toaster]:text-ink group-[.toaster]:border-iron/10 group-[.toaster]:shadow-sm group-[.toaster]:rounded-[16px] group-[.toaster]:font-sans",
          description: "group-[.toast]:text-iron",
          actionButton:
            "group-[.toast]:bg-ink group-[.toast]:text-canvas",
          cancelButton:
            "group-[.toast]:bg-iron/5 group-[.toast]:text-iron",
        },
      }}
      {...props}
    />
  );
}

export { toast } from "sonner";
