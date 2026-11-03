import Link from "next/link";
import { requireCs } from "@/lib/cs-auth";
import { searchUsers } from "@/lib/user-lookup";
import { ROLE_LABEL } from "@/lib/support-inquiries-shared";
import { CS_LINKS } from "@/lib/desk-links";
import LoadError from "@/components/admin/LoadError";

/** 사용자 조회 — find a person by id, email, phone or full name. */
export default async function CsUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  await requireCs();
  const q = ((await searchParams).q ?? "").trim();

  let hits = null;
  if (q) {
    try {
      hits = await searchUsers(q);
    } catch (e) {
      return <LoadError error={e} />;
    }
  }

  return (
    <div className="flex h-screen flex-col">
      <header className="shrink-0 border-b border-gray-200 bg-white px-8 py-5">
        <h1 className="text-lg font-bold text-gray-900">사용자 조회</h1>
        <p className="mt-1 text-sm text-gray-500">
          사용자 ID, 이메일, 전화번호, 이름(전체)으로 찾을 수 있어요.
        </p>
        <form className="mt-3 flex max-w-xl gap-2">
          <input
            name="q"
            defaultValue={q}
            placeholder="예: 010-1234-5678"
            autoComplete="off"
            className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm outline-none focus:border-gray-900"
          />
          <button
            type="submit"
            className="shrink-0 rounded-lg bg-gray-900 px-4 py-1.5 text-sm font-medium text-white hover:bg-gray-800"
          >
            검색
          </button>
        </form>
      </header>

      <div className="flex-1 overflow-y-auto px-8 py-6">
        {hits === null ? null : hits.length === 0 ? (
          <p className="text-sm text-gray-500">
            &lsquo;{q}&rsquo;와 일치하는 사용자가 없어요. 이름은 전체를 정확히
            입력해 주세요.
          </p>
        ) : (
          <table className="w-full max-w-3xl text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-left text-xs text-gray-500">
                <th className="py-2 pr-4">이름</th>
                <th className="py-2 pr-4">역할</th>
                <th className="py-2 pr-4">전화</th>
                <th className="py-2">이메일</th>
              </tr>
            </thead>
            <tbody>
              {hits.map((u) => (
                <tr key={u.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 pr-4">
                    <Link href={CS_LINKS.user(u.id)} className="font-medium text-gray-900 hover:underline">
                      {u.name ?? "이름 없음"}
                    </Link>
                    <p className="font-mono text-xs text-gray-400">{u.id}</p>
                  </td>
                  <td className="py-3 pr-4 text-gray-600">
                    {u.roles.map((r) => ROLE_LABEL[r] ?? r).join(" · ") || "-"}
                  </td>
                  <td className="py-3 pr-4 text-gray-600">{u.phone ?? "-"}</td>
                  <td className="py-3 text-gray-600">{u.email ?? "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
