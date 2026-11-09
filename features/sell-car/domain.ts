import { z } from "zod";
import { normalizeWhatsappNumber } from "@/features/homepage/domain";
const text = (max: number) => z.string().trim().min(1,"Wajib diisi.").max(max);
export function sellCarSchema(currentYear = new Date().getFullYear()) {
  return z.strictObject({ name:text(100), contact:text(30).refine(value=>Boolean(normalizeWhatsappNumber(value)),"Nomor kontak tidak valid."), brand:text(80), model:text(100), year:z.union([z.number(),z.string().trim().min(1,"Wajib diisi.")]).transform(Number).pipe(z.number().int().min(1900,"Tahun tidak valid.").max(currentYear+1,"Tahun tidak valid.")), transmission:z.enum(["Manual","Automatic"],{error:"Pilih transmisi."}), mileage:z.union([z.number(),z.string().trim().min(1,"Wajib diisi.")]).transform(Number).pipe(z.number().int().min(0).max(10000000)), price:z.union([z.number(),z.string().trim().min(1,"Wajib diisi.")]).transform(Number).pipe(z.number().int().positive("Harga harus lebih dari nol.").max(999999999999999)), notes:z.string().trim().max(2000) });
}
export type SellCarInput = z.input<ReturnType<typeof sellCarSchema>>;
export function buildSellCarWhatsapp(number: string | null, input: unknown, currentYear?:number) {
  const normalized=normalizeWhatsappNumber(number);if(!normalized)return null;
  const data=sellCarSchema(currentYear).parse(input);
  const message=["Permintaan informasi jual mobil",`Nama: ${data.name}`,`Kontak: ${data.contact}`,`Kendaraan: ${data.brand} ${data.model}`,`Tahun: ${data.year}`,`Transmisi: ${data.transmission}`,`Jarak tempuh: ${data.mileage.toLocaleString("id-ID")} km`,`Harga yang diharapkan: Rp${data.price.toLocaleString("id-ID")}`,data.notes?`Catatan: ${data.notes}`:"","Saya ingin menanyakan prosedur showroom. Pesan ini bukan persetujuan penilaian atau jaminan pembelian."].filter(Boolean).join("\n");
  return `https://wa.me/${normalized}?text=${encodeURIComponent(message)}`;
}
