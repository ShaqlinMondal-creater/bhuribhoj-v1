import Image from "next/image";
import Link from "next/link";
import { photos } from "@/components/marketing/photos";

export function CtaBand() {
  return (
    <section className="marketing relative isolate overflow-hidden">
      <div className="absolute inset-0">
        <Image
          src={photos.ctaKitchen}
          alt="A kitchen range with pots ready for the next meal"
          fill
          sizes="100vw"
          placeholder="blur"
          className="object-cover object-center"
        />
      </div>
      <div className="absolute inset-0 bg-black/75" aria-hidden="true" />
      <div className="relative m-wrap py-20 md:py-28">
        <h2 className="max-w-xl text-3xl font-semibold tracking-tight text-white sm:text-4xl">
          Ready to open a house?
        </h2>
        <p className="mt-4 max-w-lg text-base leading-7 text-white/70">
          Tell us the mess name. We will point you to the right door.
        </p>
        <Link href="/contact" className="m-btn m-btn-primary mt-8">
          Start your mess
        </Link>
      </div>
    </section>
  );
}
