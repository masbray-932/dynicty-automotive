import { notFound } from "next/navigation";
import { createHash } from "node:crypto";
import { db } from "@/db/client";
import { Card } from "@/components/ui/card";
import { InvitationForm } from "@/features/auth/invitation-form";
export default async function InvitationPage({params}:{params:Promise<{token:string}>}){const {token}=await params;if(!/^[A-Za-z0-9_-]{40,200}$/.test(token))notFound();const invitation=await db.adminInvitation.findUnique({where:{tokenHash:createHash("sha256").update(token).digest("hex")}});if(!invitation||invitation.acceptedAt||invitation.revokedAt||invitation.expiresAt<=new Date())notFound();return <main className="grid min-h-screen place-items-center p-4"><Card className="w-full max-w-lg"><h1 className="text-2xl font-bold">Aktivasi Admin Dealer</h1><p className="mt-2 mb-6 text-sm text-zinc-400">Buat akun Anda sendiri. Platform tidak pernah mengirim kata sandi plaintext.</p><InvitationForm email={invitation.invitedEmail} token={token}/></Card></main>}
