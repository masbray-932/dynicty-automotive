"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/server/auth/session";
import { logger } from "@/server/log";
import {
  createCar,
  arrangeUploadedCarImages,
  deleteCarImage,
  deleteCarWithMedia,
  InvalidModelRelationError,
  reorderCarImage,
  setPrimaryImage,
  updateCar,
  uploadCarImage,
} from "@/server/cars/service";
import type { ActionState } from "@/types/action-state";
import { carFormData, carFormSchema } from "@/validation/car";
import { validateImageUpload } from "@/validation/upload";
import { reportUploadFailure } from "@/server/upload-feedback";
import { actionResult } from "@/types/action-state";

const idSchema = z.string().cuid();
const uploadedImageIdsSchema = z.array(idSchema).max(50);

export type QueuedImageUploadResult = ActionState & { image?: { id: string; isPrimary: boolean; sortOrder: number } };

function refreshPublicCarRoutes(slug?: string) {
  revalidatePath("/");
  revalidatePath("/cars");
  if (slug) revalidatePath(`/cars/${slug}`);
  revalidatePath("/sitemap.xml");
}

function saveError(error: unknown): ActionState {
  if (error instanceof InvalidModelRelationError) return { message: error.message, errors: { modelId: [error.message] } };
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") return { message: "Data mobil tidak ditemukan.", errors: {} };
  return { message: "Mobil tidak dapat disimpan. Silakan coba kembali.", errors: {} };
}

export async function createCarAction(_state: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const parsed = carFormSchema.safeParse(carFormData(formData));
  if (!parsed.success) return { message: "Periksa kembali data mobil.", errors: parsed.error.flatten().fieldErrors };

  let id: string;
  try {
    const created = await createCar(parsed.data);
    id = created.id;
    refreshPublicCarRoutes(created.slug);
  } catch (error) {
    logger.error("car.create_failed", { errorType: error instanceof Error ? error.name : "unknown" });
    return saveError(error);
  }
  redirect(`/admin/cars/${id}/edit?notice=created`);
}

export async function updateCarAction(id: string, _state: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  if (!idSchema.safeParse(id).success) return { message: "ID mobil tidak valid.", errors: {} };
  const parsed = carFormSchema.safeParse(carFormData(formData));
  if (!parsed.success) return { message: "Periksa kembali data mobil.", errors: parsed.error.flatten().fieldErrors };

  try {
    const updated = await updateCar(id, parsed.data);
    refreshPublicCarRoutes(updated.slug);
  } catch (error) {
    logger.error("car.update_failed", { carId: id, errorType: error instanceof Error ? error.name : "unknown" });
    return saveError(error);
  }
  revalidatePath("/admin/cars");
  revalidatePath(`/admin/cars/${id}/edit`);
  return actionResult("success", "Perubahan berhasil disimpan.");
}

export async function deleteCarAction(formData: FormData) {
  await requireAdmin();
  const id = idSchema.parse(formData.get("id"));
  const result = await deleteCarWithMedia(id);
  refreshPublicCarRoutes();
  if (result.failedKeys.length) logger.warn("car.media_cleanup_failed", { carId: id, failedCount: result.failedKeys.length });
  if (!result.deleted) redirect("/admin/cars?notice=not-found");
  redirect(`/admin/cars?notice=${result.failedKeys.length ? "deleted-cleanup-warning" : "deleted"}`);
}

export async function uploadImageAction(carId: string, _state: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  if (!idSchema.safeParse(carId).success) return { message: "ID mobil tidak valid.", errors: {} };
  const parsed = await validateImageUpload(formData.get("image"));
  if (!parsed.success) {
    logger.warn("car.image_rejected", { carId });
    return { message: "Gambar ditolak.", errors: { image: parsed.error.issues.map((issue) => issue.message) } };
  }
  try {
    await uploadCarImage(carId, parsed.data);
  } catch (error) {
    const message = reportUploadFailure("car.image_upload_failed", error, { carId });
    return actionResult("error", message, { image: [message] });
  }
  try {
    revalidatePath(`/admin/cars/${carId}/edit`);
    refreshPublicCarRoutes();
  } catch {
    logger.warn("car.image_revalidation_failed", { carId });
    return actionResult("warning", "Gambar disimpan. Muat ulang halaman untuk melihat perubahan.");
  }
  return actionResult("success", "Gambar berhasil diunggah.");
}

