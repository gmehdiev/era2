import { createContext, useContext } from "react";
import type { QueueAction, QueueState } from "./queueReducer";

export interface QueueContextValue extends QueueState {
  dispatch: React.Dispatch<QueueAction>;
  cancelTask: (id: string) => void;
  retryTask: (id: string) => void;
  deleteTask: (id: string) => void;
  moveQueuedTask: (id: string, direction: "up" | "down") => void;
  restoreTasks: (tasks: QueueState["tasks"]) => void;
  clearDone: () => void;
  reloadQueue: () => void;
}

export const QueueContext = createContext<QueueContextValue | null>(null);

export function useQueue() {
  const context = useContext(QueueContext);
  if (!context) throw new Error("useQueue must be used inside QueueProvider");
  return context;
}
