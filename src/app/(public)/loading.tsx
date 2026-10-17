import { LogoLoader } from "@/components/brand/LogoLoader";

export default function Loading() {
  return (
    <div className="grid min-h-[70dvh] place-items-center">
      <LogoLoader />
    </div>
  );
}
