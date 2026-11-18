"use client";
import { useActionState } from "react";
import { acceptInvitationAction } from "@/server/auth/account-actions";
import { emptyActionState } from "@/types/action-state";
import { Button } from "@/components/ui/button";
import { SecurePasswordField } from "@/features/auth/secure-password-field";
const input="min-h-11 w-full rounded-xl border border-white/15 bg-zinc-950 px-4 text-white";
export function InvitationForm({token,email}:{token:string;email:string}){const [state,action,pending]=useActionState(acceptInvitationAction,emptyActionState);const hasFieldErrors=Boolean(state.errors.name?.length||state.errors.password?.length);return <form action={action} className="grid gap-4"><input name="token" type="hidden" value={token}/><p className="text-sm text-zinc-300">Aktivasi untuk <strong>{email}</strong></p><label>Nama lengkap<input aria-invalid={Boolean(state.errors.name?.length)||undefined} className={input} name="name" required/></label>{state.errors.name?.map(message=><p className="text-sm text-red-300" key={message} role="alert">{message}</p>)}<SecurePasswordField error={state.errors.password} label="Kata sandi baru" name="password"/>{state.message&&!hasFieldErrors?<p className="text-sm text-red-300" role="alert">{state.message}</p>:null}<Button disabled={pending}>{pending?"Mengaktifkan…":"Aktifkan akun"}</Button></form>}
