import type { GenerationTask } from "@/entities/generation-task";

export const MAX_CONCURRENT = 2;

export interface QueueState {
  status: "loading" | "ready" | "error";
  tasks: GenerationTask[];
  error: string | null;
}

export type QueueAction =
  | { type: "LOAD_START" }
  | { type: "LOAD_SUCCESS"; tasks: GenerationTask[] }
  | { type: "LOAD_ERROR"; error: string }
  | { type: "QUEUE_RECONCILE" }
  | { type: "TASK_PROGRESS"; id: string; progress: number }
  | { type: "TASK_FAIL"; id: string; error: string }
  | { type: "TASK_CANCEL"; id: string }
  | { type: "TASK_RETRY"; id: string }
  | { type: "TASK_DELETE"; id: string }
  | { type: "TASK_MOVE_QUEUED"; id: string; direction: "up" | "down" }
  | { type: "TASKS_RESTORE"; tasks: GenerationTask[] }
  | { type: "CLEAR_DONE" };

export const initialQueueState: QueueState = {
  status: "loading",
  tasks: [],
  error: null,
};

function withUpdatedTask(
  tasks: GenerationTask[],
  id: string,
  update: (task: GenerationTask) => GenerationTask,
) {
  return tasks.map((task) => (task.id === id ? update(task) : task));
}

function reconcileQueue(tasks: GenerationTask[]) {
  let runningCount = 0;
  const runningLimited = tasks.map((task) => {
    if (task.status !== "running") return task;
    runningCount += 1;
    if (runningCount <= MAX_CONCURRENT) return task;
    return { ...task, status: "queued" as const, updatedAt: Date.now() };
  });

  const availableSlots = Math.max(0, MAX_CONCURRENT - runningLimited.filter((task) => task.status === "running").length);
  if (availableSlots === 0) return runningLimited;

  const queuedIds = runningLimited
    .filter((task) => task.status === "queued")
    .sort((a, b) => a.createdAt - b.createdAt)
    .slice(0, availableSlots)
    .map((task) => task.id);
  const queuedIdSet = new Set(queuedIds);

  return runningLimited.map((task) =>
    queuedIdSet.has(task.id)
      ? { ...task, status: "running" as const, updatedAt: Date.now() }
      : task,
  );
}

function normalizeRestoredTasks(tasks: GenerationTask[]) {
  return tasks.map((task) =>
    task.status === "running"
      ? { ...task, status: "queued" as const, updatedAt: Date.now() }
      : task,
  );
}

function moveQueuedTask(tasks: GenerationTask[], id: string, direction: "up" | "down") {
  const queued = tasks
    .filter((task) => task.status === "queued")
    .sort((a, b) => a.createdAt - b.createdAt);
  const index = queued.findIndex((task) => task.id === id);
  const swapIndex = direction === "up" ? index - 1 : index + 1;

  if (index === -1 || swapIndex < 0 || swapIndex >= queued.length) return tasks;

  const current = queued[index];
  const target = queued[swapIndex];

  return tasks.map((task) => {
    if (task.id === current.id) return { ...task, createdAt: target.createdAt, updatedAt: Date.now() };
    if (task.id === target.id) return { ...task, createdAt: current.createdAt, updatedAt: Date.now() };
    return task;
  });
}

export function queueReducer(state: QueueState, action: QueueAction): QueueState {
  switch (action.type) {
    case "LOAD_START":
      return { ...state, status: "loading", error: null };
    case "LOAD_SUCCESS":
      return {
        status: "ready",
        tasks: reconcileQueue(normalizeRestoredTasks(action.tasks)),
        error: null,
      };
    case "LOAD_ERROR":
      return { ...state, status: "error", error: action.error };
    case "QUEUE_RECONCILE":
      return { ...state, tasks: reconcileQueue(state.tasks) };
    case "TASK_PROGRESS": {
      const tasks = withUpdatedTask(state.tasks, action.id, (task) => {
        if (task.status !== "running") return task;
        const progress = Math.max(task.progress, Math.min(100, Math.round(action.progress)));
        return {
          ...task,
          progress,
          status: progress >= 100 ? "done" : "running",
          etaSeconds: progress >= 100 ? 0 : Math.max(1, Math.round(task.durationSeconds * (1 - progress / 100))),
          updatedAt: Date.now(),
          error: null,
        };
      });
      return { ...state, tasks: reconcileQueue(tasks) };
    }
    case "TASK_FAIL":
      return {
        ...state,
        tasks: reconcileQueue(
          withUpdatedTask(state.tasks, action.id, (task) =>
            task.status === "running"
              ? { ...task, status: "failed", error: action.error, etaSeconds: 0, updatedAt: Date.now() }
              : task,
          ),
        ),
      };
    case "TASK_CANCEL":
      return {
        ...state,
        tasks: reconcileQueue(
          withUpdatedTask(state.tasks, action.id, (task) =>
            task.status === "queued" || task.status === "running"
              ? { ...task, status: "canceled", etaSeconds: 0, updatedAt: Date.now() }
              : task,
          ),
        ),
      };
    case "TASK_RETRY":
      return {
        ...state,
        tasks: reconcileQueue(
          withUpdatedTask(state.tasks, action.id, (task) =>
            task.status === "failed" || task.status === "canceled"
              ? { ...task, status: "queued", progress: 0, etaSeconds: task.durationSeconds, error: null, updatedAt: Date.now() }
              : task,
          ),
        ),
      };
    case "TASK_DELETE":
      return { ...state, tasks: reconcileQueue(state.tasks.filter((task) => task.id !== action.id)) };
    case "TASK_MOVE_QUEUED":
      return { ...state, tasks: moveQueuedTask(state.tasks, action.id, action.direction) };
    case "TASKS_RESTORE":
      return { ...state, tasks: reconcileQueue(action.tasks) };
    case "CLEAR_DONE":
      return { ...state, tasks: state.tasks.filter((task) => task.status !== "done") };
    default:
      return state;
  }
}
