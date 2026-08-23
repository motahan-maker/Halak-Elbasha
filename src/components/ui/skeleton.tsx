import { cn } from "@/lib/utils";

export function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-xl bg-muted", className)}
      {...props}
    />
  );
}

export function SkeletonCard() {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-card">
      <div className="flex items-start gap-3">
        <Skeleton className="h-12 w-12 shrink-0 rounded-xl" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
    </div>
  );
}

export function SkeletonStat() {
  return (
    <div className="rounded-2xl border border-border bg-card p-3 text-center shadow-card">
      <Skeleton className="mx-auto h-8 w-16" />
      <Skeleton className="mx-auto mt-2 h-3 w-12" />
    </div>
  );
}

export function SkeletonWizard() {
  return (
    <div className="space-y-4">
      <div className="flex justify-center gap-1.5">
        {[0, 1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-1.5 w-8 rounded-full" />
        ))}
      </div>
      <Skeleton className="h-7 w-40" />
      <div className="space-y-2">
        {[0, 1, 2].map((i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    </div>
  );
}
