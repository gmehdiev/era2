import type { GenerationTask } from "@/entities/generation-task";
import type { DragEvent } from "react";
import { formatCredits, formatDuration } from "@/features/generation-queue/lib/formatEta";
import { cn } from "@/shared/lib/utils";
import { AudioLines, FileText, ImageIcon, Video } from "lucide-react";
import { ProgressBar } from "./ProgressBar";
import { StatusBadge } from "./StatusBadge";
import { TaskActions } from "./TaskActions";

const typeIcons = {
  text: FileText,
  image: ImageIcon,
  video: Video,
  audio: AudioLines,
};

interface TaskRowProps {
  task: GenerationTask;
  queuePosition: number | null;
  onCancel: (id: string) => void;
  onRetry: (id: string) => void;
  onDelete: (id: string) => void;
  onDownload: (id: string) => void;
  onMoveQueued: (id: string, direction: "up" | "down") => void;
  onDragQueuedStart: (id: string) => void;
  onDragQueuedOver: (event: DragEvent<HTMLDivElement>) => void;
  onDropQueued: (targetId: string) => void;
}

export function TaskRow({
  task,
  queuePosition,
  onCancel,
  onRetry,
  onDelete,
  onDownload,
  onMoveQueued,
  onDragQueuedStart,
  onDragQueuedOver,
  onDropQueued,
}: TaskRowProps) {
  const Icon = typeIcons[task.type];
  const isRunning = task.status === "running";
  const isQueued = task.status === "queued";

  return (
    <div
      role="listitem"
      tabIndex={isQueued ? 0 : undefined}
      draggable={isQueued}
      aria-label={isQueued ? `${task.prompt}. Можно переместить Alt и стрелками вверх или вниз.` : task.prompt}
      aria-grabbed={isQueued ? false : undefined}
      onDragStart={(event) => {
        if (!isQueued) return;
        event.dataTransfer.effectAllowed = "move";
        onDragQueuedStart(task.id);
      }}
      onDragOver={isQueued ? onDragQueuedOver : undefined}
      onDrop={(event) => {
        if (!isQueued) return;
        event.preventDefault();
        onDropQueued(task.id);
      }}
      onKeyDown={(event) => {
        if (!isQueued || !event.altKey) return;
        if (event.key === "ArrowUp") {
          event.preventDefault();
          onMoveQueued(task.id, "up");
        }
        if (event.key === "ArrowDown") {
          event.preventDefault();
          onMoveQueued(task.id, "down");
        }
      }}
      className={cn(
        "grid min-h-[124px] grid-cols-[80px_minmax(0,1fr)_auto_auto_auto] items-center gap-5 rounded-[22px] border bg-[var(--q-card)] px-5 py-5 shadow-none transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--q-bg)]",
        isRunning ? "border-primary/55" : "border-[var(--q-border)]",
        isQueued && "cursor-grab active:cursor-grabbing",
      )}
    >
      <div
        className={cn(
          "flex size-20 shrink-0 items-center justify-center rounded-[16px] border border-[var(--q-border)]",
          task.type === "image" || task.type === "video" ? "bg-[var(--q-preview)] text-primary" : "bg-[var(--q-preview-strong)] text-primary",
        )}
      >
        <Icon className="size-7" strokeWidth={1.9} />
      </div>

      <div className="min-w-0">
        <p className="truncate text-xl font-semibold leading-7 text-[var(--q-fg)]">{task.prompt}</p>
        <div className="mt-2 flex min-w-0 items-center gap-3 text-base text-[var(--q-muted)]">
          <span className="size-2 rounded-full bg-primary" />
          <span className="truncate font-mono">{task.model}</span>
          <span>·</span>
          <span className="truncate">
            {task.status === "queued" && queuePosition
              ? `позиция ${queuePosition} в очереди · ${formatCredits(task.credits)}`
              : `${formatDuration(task.durationSeconds)} · ${formatCredits(task.credits)}`}
          </span>
        </div>

        {isRunning ? (
          <div className="mt-4">
            <ProgressBar value={task.progress} />
          </div>
        ) : null}
      </div>

      <span className="min-w-10 text-right font-mono text-lg font-semibold text-primary">
        {isRunning ? `${Math.round(task.progress)}%` : ""}
      </span>

      <StatusBadge status={task.status} />

      <TaskActions task={task} onCancel={onCancel} onRetry={onRetry} onDelete={onDelete} onDownload={onDownload} />
    </div>
  );
}
