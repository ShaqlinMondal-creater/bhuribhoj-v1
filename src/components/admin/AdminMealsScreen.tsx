"use client";

import { AdminMessPicker, useAdminMessId } from "@/components/admin/AdminMessPicker";
import { MenusScreen } from "@/components/mess/MenusScreen";
import { PageHeader } from "@/components/ui/PageHeader";

export function AdminMealsScreen() {
  const [messId, setMessId] = useAdminMessId();

  return (
    <section className="space-y-5">
      <PageHeader eyebrow="Mess Details" title="Meals" description="Daily menus for one mess on the platform." />
      <AdminMessPicker value={messId} onChange={setMessId} />
      <MenusScreen key={messId ?? "none"} messId={messId} hideHeader />
    </section>
  );
}
