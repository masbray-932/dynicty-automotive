"use server";

import { Prisma } from "@prisma/client";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/server/auth/session";
import { logger } from "@/server/log";
import { actionResult, type ActionState } from "@/types/action-state";
import { articleSchema, categorySchema, serviceSchema, editorialFormInput, type EditorialKind } from "@/validation/editorial";
import { deleteEditorial, EditorialError, saveEditorial } from "./service";

function refresh(kind: EditorialKind, slugs: Array<string | null>) {
  const publicBase = kind === "article" ? "/articles" : "/services";
  revalidatePath(kind === "article" ? "/admin/articles" : "/admin/services");
  revalidatePath(publicBase);
  revalidatePath(`${publicBase}/[slug]`, "page");
  for (const slug of slugs) if (slug) revalidatePath(`${publicBase}/${slug}`);
  revalidatePath("/"); revalidatePath("/sitemap.xml");
}
function failure(error: unknown): ActionState {
  if (error instanceof z.ZodError) return actionResult("error", "Periksa kembali data konten.", error.flatten().fieldErrors as Record<string, string[]>);
  if (error instanceof EditorialError) return actionResult("error", error.message, error.field ? { [error.field]: [error.message] } : {});
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") return actionResult("error", "Slug sudah digunakan. Pilih slug lain.", { slug: ["Slug sudah digunakan."] });
  logger.error("editorial.mutation_failed");
  return actionResult("error", "Konten belum dapat disimpan. Silakan coba kembali.");
}
export async function saveEditorialAction(kind: EditorialKind, _state: ActionState, form: FormData): Promise<ActionState> {
  await requireAdmin();
  if (!["category", "service", "article"].includes(kind)) return actionResult("error", "Jenis konten tidak valid.");
  let result;
  try {
    const input = editorialFormInput(kind, form);
    const data = kind === "category" ? categorySchema.parse(input) : kind === "service" ? serviceSchema.parse(input) : articleSchema.parse(input);
    result = await saveEditorial(kind, data, form.get("image"), form.get("removeImage") === "on");
  } catch (error) { return failure(error); }
  try { refresh(kind, [result.oldSlug, result.slug]); }
  catch { return actionResult("warning", "Konten disimpan. Muat ulang halaman untuk melihat perubahan."); }
  return actionResult(result.cleanupFailed ? "warning" : "success", result.cleanupFailed ? "Konten disimpan; media lama perlu ditinjau operator." : "Konten berhasil disimpan.");
}
export async function deleteEditorialAction(kind: EditorialKind, _state: ActionState, form: FormData): Promise<ActionState> {
  await requireAdmin();
  if (!["category", "service", "article"].includes(kind)) return actionResult("error", "Jenis konten tidak valid.");
  const keys = [...form.keys()].filter(key => !key.startsWith("$ACTION_"));
  if (keys.length !== 2 || new Set(keys).size !== 2 || !keys.every(key => ["id", "confirm"].includes(key)) || form.get("confirm") !== "on") return actionResult("error", "Konfirmasi hapus diperlukan.");
  let result;
  try { result = await deleteEditorial(kind, String(form.get("id") ?? "")); }
  catch (error) { return failure(error); }
  try { refresh(kind, [result.slug]); }
  catch { return actionResult("warning", "Konten dihapus. Muat ulang halaman."); }
  return actionResult(result.cleanupFailed ? "warning" : "success", result.cleanupFailed ? "Konten dihapus; media perlu ditinjau operator." : "Konten berhasil dihapus.");
}
