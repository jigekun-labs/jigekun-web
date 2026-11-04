/* eslint-disable @next/next/no-img-element -- sized and masked by site.css */
import type { ReactNode } from "react";

/**
 * A rendered phone mockup (848×1264 photo, transparent background) with the
 * app screen mapped onto it: `.rp-mask` cuts the screen shape out of the
 * photo and HomeEffects fits the 402×874 screen to its four corners. `mirror`
 * flips the phone to face the other way. Children go inside the screen.
 */
export default function RPhone({
  model,
  mirror = false,
  id,
  lazy = true,
  children,
}: {
  model: "light" | "navy";
  mirror?: boolean;
  id?: string;
  lazy?: boolean;
  children: ReactNode;
}) {
  return (
    <div className={mirror ? "rphone mirror" : "rphone"} data-model={model} id={id}>
      <img
        className="rp-body"
        src={`/assets/phone-${model}.webp`}
        alt=""
        width={848}
        height={1264}
        loading={lazy ? "lazy" : undefined}
      />
      <div className="rp-mask">
        <div className="rp-px">
          <div className="rp-screen scr">{children}</div>
        </div>
      </div>
    </div>
  );
}
