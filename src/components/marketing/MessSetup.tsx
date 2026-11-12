import Image, { type StaticImageData } from "next/image";
import { Reveal } from "@/components/marketing/Reveal";
import { photos } from "@/components/marketing/photos";

const shots: { src: StaticImageData; caption: string; alt: string; className: string }[] = [
  {
    src: photos.aboutKitchen,
    caption: "Kitchen",
    alt: "A working shared kitchen ready for the next meal",
    className: "col-span-2 md:row-span-2",
  },
  {
    src: photos.fish,
    caption: "Meals",
    alt: "A cooked meal served in a bowl",
    className: "",
  },
  {
    src: photos.market,
    caption: "Shopping",
    alt: "Fresh produce at a market stall",
    className: "",
  },
  {
    src: photos.spices,
    caption: "Stores",
    alt: "Spices and dry goods laid out for cooking",
    className: "",
  },
  {
    src: photos.pot,
    caption: "Provisions",
    alt: "Lentils, peas, and grains ready for the kitchen",
    className: "",
  },
];

export function MessSetup() {
  return (
    <section className="marketing">
      <div className="m-wrap py-16 md:py-24">
        <Reveal>
          <p className="text-sm font-medium text-[var(--accent)]">The product</p>
          <h2 className="mt-3 max-w-2xl text-3xl font-semibold tracking-tight sm:text-4xl">
            Built for how a shared kitchen already runs.
          </h2>
          <p className="mt-4 max-w-xl text-base leading-7 text-[var(--muted)]">
            In India a “mess” is a kitchen people share — shopping, cooking, and eating together. BhuriBhoj keeps that daily work and the monthly accounts in one system, wherever your house is.
          </p>
        </Reveal>

        <div className="mt-12 grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-5">
          {shots.map((shot) => (
            <Reveal key={shot.caption} className={shot.className}>
              <figure className="flex h-full flex-col">
                <div
                  className={`m-photo relative overflow-hidden ${
                    shot.caption === "Kitchen"
                      ? "aspect-[16/10] min-h-[14rem] md:h-full md:min-h-[28rem] md:aspect-auto"
                      : "aspect-[4/3]"
                  }`}
                >
                  <Image
                    src={shot.src}
                    alt={shot.alt}
                    fill
                    sizes={
                      shot.caption === "Kitchen"
                        ? "(max-width: 768px) 100vw, 560px"
                        : "(max-width: 768px) 50vw, 280px"
                    }
                    placeholder="blur"
                    className="object-cover"
                  />
                </div>
                <figcaption className="mt-2.5 text-sm font-medium text-[var(--muted)]">{shot.caption}</figcaption>
              </figure>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
