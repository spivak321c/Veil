import { forwardRef } from "react";
import { cn } from "@/lib/utils/cn";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, ...props }, ref) => {
    return (
      <div className="w-full flex flex-col gap-[8px]">
        <input
          ref={ref}
          className={cn(
            "flex h-[54px] w-full rounded-[45px] border bg-canvas px-[24px] py-[12px] text-[15px] text-ink ring-offset-canvas file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-silver-thread focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink disabled:cursor-not-allowed disabled:opacity-50 transition-colors duration-200 font-sans",
            error ? "border-vivid-pink focus-visible:ring-vivid-pink" : "border-iron/20 focus-visible:border-ink",
            className
          )}
          {...props}
        />
        {error && (
          <span className="text-[13px] text-vivid-pink font-medium px-[16px]">{error}</span>
        )}
      </div>
    );
  }
);
Input.displayName = "Input";
