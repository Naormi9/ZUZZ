import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="container-app flex min-h-[60vh] flex-col items-center justify-center text-center">
      <h1 className="mb-2 text-6xl font-bold text-gray-300">404</h1>
      <h2 className="mb-4 text-xl font-semibold text-gray-900">העמוד לא נמצא</h2>
      <p className="mb-6 text-gray-600">הדף שחיפשתם לא קיים או שהוסר.</p>
      <Link href="/" className="rounded-lg bg-brand-600 px-6 py-2 text-white hover:bg-brand-700">
        חזרה לדף הבית
      </Link>
    </div>
  );
}
