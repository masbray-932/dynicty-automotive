export type CountRow<T extends string> = { key: T; count: number };

export function mapDashboardCounts(
  total: number,
  statusRows: Array<{ status: "DRAFT" | "AVAILABLE" | "SOLD"; _count: { _all: number } }>,
  conditionRows: Array<{ condition: "NEW" | "USED"; _count: { _all: number } }>,
  featured: number,
) {
  const status = Object.fromEntries(statusRows.map((row) => [row.status, row._count._all]));
  const condition = Object.fromEntries(conditionRows.map((row) => [row.condition, row._count._all]));
  return { total, available: status.AVAILABLE ?? 0, draft: status.DRAFT ?? 0, sold: status.SOLD ?? 0, newCars: condition.NEW ?? 0, usedCars: condition.USED ?? 0, featured };
}

export function projectRecentVehicles<T extends { id: string; updatedAt: Date }>(rows: T[], limit = 6) {
  return [...rows].sort((left, right) => right.updatedAt.getTime() - left.updatedAt.getTime() || left.id.localeCompare(right.id)).slice(0, limit);
}
