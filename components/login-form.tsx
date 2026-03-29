"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";

import { createClient } from "@/lib/supabase/client";

type LoginValues = {
  email: string;
  password: string;
};

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const form = useForm<LoginValues>({
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(values: LoginValues) {
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword(values);

    if (error) {
      form.setError("root", { message: error.message });
      return;
    }

    const requestedRedirect = searchParams.get("redirectTo");
    const redirectTarget =
      requestedRedirect && requestedRedirect.startsWith("/admin")
        ? "/admin"
        : "/admin";
    router.push(redirectTarget);
    router.refresh();
  }

  return (
    <form
      className="space-y-4 rounded-3xl border border-stone-200 bg-white p-6 shadow-sm"
      onSubmit={form.handleSubmit(onSubmit)}
    >
      <div>
        <h1 className="text-2xl font-semibold text-stone-950">Login</h1>
      </div>
      <label className="block space-y-2 text-sm font-medium text-stone-700">
        Email
        <input
          type="email"
          className="w-full rounded-2xl border border-stone-300 px-3 py-2"
          {...form.register("email", { required: true })}
        />
      </label>
      <label className="block space-y-2 text-sm font-medium text-stone-700">
        Password
        <input
          type="password"
          className="w-full rounded-2xl border border-stone-300 px-3 py-2"
          {...form.register("password", { required: true })}
        />
      </label>
      {form.formState.errors.root ? (
        <p className="text-sm text-red-600">
          {form.formState.errors.root.message}
        </p>
      ) : null}
      <button
        type="submit"
        className="w-full rounded-full bg-stone-950 px-4 py-2 text-sm font-medium text-white"
        disabled={form.formState.isSubmitting}
      >
        {form.formState.isSubmitting ? "Signing in..." : "Sign in"}
      </button>
    </form>
  );
}
