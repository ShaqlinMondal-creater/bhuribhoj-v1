import type { Metadata } from "next";
import { Bento } from "@/components/marketing/Bento";
import { CtaBand } from "@/components/marketing/CtaBand";
import { FaqList } from "@/components/marketing/FaqList";
import { Hero } from "@/components/marketing/Hero";
import { PlanPreview } from "@/components/marketing/PlanCards";
import { MessSetup } from "@/components/marketing/MessSetup";
import { Roles } from "@/components/marketing/Roles";
import { Reveal } from "@/components/marketing/Reveal";
import { TrustMarquee } from "@/components/marketing/TrustMarquee";

export const metadata: Metadata = {
  title: {
    absolute: "BhuriBhoj — mess & shared kitchen management",
  },
  description:
    "BhuriBhoj helps hostels, PGs, and shared kitchens track meals, members, and money — across India and worldwide.",
  openGraph: {
    title: "BhuriBhoj — mess & shared kitchen management",
    description: "Meals, members, and money in one place. Built for shared kitchens in India and beyond.",
  },
};

const questions = [
  {
    q: "Who is this for?",
    a: "Hostels, paying-guest houses, student housing, boarding kitchens, and any group that cooks and eats together — in India or abroad.",
  },
  {
    q: "What does “mess” mean here?",
    a: "In India, a mess is a shared kitchen. BhuriBhoj works the same idea for shared kitchens and community dining anywhere.",
  },
  {
    q: "Does everyone see the same screen?",
    a: "No. Platform admin, president, manager, and member each get their own area with the right permissions.",
  },
  {
    q: "What happens at month end?",
    a: "Deposits, expenses, dues, and fines sit in one ledger so you can close the month cleanly.",
  },
  {
    q: "Can guests eat?",
    a: "Yes. Guest meals are their own records, with a name and a price your kitchen sets.",
  },
  {
    q: "How long is a subscription?",
    a: "Pick a plan for one month, a short term, or a full year. The president opens it for one kitchen.",
  },
];

export default function HomePage() {
  return (
    <main>
      <Hero />
      <TrustMarquee />
      <MessSetup />
      <Bento />
      <Roles />
      <PlanPreview />
      <section className="marketing bg-[var(--surface)]">
        <div className="m-wrap py-16 md:py-24">
          <Reveal>
            <p className="text-sm font-medium text-[var(--accent)]">FAQ</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">Common questions</h2>
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
