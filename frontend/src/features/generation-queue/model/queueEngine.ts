import type { GenerationTask } from "@/entities/generation-task";
import type { QueueAction } from "./queueReducer";

type Dispatch = (action: QueueAction) => void;

const ERROR_MESSAGES = [
  "Недостаточно кредитов",
  "Превышено время ожидания",
  "Модель временно недоступна",
] as const;

const TICK_MS = 550;

function randomBetween(min: number, max: number) {
  return min + Math.random() * (max - min);
}

function getProgressStep(task: GenerationTask) {
  if (task.type === "text") return randomBetween(9, 17);
  if (task.type === "image") return randomBetween(6, 12);
  if (task.type === "audio") return randomBetween(3.5, 7);
  return randomBetween(2.5, 5.5);
}

function shouldFail(task: GenerationTask) {
  if (task.progress < 12 || task.progress > 88) return false;
  return Math.random() < 0.018;
}

function pickErrorMessage() {
  return ERROR_MESSAGES[Math.floor(Math.random() * ERROR_MESSAGES.length)];
}

export function createQueueEngine(getTasks: () => GenerationTask[], dispatch: Dispatch) {
  let intervalId: number | null = null;

  const tick = () => {
    dispatch({ type: "QUEUE_RECONCILE" });

    for (const task of getTasks()) {
      if (task.status !== "running") continue;
      if (shouldFail(task)) {
        dispatch({ type: "TASK_FAIL", id: task.id, error: pickErrorMessage() });
        continue;
      }
      dispatch({
        type: "TASK_PROGRESS",
        id: task.id,
        progress: task.progress + getProgressStep(task),
      });
    }
  };

  return {
    start() {
      if (intervalId !== null) return;
      intervalId = window.setInterval(tick, TICK_MS);
    },
    stop() {
      if (intervalId === null) return;
      window.clearInterval(intervalId);
      intervalId = null;
    },
  };
}
