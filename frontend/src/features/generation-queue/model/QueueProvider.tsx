import { useCallback, useEffect, useMemo, useReducer, useRef } from "react";
import type { ReactNode } from "react";
import { seedGenerationTasks } from "@/entities/generation-task";
import type { GenerationTask } from "@/entities/generation-task";
import { createQueueEngine } from "./queueEngine";
import { initialQueueState, queueReducer } from "./queueReducer";
import { QueueContext } from "./useQueue";

const STORAGE_KEY = "era2:generation-queue:v7";
const LOAD_DELAY_MS = 600;

function readStoredTasks() {
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (!stored) return null;
  const parsed = JSON.parse(stored) as GenerationTask[];
  if (!Array.isArray(parsed)) throw new Error("Некорректный формат очереди");
  return parsed;
}

export function QueueProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(queueReducer, initialQueueState);
  const tasksRef = useRef(state.tasks);

  useEffect(() => {
    tasksRef.current = state.tasks;
  }, [state.tasks]);

  const loadQueue = useCallback(() => {
    dispatch({ type: "LOAD_START" });
    const timer = window.setTimeout(() => {
      try {
        dispatch({ type: "LOAD_SUCCESS", tasks: readStoredTasks() ?? seedGenerationTasks });
      } catch {
        dispatch({ type: "LOAD_ERROR", error: "Не удалось восстановить очередь. Можно начать заново." });
      }
    }, LOAD_DELAY_MS);

    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => loadQueue(), [loadQueue]);

  useEffect(() => {
    if (state.status !== "ready") return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state.tasks));
  }, [state.status, state.tasks]);

  useEffect(() => {
    if (state.status !== "ready") return;
    const engine = createQueueEngine(() => tasksRef.current, dispatch);
    engine.start();
    return () => engine.stop();
  }, [state.status]);

  const value = useMemo(
    () => ({
      ...state,
      dispatch,
      cancelTask: (id: string) => dispatch({ type: "TASK_CANCEL", id }),
      retryTask: (id: string) => dispatch({ type: "TASK_RETRY", id }),
      deleteTask: (id: string) => dispatch({ type: "TASK_DELETE", id }),
      moveQueuedTask: (id: string, direction: "up" | "down") => dispatch({ type: "TASK_MOVE_QUEUED", id, direction }),
      restoreTasks: (tasks: GenerationTask[]) => dispatch({ type: "TASKS_RESTORE", tasks }),
      clearDone: () => dispatch({ type: "CLEAR_DONE" }),
      reloadQueue: () => {
        window.localStorage.removeItem(STORAGE_KEY);
        loadQueue();
      },
    }),
    [loadQueue, state],
  );

  return <QueueContext.Provider value={value}>{children}</QueueContext.Provider>;
}
