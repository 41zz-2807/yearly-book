import Link from "next/link";
import { redirect } from "next/navigation";
import { auth, signOut } from "@/auth";

export const metadata = {
  title: "Admin",
};

/**
 * Proteksi seluruh route /admin/*.
 *
 * SENGaja dipasang di layout, bukan middleware: verifikasi password memakai
 * bcryptjs yang tidak berjalan di Edge runtime milik middleware. Dengan
 * begini route tetap terlindungi tanpa perlu adapter edge.
 *
 * `dynamic = "force-dynamic"` wajib karena layout ini membaca cookies
 * lewat auth(), sehingga tidak boleh di-prerender saat build.
 */
export const dynamic = "force-dynamic";

const NAV = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/siswa", label: "Siswa" },
  { href: "/admin/kegiatan", label: "Kegiatan" },
  { href: "/admin/wali-kelas", label: "Wali Kelas" },
  { href: "/admin/prestasi", label: "Prestasi" },
  { href: "/admin/pengaturan", label: "Pengaturan" },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user || session.user.role !== "admin") {
    redirect("/login");
  }

  return (
    <div className="min-h-screen md:flex">
      <aside className="border-b border-ink-800 bg-ink-900/40 md:w-60 md:border-r md:border-b-0">
        <div className="p-4 md:p-6">
          <p className="text-xs font-medium tracking-widest text-emerald-400 uppercase">
            Admin
          </p>
          <p className="mt-1 truncate text-sm text-ink-300">
            {session.user.name}
          </p>
        </div>

        <nav className="flex gap-1 overflow-x-auto px-2 pb-3 md:flex-col md:px-3">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="shrink-0 rounded-lg px-3 py-2 text-sm text-ink-300 transition-colors hover:bg-ink-800 hover:text-white"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="px-3 pb-4 md:mt-auto">
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/login" });
            }}
          >
            <button
              type="submit"
              className="w-full rounded-lg border border-ink-700 px-3 py-2 text-sm text-ink-300 transition-colors hover:border-ink-600 hover:text-white"
            >
              Keluar
            </button>
          </form>
        </div>
      </aside>

      <main className="flex-1 p-6 md:p-8">{children}</main>
    </div>
  );
}
