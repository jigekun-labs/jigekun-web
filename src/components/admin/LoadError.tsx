/**
 * Shown when a dashboard read throws — almost always missing or malformed
 * Firebase credentials in the environment. Renders the underlying message so
 * the cause is visible in the page instead of only in a 500's server logs.
 */
export default function LoadError({ error }: { error: unknown }) {
  const message = error instanceof Error ? error.message : String(error);

  return (
    <div className="px-8 py-8">
      <div className="max-w-2xl rounded-xl border border-red-200 bg-red-50 p-6">
        <h1 className="text-lg font-bold text-red-800">
          데이터를 불러오지 못했습니다
        </h1>
        <p className="mt-2 text-sm text-red-700">
          Firestore 연결에 실패했습니다. 배포 환경에 Firebase 자격 증명
          (FIREBASE_PROJECT_ID · FIREBASE_CLIENT_EMAIL · FIREBASE_PRIVATE_KEY)
          이 설정되어 있는지 확인하세요.
        </p>
        <pre className="mt-4 overflow-auto rounded-lg bg-white/70 px-3 py-2 font-mono text-[12px] text-red-900">
          {message}
        </pre>
      </div>
    </div>
  );
}
