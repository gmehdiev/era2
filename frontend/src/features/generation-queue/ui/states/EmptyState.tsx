import { Button } from "@/shared/ui/button";
import { Inbox } from "lucide-react";

export function EmptyState({ onReset }: { onReset: () => void }) {
  return (
    <div className="flex min-h-[360px] flex-col items-center justify-center rounded-[14px] border border-dashed border-border bg-card/50 p-8 text-center">
      <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <Inbox className="size-5" />
      </div>
      <h2 className="mt-4 text-xl font-semibold">Задач не найдено</h2>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        Попробуйте изменить фильтр, тип генерации или поисковый запрос.
      </p>
      <Button className="mt-5" variant="outline" onClick={onReset}>
        Сбросить фильтры
      </Button>
    </div>
  );
}
