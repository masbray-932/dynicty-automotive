export function formatRupiah(value: { toString(): string } | string | number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(Number(value.toString()));
}

export function formatDate(value: Date) {
  return new Intl.DateTimeFormat("id-ID", { dateStyle: "medium" }).format(value);
}

export function formatMileage(value: number) {
  return `${new Intl.NumberFormat("id-ID").format(value)} km`;
}
