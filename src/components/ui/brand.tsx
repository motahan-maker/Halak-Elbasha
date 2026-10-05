import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/* Button Primitives (Design System Reference)                        */
/* ------------------------------------------------------------------ */

type BrandButtonVariant = "primary" | "secondary" | "outline" | "danger" | "ghost" | "success";

const BUTTON_STYLES: Record<BrandButtonVariant, string> = {
  primary:
    "bg-[#111111] text-[#FFFFFF] shadow-card hover:bg-[#262626] active:bg-[#000000] dark:bg-[#F6F1E8] dark:text-[#111111] dark:hover:bg-[#FFFFFF]",
  secondary:
    "border border-[#DAD6CF] bg-[#F6F1E8] text-[#111111] shadow-card hover:bg-[#EFE8DC] active:bg-[#E2DAD0] dark:border-[#2A2A2A] dark:bg-[#1A1A1A] dark:text-[#F6F1E8] dark:hover:bg-[#242424]",
  outline:
    "border border-[#111111] bg-transparent text-[#111111] hover:bg-[#111111]/5 active:bg-[#111111]/10 dark:border-[#F6F1E8] dark:text-[#F6F1E8] dark:hover:bg-[#F6F1E8]/10",
  danger:
    "bg-[#C5221F] text-[#FFFFFF] shadow-card hover:bg-[#A81B18] active:bg-[#8E1714]",
  ghost:
    "bg-transparent text-[#8A857D] hover:bg-[#EFE8DC] hover:text-[#111111] dark:hover:bg-[#1F1F1F] dark:hover:text-[#F6F1E8]",
  success:
    "bg-[#2E7D32] text-[#FFFFFF] shadow-card hover:bg-[#1B5E20] active:bg-[#144718]",
};

interface BrandButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: BrandButtonVariant;
  loading?: boolean;
  icon?: ReactNode;
}

export function BrandButton({
  variant = "primary",
  loading = false,
  icon,
  className,
  children,
  disabled,
  ...props
}: BrandButtonProps) {
  return (
    <button
      type="button"
      disabled={disabled || loading}
      aria-busy={loading}
      className={cn(
        "inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-xl px-5 py-2.5 font-display text-[0.875rem] font-bold transition-all duration-200 press disabled:cursor-not-allowed disabled:opacity-50",
        BUTTON_STYLES[variant],
        className,
      )}
      {...props}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2.2} /> : icon}
      {children}
    </button>
  );
}

/* ------------------------------------------------------------------ */
/* Card Primitive                                                     */
/* ------------------------------------------------------------------ */

