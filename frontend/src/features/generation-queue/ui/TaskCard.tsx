import type { GenerationTask, GenType } from "@/entities/generation-task";
import { formatCredits, formatDuration, formatEta } from "@/features/generation-queue/lib/formatEta";
import { cn } from "@/shared/lib/utils";
import { AudioLines, FileText, ImageIcon, Video } from "lucide-react";
import { ProgressBar } from "./ProgressBar";
import { StatusBadge } from "./StatusBadge";
import { TaskActions } from "./TaskActions";

const typeLabels: Record<GenType, string> = {
  text: "Текст",
  image: "Изображение",
  video: "Видео",
  audio: "Аудио",
};

const typeIcons = {
  text: FileText,
  image: ImageIcon,
  video: Video,
  audio: AudioLines,
};

interface TaskCardProps {
  task: GenerationTask;
  queuePosition: number | null;
  onCancel: (id: string) => void;
  onRetry: (id: string) => void;
  onDelete: (id: string) => void;
  onDownload: (id: string) => void;
}

export function TaskCard({ task, queuePosition, onCancel, onRetry, onDelete, onDownload }: TaskCardProps) {
  const Icon = typeIcons[task.type];

  return (
    <article className="rounded-[14px] border border-[var(--q-border)] bg-[var(--q-card)] p-4 shadow-[var(--shadow-1)]">
      <div className="flex items-start gap-3">
        <div
          className={cn(
            "flex size-12 shrink-0 items-center justify-center rounded-[14px] border border-[var(--q-border)]",
            task.type === "image" || task.type === "video" ? "bg-[var(--q-preview)] text-primary" : "bg-[var(--q-preview-strong)] text-primary",
          )}
        >
          <Icon className="size-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-[var(--q-chip)] px-2 py-0.5 text-[11px] text-[var(--q-muted)]">
              {typeLabels[task.type]}
            </span>
            <StatusBadge status={task.status} />
          </div>
          <h3 className="mt-2 line-clamp-3 text-sm font-semibold leading-5">{task.prompt}</h3>
          <p className="mt-1 truncate font-mono text-[11px] text-[var(--q-muted)]">{task.model}</p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2 text-xs text-[var(--q-muted)]">
        <span>{formatCredits(task.credits)}</span>
        <span>·</span>
        <span>{formatDuration(task.durationSeconds)}</span>
        {queuePosition ? (
          <>
            <span>·</span>
            <span>позиция {queuePosition}</span>
          </>
        ) : null}
      </div>

      <div className="mt-4">
        {task.status === "running" ? (
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between font-mono text-xs text-muted-foreground">
              <span>{Math.round(task.progress)}%</span>
              <span>{formatEta(task.etaSeconds)}</span>
            </div>
            <ProgressBar value={task.progress} />
          </div>
        ) : null}
      </div>

      <div className="mt-4">
        <TaskActions task={task} onCancel={onCancel} onRetry={onRetry} onDelete={onDelete} onDownload={onDownload} />
      </div>
    </article>
  );
}
