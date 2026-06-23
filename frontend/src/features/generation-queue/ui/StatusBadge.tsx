import type { TaskStatus } from "@/entities/generation-task";
import { cn } from "@/shared/lib/utils";

const statusClasses: Record<TaskStatus, string> = {
  queued: "border-transparent bg-[#171211] text-[#8d827b]",
  running: "border-transparent bg-[#431b0c] text-primary",
  done: "border-transparent bg-[#073b2a] text-emerald-400",
  failed: "border-transparent bg-[#44191b] text-[#ff6970]",
  canceled: "border-transparent bg-[#12100f] text-[#6f6560]",
};

const statusLabels: Record<TaskStatus, string> = {
  queued: "В очереди",
  running: "Идёт",
  done: "Готово",
  failed: "Ошибка",
  canceled: "Отменено",
};

export function StatusBadge({ status, className }: { status: TaskStatus; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex h-10 w-fit shrink-0 items-center justify-self-start rounded-[10px] border px-4 text-base font-semibold",
        statusClasses[status],
        className,
      )}
    >
      {statusLabels[status]}
    </span>
  );
}
