import { redirect } from "next/navigation";
import { currentAdmin } from "@/lib/admin-auth";
import LoginForm from "@/components/admin/LoginForm";

export default async function LoginPage() {
  // Already signed in — skip the form.
  if (await currentAdmin()) redirect("/admin");

  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900">지게꾼 Admin</h1>
          <p className="mt-2 text-sm text-gray-500">
            관리자 계정으로 로그인하세요
          </p>
        </div>
        <LoginForm />
      </div>
    </main>
  );
}
