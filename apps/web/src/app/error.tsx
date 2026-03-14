'use client';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="container-app flex min-h-[60vh] flex-col items-center justify-center text-center">
      <h1 className="mb-4 text-2xl font-bold text-gray-900">משהו השתבש</h1>
      <p className="mb-6 text-gray-600">אירעה שגיאה בלתי צפויה. אנא נסו שוב.</p>
      <button
        onClick={reset}
        className="rounded-lg bg-brand-600 px-6 py-2 text-white hover:bg-brand-700"
      >
        נסו שוב
      </button>
    </div>
  );
}
