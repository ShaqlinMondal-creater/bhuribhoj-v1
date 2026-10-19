import Image from "next/image";
import Link from "next/link";
import { photos } from "@/components/marketing/photos";

export function CtaBand() {
  return (
    <section className="marketing">
      <div className="m-wrap py-16 md:py-24">
        <div className="relative min-h-[22rem] overflow-hidden rounded-2xl">
          <Image
            src={photos.ctaKitchen}
            alt="A kitchen range with pots ready for the next meal"
            fill
            sizes="(max-width: 768px) 100vw, 1152px"
            placeholder="blur"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/88 via-black/78 to-black/60" />
          <div className="relative px-6 py-14 sm:px-10">
            <h2 className="max-w-xl text-3xl font-semibold tracking-tight text-white sm:text-4xl">Ready to open a house?</h2>
            <p className="mt-3 max-w-lg text-base leading-7 text-white">
              Tell us the mess name. We will point you to the right door.
            </p>
            <Link href="/contact" className="m-btn m-btn-primary mt-8">
              Start your mess
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
