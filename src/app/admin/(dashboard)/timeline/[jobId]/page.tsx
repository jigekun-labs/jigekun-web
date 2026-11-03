import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin-auth";
import { fetchJobTimeline } from "@/lib/job-timeline";
import { ADMIN_LINKS } from "@/lib/desk-links";
import LoadError from "@/components/admin/LoadError";
import TimelineView from "@/components/desk/TimelineView";

export default async function JobTimelinePage({
  params,
}: {
  params: Promise<{ jobId: string }>;
}) {
  await requireAdmin();
  const { jobId } = await params;

  let t;
  try {
    t = await fetchJobTimeline(decodeURIComponent(jobId));
  } catch (e) {
    return <LoadError error={e} />;
  }
  if (!t) notFound();

  return <TimelineView t={t} links={ADMIN_LINKS} />;
}
