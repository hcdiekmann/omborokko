import { Suspense } from "react";

import { LoginForm } from "@/components/login-form";

export default function LoginPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md items-center px-4 py-10">
      <Suspense fallback={<div className="w-full rounded-3xl border border-stone-200 bg-white p-6 shadow-sm" />}>
        <LoginForm />
      </Suspense>
    </main>
  );
}
