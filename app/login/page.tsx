import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { LoginForm } from "@/components/login-form";

export const metadata = {
  title: "Masuk",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string; error?: string }>;
}) {
  // Sudah punya sesi admin? Langsung ke admin.
  const session = await auth();
  if (session?.user && session.user.role === "admin") {
    redirect("/admin");
  }

  const { callbackUrl, error } = await searchParams;

  // Tombol Google hanya ditampilkan bila provider-nya benar-benar siap.
  // AUTH_ADMIN_EMAIL ikut diperiksa karena tanpa itu semua login Google akan
  // ditolak oleh callback `signIn` — lebih baik tidak menawarkan tombol yang
  // pasti gagal daripada menampilkan tombol lalu menolaknya.
  const googleEnabled = Boolean(
    process.env.AUTH_GOOGLE_ID &&
      process.env.AUTH_GOOGLE_SECRET &&
      process.env.AUTH_ADMIN_EMAIL,
  );

  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <div className="w-full max-w-sm space-y-6">
        <div className="space-y-1 text-center">
          <h1 className="text-2xl font-bold text-white">Yearly Book</h1>
          <p className="text-sm text-ink-400">Masuk sebagai admin</p>
        </div>

        <div className="ds-panel p-6">
          {error === "AccessDenied" ? (
            <p role="alert" className="ds-alert ds-alert-error mb-4">
              Email tersebut tidak terdaftar sebagai admin.
            </p>
          ) : null}
          <LoginForm
            callbackUrl={callbackUrl ?? "/admin"}
            googleEnabled={googleEnabled}
          />
        </div>
      </div>
    </main>
  );
}
