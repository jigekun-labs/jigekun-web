import { requireCs } from "@/lib/cs-auth";
import { listFaqs } from "@/lib/cs-content";
import { schemaFor } from "@/lib/collection-schemas";
import LoadError from "@/components/admin/LoadError";
import CreateDocumentButton from "@/components/admin/CreateDocumentButton";
import { csCreateDocumentAction } from "@/app/cs/content-actions";

/** 자주 묻는 질문 — in the app's order, with whether each is actually shown. */
export default async function CsFaqsPage() {
  await requireCs();

  let items;
  try {
    items = await listFaqs();
  } catch (e) {
    return <LoadError error={e} />;
  }
  const schema = schemaFor("faqs")!;

  return (
    <div className="flex h-screen flex-col">
      <header className="shrink-0 border-b border-gray-200 bg-white px-8 py-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-lg font-bold text-gray-900">자주 묻는 질문</h1>
            <p className="mt-1 text-sm text-gray-500">
              앱의 FAQ 화면에 이 순서대로 보여요. 저장하면 바로 반영돼요.
            </p>
          </div>
          <CreateDocumentButton
            collection="faqs"
            schema={schema}
            action={csCreateDocumentAction}
          />
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-8 py-6">
        {items.length === 0 ? (
          <p className="text-sm text-gray-500">FAQ가 없어요.</p>
        ) : (
          <ol className="max-w-3xl space-y-3">
            {items.map((f) => (
              <li key={f.id} className="rounded-xl border border-gray-200 bg-white px-5 py-4">
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 w-6 shrink-0 text-xs tabular-nums text-gray-400">
                    {f.order ?? "-"}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-semibold text-gray-900">{f.question}</h2>
                      {f.visibleInApp ? (
                        <span className="rounded bg-green-50 px-1.5 py-0.5 text-xs text-green-700">앱에 표시</span>
                      ) : (
                        <span className="rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-600">
                          {f.isActive ? "순서 없음 · 앱에 안 보임" : "숨김"}
                        </span>
                      )}
                    </div>
                    <p className="mt-2 whitespace-pre-wrap text-sm text-gray-600">{f.answer}</p>
                  </div>
                </div>
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  );
}
