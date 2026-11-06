import { Prisma, type PrismaClient } from "@prisma/client";
import { hashPassword, verifyPassword } from "../server/auth/password";

// Both operator seeds use the same lock and policy. There is no runtime user
// creation endpoint. Direct DB operators are outside this policy boundary.
export async function bootstrapPrimaryAdmin(db: PrismaClient, credentials: { email: string; password: string }) {
  const passwordHash = await hashPassword(credentials.password);
  return db.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT 1 FROM pg_advisory_xact_lock(1846984126, 1)`;
    const admins = await tx.adminUser.findMany({ take: 2, select: { id: true, email: true, passwordHash: true } });
    const [admin] = admins;
    if (admins.length > 1 || (admin && admin.email !== credentials.email)) {
      throw new Error("Primary admin bootstrap refused: reconcile existing administrator accounts explicitly.");
    }
    if (!admin) {
      await tx.adminUser.create({ data: { email: credentials.email, passwordHash } });
      return "created";
    }
    if (await verifyPassword(credentials.password, admin.passwordHash)) return "unchanged";
    await tx.adminUser.update({ where: { id: admin.id }, data: { passwordHash } });
    await tx.adminSession.deleteMany({ where: { adminId: admin.id } });
    return "rotated";
  }, { isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted });
}
