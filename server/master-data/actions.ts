"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { db } from "@/db/client";
import { slugify, uniqueSlug } from "@/features/cars/domain";
import { requireAdmin } from "@/server/auth/session";
import { standaloneModel, standaloneOwner } from "@/server/standalone/inventory";
import type { ActionState } from "@/types/action-state";
import { brandSchema, carModelSchema } from "@/validation/master-data";
import { BrandLogoError, cleanupBrandLogo, uploadBrandLogo } from "./brand-media";

function duplicateMessage(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}

export async function saveBrandAction(_state: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const parsed = brandSchema.safeParse({ id: formData.get("id") || undefined, name: formData.get("name"), active: formData.get("active") === "on", sortOrder: formData.get("sortOrder") ?? "0" });
  if (!parsed.success) return { message: "Periksa nama merek.", errors: parsed.error.flatten().fieldErrors };

  let uploaded: string | null = null;
  let oldKey: string | null = null;
  try {
    uploaded = await uploadBrandLogo(formData.get("logo"));
    if (parsed.data.id) {
      const slug = await uniqueSlug(parsed.data.name, async (candidate) =>
        Boolean(await db.brand.findFirst({ where: { ...standaloneOwner, slug: candidate, NOT: { id: parsed.data.id } }, select: { id: true } })),
      );
      const existing = await db.brand.findUnique({ where: { ...standaloneOwner, id: parsed.data.id }, select: { logoStorageKey: true } });
      if (!existing) throw new Error("Merek tidak ditemukan.");
      const removeLogo = formData.get("removeLogo") === "on";
      const logoStorageKey = uploaded ?? (removeLogo ? null : existing.logoStorageKey);
      await db.brand.update({ where: { ...standaloneOwner, id: parsed.data.id }, data: { name: parsed.data.name, slug, active: parsed.data.active, sortOrder: parsed.data.sortOrder, logoStorageKey } });
      if (existing.logoStorageKey !== logoStorageKey) oldKey = existing.logoStorageKey;
    } else {
      const slug = await uniqueSlug(parsed.data.name, async (candidate) =>
        Boolean(await db.brand.findUnique({ where: { ...standaloneOwner, slug: candidate }, select: { id: true } })),
      );
      await db.brand.create({ data: { ...standaloneOwner, name: parsed.data.name, slug, active: parsed.data.active, sortOrder: parsed.data.sortOrder, logoStorageKey: uploaded } });
    }
  } catch (error) {
    await cleanupBrandLogo(uploaded);
    if (error instanceof BrandLogoError) return { message: error.message, errors: { logo: [error.message] } };
    if (duplicateMessage(error)) return { message: "Nama merek sudah digunakan.", errors: { name: ["Gunakan nama lain."] } };
    return { message: "Merek tidak dapat disimpan.", errors: {} };
  }

  revalidatePath("/admin/brands");
  revalidatePath("/admin/cars/new");
  revalidatePath("/"); revalidatePath("/cars");
  const cleanupFailed = await cleanupBrandLogo(oldKey);
  return { message: cleanupFailed ? "Merek disimpan; logo lama perlu ditinjau operator." : "Merek berhasil disimpan.", errors: {}, status: cleanupFailed ? "warning" : "success" };
}

export async function saveModelAction(_state: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const parsed = carModelSchema.safeParse({
    id: formData.get("id") || undefined,
    brandId: formData.get("brandId"),
    name: formData.get("name"),
  });
  if (!parsed.success) return { message: "Periksa data model.", errors: parsed.error.flatten().fieldErrors };

  try {
    const blocked = await db.$transaction(async (tx): Promise<ActionState | null> => {
      const brandExists = await tx.brand.findUnique({ where: { ...standaloneOwner, id: parsed.data.brandId }, select: { id: true } });
      if (!brandExists) return { message: "Merek tidak ditemukan.", errors: { brandId: ["Pilih merek yang tersedia."] } };

      const slug = slugify(parsed.data.name);
      if (parsed.data.id) {
        const where = { ...standaloneModel, id: parsed.data.id };
        const existing = await tx.carModel.findUnique({ where, select: { brandId: true, _count: { select: { cars: true } } } });
        if (!existing) return { message: "Model tidak ditemukan.", errors: {} };
        if (existing.brandId !== parsed.data.brandId && existing._count.cars > 0) {
          return { message: "Merek model tidak dapat dipindahkan karena sudah digunakan mobil.", errors: { brandId: ["Pertahankan merek sebelumnya."] } };
        }
        await tx.carModel.update({ where, data: { brandId: parsed.data.brandId, name: parsed.data.name, slug } });
      } else {
        await tx.carModel.create({ data: { ...standaloneOwner, brandId: parsed.data.brandId, name: parsed.data.name, slug } });
      }
      return null;
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    if (blocked) return blocked;
  } catch (error) {
    if (duplicateMessage(error)) return { message: "Model tersebut sudah ada pada merek ini.", errors: { name: ["Gunakan nama lain."] } };
    return { message: "Model tidak dapat disimpan.", errors: {} };
  }

  revalidatePath("/admin/brands");
  revalidatePath("/admin/cars/new");
  return { message: "Model berhasil disimpan.", errors: {} };
}
