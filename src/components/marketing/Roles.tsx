"use client";

import { Crown, Shield, UserRound, Utensils } from "lucide-react";
import { useReducedMotion } from "framer-motion";
import { Reveal } from "@/components/marketing/Reveal";

const roles = [
  { title: "Platform admin", copy: "Sees every mess, every plan, and every invitation. Does not cook.", icon: Shield },
  { title: "President", copy: "Opens the house, buys the plan, and invites the first managers.", icon: Crown },
  { title: "Manager", copy: "Runs the month on duty: meals, market, money, and members.", icon: Utensils },
  { title: "Member", copy: "Marks meals, sees the house they belong to, and pays what is due.", icon: UserRound },
];

export function Roles() {
  const reduced = useReducedMotion();

  function tilt(event: React.MouseEvent<HTMLElement>) {
    if (reduced) return;
    const box = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - box.left) / box.width - 0.5;
    const y = (event.clientY - box.top) / box.height - 0.5;
    event.currentTarget.style.setProperty("--mx", `${event.clientX - box.left}px`);
    event.currentTarget.style.setProperty("--my", `${event.clientY - box.top}px`);
    event.currentTarget.style.transform = `perspective(800px) rotateX(${(-y * 6).toFixed(2)}deg) rotateY(${(x * 6).toFixed(2)}deg) translateY(-4px)`;
  }

  return (
    <section className="marketing">
      <div className="m-wrap py-16 md:py-24">
        <Reveal>
          <p className="text-sm font-medium text-[var(--accent)]">Who sits where</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">Four doors. No shared screen.</h2>
        </Reveal>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {roles.map((role, index) => {
            const Icon = role.icon;
            return (
              <Reveal key={role.title} delay={index * 0.05}>
                <article
                  onMouseMove={tilt}
                  onMouseLeave={(event) => {
                    event.currentTarget.style.transform = "";
                  }}
                  className="glow-card h-full p-5 transition duration-200 ease-out"
                >
                  <span className="relative flex h-10 w-10 items-center justify-center rounded-full bg-[var(--surface-2)] text-[var(--accent)]">
                    <Icon size={18} aria-hidden="true" />
                  </span>
                  <h3 className="relative mt-4 text-lg font-semibold">{role.title}</h3>
                  <p className="relative mt-2 text-sm leading-6 text-[var(--muted)]">{role.copy}</p>
                </article>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
