import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface AuthFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  icon: ReactNode;
  type?: string;
  autoComplete?: string;
  inputMode?: "text" | "tel";
  error?: string | null;
}

export function AuthField({
  id,
  label,
  value,
  onChange,
  icon,
  type = "text",
  autoComplete,
  inputMode,
  error,
}: AuthFieldProps) {
  const errorId = `${id}-error`;
  return (
    <div>
      <label
        htmlFor={id}
        className={cn(
          "flex min-h-13 items-center gap-3 rounded-2xl border bg-[#FFFFFF] px-4 transition-all duration-200 dark:bg-[#1A1A1A]",
          error
            ? "border-[#C5221F] focus-within:border-[#C5221F] focus-within:ring-2 focus-within:ring-[#C5221F]/20"
            : "border-[#DAD6CF] focus-within:border-[#111111] focus-within:ring-2 focus-within:ring-[#111111]/15 dark:border-[#2A2A2A] dark:focus-within:border-[#F6F1E8]",
        )}
      >
        <span className="sr-only">{label}</span>
        <input
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={label}
          aria-label={label}
          type={type}
          autoComplete={autoComplete}
          inputMode={inputMode}
          aria-invalid={!!error}
          aria-describedby={error ? errorId : undefined}
          className="w-full bg-transparent py-3.5 font-display text-[0.95rem] font-medium text-foreground outline-none placeholder:text-[#8A857D]"
        />
        <span aria-hidden className="shrink-0 text-[#8A857D]">
          {icon}
        </span>
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
