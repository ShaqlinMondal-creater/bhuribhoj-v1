export function RoundPhoto({
  src,
  alt,
  className = "h-auto w-full",
}: {
  src: string;
  alt: string;
  className?: string;
}) {
  return (
    <img
      src={src}
      alt={alt}
      className={`aspect-square max-w-full rounded-full object-cover ring-2 ring-[#e2b657]/45 ${className}`}
    />
  );
}
