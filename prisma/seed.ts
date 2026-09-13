import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../server/auth/password";
import { seedAdminSchema } from "../validation/auth";

const db = new PrismaClient();

async function main() {
  const credentials = seedAdminSchema.parse({
    email: process.env.ADMIN_EMAIL,
    password: process.env.ADMIN_PASSWORD,
  });

  await db.adminUser.upsert({
    where: { email: credentials.email },
    update: { passwordHash: await hashPassword(credentials.password) },
    create: {
      email: credentials.email,
      passwordHash: await hashPassword(credentials.password),
    },
  });

  await db.dealerSettings.upsert({
    where: { id: "default" },
    update: {},
    create: { id: "default", dealerName: "Dynicty Automotive" },
  });

  const developmentCatalog = [
    { name: "Toyota", slug: "toyota", model: "Avanza", modelSlug: "avanza" },
    { name: "Honda", slug: "honda", model: "Brio", modelSlug: "brio" },
    { name: "Suzuki", slug: "suzuki", model: "XL7", modelSlug: "xl7" },
    { name: "Mitsubishi", slug: "mitsubishi", model: "Xpander", modelSlug: "xpander" },
  ];

  for (const item of developmentCatalog) {
    const brand = await db.brand.upsert({
      where: { slug: item.slug },
      update: { name: item.name },
      create: { name: item.name, slug: item.slug },
    });
    await db.carModel.upsert({
      where: { brandId_slug: { brandId: brand.id, slug: item.modelSlug } },
      update: { name: item.model },
      create: { brandId: brand.id, name: item.model, slug: item.modelSlug },
    });
  }

  console.info(`Admin account ready for ${credentials.email}.`);
}

main()
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : "Seed failed.");
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
