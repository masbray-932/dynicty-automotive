import "server-only";
import { db } from "@/db/client";
import { mapDashboardCounts, projectRecentVehicles } from "@/features/dashboard/domain";
import { buildVehicleTitle } from "@/features/car-detail/domain";

export async function getDashboardData() {
  try {
    const [total, statusRows, conditionRows, featured, recentRows] = await Promise.all([
      db.car.count(),
      db.car.groupBy({ by: ["status"], _count: { _all: true } }),
      db.car.groupBy({ by: ["condition"], _count: { _all: true } }),
      db.car.count({ where: { featured: true } }),
      db.car.findMany({ orderBy: [{ updatedAt: "desc" }, { id: "asc" }], take: 6, select: { id: true, condition: true, status: true, variant: true, year: true, price: true, updatedAt: true, brand: { select: { name: true } }, model: { select: { name: true } } } }),
    ]);
    return { kind: "success" as const, metrics: mapDashboardCounts(total, statusRows, conditionRows, featured), recent: projectRecentVehicles(recentRows).map((car) => ({ id: car.id, title: buildVehicleTitle({ brand: car.brand.name, model: car.model.name, variant: car.variant, year: car.year }), condition: car.condition, status: car.status, price: car.price.toString(), updatedAt: car.updatedAt })) };
  } catch { return { kind: "error" as const }; }
}
