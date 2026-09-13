import Link from "next/link";
import { logoutAction } from "@/server/auth/actions";

const links = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/cars", label: "Kelola Mobil" },
  { href: "/admin/settings", label: "Pengaturan" },
  { href: "/", label: "Lihat Website" },
];

export function AdminNav() {
  return (
    <aside className="border-b border-white/10 bg-zinc-950 p-4 lg:min-h-screen lg:w-64 lg:border-b-0 lg:border-r">
      <p className="mb-5 text-sm font-black tracking-wide text-white">DYNICTY ADMIN</p>
      <nav aria-label="Navigasi admin">
        <ul className="flex flex-wrap gap-2 lg:flex-col">
          {links.map((link) => (
            <li key={link.href}>
              <Link className="block rounded-lg px-3 py-2 text-sm text-zinc-300 hover:bg-white/10 hover:text-white" href={link.href}>
                {link.label}
              </Link>
            </li>
          ))}
          <li>
            <form action={logoutAction}>
              <button className="rounded-lg px-3 py-2 text-left text-sm text-red-300 hover:bg-red-500/10" type="submit">
                Keluar
              </button>
            </form>
          </li>
        </ul>
      </nav>
    </aside>
  );
}
