"use server";

import { redirect } from "next/navigation";
import { signIn, signOut } from "@/lib/admin-auth";

export type LoginState = { error?: string };

export async function loginAction(
  _prev: LoginState,
  formData: FormData
): Promise<LoginState> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "이메일과 비밀번호를 입력해주세요." };
  }

  const result = await signIn(email, password);
  if (!result.ok) return { error: result.error };

  redirect("/admin");
}

export async function logoutAction() {
  await signOut();
  redirect("/admin/login");
}
