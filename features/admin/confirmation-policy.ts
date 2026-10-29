export type Confirmation = {
  title: string;
  explanation: string;
  actionLabel: string;
  destructive?: boolean;
  changes?: { label: string; before: string; after: string }[];
};

type Values = Record<string, unknown>;
const text = (value: unknown) => value === null || value === undefined || value === "" ? "—" : String(value).trim() || "—";
const field = (data: FormData, name: string) => String(data.get(name) ?? "").trim();
export const hasFile = (data: FormData, name: string) => { const file = data.get(name); return file instanceof File && file.size > 0; };
export const criticalAction = (title: string, explanation: string, actionLabel = "Konfirmasi perubahan", destructive = false): Confirmation => ({ title, explanation, actionLabel, destructive });

function changesFor(original: Values, data: FormData, fields: Record<string, string>) {
  return Object.entries(fields).flatMap(([name, label]) => {
    const before = text(original[name]);
    const after = text(data.get(name));
    return before === after ? [] : [{ label, before, after }];
  });
}
export function vehicleConfirmation(original: Values | undefined, data: FormData): Confirmation | null {
  if (!original) return field(data, "status") === "AVAILABLE" ? criticalAction("Publikasikan kendaraan?", "Kendaraan baru akan terlihat di katalog publik.", "Publikasikan") : null;
  const normalized = new FormData();
  for (const [key, value] of data) normalized.set(key, value);
  const price = field(data, "price").replace(/[.\s]/g, "");
  if (/^\d+$/.test(price)) normalized.set("price", String(Number(price)));
  normalized.set("featured", data.get("featured") === "on" ? "true" : "false");
  const changes = changesFor(original, normalized, {
    price: "Harga (Rp)", status: "Status (DRAFT / AVAILABLE / SOLD)", condition: "Kondisi", brandId: "Merek (ID)", modelId: "Model (ID)",
    variant: "Varian", year: "Tahun", mileage: "Kilometer", transmission: "Transmisi", fuelType: "Bahan bakar", color: "Warna kendaraan", featured: "Unggulan",
  });
  return changes.length ? { ...criticalAction("Simpan perubahan penting kendaraan?", "Periksa harga, identitas, spesifikasi, dan status sebelum menyimpan."), changes } : null;
}
export function brandConfirmation(original: { name: string } | undefined, data: FormData): Confirmation | null {
  if (!original) return null;
  const changes = changesFor(original, data, { name: "Nama merek" });
  return changes.length ? { ...criticalAction("Ubah nama merek?", "Perubahan nama dan slug dapat memengaruhi identitas katalog."), changes } : null;
}
export function modelConfirmation(original: { name: string; brandId: string } | undefined, data: FormData): Confirmation | null {
  if (!original) return null;
  const changes = changesFor(original, data, { name: "Nama model", brandId: "Merek (ID)" });
  return changes.length ? { ...criticalAction("Ubah identitas model?", "Model yang terhubung ke kendaraan akan memakai identitas ini. Validasi hubungan merek tetap berlaku."), changes } : null;
}
export function settingsConfirmation(original: Values, data: FormData): Confirmation | null {
  const normalized = new FormData();
  for (const [key, value] of data) normalized.set(key, value);
  const effective = { ...original, dealerName: original.dealerName ?? "Dynicty Automotive" };
  const changes = changesFor(effective, normalized, { dealerName: "Nama dealer", whatsappNumber: "WhatsApp", phone: "Telepon", email: "Email", address: "Alamat showroom", googleMapsUrl: "Lokasi Maps", instagramUrl: "Instagram", facebookUrl: "Facebook" });
  return changes.length ? { ...criticalAction("Ubah identitas atau kontak dealer?", "Pengunjung menggunakan informasi ini untuk menghubungi dan menemukan dealer."), changes } : null;
}
export function profileConfirmation(original: Values | null, data: FormData): Confirmation | null {
  const changes = ["welcomeActive", "aboutActive", "operatingHoursActive"].flatMap(name => {
    const before = Boolean(original?.[name]); const after = data.get(name) === "on";
    return before === after ? [] : [{ label: ({ welcomeActive: "Welcome", aboutActive: "Tentang kami", operatingHoursActive: "Jam operasional" } as Record<string, string>)[name], before: before ? "Aktif" : "Nonaktif", after: after ? "Aktif" : "Nonaktif" }];
  });
  if (original?.showroomKey && (hasFile(data, "image") || data.get("removeImage") === "on")) changes.push({ label: "Foto showroom", before: "Tersimpan", after: hasFile(data, "image") ? "Diganti" : "Dihapus" });
  if ((original?.operatingHoursActive || data.get("operatingHoursActive") === "on") && text(original?.operatingHours) !== text(data.get("operatingHours"))) changes.push({ label: "Jam operasional", before: text(original?.operatingHours), after: text(data.get("operatingHours")) });
  return changes.length ? { ...criticalAction("Ubah publikasi atau informasi operasional?", "Perubahan ini memengaruhi bagian website atau informasi kunjungan dealer."), changes } : null;
}
export function contentConfirmation(original: { active: boolean; link: string; title: string } | undefined, data: FormData): Confirmation | null {
  const active = data.get("active") === "on";
  const changes = [];
  if (active !== Boolean(original?.active)) changes.push({ label: "Publikasi", before: original?.active ? "Aktif" : "Nonaktif", after: active ? "Aktif" : "Nonaktif" });
  if (original?.active && (hasFile(data, "image") || text(original.link) !== text(data.get("link")))) changes.push({ label: original.title, before: "Media/tautan aktif", after: "Media/tautan baru" });
  return changes.length ? { ...criticalAction("Ubah konten yang dipublikasikan?", "Periksa perubahan publikasi, media atau tautan sebelum menyimpan."), changes } : null;
}
