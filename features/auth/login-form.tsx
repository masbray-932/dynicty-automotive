"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { loginAction } from "@/server/auth/actions";

const initialState = { message: "", errors: {} as Record<string, string[]> };

export function LoginForm() {
  const [state, action, pending] = useActionState(loginAction, initialState);

  return (
    <form action={action} className="space-y-5">
      <FormField error={state.errors.email?.[0]} htmlFor="email" label="Email">
        <Input autoComplete="email" id="email" name="email" placeholder="admin@dealer.com" required type="email" />
      </FormField>
      <FormField error={state.errors.password?.[0]} htmlFor="password" label="Kata sandi">
        <Input autoComplete="current-password" id="password" name="password" required type="password" />
      </FormField>
      {state.message ? <p aria-live="polite" className="text-sm text-red-300">{state.message}</p> : null}
      <Button className="w-full" disabled={pending} type="submit">
        {pending ? "Memeriksa…" : "Masuk ke Admin"}
      </Button>
    </form>
  );
}
