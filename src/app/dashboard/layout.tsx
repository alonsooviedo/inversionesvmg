import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import Sidebar from "@/components/layout/Sidebar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  return (
    <div className="min-h-screen">
      <Sidebar />
      <main className="min-h-screen md:ml-56">
        <div className="pt-16 p-4 md:pt-8 md:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
