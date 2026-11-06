"use client";

import { AdminMessPicker, useAdminMessId } from "@/components/admin/AdminMessPicker";
import { MealsScreen } from "@/components/mess/MealsScreen";
import { PageHeader } from "@/components/ui/PageHeader";

export function AdminDailyMealsScreen() {
  const [messId, setMessId] = useAdminMessId();

  return (
    <section className="space-y-5">
      <PageHeader eyebrow="Mess Details" title="Daily Meals" description="Meal attendance for one mess, one day at a time." />
      <AdminMessPicker value={messId} onChange={setMessId} />
      <MealsScreen key={messId ?? "none"} messId={messId} />
    </section>
  );
}
