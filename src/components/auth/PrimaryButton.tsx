interface PrimaryButtonProps {
  loading: boolean;
  label: string;
}

/** Full-width primary CTA with loading state. Matches reference image. */
export function PrimaryButton({ loading, label }: PrimaryButtonProps) {
  return (
    <button
      type="submit"
      disabled={loading}
      aria-busy={loading}
      className="flex min-h-13 w-full cursor-pointer items-center justify-center rounded-2xl bg-[#111111] py-3.5 font-display text-[1.05rem] font-bold text-[#FFFFFF] shadow-card transition-all duration-200 hover:bg-[#262626] active:bg-[#000000] disabled:cursor-not-allowed disabled:opacity-50 dark:bg-[#F6F1E8] dark:text-[#111111] dark:hover:bg-[#FFFFFF] press"
    >
      {loading ? (
        <span
          aria-label="جارٍ التحميل"
          className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white dark:border-black/30 dark:border-t-black"
        />
      ) : (
        label
      )}
    </button>
  );
}
