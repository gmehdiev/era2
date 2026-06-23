export type GenType = "text" | "image" | "video" | "audio";

export type TaskStatus = "queued" | "running" | "done" | "failed" | "canceled";

export interface GenerationTask {
  id: string;
  type: GenType;
  status: TaskStatus;
  prompt: string;
  model: string;
  progress: number;
  createdAt: number;
  updatedAt: number;
  etaSeconds: number;
  durationSeconds: number;
  credits: number;
  error: string | null;
}
