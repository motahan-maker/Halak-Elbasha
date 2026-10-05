import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/* Button                                                              */
/* ------------------------------------------------------------------ */

type BrandButtonVariant = "primary" | "secondary" | "outline" | "danger" | "ghost" | "success";

const BUTTON_STYLES: Record<BrandButtonVariant, string> = {
  primary:
    "bg-[#C99A35] text-white shadow-[0_14px_28px_-12px_rgba(201,154,53,0.65)] hover:bg-[#B3872C] hover:brightness-[1.03]",
  secondary:
    "border border-[#E5DCCB] bg-white text-[#24140E] shadow-card hover:border-[#C99A35]/50 hover:text-[#8A6414]",
  outline: "border border-[#C99A35]/60 bg-transparent text-[#8A6414] hover:bg-[#C99A35]/10",
  danger: "bg-[#B94E48] text-white shadow-card hover:brightness-105",
  ghost: "bg-transparent text-[#756D64] hover:bg-[#C99A35]/10 hover:text-[#8A6414]",
  success: "bg-[#5C8A58] text-white shadow-card hover:brightness-105",
};

interface BrandButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: BrandButtonVariant;
  loading?: boolean;
  icon?: ReactNode;
}

/** Unified button: gold primary like the login CTA. Min 44px touch target. */
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
        "inline-flex min-h-11 cursor-pointer items-center justify-center gap-1.5 rounded-xl px-4 py-2.5 font-display text-[0.82rem] font-extrabold transition-all duration-200 press disabled:cursor-not-allowed disabled:opacity-55",
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
/* Card                                                                */
/* ------------------------------------------------------------------ */

export function BrandCard({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("card-brand p-4", className)} {...props}>
      {children}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Section heading                                                     */
/* ------------------------------------------------------------------ */

export function SectionHeading({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <h2 className={cn("section-heading", className)}>{children}</h2>;
}

/* ------------------------------------------------------------------ */
/* Status badge                                                        */
/* ------------------------------------------------------------------ */

type BadgeTone = "gold" | "success" | "danger" | "muted" | "warn";

const BADGE_STYLES: Record<BadgeTone, string> = {
  gold: "border-[#C99A35]/35 bg-[#C99A35]/12 text-[#8A6414] dark:text-[#E3B95A]",
  success: "border-[#5C8A58]/30 bg-[#5C8A58]/10 text-[#3E6B3B] dark:text-[#82A97E]",
  danger: "border-[#B94E48]/30 bg-[#B94E48]/10 text-[#B94E48] dark:text-[#D46960]",
  muted:
    "border-[#E5DCCB] bg-[#F5EFE2] text-[#756D64] dark:border-white/10 dark:bg-white/5 dark:text-[#A89A87]",
  warn: "border-[#D9A62E]/35 bg-[#D9A62E]/12 text-[#8A6414] dark:text-[#E0B44C]",
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
        "inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full border px-2.5 py-1 text-[0.68rem] font-extrabold",
        BADGE_STYLES[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

/** Booking status -> badge tone + Arabic label. */
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
/* Empty / error states                                                */
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
    <div className="card-brand p-8 text-center">
      <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-[#C99A35]/12 text-[#8A6414]">
        {icon}
      </div>
      <p className="mt-3 font-display text-[0.9rem] font-extrabold text-foreground">{title}</p>
      {hint && <p className="mt-1 text-xs font-medium text-muted-foreground">{hint}</p>}
      {action && <div className="mt-4">{action}</div>}
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
    <div className="card-brand p-8 text-center">
      <p className="font-display text-[0.9rem] font-extrabold text-foreground">{message}</p>
      {onRetry && (
        <BrandButton variant="secondary" onClick={onRetry} className="mt-4">
          إعادة المحاولة
        </BrandButton>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Labeled input (login-DNA style)                                     */
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
          "flex min-h-14 items-center gap-3 rounded-2xl border bg-white px-4 transition-all duration-200 dark:bg-white/5",
          error
            ? "border-red-400 focus-within:border-red-400 focus-within:ring-2 focus-within:ring-red-200"
            : "border-[#E5DCCB] focus-within:border-[#C99A35]/60 focus-within:ring-2 focus-within:ring-[#C99A35]/25 dark:border-white/10",
        )}
      >
        <span className="sr-only">{label}</span>
        <input
          id={id}
          aria-label={label}
          aria-invalid={!!error}
          aria-describedby={error && errorId ? errorId : undefined}
          className="w-full bg-transparent py-4 text-[0.95rem] font-medium text-[#24140E] outline-none placeholder:text-[#24140E]/40 dark:text-[#F5ECDD] dark:placeholder:text-[#F5ECDD]/40"
          {...props}
        />
        {icon && (
          <span aria-hidden className="shrink-0 text-[#C99A35]">
            {icon}
          </span>
        )}
      </label>
      {error && (
        <p
          id={errorId}
          role="alert"
          className="mt-1.5 px-1 text-[0.78rem] font-semibold text-red-600"
        >
          {error}
        </p>
      )}
    </div>
  );
}
