export function BrandLogo({
  className = "h-14 w-14",
}: {
  className?: string;
}) {
  return (
    <img
      src="/no-bg.png"
      alt="ভুরিভোজ"
      className={`rounded-full object-cover ${className}`}
    />
  );
}
