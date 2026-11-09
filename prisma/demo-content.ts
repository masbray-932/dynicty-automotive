import type { PrismaClient } from "@prisma/client";

export const DEMO_NAME = "Dynicty Auto Demo";
export const demoItems = [
  { id: "demo-welcome-faq", kind: "FAQ" as const, title: "Apakah showroom ini melayani transaksi nyata?", body: "Tidak. Dynicty Auto Demo adalah identitas fiktif untuk menunjukkan pengelolaan website showroom. Data dan program pada lingkungan ini bukan penawaran komersial.", active: true },
  { id: "demo-document-faq", kind: "FAQ" as const, title: "Apa yang sebaiknya disiapkan sebelum mencari mobil?", body: "Tentukan kebutuhan penggunaan, kisaran anggaran, dan pertanyaan mengenai kondisi kendaraan. Informasi di website membantu menyusun pilihan awal; rincian unit harus diperiksa langsung pada showroom yang nyata.", active: true },
  { id: "demo-advantage", kind: "ADVANTAGE" as const, title: "Informasi yang mudah ditinjau", body: "Contoh demo menampilkan spesifikasi, harga, foto, dan informasi showroom dalam alur yang konsisten. Ini menggambarkan fungsi website, bukan sertifikasi kondisi kendaraan.", active: true },
  { id: "demo-promo", kind: "PROMO_BANNER" as const, title: "Contoh informasi promo bulanan — bukan penawaran", body: "", active: false },
  { id: "demo-leasing", kind: "LEASING_PARTNER" as const, title: "Area contoh partner leasing — belum ada kemitraan", body: "", active: false },
];
export const demoArticles = [
  { id: "demo-article-budget", slug: "menyusun-anggaran-pembelian-mobil", title: "Menyusun Anggaran Pembelian Mobil", excerpt: "Pertimbangan dasar agar pencarian kendaraan sesuai kebutuhan dan kemampuan biaya.", body: "Mulailah dengan tujuan penggunaan kendaraan. Mobil untuk perjalanan harian, kebutuhan keluarga, dan kegiatan usaha dapat membutuhkan kapasitas serta karakter yang berbeda. Tulis prioritas utama agar perbandingan tidak hanya mengikuti penampilan.\n\nPisahkan anggaran harga kendaraan dari pengeluaran setelah pembelian. Perawatan berkala, bahan bakar, pajak, parkir, serta kebutuhan administrasi perlu diperhitungkan menggunakan informasi yang benar untuk unit dan wilayah Anda. Contoh website ini tidak memberikan estimasi biaya atau janji penghematan.\n\nGunakan filter kondisi, merek, model, kata kunci, dan batas harga untuk menyusun daftar awal. Periksa informasi tiap kendaraan, lalu susun pertanyaan yang belum terjawab sebelum menghubungi showroom. Jangan menganggap seluruh informasi iklan sebagai pengganti pemeriksaan unit.\n\nArtikel ini adalah materi edukasi umum pada showroom fiktif Dynicty Auto Demo. Tidak ada penawaran pembiayaan, jaminan pembelian, atau rekomendasi produk keuangan di dalamnya." },
  { id: "demo-article-inspection", slug: "menyiapkan-kunjungan-ke-showroom", title: "Menyiapkan Kunjungan ke Showroom", excerpt: "Daftar hal yang dapat ditanyakan ketika meninjau kendaraan secara langsung.", body: "Sebelum berkunjung, catat kendaraan yang ingin dilihat beserta pertanyaan mengenai tahun, varian, transmisi, jarak tempuh, dan riwayat yang tersedia. Hubungi showroom untuk meminta konfirmasi ketersediaan. Stok website dapat berubah dan bukan janji bahwa unit selalu tersedia.\n\nSaat meninjau kendaraan, cocokkan informasi yang diberikan dengan kondisi unit. Mintalah penjelasan mengenai dokumen, catatan perawatan jika tersedia, serta prosedur transaksi. Jika membutuhkan penilaian teknis, pertimbangkan tenaga pemeriksa independen yang kompeten.\n\nSimpan ringkasan pertanyaan dan jawaban agar pilihan dapat dibandingkan dengan tenang. Hindari keputusan hanya berdasarkan satu foto atau klaim yang belum dapat dibuktikan. Harga, biaya tambahan, dan ketentuan transaksi perlu dijelaskan oleh pihak showroom yang sebenarnya.\n\nDynicty Auto Demo tidak menjalankan layanan inspeksi atau transaksi kendaraan. Artikel ini merupakan materi demonstrasi fungsi penerbitan konten website." },
];

export function assertDemoEnvironment(environment: Record<string, string | undefined>) {
  if (environment.DEMO_CONTENT !== "true" || environment.NODE_ENV === "production" || !["development", "staging"].includes(environment.DEPLOYMENT_ENV ?? "")) throw new Error("Demo seed requires an explicit non-production demo environment.");
  const url = new URL(environment.DATABASE_URL ?? "");
  const database = decodeURIComponent(url.pathname.slice(1));
  if (!/^dynicty_automotive_demo_[a-z0-9_]+$/.test(database) || !["127.0.0.1", "localhost", "[::1]"].includes(url.hostname)) throw new Error("Demo seed requires a dedicated loopback demo database.");
  if (environment.STORAGE_PROVIDER !== "local") throw new Error("Demo seed supports isolated local storage only.");
  return database;
}

