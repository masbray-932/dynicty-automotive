"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/server/auth/session";
import {
  createCar,
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

const idSchema = z.string().cuid();

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
    id = (await createCar(parsed.data)).id;
  } catch (error) {
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
    await updateCar(id, parsed.data);
  } catch (error) {
    return saveError(error);
  }
  revalidatePath("/admin/cars");
  revalidatePath(`/admin/cars/${id}/edit`);
  return { message: "Perubahan berhasil disimpan.", errors: {} };
}

export async function deleteCarAction(formData: FormData) {
  await requireAdmin();
  const id = idSchema.parse(formData.get("id"));
  const result = await deleteCarWithMedia(id);
  if (!result.deleted) redirect("/admin/cars?notice=not-found");
  redirect(`/admin/cars?notice=${result.failedKeys.length ? "deleted-cleanup-warning" : "deleted"}`);
}

export async function uploadImageAction(carId: string, _state: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  if (!idSchema.safeParse(carId).success) return { message: "ID mobil tidak valid.", errors: {} };
  const parsed = await validateImageUpload(formData.get("image"));
  if (!parsed.success) return { message: "Gambar ditolak.", errors: { image: parsed.error.issues.map((issue) => issue.message) } };
  try {
    await uploadCarImage(carId, parsed.data);
  } catch {
    return { message: "Gambar gagal diunggah. Tidak ada data parsial yang disimpan.", errors: {} };
  }
  revalidatePath(`/admin/cars/${carId}/edit`);
  return { message: "Gambar berhasil diunggah.", errors: {} };
}

export async function setPrimaryImageAction(formData: FormData) {
  await requireAdmin();
  const carId = idSchema.parse(formData.get("carId"));
  const imageId = idSchema.parse(formData.get("imageId"));
  await setPrimaryImage(carId, imageId);
  revalidatePath(`/admin/cars/${carId}/edit`);
}

export async function reorderImageAction(formData: FormData) {
  await requireAdmin();
  const carId = idSchema.parse(formData.get("carId"));
  const imageId = idSchema.parse(formData.get("imageId"));
  const direction = z.enum(["up", "down"]).parse(formData.get("direction"));
  await reorderCarImage(carId, imageId, direction);
  revalidatePath(`/admin/cars/${carId}/edit`);
}

export async function deleteImageAction(formData: FormData) {
  await requireAdmin();
  const carId = idSchema.parse(formData.get("carId"));
  const imageId = idSchema.parse(formData.get("imageId"));
  const result = await deleteCarImage(carId, imageId);
  revalidatePath(`/admin/cars/${carId}/edit`);
  redirect(`/admin/cars/${carId}/edit?notice=${result.storageCleanupFailed ? "image-cleanup-warning" : "image-deleted"}`);
}
