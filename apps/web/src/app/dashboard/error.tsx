'use client';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center px-4">
      <h1 className="mb-4 text-2xl font-bold text-gray-900">שגיאה בלוח הבקרה</h1>
      <p className="mb-6 text-gray-600">אירעה שגיאה בטעינת הדף. נסה לרענן.</p>
      <button
        onClick={reset}
        className="rounded-lg bg-brand-600 px-6 py-2 text-white hover:bg-brand-700"
      >
        נסו שוב
      </button>
    </div>
  );
}
