import { createServer } from "vite";

const server = await createServer({
  configFile: "./vite.config.ts",
  server: { middlewareMode: true },
  appType: "custom",
  logLevel: "error",
});

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

try {
  const [{ seedGenerationTasks }, queueModule, selectors] = await Promise.all([
    server.ssrLoadModule("/src/entities/generation-task/index.ts"),
    server.ssrLoadModule("/src/features/generation-queue/model/queueReducer.ts"),
    server.ssrLoadModule("/src/features/generation-queue/model/selectors.ts"),
  ]);

  const { MAX_CONCURRENT, queueReducer } = queueModule;
  const { getQueueStats } = selectors;

  const baseTasks = seedGenerationTasks.map((task, index) => ({
    ...task,
    id: `spec-${index}`,
    createdAt: 1_000 + index,
    updatedAt: 1_000 + index,
    status: index < 5 ? "queued" : task.status,
    progress: 0,
  }));

  const initialState = {
    status: "ready",
    tasks: baseTasks,
    error: null,
  };

  const started = queueReducer(initialState, { type: "QUEUE_RECONCILE" });
  assert(
    started.tasks.filter((task) => task.status === "running").length === MAX_CONCURRENT,
    "QUEUE_RECONCILE must start exactly MAX_CONCURRENT tasks when enough queued tasks exist",
  );

  const firstRunning = started.tasks.find((task) => task.status === "running");
  assert(firstRunning, "QUEUE_RECONCILE must start the first queued task");

  const afterDone = queueReducer(started, {
    type: "TASK_PROGRESS",
    id: firstRunning.id,
    progress: 100,
  });
  assert(
    afterDone.tasks.filter((task) => task.status === "running").length === MAX_CONCURRENT,
    "Completing a running task must pull the next queued task into a free slot",
  );

  const canceled = queueReducer(afterDone, { type: "TASK_CANCEL", id: "spec-2" });
  assert(
    canceled.tasks.find((task) => task.id === "spec-2")?.status === "canceled",
    "TASK_CANCEL must mark queued/running tasks as canceled",
  );

  const retried = queueReducer(canceled, { type: "TASK_RETRY", id: "spec-2" });
  assert(
    retried.tasks.find((task) => task.id === "spec-2")?.status === "queued",
    "TASK_RETRY must return failed/canceled tasks to queued",
  );

  const reorderState = {
    ...initialState,
    tasks: baseTasks.slice(0, 4).map((task) => ({ ...task, status: "queued" })),
  };
  const queuedBeforeMove = reorderState.tasks
    .filter((task) => task.status === "queued")
    .sort((a, b) => a.createdAt - b.createdAt);
  const moved = queueReducer(reorderState, {
    type: "TASK_MOVE_QUEUED",
    id: queuedBeforeMove.at(-1).id,
    direction: "up",
  });
  const queuedAfterMove = moved.tasks
    .filter((task) => task.status === "queued")
    .sort((a, b) => a.createdAt - b.createdAt);
  assert(
    queuedAfterMove.at(-1).id !== queuedBeforeMove.at(-1).id,
    "TASK_MOVE_QUEUED must move a queued task by changing its createdAt ordering",
  );

  const restored = queueReducer(moved, { type: "TASKS_RESTORE", tasks: retried.tasks });
  assert(
    restored.tasks.map((task) => task.id).join(",") === retried.tasks.map((task) => task.id).join(","),
    "TASKS_RESTORE must restore a previous snapshot for undo",
  );

  const stats = getQueueStats(restored.tasks);
  assert(stats.total === restored.tasks.length, "getQueueStats total must match tasks length");

  console.log("queue logic tests passed");
} finally {
  await server.close();
}
