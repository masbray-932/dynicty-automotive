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

  console.info(`Admin account ready for ${credentials.email}.`);
}

main()
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : "Seed failed.");
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
