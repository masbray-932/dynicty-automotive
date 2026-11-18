import { verifyEmailChangeAction } from "@/server/auth/account-actions";
export default async function VerifyEmailPage({params}:{params:Promise<{token:string}>}){const {token}=await params;await verifyEmailChangeAction(token);return null}
