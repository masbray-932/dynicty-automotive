"use server";

import { Prisma } from "@prisma/client";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/server/auth/session";
import { logger } from "@/server/log";
import { actionResult, type ActionState } from "@/types/action-state";
import { salesTeamFormInput, salesTeamSchema } from "@/validation/sales-team";
import { deleteSalesTeamMember, SalesTeamError, saveSalesTeamMember } from "./service";

function failure(error: unknown): ActionState {
  if (error instanceof z.ZodError) return actionResult("error", "Periksa data anggota tim.", error.flatten().fieldErrors as Record<string, string[]>);
  if (error instanceof SalesTeamError) return actionResult("error", error.message, error.field ? { [error.field]: [error.message] } : {});
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") return actionResult("error", "Data anggota tim bertabrakan dengan data lain.");
  logger.error("sales_team.mutation_failed"); return actionResult("error", "Tim sales belum dapat disimpan.");
}

export async function saveSalesTeamAction(_state: ActionState, form: FormData): Promise<ActionState> {
  await requireAdmin();
  try {
    const data = salesTeamSchema.parse(salesTeamFormInput(form));
    const result = await saveSalesTeamMember(data, form.get("image"), form.get("removeImage") === "on");
    revalidatePath("/admin/sales-team"); revalidatePath("/");
    return actionResult(result.cleanupFailed ? "warning" : "success", result.cleanupFailed ? "Anggota disimpan; foto lama perlu ditinjau operator." : "Anggota tim berhasil disimpan.");
  } catch (error) { return failure(error); }
}

export async function deleteSalesTeamAction(_state: ActionState, form: FormData): Promise<ActionState> {
  await requireAdmin();
  const keys = [...form.keys()].filter(key => !key.startsWith("$ACTION_"));
  if (keys.length !== 2 || !keys.every(key => ["id", "confirm"].includes(key)) || form.get("confirm") !== "on") return actionResult("error", "Konfirmasi hapus diperlukan.");
  try {
    const result = await deleteSalesTeamMember(String(form.get("id") ?? ""));
    revalidatePath("/admin/sales-team"); revalidatePath("/");
    return actionResult(result.cleanupFailed ? "warning" : "success", result.cleanupFailed ? "Anggota dihapus; foto perlu ditinjau operator." : "Anggota tim berhasil dihapus.");
  } catch (error) { return failure(error); }
}
