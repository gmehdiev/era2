import { cn } from "@/shared/lib/utils";

export function ProgressBar({ value, compact = false }: { value: number; compact?: boolean }) {
  return (
    <div className={cn("overflow-hidden rounded-full bg-[#251d1a]", compact ? "h-1.5" : "h-1.5")}>
      <div
        className="h-full rounded-full bg-primary transition-[width] duration-500 ease-out"
        style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
      />
    </div>
  );
}