export function BrandCard({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-[#DAD6CF] bg-[#FFFFFF] p-5 shadow-card dark:border-[#2A2A2A] dark:bg-[#141414]",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Section Heading                                                    */
/* ------------------------------------------------------------------ */

export function SectionHeading({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <h2 className={cn("font-display text-[1.15rem] font-black text-foreground", className)}>
      {children}
    </h2>
  );
}

/* ------------------------------------------------------------------ */
/* Status Badges                                                      */
/* ------------------------------------------------------------------ */

type BadgeTone = "gold" | "success" | "danger" | "muted" | "warn";

const BADGE_STYLES: Record<BadgeTone, string> = {
  gold: "border-[#111111] bg-[#111111] text-[#FFFFFF] dark:border-[#F6F1E8] dark:bg-[#F6F1E8] dark:text-[#111111]",
  success:
    "border-[#2E7D32]/25 bg-[#2E7D32]/10 text-[#2E7D32] dark:border-[#43A047]/30 dark:bg-[#43A047]/15 dark:text-[#81C784]",
  danger:
    "border-[#C5221F]/25 bg-[#C5221F]/10 text-[#C5221F] dark:border-[#E53935]/30 dark:bg-[#E53935]/15 dark:text-[#EF9A9A]",
  muted:
    "border-[#DAD6CF] bg-[#EFE8DC] text-[#4F4C47] dark:border-[#2A2A2A] dark:bg-[#1F1F1F] dark:text-[#A6A199]",
  warn:
    "border-[#B45309]/25 bg-[#B45309]/10 text-[#B45309] dark:border-[#F59E0B]/30 dark:bg-[#F59E0B]/15 dark:text-[#FCD34D]",
};

export function StatusBadge({
  tone = "muted",
  className,
  children,
}: {
  tone?: BadgeTone;
  className?: string;
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full border px-2.5 py-1 text-[0.7rem] font-bold",
        BADGE_STYLES[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function BookingStatusBadge({ status }: { status: string }) {
  if (status === "completed") return <StatusBadge tone="success">مكتمل</StatusBadge>;
  if (
    status === "cancelled" ||
    status === "cancelled_by_customer" ||
    status === "cancelled_by_barber"
  )
    return <StatusBadge tone="danger">ملغي</StatusBadge>;
  return <StatusBadge tone="gold">مؤكد</StatusBadge>;
}

/* ------------------------------------------------------------------ */
/* Empty & Error States                                               */
/* ------------------------------------------------------------------ */

export function EmptyState({
  icon,
  title,
  hint,
  action,
}: {
  icon: ReactNode;
  title: string;
  hint?: string;
  action?: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-[#DAD6CF] bg-[#FFFFFF] p-8 text-center shadow-card dark:border-[#2A2A2A] dark:bg-[#141414]">
      <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-[#EFE8DC] text-[#111111] dark:bg-[#242424] dark:text-[#F6F1E8]">
        {icon}
      </div>
      <p className="mt-3.5 font-display text-[0.95rem] font-bold text-foreground">{title}</p>
      {hint && <p className="mt-1 text-xs font-medium text-muted-foreground">{hint}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function ErrorState({
  message = "حدث خطأ أثناء تحميل البيانات",
  onRetry,
}: {
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="rounded-2xl border border-[#DAD6CF] bg-[#FFFFFF] p-8 text-center shadow-card dark:border-[#2A2A2A] dark:bg-[#141414]">
      <p className="font-display text-[0.95rem] font-bold text-foreground">{message}</p>
      {onRetry && (
        <BrandButton variant="secondary" onClick={onRetry} className="mt-4">
          إعادة المحاولة
        </BrandButton>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Labeled Form Input                                                 */
/* ------------------------------------------------------------------ */

interface BrandFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  icon?: ReactNode;
  error?: string | null;
}

export function BrandField({ label, icon, error, id, className, ...props }: BrandFieldProps) {
  const errorId = id ? `${id}-error` : undefined;
  return (
    <div className={className}>
      <label
        htmlFor={id}
        className={cn(
          "flex min-h-13 items-center gap-3 rounded-2xl border bg-[#FFFFFF] px-4 transition-all duration-200 dark:bg-[#141414]",
          error
            ? "border-[#C5221F] focus-within:border-[#C5221F] focus-within:ring-2 focus-within:ring-[#C5221F]/20"
            : "border-[#DAD6CF] focus-within:border-[#111111] focus-within:ring-2 focus-within:ring-[#111111]/15 dark:border-[#2A2A2A] dark:focus-within:border-[#F6F1E8]",
        )}
      >
        <span className="sr-only">{label}</span>
        <input
          id={id}
          aria-label={label}
          aria-invalid={!!error}
          aria-describedby={error && errorId ? errorId : undefined}
          className="w-full bg-transparent py-3.5 font-display text-[0.95rem] font-medium text-foreground outline-none placeholder:text-[#8A857D]"
          {...props}
        />
        {icon && (
          <span aria-hidden className="shrink-0 text-[#8A857D]">
            {icon}
          </span>
        )}
      </label>
      {error && (
        <p
          id={errorId}
          role="alert"
          className="mt-1.5 px-1 font-display text-[0.78rem] font-semibold text-[#C5221F]"
        >
          {error}
        </p>
      )}
    </div>
  );
}
