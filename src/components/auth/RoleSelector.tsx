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
      className="flex items-center rounded-full bg-[#E6E2D6] p-1.5 shadow-[0_10px_25px_-12px_rgba(0,0,0,0.35)]"
    >
      {OPTIONS.map((opt, i) => {
        const active = value === opt.key;
        return (
          <div key={opt.key} className="flex flex-1 items-center">
            <button
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => onChange(opt.key)}
              className={cn(
                "min-h-11 flex-1 cursor-pointer rounded-full py-2.5 text-[1.05rem] font-bold transition-all duration-200 press",
                active
                  ? "bg-white text-[#E8892F] shadow-[0_6px_16px_-6px_rgba(0,0,0,0.35)]"
                  : "text-[#2b2b2b] hover:text-black",
              )}
            >
              {opt.label}
            </button>
            {i < OPTIONS.length - 1 && (
              <span aria-hidden className="mx-1 h-7 w-px bg-[#2b2b2b]/15" />
            )}
          </div>
        );
      })}
    </div>
  );
}
