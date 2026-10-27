"use server";

import { signIn } from "@/auth";

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
  await signIn("local", {
    email: formData.get("email"),
    password: formData.get("password"),
    name: formData.get("name"),
    intent: "register",
    redirectTo: `/${locale(formData)}`,
  });
}

export async function microsoftLogin(formData: FormData) {
  await signIn("microsoft-entra-id", { redirectTo: `/${locale(formData)}` });
}
