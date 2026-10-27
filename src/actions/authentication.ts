"use server";

import { signIn } from "@/auth";
import { localAccountExists } from "@/lib/local-accounts";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";

function locale(formData: FormData) {
  const value = formData.get("locale");
  return value === "en" || value === "pt-BR" ? value : "es";
}

export async function login(formData: FormData) {
  await signIn("local", {
    email: formData.get("email"),
    password: formData.get("password"),
    intent: "login",
    redirectTo: `/${locale(formData)}`,
  });
}

export async function register(formData: FormData) {
  const targetLocale = locale(formData);
  if (await localAccountExists(formData.get("email"))) {
    (await cookies()).set("perxia-register-error", "email-exists", { httpOnly: true, sameSite: "lax", maxAge: 60, path: `/${targetLocale}` });
    redirect(`/${targetLocale}`);
  }
  await signIn("local", {
    email: formData.get("email"),
    password: formData.get("password"),
    name: formData.get("name"),
    intent: "register",
    redirectTo: `/${targetLocale}`,
  });
}

export async function microsoftLogin(formData: FormData) {
  await signIn("microsoft-entra-id", { redirectTo: `/${locale(formData)}` });
}
