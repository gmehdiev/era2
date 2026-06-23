import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  getQueuePosition,
  getQueueStats,
  selectVisibleTasks,
  useQueue,
  type QueueFilters,
} from "@/features/generation-queue";
import { EmptyState } from "@/features/generation-queue/ui/states/EmptyState";
import { ErrorState } from "@/features/generation-queue/ui/states/ErrorState";
import { LoadingState } from "@/features/generation-queue/ui/states/LoadingState";
import { QueueStats } from "@/features/generation-queue/ui/QueueStats";
import { QueueToolbar } from "@/features/generation-queue/ui/QueueToolbar";
import { TaskCard } from "@/features/generation-queue/ui/TaskCard";
import { TaskRow } from "@/features/generation-queue/ui/TaskRow";
import { useTheme } from "@/features/theme-switcher";
import { Button } from "@/shared/ui/button";

const defaultFilters: QueueFilters = {
  status: "all",
  type: "all",
  sort: "newest",
  query: "",
};

const ROW_HEIGHT = 140;
const VIRTUAL_THRESHOLD = 40;
const VIRTUAL_HEIGHT = 780;
const OVERSCAN = 4;

export function GenerationQueue() {
  const {
    status,
    tasks,
    error,
    cancelTask,
    retryTask,
    deleteTask,
    moveQueuedTask,
    restoreTasks,
    clearDone,
    reloadQueue,
  } = useQueue();
  const { theme } = useTheme();
  const [filters, setFilters] = useState<QueueFilters>(defaultFilters);
  const [undo, setUndo] = useState<{ message: string; tasks: typeof tasks } | null>(null);
  const [draggedQueuedId, setDraggedQueuedId] = useState<string | null>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const undoTimerRef = useRef<number | null>(null);
  const shouldReduceMotion = useReducedMotion();

  const stats = useMemo(() => getQueueStats(tasks), [tasks]);
  const visibleTasks = useMemo(() => selectVisibleTasks(tasks, filters), [filters, tasks]);
  const shouldVirtualize = visibleTasks.length > VIRTUAL_THRESHOLD;
  const virtualStart = shouldVirtualize ? Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - OVERSCAN) : 0;
  const virtualEnd = shouldVirtualize
    ? Math.min(visibleTasks.length, Math.ceil((scrollTop + VIRTUAL_HEIGHT) / ROW_HEIGHT) + OVERSCAN)
    : visibleTasks.length;
  const desktopTasks = shouldVirtualize ? visibleTasks.slice(virtualStart, virtualEnd) : visibleTasks;
  const rowMotion = shouldReduceMotion
    ? {}
    : {
        initial: { opacity: 0, y: 8 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: -8 },
        transition: { duration: 0.18 },
      };
  const queueThemeVars =
    theme === "light"
      ? {
          "--q-bg": "#f6f3f0",
          "--q-fg": "#17110e",
          "--q-muted": "#7a6f66",
          "--q-card": "#fffaf5",
          "--q-border": "#d8c9bc",
          "--q-chip": "#eee5dc",
          "--q-preview": "#f5dfd2",
          "--q-preview-strong": "#f0d1bd",
        }
      : {
          "--q-bg": "#080403",
          "--q-fg": "#f6efe9",
          "--q-muted": "#8d827b",
          "--q-card": "#120d0c",
          "--q-border": "#2a221e",
          "--q-chip": "#171211",
          "--q-preview": "#1d100c",
          "--q-preview-strong": "#351506",
        };

  useEffect(() => {
    return () => {
      if (undoTimerRef.current !== null) window.clearTimeout(undoTimerRef.current);
    };
  }, []);

  const showUndo = (message: string, snapshot: typeof tasks) => {
    if (undoTimerRef.current !== null) window.clearTimeout(undoTimerRef.current);
    setUndo({ message, tasks: snapshot });
    undoTimerRef.current = window.setTimeout(() => setUndo(null), 6000);
  };

  const handleClearDone = () => {
    if (stats.done === 0) return;
    const snapshot = tasks;
    clearDone();
    showUndo("Готовые задачи удалены", snapshot);
  };

  const handleDownload = () => {
    window.alert("Скачивание результата здесь эмулируется.");
  };

  const handleDelete = (id: string) => {
    const snapshot = tasks;
    deleteTask(id);
    showUndo("Задача удалена", snapshot);
  };

  const handleUndo = () => {
    if (!undo) return;
    restoreTasks(undo.tasks);
    setUndo(null);
    if (undoTimerRef.current !== null) window.clearTimeout(undoTimerRef.current);
  };

  const handleDropQueued = (targetId: string) => {
    if (!draggedQueuedId || draggedQueuedId === targetId) return;
    const queued = tasks.filter((task) => task.status === "queued").sort((a, b) => a.createdAt - b.createdAt);
    const sourceIndex = queued.findIndex((task) => task.id === draggedQueuedId);
    const targetIndex = queued.findIndex((task) => task.id === targetId);
    if (sourceIndex === -1 || targetIndex === -1) return;
    const direction = sourceIndex > targetIndex ? "up" : "down";
    for (let step = 0; step < Math.abs(sourceIndex - targetIndex); step += 1) {
      moveQueuedTask(draggedQueuedId, direction);
    }
    setDraggedQueuedId(null);
  };

  const renderDesktopRow = (task: (typeof visibleTasks)[number], virtualIndex?: number) => (
    <motion.div
      key={task.id}
      layout={!shouldVirtualize && !shouldReduceMotion}
      style={
        shouldVirtualize && virtualIndex !== undefined
          ? { position: "absolute", left: 0, right: 0, top: virtualIndex * ROW_HEIGHT }
          : undefined
      }
      {...rowMotion}
    >
      <TaskRow
        task={task}
        queuePosition={getQueuePosition(tasks, task.id)}
        onCancel={cancelTask}
        onRetry={retryTask}
        onDelete={handleDelete}
        onDownload={handleDownload}
        onMoveQueued={moveQueuedTask}
        onDragQueuedStart={setDraggedQueuedId}
        onDragQueuedOver={(event) => event.preventDefault()}
        onDropQueued={handleDropQueued}
      />
    </motion.div>
  );

  return (
    <section
      className="min-h-screen bg-[var(--q-bg)] px-4 py-10 text-[var(--q-fg)] md:px-8 lg:px-12 lg:py-16"
      style={queueThemeVars}
    >
      <div className="mx-auto flex max-w-[1596px] flex-col gap-8">
        <header className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <h1 className="text-4xl font-semibold leading-tight tracking-normal md:text-[44px]">Очередь генераций</h1>
            <p className="mt-2 text-xl text-[#8d827b]">Все ваши задачи в реальном времени</p>
          </div>

          <Button
            variant="outline"
            onClick={handleClearDone}
            disabled={stats.done === 0}
            className="h-14 rounded-full border-[var(--q-border)] bg-transparent px-6 text-base text-[var(--q-muted)] hover:bg-[var(--q-chip)] hover:text-[var(--q-fg)]"
          >
            Очистить готовые
          </Button>
        </header>

        {status === "loading" ? (
          <>
            <QueueStats stats={{ queued: 0, running: 0, done: 0, failed: 0 }} />
            <LoadingState />
          </>
        ) : status === "error" ? (
          <ErrorState message={error ?? "Неизвестная ошибка"} onRetry={reloadQueue} />
        ) : (
          <>
            <QueueStats stats={stats} />
            <QueueToolbar filters={filters} onChange={setFilters} />

            {visibleTasks.length === 0 ? (
              <EmptyState onReset={() => setFilters(defaultFilters)} />
            ) : (
              <>
                <div
                  className="hidden lg:block"
                  role="list"
                  aria-label="Список задач генерации"
                  onScroll={(event) => setScrollTop(event.currentTarget.scrollTop)}
                  style={shouldVirtualize ? { maxHeight: VIRTUAL_HEIGHT, overflowY: "auto" } : undefined}
                >
                  <AnimatePresence initial={false}>
                    {shouldVirtualize ? (
                      <div style={{ height: visibleTasks.length * ROW_HEIGHT, position: "relative" }}>
                        {desktopTasks.map((task, index) => renderDesktopRow(task, virtualStart + index))}
                      </div>
                    ) : (
                      <div className="flex flex-col gap-3">{desktopTasks.map((task) => renderDesktopRow(task))}</div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="flex flex-col gap-3 lg:hidden">
                  <AnimatePresence initial={false}>
                    {visibleTasks.map((task) => (
                      <motion.div key={task.id} layout={!shouldReduceMotion} {...rowMotion}>
                        <TaskCard
                          task={task}
                          queuePosition={getQueuePosition(tasks, task.id)}
                          onCancel={cancelTask}
                          onRetry={retryTask}
                          onDelete={handleDelete}
                          onDownload={handleDownload}
                        />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </>
            )}
          </>
        )}

        <AnimatePresence>
          {undo ? (
            <motion.div
              className="fixed bottom-5 left-1/2 z-50 flex -translate-x-1/2 items-center gap-4 rounded-full border border-[var(--q-border)] bg-[var(--q-card)] px-5 py-3 text-sm text-[var(--q-fg)] shadow-[var(--shadow-2)]"
              initial={shouldReduceMotion ? false : { opacity: 0, y: 12, x: "-50%" }}
              animate={shouldReduceMotion ? { opacity: 1, x: "-50%" } : { opacity: 1, y: 0, x: "-50%" }}
              exit={shouldReduceMotion ? { opacity: 0, x: "-50%" } : { opacity: 0, y: 12, x: "-50%" }}
            >
              <span>{undo.message}</span>
              <button
                type="button"
                onClick={handleUndo}
                className="rounded-full px-3 py-1 font-medium text-primary outline-none transition-colors hover:bg-primary/10 focus-visible:ring-2 focus-visible:ring-primary"
              >
                Отменить
              </button>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </section>
  );
}
