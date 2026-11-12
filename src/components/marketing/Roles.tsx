import { Crown, Shield, UserRound, Utensils } from "lucide-react";
import { Reveal } from "@/components/marketing/Reveal";

const roles = [
  { title: "Platform admin", copy: "Sees every mess, every plan, and every invitation. Does not cook.", icon: Shield },
  { title: "President", copy: "Opens the house, buys the plan, and invites the first managers.", icon: Crown },
  { title: "Manager", copy: "Runs the month on duty: meals, market, money, and members.", icon: Utensils },
  { title: "Member", copy: "Marks meals, sees the house they belong to, and pays what is due.", icon: UserRound },
];

export function Roles() {
  return (
    <section className="marketing">
      <div className="m-wrap py-16 md:py-24">
        <Reveal>
          <p className="text-sm font-medium text-[var(--accent)]">Who sits where</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">Four doors. No shared screen.</h2>
        </Reveal>
        <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
          {roles.map((role, index) => {
            const Icon = role.icon;
            return (
              <Reveal key={role.title} delay={index * 0.04}>
                <article className="h-full border-t border-[var(--border)] pt-5">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--surface)] text-[var(--accent)]">
                    <Icon size={17} aria-hidden="true" />
                  </span>
                  <h3 className="mt-4 text-lg font-semibold">{role.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{role.copy}</p>
                </article>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
