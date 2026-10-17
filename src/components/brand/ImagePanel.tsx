export function ImagePanel({
  src,
  alt,
  className = "",
  children,
}: {
  src: string;
  alt: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <article className={`relative overflow-hidden rounded-[1.75rem] ${className}`}>
      <img src={src} alt={alt} className="absolute inset-0 h-full w-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/65 to-black/15" />
      <div className="relative flex h-full min-h-full flex-col justify-end p-5 sm:p-7">{children}</div>
    </article>
  );
}
