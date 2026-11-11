import Image from "next/image";

export function BrandLogo({
  className = "h-14 w-14",
}: {
  className?: string;
}) {
  return (
    <Image
      src="/no-bg.png"
      alt="ভুরিভোজ"
      width={80}
      height={80}
      className={`rounded-full object-cover ${className}`}
      priority
    />
  );
}
