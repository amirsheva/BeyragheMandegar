export default function RetryButton({onRetry}) {
  return (
    <button
      onClick={onRetry}
      className="px-5 py-2 rounded-xl bg-white/10"
    >
      تلاش مجدد
    </button>
  );
}
