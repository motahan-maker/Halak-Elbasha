interface PrimaryButtonProps {
  loading: boolean;
  label: string;
}

/** Full-width orange CTA with loading state. */
export function PrimaryButton({ loading, label }: PrimaryButtonProps) {
  return (
    <button
      type="submit"
      disabled={loading}
      aria-busy={loading}
      className="flex min-h-14 w-full cursor-pointer items-center justify-center rounded-2xl bg-[#E8892F] py-4 text-[1.15rem] font-extrabold text-white shadow-[0_16px_28px_-14px_rgba(232,137,47,0.7),inset_0_-3px_0_rgba(0,0,0,0.12)] transition-all duration-200 hover:bg-[#D1731F] active:translate-y-px active:shadow-[0_8px_18px_-10px_rgba(232,137,47,0.7)] disabled:cursor-not-allowed disabled:opacity-60 press"
    >
      {loading ? (
        <span
          aria-label="جارٍ الدخول"
          className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white"
        />
      ) : (
        label
      )}
    </button>
  );
}
