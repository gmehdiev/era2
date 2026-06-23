import type { GenerationTask } from "@/entities/generation-task";
import { Button } from "@/shared/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";
import { Download, MoreHorizontal, RotateCcw, Trash2, X } from "lucide-react";

interface TaskActionsProps {
  task: GenerationTask;
  onCancel: (id: string) => void;
  onRetry: (id: string) => void;
  onDelete: (id: string) => void;
  onDownload: (id: string) => void;
}

export function TaskActions({ task, onCancel, onRetry, onDelete, onDownload }: TaskActionsProps) {
  const canCancel = task.status === "queued" || task.status === "running";
  const canRetry = task.status === "failed" || task.status === "canceled";
  const canDownload = task.status === "done";

  return (
    <div className="flex items-center justify-end gap-2">
      {canCancel ? (
        <Button
          size="icon"
          variant="outline"
          onClick={() => onCancel(task.id)}
          aria-label="Отменить задачу"
          title="Отменить"
          className="size-11 rounded-[10px] border-[var(--q-border)] bg-[var(--q-chip)] text-[var(--q-muted)] hover:bg-[var(--q-preview)] hover:text-[var(--q-fg)]"
        >
          <X />
        </Button>
      ) : null}
      {canRetry ? (
        <Button
          size="icon"
          variant="outline"
          onClick={() => onRetry(task.id)}
          aria-label="Повторить задачу"
          title="Повторить"
          className="size-11 rounded-[10px] border-[var(--q-border)] bg-[var(--q-chip)] text-primary hover:bg-[var(--q-preview)] hover:text-primary"
        >
          <RotateCcw />
        </Button>
      ) : null}
      {canDownload ? (
        <Button
          size="icon"
          variant="outline"
          onClick={() => onDownload(task.id)}
          aria-label="Скачать результат"
          title="Скачать"
          className="size-11 rounded-[10px] border-[var(--q-border)] bg-[var(--q-chip)] text-primary hover:bg-[var(--q-preview)] hover:text-primary"
        >
          <Download />
        </Button>
      ) : null}

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            size="icon"
            variant="outline"
            aria-label="Дополнительные действия"
            className="size-11 rounded-[10px] border-[var(--q-border)] bg-[var(--q-chip)] text-[var(--q-muted)] hover:bg-[var(--q-preview)] hover:text-[var(--q-fg)]"
          >
            <MoreHorizontal />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-40">
          <DropdownMenuGroup>
            <DropdownMenuItem onClick={() => onDelete(task.id)} className="text-destructive focus:text-destructive">
              <Trash2 />
              Удалить
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
