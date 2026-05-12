layout = '''"use client";

import { Suspense } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen bg-zinc-950">
        <div className="w-8 h-8 border-4 border-[#3ecf8e] border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <div className="min-h-screen bg-zinc-950 text-zinc-100">
        {children}
      </div>
    </Suspense>
  );
}
'''

page = '''import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function ProtectedPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");
  redirect("/dashboard");
}
'''

with open('./app/protected/layout.tsx', 'w') as f:
    f.write(layout)

with open('./app/protected/page.tsx', 'w') as f:
    f.write(page)

print("ok")