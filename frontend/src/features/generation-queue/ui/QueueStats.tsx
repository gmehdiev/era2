import { cn } from "@/shared/lib/utils";

interface QueueStatsProps {
  stats: {
    queued: number;
    running: number;
    done: number;
    failed: number;
  };
}

const cards: Array<{
  key: keyof QueueStatsProps["stats"];
  label: string;
  dot: string;
}> = [
  { key: "queued", label: "В очереди", dot: "bg-[#8d827b]" },
  { key: "running", label: "Идёт", dot: "bg-primary" },
  { key: "done", label: "Готово", dot: "bg-emerald-400" },
  { key: "failed", label: "Ошибка", dot: "bg-[#ff6970]" },
];

export function QueueStats({ stats }: QueueStatsProps) {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {cards.map((card) => (
        <div key={card.key} className="rounded-[22px] border border-[var(--q-border)] bg-[var(--q-card)] px-6 py-5 shadow-none md:px-7 md:py-6">
          <div className="flex items-center gap-3 text-[var(--q-muted)]">
            <span className={cn("size-3 rounded-full", card.dot)} />
            <span className="text-lg font-medium">{card.label}</span>
          </div>
          <div className="mt-5 font-sans text-4xl font-semibold leading-none tracking-normal text-[var(--q-fg)]">
            {stats[card.key]}
          </div>
        </div>
      ))}
    </div>
  );
}
