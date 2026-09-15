import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../server/auth/password";
import { seedAdminSchema } from "../validation/auth";

function assertStagingTarget() {
  if (process.env.DEPLOYMENT_ENV !== "staging") throw new Error("Staging seed requires DEPLOYMENT_ENV=staging.");
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error("Staging DATABASE_URL is required.");
  let databaseName = "";
  try { databaseName = decodeURIComponent(new URL(databaseUrl).pathname).replace(/^\//, ""); }
  catch { throw new Error("Staging DATABASE_URL is invalid."); }
  if (!/staging/i.test(databaseName)) throw new Error("Refusing to seed a database whose name does not contain 'staging'.");
}

const db = new PrismaClient();

async function main() {
  assertStagingTarget();
  const credentials = seedAdminSchema.parse({
    email: process.env.STAGING_ADMIN_EMAIL,
    password: process.env.STAGING_ADMIN_PASSWORD,
  });
  const passwordHash = await hashPassword(credentials.password);
  await db.adminUser.upsert({
    where: { email: credentials.email },
    update: { passwordHash },
    create: { email: credentials.email, passwordHash },
  });

  await db.dealerSettings.upsert({
    where: { id: "default" },
    create: {
      id: "default",
      dealerName: "Dynicty Automotive Preview",
      phone: "+62 800 0000 000",
      whatsappNumber: "6280000000000",
      email: "preview@example.invalid",
      address: "Alamat contoh staging — bukan showroom nyata.",
      primaryColor: "#DC2626",
      secondaryColor: "#18181B",
    },
    update: {
      dealerName: "Dynicty Automotive Preview",
      phone: "+62 800 0000 000",
      whatsappNumber: "6280000000000",
      email: "preview@example.invalid",
      address: "Alamat contoh staging — bukan showroom nyata.",
      primaryColor: "#DC2626",
      secondaryColor: "#18181B",
    },
  });

  const catalog = [
    { brand: "Toyota", brandSlug: "toyota", model: "Avanza", modelSlug: "avanza", transmission: "Automatic" },
    { brand: "Honda", brandSlug: "honda", model: "Brio", modelSlug: "brio", transmission: "CVT" },
    { brand: "Suzuki", brandSlug: "suzuki", model: "XL7", modelSlug: "xl7", transmission: "Automatic" },
  ];
  const models = [] as Array<(typeof catalog)[number] & { brandId: string; modelId: string }>;
  for (const item of catalog) {
    const brand = await db.brand.upsert({ where: { slug: item.brandSlug }, update: { name: item.brand }, create: { name: item.brand, slug: item.brandSlug } });
    const model = await db.carModel.upsert({
      where: { brandId_slug: { brandId: brand.id, slug: item.modelSlug } },
      update: { name: item.model },
      create: { brandId: brand.id, name: item.model, slug: item.modelSlug },
    });
    models.push({ ...item, brandId: brand.id, modelId: model.id });
  }

  for (let index = 0; index < 15; index += 1) {
    const item = models[index % models.length];
    const condition = index % 3 === 0 ? "NEW" as const : "USED" as const;
    const status = index === 13 ? "DRAFT" as const : index === 14 ? "SOLD" as const : "AVAILABLE" as const;
    const slug = `${item.brandSlug}-${item.modelSlug}-preview-${index + 1}`;
    const data = {
      condition,
      brandId: item.brandId,
      modelId: item.modelId,
      variant: `Preview ${index + 1}`,
      year: 2026 - (index % 7),
      price: String(175_000_000 + index * 12_500_000),
      transmission: item.transmission,
      fuelType: "Bensin",
      color: ["Hitam", "Putih", "Abu-abu"][index % 3],
      mileage: condition === "USED" ? 8_000 + index * 1_500 : null,
      description: "Data kendaraan khusus staging untuk pengujian Dynicty Automotive Preview.",
      status,
      featured: status === "AVAILABLE" && index < 3,
    };
    await db.car.upsert({ where: { slug }, update: data, create: { slug, ...data } });
  }

  console.info("Staging-only admin, DealerSettings, and 15 preview vehicles are ready.");
}

main()
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : "Staging seed failed.");
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
