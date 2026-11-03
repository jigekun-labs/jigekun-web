"use server";

import { redirect } from "next/navigation";
import { signInCs, signOutCs } from "@/lib/cs-auth";
import type { LoginState } from "@/app/admin/actions";

export async function csLoginAction(
  _prev: LoginState,
  formData: FormData
): Promise<LoginState> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "이메일과 비밀번호를 입력해주세요." };
  }

  const result = await signInCs(email, password);
  if (!result.ok) return { error: result.error };

  redirect("/cs");
}

export async function csLogoutAction() {
  await signOutCs();
  redirect("/cs/login");
}
