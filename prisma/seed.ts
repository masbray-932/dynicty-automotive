import { PrismaClient } from "@prisma/client";
import { bootstrapPrimaryAdmin } from "./primary-admin";
import { seedAdminSchema } from "../validation/auth";

const db = new PrismaClient();

async function main() {
  const credentials = seedAdminSchema.parse({
    email: process.env.ADMIN_EMAIL,
    password: process.env.ADMIN_PASSWORD,
  });

  const status = await bootstrapPrimaryAdmin(db, credentials);
  await db.dealerSettings.upsert({
    where: { id: "default", AND: [{ dealerId: null }] },
    update: {},
    create: { id: "default", dealerName: "Dynicty Automotive" },
  });
  console.info(`Primary administrator: ${status}.`);
}

main()
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : "Seed failed.");
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
