import type { GenerationTask, GenType, TaskStatus } from "@/entities/generation-task";

export type QueueStatusFilter = "all" | Extract<TaskStatus, "queued" | "running" | "done" | "failed">;
export type QueueTypeFilter = "all" | GenType;
export type QueueSort = "newest" | "oldest" | "progress";

export interface QueueFilters {
  status: QueueStatusFilter;
  type: QueueTypeFilter;
  sort: QueueSort;
  query: string;
}

export function getQueueStats(tasks: GenerationTask[]) {
  return {
    total: tasks.length,
    queued: tasks.filter((task) => task.status === "queued").length,
    running: tasks.filter((task) => task.status === "running").length,
    done: tasks.filter((task) => task.status === "done").length,
    failed: tasks.filter((task) => task.status === "failed").length,
    canceled: tasks.filter((task) => task.status === "canceled").length,
  };
}

export function getQueuePosition(tasks: GenerationTask[], id: string) {
  const queued = tasks
    .filter((task) => task.status === "queued")
    .sort((a, b) => a.createdAt - b.createdAt);
  const index = queued.findIndex((task) => task.id === id);
  return index === -1 ? null : index + 1;
}

export function getActiveTasks(tasks: GenerationTask[]) {
  return tasks
    .filter((task) => task.status === "running" || task.status === "queued")
    .sort((a, b) => {
      if (a.status !== b.status) return a.status === "running" ? -1 : 1;
      return a.createdAt - b.createdAt;
    });
}

export function getAverageActiveProgress(tasks: GenerationTask[]) {
  const active = getActiveTasks(tasks);
  if (active.length === 0) return 0;
  const total = active.reduce((sum, task) => sum + (task.status === "queued" ? 0 : task.progress), 0);
  return Math.round(total / active.length);
}

export function selectVisibleTasks(tasks: GenerationTask[], filters: QueueFilters) {
  const normalizedQuery = filters.query.trim().toLowerCase();
  const statusRank: Record<GenerationTask["status"], number> = {
    running: 0,
    queued: 1,
    done: 2,
    failed: 3,
    canceled: 4,
  };

  return tasks
    .filter((task) => filters.status === "all" || task.status === filters.status)
    .filter((task) => filters.type === "all" || task.type === filters.type)
    .filter((task) => {
      if (!normalizedQuery) return true;
      return `${task.prompt} ${task.model}`.toLowerCase().includes(normalizedQuery);
    })
    .sort((a, b) => {
      if (filters.sort === "newest" || filters.sort === "oldest") {
        const statusDelta = statusRank[a.status] - statusRank[b.status];
        if (statusDelta !== 0) return statusDelta;
      }
      if (filters.sort === "oldest") return a.createdAt - b.createdAt;
      if (filters.sort === "progress") return b.progress - a.progress;
      return b.createdAt - a.createdAt;
    });
}
