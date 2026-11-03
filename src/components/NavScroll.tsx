"use client";

import { useEffect } from "react";

/**
 * Adds the header's bottom rule once the page leaves the top. Toggled on the
 * DOM directly rather than through state: the home intro also drives classes
 * on the same element, and a re-render would wipe them.
 */
export default function NavScroll() {
  useEffect(() => {
    const nav = document.getElementById("nav");
    if (!nav) return;
    const update = () => nav.classList.toggle("scrolled", scrollY > 8);
    addEventListener("scroll", update, { passive: true });
    update();
    return () => removeEventListener("scroll", update);
  }, []);

  return null;
}
