import Image from "next/image";

export function BrandLoader({ variant = "splash" }: { variant?: "splash" | "bar" }) {
  if (variant === "bar") {
    return (
      <div className="marketing relative" role="status" aria-label="Loading the page">
        <div className="m-loader-track pointer-events-none fixed inset-x-0 top-0 z-50 h-0.5 bg-white/10">
          <div className="m-loader-bar h-full w-full bg-[var(--accent)]" />
        </div>
        <div className="grid place-items-center py-24">
          <Image src="/no-bg.png" alt="" width={72} height={72} className="h-16 w-16 rounded-full object-cover" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center" role="status" aria-label="Loading ভুরিভোজ">
      <div className="m-logo-ring relative grid h-36 w-36 place-items-center rounded-full">
        <Image
          src="/no-bg.png"
          alt=""
          width={112}
          height={112}
          priority
          className="m-logo-pulse h-28 w-28 rounded-full object-cover"
        />
      </div>
      <p className="bn mt-5 text-2xl font-semibold tracking-tight">ভুরিভোজ</p>
      <div className="mt-6 h-0.5 w-40 overflow-hidden rounded-full bg-white/15">
        <div className="m-loader-bar h-full w-full bg-[var(--accent)]" />
      </div>
    </div>
  );
}
