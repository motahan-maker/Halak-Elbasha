import { cn } from "@/lib/utils";

export function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-shimmer rounded-xl bg-muted", className)}
      {...props}
    />
  );
}

export function SkeletonCard() {
  return (
    <div className="rounded-2xl glass-card p-4">
      <div className="flex items-start gap-3">
        <Skeleton className="h-11 w-11 shrink-0 squircle" />
        <div className="flex-1 space-y-2.5">
          <Skeleton className="h-4 w-3/4 rounded-lg" />
          <Skeleton className="h-3 w-1/2 rounded-lg" />
        </div>
      </div>
    </div>
  );
}

export function SkeletonStat() {
  return (
    <div className="rounded-2xl glass-card p-3.5 text-center">
      <Skeleton className="mx-auto h-8 w-16 rounded-lg" />
      <Skeleton className="mx-auto mt-2.5 h-3 w-14 rounded-lg" />
    </div>
  );
}

export function SkeletonWizard() {
  return (
    <div className="space-y-5">
      <div className="flex justify-center gap-1">
        {[0, 1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-[5px] w-8 rounded-full" />
        ))}
      </div>
      <Skeleton className="h-8 w-44 rounded-xl" />
      <div className="space-y-2.5">
        {[0, 1, 2].map((i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    </div>
  );
}
