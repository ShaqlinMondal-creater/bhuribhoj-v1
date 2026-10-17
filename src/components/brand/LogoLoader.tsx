import { BrandLogo } from "@/components/brand/BrandLogo";

const sizes = {
  sm: "h-24 w-24",
  md: "h-36 w-36",
  lg: "h-52 w-52 sm:h-64 sm:w-64 md:h-72 md:w-72",
};

export function LogoLoader({
  size = "md",
  spin = true,
  label = "Loading",
}: {
  size?: keyof typeof sizes;
  spin?: boolean;
  label?: string;
}) {
  return (
    <div className={`relative ${sizes[size]}`} role={spin ? "status" : "img"} aria-label={label}>
      <span
        className={`absolute inset-0 rounded-full border-2 border-[#e2b657]/20 border-t-[#e2b657] ${spin ? "animate-[spin_1.2s_linear_infinite]" : ""}`}
      />
      <span
        className={`absolute inset-[10%] rounded-full border border-[#e2b657]/35 ${spin ? "animate-[spin_2.2s_linear_infinite_reverse]" : ""}`}
      />
      <span className="absolute inset-[18%] overflow-hidden rounded-full bg-black shadow-[0_0_48px_rgba(226,182,87,0.35)]">
        <BrandLogo className="h-full w-full" />
      </span>
    </div>
  );
}
