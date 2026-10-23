import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import type { IconName } from "@/components/icons/Icon";

export function SectionScreen({
  title,
  description,
  icon,
}: {
  title: string;
  description: string;
  icon: IconName;
}) {
  return (
    <section className="space-y-6">
      <PageHeader eyebrow="Platform" title={title} description={description} />
      <EmptyState icon={icon} title="No records yet" description="This list is empty." />
    </section>
  );
}
