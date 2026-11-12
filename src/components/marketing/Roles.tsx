import { Crown, Shield, UserRound, Utensils } from "lucide-react";
import { Reveal } from "@/components/marketing/Reveal";

const roles = [
  { title: "Platform admin", copy: "Manages every kitchen on the platform, plans, and access. Not day-to-day cooking.", icon: Shield },
  { title: "President", copy: "Opens the kitchen, chooses a plan, and invites managers.", icon: Crown },
  { title: "Manager", copy: "Runs the month: meals, shopping, money, and members.", icon: Utensils },
  { title: "Member", copy: "Marks meals, sees their house, and pays what is due.", icon: UserRound },
];

export function Roles() {
  return (
    <section className="marketing">
      <div className="m-wrap py-16 md:py-24">
        <Reveal>
          <p className="text-sm font-medium text-[var(--accent)]">Roles</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
            Four roles. Clear permissions.
          </h2>
          <p className="mt-4 max-w-xl text-base leading-7 text-[var(--muted)]">
            Everyone enters their own area. No shared admin screen for the whole house.
          </p>
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
