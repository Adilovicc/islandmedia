import Image from "next/image";

/**
 * The brand mark. `unoptimized` because these are SVGs already at their final
 * size — running them through the image optimiser costs a request and returns
 * the same bytes.
 */
export function Logo({
  reverse = false,
  width = 174,
}: {
  /** The light-on-dark lockup, for the carbon sidebar and field header. */
  reverse?: boolean;
  width?: number;
}) {
  return (
    <Image
      src={reverse ? "/logo/island-media-primary-reverse.svg" : "/logo/island-media-primary.svg"}
      alt="Island Media Co"
      width={width}
      height={Math.round(width * 0.23)}
      priority
      unoptimized
    />
  );
}
