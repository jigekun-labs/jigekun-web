import { notFound } from "next/navigation";
import { requireCs } from "@/lib/cs-auth";
import { fetchJobTimeline } from "@/lib/job-timeline";
import { CS_LINKS } from "@/lib/desk-links";
import LoadError from "@/components/admin/LoadError";
import TimelineView from "@/components/desk/TimelineView";

/** 상태 기록 for one job — what CS checks before settling a held wage. */
export default async function CsTimelinePage({
  params,
}: {
  params: Promise<{ jobId: string }>;
}) {
  await requireCs();
  const { jobId } = await params;

  let t;
  try {
    t = await fetchJobTimeline(decodeURIComponent(jobId));
  } catch (e) {
    return <LoadError error={e} />;
  }
  if (!t) notFound();

  return <TimelineView t={t} links={CS_LINKS} />;
}
