import type { CSSProperties, ReactNode } from "react";

// Metal plates stacked along Z to give the phone its thickness (see .ip-slab).
const SLABS = 18;
const BUTTONS = ["l1", "l2", "l3", "r1", "r2"];

/** The CSS 3D iPhone frame from the design; children go inside the screen. */
export default function IPhone({
  flip = false,
  id,
  children,
}: {
  flip?: boolean;
  id?: string;
  children: ReactNode;
}) {
  return (
    <div className={flip ? "iphone flip" : "iphone"} id={id}>
      <div className="ip-slab" aria-hidden="true">
        {Array.from({ length: SLABS }, (_, i) => (
          <i
            key={i}
            style={{ "--k": ((i + 1) / SLABS).toFixed(3) } as CSSProperties}
          />
        ))}
        {BUTTONS.map((b) => (
          <span key={b} className={`ip-btn ${b}`} />
        ))}
      </div>
      <div className="scr">{children}</div>
    </div>
  );
}
