import Image, { type StaticImageData } from "next/image";
import { Reveal } from "@/components/marketing/Reveal";
import { photos } from "@/components/marketing/photos";

const shots: { src: StaticImageData; caption: string; alt: string; className: string }[] = [
  {
    src: photos.thali,
    caption: "The plate",
    alt: "A steel thali with roti, sabzi, and small bowls of a home meal",
    className: "col-span-2 aspect-[16/10] md:row-span-2 md:aspect-auto md:min-h-[28rem]",
  },
  {
    src: photos.fish,
    caption: "The catch",
    alt: "Fish curry with potato and green chili in a white bowl",
    className: "aspect-[4/3]",
  },
  {
    src: photos.market,
    caption: "Morning market",
    alt: "A market stall piled with vegetables, fruit, and a hanging scale",
    className: "aspect-[4/3]",
  },
  {
    src: photos.spices,
    caption: "The store",
    alt: "Chili, turmeric, cumin, and other dry spices laid out for the kitchen",
    className: "aspect-[4/3]",
  },
  {
    src: photos.pot,
    caption: "Dry dal",
    alt: "Wooden bowls of uncooked lentils, peas, and grains",
    className: "aspect-[4/3]",
  },
];

export function MessSetup() {
  return (
    <section className="marketing">
      <div className="m-wrap py-16 md:py-24">
        <Reveal>
          <p className="text-sm font-medium text-[var(--accent)]">A mess, set up</p>
          <h2 className="mt-3 max-w-2xl text-3xl font-semibold tracking-tight sm:text-4xl">What the house already keeps on the table.</h2>
          <p className="mt-4 max-w-xl text-base leading-7 text-[var(--muted)]">
            Dal in the store, vegetables from the morning market, and a plate for lunch. The books come after the food.
          </p>
        </Reveal>
        <div className="mt-10 grid grid-cols-2 gap-3 md:grid-cols-4">
          {shots.map((shot) => (
            <Reveal key={shot.caption} className={shot.className}>
              <figure className="m-photo relative h-full min-h-40 overflow-hidden rounded-2xl">
                <Image
                  src={shot.src}
                  alt={shot.alt}
                  fill
                  sizes={shot.caption === "The plate" ? "(max-width: 768px) 100vw, 560px" : "(max-width: 768px) 50vw, 280px"}
                  placeholder="blur"
                  className="object-cover"
                />
                <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/45 to-transparent px-3 py-3 text-sm font-semibold text-white">
                  {shot.caption}
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
