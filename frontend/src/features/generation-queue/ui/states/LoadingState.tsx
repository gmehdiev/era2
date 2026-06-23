import { Skeleton } from "@/shared/ui/skeleton";

export function LoadingState() {
  return (
    <div className="flex flex-col gap-3">
      {Array.from({ length: 5 }).map((_, index) => (
        <div key={index} className="rounded-[14px] border border-border bg-card p-4">
          <div className="flex items-center gap-3">
            <Skeleton className="size-12 rounded-xl" />
            <div className="flex flex-1 flex-col gap-2">
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-3 w-1/2" />
            </div>
            <Skeleton className="hidden h-8 w-28 rounded-full md:block" />
          </div>
        </div>
      ))}
    </div>
  );
}
