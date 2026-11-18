import "server-only";
import { Prisma } from "@prisma/client";
import { db } from "@/db/client";
import { requireAdmin } from "@/server/auth/session";
import { LEGACY_DEALER_SCOPE } from "@/server/dealer/scope";
import { getStorageProvider } from "@/services/storage";
import { createEditorialMediaKey, isEditorialMediaKey } from "@/services/storage/key";
import { validateImageUpload } from "@/validation/upload";
import { serviceCtaSchema, type ServiceCtaValues } from "@/validation/service-cta";
import { normalizeWhatsappNumber } from "@/features/homepage/domain";

const ownerId = LEGACY_DEALER_SCOPE.dealerId;
const serializable = { isolationLevel: Prisma.TransactionIsolationLevel.Serializable };

async function removeMedia(key: string | null) {
  if (!key || !isEditorialMediaKey(key)) return;
  const refs = await db.serviceCtaConfig.count({ where: { imageStorageKey: key } });
  if (!refs) await getStorageProvider().delete(key).catch(() => undefined);
}

async function uploadImage(file: unknown) {
  if (!(file instanceof File) || !file.size) return null;
  const parsed = await validateImageUpload(file);
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Gambar CTA tidak valid.");
  const key = createEditorialMediaKey("service-cta", file.type);
  await getStorageProvider().put({ key, body: new Uint8Array(await file.arrayBuffer()), contentType: file.type });
  return key;
}

export async function getServiceCtaAdmin(serviceId: string) {
  await requireAdmin();
  return db.serviceCtaConfig.findFirst({ where: { dealerSettingsId: ownerId, serviceId }, include: { buttons: { orderBy: [{ sortOrder: "asc" }, { id: "asc" }] } } });
}

export async function saveServiceCta(input: ServiceCtaValues, image: unknown, removeImage: boolean) {
  await requireAdmin();
  const values = serviceCtaSchema.parse(input);
  const uploaded = await uploadImage(image);
  let oldImage: string | null = null;
  try {
    const result = await db.$transaction(async tx => {
      const service = await tx.showroomService.findFirst({ where: { id: values.serviceId, dealerSettingsId: ownerId }, select: { id: true } });
      if (!service) throw new Error("Layanan tidak ditemukan.");
      const existing = await tx.serviceCtaConfig.findUnique({ where: { dealerSettingsId_serviceId: { dealerSettingsId: ownerId, serviceId: values.serviceId } }, select: { id: true, imageStorageKey: true } });
      oldImage = existing?.imageStorageKey ?? null;
      const data = { enabled: values.enabled, heading: values.heading, description: values.description, headingDesktopPx: values.headingDesktopPx, descriptionDesktopPx: values.descriptionDesktopPx, headingMobilePx: values.headingMobilePx, descriptionMobilePx: values.descriptionMobilePx, backgroundColor: values.backgroundColor, textColor: values.textColor, imageStorageKey: uploaded ?? (removeImage ? null : oldImage) };
      const cta = await tx.serviceCtaConfig.upsert({
        where: { dealerSettingsId_serviceId: { dealerSettingsId: ownerId, serviceId: values.serviceId } },
        create: { dealerSettingsId: ownerId, serviceId: values.serviceId, ...data }, update: data,
      });
      await tx.serviceCtaButton.deleteMany({ where: { dealerSettingsId: ownerId, serviceCtaId: cta.id } });
      if (values.buttons.length) await tx.serviceCtaButton.createMany({ data: values.buttons.map((button, sortOrder) => ({ ...button, whatsappNumber: normalizeWhatsappNumber(button.whatsappNumber)!, sortOrder, dealerSettingsId: ownerId, serviceCtaId: cta.id })) });
      return cta;
    }, serializable);
    if ((uploaded || removeImage) && oldImage && oldImage !== uploaded) await removeMedia(oldImage);
    return result;
  } catch (error) {
    if (uploaded) await removeMedia(uploaded);
    throw error;
  }
}
