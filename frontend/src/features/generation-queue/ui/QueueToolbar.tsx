import type { QueueFilters, QueueSort, QueueStatusFilter } from "@/features/generation-queue";
import { cn } from "@/shared/lib/utils";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";

interface QueueToolbarProps {
  filters: QueueFilters;
  onChange: (filters: QueueFilters) => void;
}

const statusFilters: Array<{ value: QueueStatusFilter; label: string; }> = [
  { value: "all", label: "Все" },
  { value: "queued", label: "В очереди" },
  { value: "running", label: "Идёт", },
  { value: "done", label: "Готово", },
  { value: "failed", label: "Ошибка", },
];

const sortOptions: Array<{ value: QueueSort; label: string }> = [
  { value: "newest", label: "Сначала новые" },
  { value: "oldest", label: "Сначала старые" },
  { value: "progress", label: "По прогрессу" },
];

export function QueueToolbar({ filters, onChange }: QueueToolbarProps) {
  return (
    <div className="flex flex-col gap-3 rounded-[14px]">
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
        {statusFilters.map((filter) => (
          <button
            key={filter.value}
            type="button"
            onClick={() => onChange({ ...filters, status: filter.value })}
            className={cn(
              "inline-flex h-12 shrink-0 items-center gap-2 rounded-full border px-5 text-lg transition-colors",
              filters.status === filter.value
                ? "border-primary bg-primary text-white"
                : "border-[var(--q-border)] bg-[var(--q-chip)] text-[var(--q-muted)] hover:text-[var(--q-fg)]",
            )}
          >
            {filter.label}
          </button>
        ))}
              
        <Select value={filters.sort} onValueChange={(value) => onChange({ ...filters, sort: value as QueueSort })}>
          <SelectTrigger className="ml-8 h-12 w-auto min-w-fit shrink-0 rounded-full border-[var(--q-border)] bg-[var(--q-chip)] px-5 text-lg text-[var(--q-muted)]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {sortOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
