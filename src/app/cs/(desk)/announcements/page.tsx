import { requireCs } from "@/lib/cs-auth";
import { listAnnouncements } from "@/lib/cs-content";
import { schemaFor } from "@/lib/collection-schemas";
import LoadError from "@/components/admin/LoadError";
import CreateDocumentButton from "@/components/admin/CreateDocumentButton";
import AnnouncementStatus from "@/components/admin/AnnouncementStatus";
import { kst } from "@/components/cs/inquiry-bits";
import {
  csCreateDocumentAction,
  csPublishAnnouncementAction,
} from "@/app/cs/content-actions";

/**
 * 공지사항 — write a notice and publish it. Uses /admin's form and publish
 * control, so the same red warnings stand in front of anything that would
 * notify every user.
 */
export default async function CsAnnouncementsPage() {
  await requireCs();

  let items;
  try {
    items = await listAnnouncements();
  } catch (e) {
    return <LoadError error={e} />;
  }
  const schema = schemaFor("announcements")!;

  return (
    <div className="flex h-screen flex-col">
      <header className="shrink-0 border-b border-gray-200 bg-white px-8 py-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-lg font-bold text-gray-900">공지사항</h1>
            <p className="mt-1 text-sm text-gray-500">
              새 공지는 초안으로 저장돼요. 내용을 확인한 뒤 여기서 게시해 주세요.
            </p>
          </div>
          <CreateDocumentButton
            collection="announcements"
            schema={schema}
            action={csCreateDocumentAction}
          />
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-8 py-6">
        {items.length === 0 ? (
          <p className="text-sm text-gray-500">공지가 없어요.</p>
        ) : (
          <ul className="max-w-3xl space-y-3">
            {items.map((a) => (
              <li key={a.id} className="overflow-hidden rounded-xl border border-gray-200 bg-white">
                <div className="px-5 py-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-semibold text-gray-900">{a.title}</h2>
                    {a.isImportant && (
                      <span className="rounded bg-red-50 px-1.5 py-0.5 text-xs text-red-700">중요</span>
                    )}
                    {a.isMarketing && (
                      <span className="rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-600">광고성</span>
                    )}
                    <span className="ml-auto text-xs text-gray-500">{kst(a.createdAt)}</span>
                  </div>
                  {a.content && (
                    <p className="mt-2 line-clamp-3 whitespace-pre-wrap text-sm text-gray-600">
                      {a.content}
                    </p>
                  )}
                </div>
                <AnnouncementStatus
                  id={a.id}
                  title={a.title}
                  status={a.status}
                  action={csPublishAnnouncementAction}
                />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