// Deliberately no admin credentials, registered dealers, vehicle inventory,
// fabricated testimonials, external image URLs or real leasing logos.
export async function seedDemoContent(db: PrismaClient, environment: Record<string, string | undefined>) {
  const expectedDatabase = assertDemoEnvironment(environment);
  return db.$transaction(async tx => {
    await tx.$queryRaw`SELECT 1 FROM pg_advisory_xact_lock(1846984126, 52)`;
    const [identity] = await tx.$queryRaw<Array<{ name: string }>>`SELECT current_database() AS name`;
    if (identity?.name !== expectedDatabase) throw new Error("Demo database identity mismatch.");
    const settings = await tx.dealerSettings.findMany({ take: 2 });
    if (settings.some(row => row.id !== "default" || row.dealerId !== null || row.dealerName !== DEMO_NAME)) throw new Error("Demo seed refuses existing customer settings.");
    const foreignCounts = await Promise.all([
      tx.dealer.count(), tx.dealerDomain.count(), tx.car.count(), tx.carImage.count(), tx.brand.count(), tx.carModel.count(),
      tx.serviceCategory.count({ where: { id: { notIn: ["demo-category-guidance", "demo-category-information"] } } }),
      tx.showroomService.count({ where: { id: { notIn: ["demo-service-selection", "demo-service-information"] } } }),
      tx.article.count({ where: { id: { notIn: demoArticles.map(item => item.id) } } }),
      tx.dealerContentItem.count({ where: { id: { notIn: demoItems.map(item => item.id) } } }),
    ]);
    if (foreignCounts.some(Boolean)) throw new Error("Demo seed refuses unknown or customer records.");
    await tx.dealerSettings.upsert({ where: { id: "default" }, create: { id: "default", dealerName: DEMO_NAME, address: "Lokasi demonstrasi fiktif — bukan alamat showroom nyata.", email: "demo@example.invalid" }, update: {} });
    await tx.dealerContent.upsert({ where: { dealerId: "default" }, create: {
      dealerId: "default", welcomeTitle: "Selamat datang di Dynicty Auto Demo", welcomeBody: "Jelajahi contoh website showroom otomotif yang dikelola melalui Admin. Identitas, layanan, dan konten pada instalasi ini adalah demonstrasi fiktif, bukan penawaran transaksi.", welcomeActive: true,
      aboutSummary: "Dynicty Auto Demo memperlihatkan cara showroom menyajikan informasi kendaraan dan profil usaha secara terstruktur. Showroom ini fiktif dan tidak menerima transaksi nyata.", aboutStory: "Website ini disiapkan sebagai lingkungan demonstrasi pengelolaan konten showroom. Operator dapat mengatur profil, banner, informasi layanan, dan artikel melalui Admin. Seluruh data contoh harus diganti dengan informasi yang benar sebelum digunakan oleh usaha nyata.", aboutActive: true,
      history: "Dynicty Auto Demo dibuat sebagai identitas fiktif untuk pengujian produk website. Tidak ada riwayat usaha nyata yang diklaim.", vision: "Mencontohkan penyajian informasi otomotif yang jelas dan mudah diakses.", mission: "Menata informasi kendaraan secara konsisten. Mempermudah pembaruan konten melalui Admin. Menunjukkan pentingnya informasi yang faktual.", achievements: "",
    }, update: {} });
    for (const [id, name, slug] of [["demo-category-guidance", "Panduan Pemilihan — Demo", "panduan-pemilihan"], ["demo-category-information", "Informasi Showroom — Demo", "informasi-showroom"]]) await tx.serviceCategory.upsert({ where: { id }, create: { id, dealerSettingsId: "default", name, slug, active: true }, update: {} });
    for (const [id, categoryId, title, slug, shortDescription, body] of [
      ["demo-service-selection", "demo-category-guidance", "Pendampingan Informasi Kendaraan — Demo", "pendampingan-informasi-kendaraan", "Contoh penjelasan cara meninjau pilihan kendaraan pada website.", "Layanan contoh ini menggambarkan informasi yang dapat disampaikan showroom saat membantu pengunjung memahami katalog. Pengunjung dapat meninjau kondisi, merek, model, dan kisaran harga. Ini bukan layanan konsultasi berbayar atau janji ketersediaan unit. Seluruh deskripsi merupakan demonstrasi fiktif yang perlu diganti dengan layanan nyata sebelum penerbitan untuk pelanggan."],
      ["demo-service-information", "demo-category-information", "Informasi Kunjungan Showroom — Demo", "informasi-kunjungan-showroom", "Contoh informasi persiapan kunjungan dan pertanyaan mengenai kendaraan.", "Bagian demo ini menunjukkan tempat showroom menjelaskan kontak, jam operasional, dan langkah meminta informasi sebelum berkunjung. Tidak ada pemesanan kunjungan otomatis, jaminan transaksi, atau layanan inspeksi yang dijanjikan. Dynicty Auto Demo adalah showroom fiktif sehingga informasi ini tidak digunakan untuk kunjungan nyata."],
    ]) await tx.showroomService.upsert({ where: { id }, create: { id, dealerSettingsId: "default", categoryId, title, slug, shortDescription, body, status: "PUBLISHED", homepageVisible: true }, update: {} });
    for (const data of demoArticles) await tx.article.upsert({ where: { id: data.id }, create: { ...data, dealerSettingsId: "default", status: "PUBLISHED", publishedAt: new Date() }, update: {} });
    for (const data of demoItems) await tx.dealerContentItem.upsert({ where: { id: data.id }, create: { ...data, dealerId: "default", ...(data.kind === "PROMO_BANNER" ? { mediaKey: "dealers/default/content/promo_banner/demo-placeholder.png" } : data.kind === "LEASING_PARTNER" ? { mediaKey: "dealers/default/content/leasing_partner/demo-placeholder.png" } : {}) }, update: {} });
    return { dealerName: DEMO_NAME, categories: 2, services: 2, articles: 2, testimonials: 0 };
  }, { timeout: 30000 });
}
