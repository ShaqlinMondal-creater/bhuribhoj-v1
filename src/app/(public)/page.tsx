import type { Metadata } from "next";
import { Bento } from "@/components/marketing/Bento";
import { CtaBand } from "@/components/marketing/CtaBand";
import { DayTimeline } from "@/components/marketing/DayTimeline";
import { FaqList } from "@/components/marketing/FaqList";
import { Hero } from "@/components/marketing/Hero";
import { PlanPreview } from "@/components/marketing/PlanCards";
import { Reveal } from "@/components/marketing/Reveal";
import { Roles } from "@/components/marketing/Roles";
import { TrustMarquee } from "@/components/marketing/TrustMarquee";

export const metadata: Metadata = {
  title: "The mess house",
  description: "BhuriBhoj keeps meals, money, and members for a shared mess in one house.",
  openGraph: {
    title: "BhuriBhoj · the mess house",
    description: "Meals at noon and night. Money at the end of the month. A seat for every role.",
  },
};

const questions = [
  { q: "Who is this for?", a: "A hostel kitchen, a paying-guest mess, or a college dining hall that already shares one pot and one fund." },
  { q: "Does every person see the same screen?", a: "No. Admin, president, manager, and member each enter their own area." },
  { q: "What happens at month end?", a: "Dues, deposits, expenses, and fines sit in one ledger so the house can close the month." },
  { q: "Can a guest eat?", a: "Yes. A guest meal is its own record, with a name and a price set by the house." },
  { q: "How long is a subscription?", a: "A mess picks a plan for one month, a short term, or a full year. The president opens it." },
];

export default function HomePage() {
  return (
    <main>
      <Hero />
      <TrustMarquee />
      <Bento />
      <DayTimeline />
      <Roles />
      <PlanPreview />
      <section className="marketing">
        <div className="m-wrap py-16 md:py-24">
          <Reveal>
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">Questions the house asks first</h2>
          </Reveal>
          <div className="mt-8">
            <FaqList items={questions} />
          </div>
        </div>
      </section>
      <CtaBand />
    </main>
  );
}
