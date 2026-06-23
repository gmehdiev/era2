import { useState } from "react";
import { getActiveTasks, getAverageActiveProgress, useQueue } from "@/features/generation-queue";
import { ProgressBar } from "@/features/generation-queue/ui/ProgressBar";
import { formatEta } from "@/features/generation-queue/lib/formatEta";
import { useNavigate } from "@/shared/routing";
import { Button } from "@/shared/ui/button";
import { ChevronDown, ChevronUp, Loader2 } from "lucide-react";

export function GlobalQueueStatusBar() {
  const { status, tasks } = useQueue();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  if (status !== "ready") return null;

  const active = getActiveTasks(tasks);
  if (active.length === 0) return null;

  const average = getAverageActiveProgress(tasks);
  const primaryTask = active[0];

  if (collapsed) {
    return (
      <button
        type="button"
        onClick={() => setCollapsed(false)}
        className="fixed bottom-3 left-3 right-3 z-50 flex items-center justify-between rounded-full border border-primary/30 bg-card px-4 py-3 text-sm shadow-[var(--shadow-2)] safe-bottom md:left-auto md:right-6 md:w-[320px]"
      >
        <span className="font-medium">{active.length} генераций · {average}%</span>
        <ChevronUp className="size-4 text-muted-foreground" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-3 left-3 right-3 z-50 rounded-[14px] border border-primary/25 bg-card p-3 shadow-[var(--shadow-2)] safe-bottom md:left-auto md:right-6 md:w-[380px]">
      {active.length === 1 && primaryTask ? (
        <div className="flex items-center gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Loader2 className="size-4 animate-spin" />
          </div>
          <button type="button" onClick={() => navigate("/queue")} className="min-w-0 flex-1 text-left">
            <div className="flex items-center justify-between gap-3">
              <p className="truncate text-sm font-medium">{primaryTask.model}</p>
              <span className="font-mono text-xs text-muted-foreground">{Math.round(primaryTask.progress)}%</span>
            </div>
            <div className="mt-2">
              <ProgressBar value={primaryTask.progress} compact />
            </div>
          </button>
          <Button size="icon" variant="quiet" onClick={() => setCollapsed(true)} aria-label="Свернуть статус генерации">
            <ChevronDown />
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <div className="flex items-start justify-between gap-3">
            <button type="button" onClick={() => navigate("/queue")} className="text-left">
              <p className="text-sm font-semibold">Генерации идут · {active.length} активны · {average}%</p>
              <p className="mt-1 text-xs text-muted-foreground">Очередь обновляется в реальном времени</p>
            </button>
            <Button size="icon" variant="quiet" onClick={() => setCollapsed(true)} aria-label="Свернуть статус генераций">
              <ChevronDown />
            </Button>
          </div>

          <div className="flex flex-col gap-2">
            {active.slice(0, 3).map((task) => (
              <div key={task.id} className="rounded-xl bg-secondary/60 px-3 py-2">
                <div className="flex items-center justify-between gap-3">
                  <span className="truncate text-xs font-medium">{task.model}</span>
                  <span className="font-mono text-[11px] text-muted-foreground">
                    {task.status === "queued" ? "ждёт" : formatEta(task.etaSeconds)}
                  </span>
                </div>
                <div className="mt-2">
                  <ProgressBar value={task.status === "queued" ? 0 : task.progress} compact />
                </div>
              </div>
            ))}
          </div>

          <Button size="sm" variant="outline" onClick={() => navigate("/queue")} className="w-full">
            Открыть очередь →
          </Button>
        </div>
      )}
    </div>
  );
}
