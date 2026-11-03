import { redirect } from "next/navigation";
import { currentCs } from "@/lib/cs-auth";
import LoginForm from "@/components/admin/LoginForm";
import { csLoginAction } from "../actions";

export default async function CsLoginPage() {
  // Already signed in — skip the form.
  if (await currentCs()) redirect("/cs");

  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900">지게꾼 고객센터</h1>
          <p className="mt-2 text-sm text-gray-500">
            고객센터 계정으로 로그인하세요
          </p>
        </div>
        <LoginForm action={csLoginAction} />
      </div>
    </main>
  );
}
