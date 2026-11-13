export default function StartButton({
  placement,
}: {
  placement: "top" | "bottom";
}) {
  return (
    <button
      aria-label={placement === "bottom" ? "하단에서 시작하기" : undefined}
      className={`mt-6 min-h-11 rounded-md bg-neutral-800 px-5 py-2 font-semibold text-white disabled:cursor-not-allowed disabled:bg-neutral-200 disabled:text-neutral-600 ${placement === "bottom" ? "w-full" : "min-w-50"}`}
      type="button"
      disabled
    >
      시작하기
    </button>
  );
}
