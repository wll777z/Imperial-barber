import Login from "@/features/admin/login";
export const metadata = {
  title: "Acesso profissional | Imperial Barber",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";
export default function Page() {
  return (
    <Login
      configured={
        !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
        !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
        !!process.env.SUPABASE_SERVICE_ROLE_KEY
      }
    />
  );
}
