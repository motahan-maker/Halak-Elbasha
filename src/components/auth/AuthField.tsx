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

/**
 * Labeled text input with an orange icon on the right (RTL start)
 * and an accessible inline error message.
 */
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
          "flex min-h-14 items-center gap-3 rounded-2xl border bg-white px-4 transition-all duration-200",
          error
            ? "border-red-400 focus-within:border-red-400 focus-within:ring-2 focus-within:ring-red-200"
            : "border-[#E3DCCB] focus-within:border-[#E8892F]/60 focus-within:ring-2 focus-within:ring-[#E8892F]/20",
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
          className="w-full bg-transparent py-4 text-[1rem] font-medium text-[#171717] outline-none placeholder:text-[#171717]/40"
        />
        <span aria-hidden className="shrink-0">
          {icon}
        </span>
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
