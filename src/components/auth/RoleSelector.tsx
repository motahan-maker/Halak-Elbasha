import { cn } from "@/lib/utils";

export type AuthRole = "customer" | "staff" | "admin";

const OPTIONS: { key: AuthRole; label: string }[] = [
  { key: "customer", label: "عميل" },
  { key: "staff", label: "موظف" },
  { key: "admin", label: "مدير" },
];

export function RoleSelector({
  value,
  onChange,
}: {
  value: AuthRole;
  onChange: (role: AuthRole) => void;
  }) {
  return (
    <div
      role="tablist"
      aria-label="نوع الحساب"
      className="flex items-center rounded-full border border-[#DAD6CF] bg-[#EFE8DC] p-1.5 shadow-card dark:border-[#2A2A2A] dark:bg-[#1A1A1A]"
    >
      {OPTIONS.map((opt) => {
        const active = value === opt.key;
        return (
          <button
            key={opt.key}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(opt.key)}
            className={cn(
              "min-h-11 flex-1 cursor-pointer rounded-full py-2 font-display text-[0.95rem] font-bold transition-all duration-200 press",
              active
                ? "bg-[#111111] text-[#FFFFFF] shadow-sm dark:bg-[#F6F1E8] dark:text-[#111111]"
                : "text-[#8A857D] hover:text-[#111111] dark:hover:text-[#F6F1E8]",
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
