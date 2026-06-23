import { Button } from "@/shared/ui/button";
import { AlertTriangle } from "lucide-react";

export function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex min-h-[360px] flex-col items-center justify-center rounded-[14px] border border-border bg-card p-8 text-center">
      <div className="flex size-12 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
        <AlertTriangle className="size-5" />
      </div>
      <h2 className="mt-4 text-xl font-semibold">Очередь не загрузилась</h2>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">{message}</p>
      <Button className="mt-5" onClick={onRetry}>
        Повторить
      </Button>
    </div>
  );
}
