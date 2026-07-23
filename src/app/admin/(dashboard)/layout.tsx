import { requireAdmin } from "@/lib/admin-auth";
import { listCollections } from "@/lib/firestore-view";
import Sidebar from "@/components/admin/Sidebar";
import { logoutAction } from "../actions";

/**
 * The gate. Every dashboard page is a child of this layout, so an unauthorized
 * request never reaches a page that reads Firestore.
 */
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const email = await requireAdmin();
  const collections = await listCollections();

  return (
    <div className="flex min-h-screen">
      <Sidebar collections={collections} email={email} logout={logoutAction} />
      <main className="flex-1 min-w-0 bg-gray-50">{children}</main>
    </div>
  );
}