export async function uploadQueuedImageAction(carId: string, formData: FormData): Promise<QueuedImageUploadResult> {
  await requireAdmin();
  if (!idSchema.safeParse(carId).success) return actionResult("error", "ID mobil tidak valid.");
  const parsed = await validateImageUpload(formData.get("image"));
  if (!parsed.success) {
    logger.warn("car.image_rejected", { carId });
    return actionResult("error", "Gambar ditolak.", { image: parsed.error.issues.map(issue => issue.message) });
  }
  try {
    const image = await uploadCarImage(carId, parsed.data);
    try {
      revalidatePath(`/admin/cars/${carId}/edit`);
      refreshPublicCarRoutes();
    } catch {
      logger.warn("car.image_revalidation_failed", { carId });
      return { ...actionResult("warning", "Gambar disimpan. Muat ulang halaman untuk melihat perubahan."), image: { id: image.id, isPrimary: image.isPrimary, sortOrder: image.sortOrder } };
    }
    return { ...actionResult("success", "Gambar berhasil diunggah."), image: { id: image.id, isPrimary: image.isPrimary, sortOrder: image.sortOrder } };
  } catch (error) {
    const message = reportUploadFailure("car.image_upload_failed", error, { carId });
    return actionResult("error", message, { image: [message] });
  }
}

export async function arrangeUploadedImagesAction(carId: string, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  if (!idSchema.safeParse(carId).success) return actionResult("error", "ID mobil tidak valid.");
  let ids: unknown;
  try { ids = JSON.parse(String(formData.get("imageIds") ?? "[]")); }
  catch { return actionResult("error", "Urutan gambar tidak valid."); }
  const parsedIds = uploadedImageIdsSchema.safeParse(ids);
  const primaryValue = String(formData.get("primaryImageId") ?? "");
  const primary = primaryValue ? idSchema.safeParse(primaryValue) : { success: true as const, data: undefined };
  if (!parsedIds.success || !primary.success) return actionResult("error", "Urutan gambar tidak valid.");
  try {
    await arrangeUploadedCarImages(carId, parsedIds.data, primary.data);
    revalidatePath(`/admin/cars/${carId}/edit`);
    refreshPublicCarRoutes();
    return actionResult("success", "Urutan dan gambar utama berhasil disimpan.");
  } catch (error) {
    logger.error("car.image_arrangement_failed", { carId, errorType: error instanceof Error ? error.name : "unknown" });
    return actionResult("error", "Gambar tersimpan, tetapi urutan belum dapat diterapkan. Coba lagi.");
  }
}

export async function setPrimaryImageAction(formData: FormData) {
  await requireAdmin();
  const carId = idSchema.parse(formData.get("carId"));
  const imageId = idSchema.parse(formData.get("imageId"));
  await setPrimaryImage(carId, imageId);
  revalidatePath(`/admin/cars/${carId}/edit`);
  refreshPublicCarRoutes();
}

export async function reorderImageAction(formData: FormData) {
  await requireAdmin();
  const carId = idSchema.parse(formData.get("carId"));
  const imageId = idSchema.parse(formData.get("imageId"));
  const direction = z.enum(["up", "down"]).parse(formData.get("direction"));
  await reorderCarImage(carId, imageId, direction);
  revalidatePath(`/admin/cars/${carId}/edit`);
  refreshPublicCarRoutes();
}

export async function deleteImageAction(formData: FormData) {
  await requireAdmin();
  const carId = idSchema.parse(formData.get("carId"));
  const imageId = idSchema.parse(formData.get("imageId"));
  const result = await deleteCarImage(carId, imageId);
  revalidatePath(`/admin/cars/${carId}/edit`);
  refreshPublicCarRoutes();
  if (result.storageCleanupFailed) logger.warn("car.image_cleanup_failed", { carId, imageId });
  redirect(`/admin/cars/${carId}/edit?notice=${result.storageCleanupFailed ? "image-cleanup-warning" : "image-deleted"}`);
}
