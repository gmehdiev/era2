import { seedGenerationTasks } from "@/entities/generation-task";
import { getQueueStats } from "@/features/generation-queue";
import { MAX_CONCURRENT, queueReducer } from "./queueReducer";

const baseTasks = seedGenerationTasks.map((task, index) => ({
  ...task,
  id: `spec-${index}`,
  createdAt: 1_000 + index,
  updatedAt: 1_000 + index,
  status: index < 4 ? "queued" : task.status,
  progress: 0,
}));

const initialState = {
  status: "ready" as const,
  tasks: baseTasks,
  error: null,
};

const started = queueReducer(initialState, { type: "QUEUE_RECONCILE" });

if (started.tasks.filter((task) => task.status === "running").length !== MAX_CONCURRENT) {
  throw new Error("QUEUE_RECONCILE must start no more than MAX_CONCURRENT tasks");
}

const firstRunning = started.tasks.find((task) => task.status === "running");
if (!firstRunning) throw new Error("QUEUE_RECONCILE must start the first queued task");

const afterDone = queueReducer(started, {
  type: "TASK_PROGRESS",
  id: firstRunning.id,
  progress: 100,
});

if (afterDone.tasks.filter((task) => task.status === "running").length !== MAX_CONCURRENT) {
  throw new Error("Completing a running task must pull the next queued task into a free slot");
}

const canceled = queueReducer(afterDone, { type: "TASK_CANCEL", id: "spec-2" });
if (canceled.tasks.find((task) => task.id === "spec-2")?.status !== "canceled") {
  throw new Error("TASK_CANCEL must mark queued/running tasks as canceled");
}

const retried = queueReducer(canceled, { type: "TASK_RETRY", id: "spec-2" });
if (retried.tasks.find((task) => task.id === "spec-2")?.status !== "queued") {
  throw new Error("TASK_RETRY must return failed/canceled tasks to queued");
}

const stats = getQueueStats(retried.tasks);
if (stats.total !== retried.tasks.length) {
  throw new Error("getQueueStats total must match tasks length");
}
