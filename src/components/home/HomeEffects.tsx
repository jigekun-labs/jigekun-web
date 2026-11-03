"use client";

import { useEffect } from "react";

type Cleanup = () => void;

const reducedMotion = () =>
  matchMedia("(prefers-reduced-motion:reduce)").matches;

function clamp(v: number, a: number, b: number) {
  return v < a ? a : v > b ? b : v;
}
// Smoothstep of p over [a, b].
function seg(p: number, a: number, b: number) {
  const t = clamp((p - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
}
function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

/** Calls `fn` at most once per animation frame on scroll and resize. */
function onScrollFrame(fn: () => void): Cleanup {
  let ticking = false;
  const handler = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      ticking = false;
      fn();
    });
  };
  addEventListener("scroll", handler, { passive: true });
  addEventListener("resize", handler);
  fn();
  return () => {
    removeEventListener("scroll", handler);
    removeEventListener("resize", handler);
  };
}

// Fades `.rv` elements in as they enter the viewport.
function reveal(): Cleanup {
  const els = document.querySelectorAll(".rv");
  if (!("IntersectionObserver" in window)) {
    els.forEach((e) => e.classList.add("in"));
    return () => {};
  }
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add("in");
          io.unobserve(e.target);
        }
      });
    },
    { rootMargin: "0px 0px -8% 0px", threshold: 0.08 },
  );
  els.forEach((e) => io.observe(e));
  return () => io.disconnect();
}

/**
 * Intro: over 700vh of scroll, the wide office photo cuts to a close-up, the
 * app lights up on the in-hand screen, the photo shrinks to a rounded card,
 * and the phone lifts out of the hand into the hero.
 */
function intro(): Cleanup {
  const $ = (id: string) => document.getElementById(id) as HTMLElement;
  const track = $("ixTrack");
  if (!track) return () => {};

  const PW = 1376;
  const PH = 768;
  // Corners of the screen in the close-up photo (where its four edges meet).
  let Q = [
    [666.4, 184.2],
    [804.6, 179.7],
    [890.0, 482.5],
    [743.8, 500.3],
  ];
  const cx = (Q[0][0] + Q[1][0] + Q[2][0] + Q[3][0]) / 4;
  const cy = (Q[0][1] + Q[1][1] + Q[2][1] + Q[3][1]) / 4;
  Q = Q.map((p) => [cx + (p[0] - cx) * 1.006, cy + (p[1] - cy) * 1.006]);
  const PHONE_C = [cx, cy];
  const FOCUS_WIDE = [990, 420];
  const FOCUS_CLOSE = [cx, cy];

  // Perspective transform taking the 402×874 screen onto quad Q.
  {
    const w = 402;
    const h = 874;
    const [[x0, y0], [x1, y1], [x2, y2], [x3, y3]] = Q;
    const dx1 = x1 - x2;
    const dx2 = x3 - x2;
    const dx3 = x0 - x1 + x2 - x3;
    const dy1 = y1 - y2;
    const dy2 = y3 - y2;
    const dy3 = y0 - y1 + y2 - y3;
    const den = dx1 * dy2 - dx2 * dy1;
    const g = (dx3 * dy2 - dx2 * dy3) / den;
    const hh = (dx1 * dy3 - dx3 * dy1) / den;
    const a = x1 - x0 + g * x1;
    const b = x3 - x0 + hh * x3;
    const c = x0;
    const d = y1 - y0 + g * y1;
    const e = y3 - y0 + hh * y3;
    const f = y0;
    $("ixHandScreen").style.transform =
      "matrix3d(" +
      [a / w, d / w, 0, g / w, b / h, e / h, 0, hh / h, 0, 0, 1, 0, c, f, 0, 1].join(",") +
      ")";
  }

  const bg = $("ixBg");
  const wide = $("ixWide");
  const close = $("ixClose");
  const inhand = $("ixInhand");
  const shadeB = $("ixShadeB");
  const shadeL = $("ixShadeL");
  const copy1 = $("ixCopy1");
  const hero = $("ixHero");
  const phone = $("ixPhone");
  const iphone = $("ixIphone");
  const hint = $("ixHint");
  const nav = $("nav");
  const words = Array.from(document.querySelectorAll<HTMLElement>("#ixWords span"));
  const handImgs = Array.from(document.querySelectorAll<HTMLElement>("#ixHandScreen img"));
  const phoneImgs = Array.from(phone.querySelectorAll<HTMLElement>(".scr img"));
  const narrow = matchMedia("(max-width:860px)");

  function place(
    el: HTMLElement,
    focus: number[],
    zoom: number,
    vw: number,
    vh: number,
    target: number[],
  ) {
    const S = Math.max(vw / PW, vh / PH) * zoom;
    const tx = clamp(target[0] - focus[0] * S, vw - PW * S, 0);
    const ty = clamp(target[1] - focus[1] * S, vh - PH * S, 0);
    el.style.transform = `translate(${tx.toFixed(2)}px,${ty.toFixed(2)}px) scale(${S.toFixed(5)})`;
    return { S, map: (x: number, y: number) => [tx + x * S, ty + y * S] };
  }

  let curHand = 0;
  let curPhone = 1;
  function frame() {
    const total = track.offsetHeight - innerHeight;
    const p = clamp(-track.getBoundingClientRect().top / total, 0, 1);
    const vw = innerWidth;
    const vh = innerHeight;
    const nar = narrow.matches;

    // 1) Wide shot + words
    place(wide, FOCUS_WIDE, 1 + 0.16 * seg(p, 0, 0.2), vw, vh, [vw / 2, vh / 2]);
    words.forEach((w, i) => {
      const inn = i === 0 ? 1 : seg(p, i * 0.045 - 0.01, i * 0.045 + 0.03);
      const out = seg(p, 0.15, 0.19);
      w.style.opacity = (inn * (1 - out)).toFixed(3);
    });
    hint.style.opacity = (1 - seg(p, 0, 0.04)).toFixed(3);
    shadeB.style.setProperty("--sb", (1 - seg(p, 0.17, 0.22)).toFixed(3));

    // 2) Close-up; the app turns on in the in-hand screen
    const cut = seg(p, 0.17, 0.23);
    close.style.opacity = cut.toFixed(3);
    wide.style.opacity = (1 - cut * 0.999).toFixed(3);
    const pl = nar
      ? place(close, FOCUS_CLOSE, 1.08 + 0.08 * seg(p, 0.2, 0.46), vw, vh, [vw / 2, vh * 0.42])
      : place(close, FOCUS_CLOSE, 1.04 + 0.16 * seg(p, 0.2, 0.46), vw, vh, [vw * 0.58, vh / 2]);
    inhand.style.opacity = seg(p, 0.22, 0.27).toFixed(3);
    shadeL.style.setProperty("--sl", (seg(p, 0.28, 0.34) * (nar ? 0.7 : 1)).toFixed(3));
    copy1.style.opacity = (seg(p, 0.3, 0.36) * (1 - seg(p, 0.58, 0.63))).toFixed(3);
    const hs = p < 0.4 ? 0 : 1;
    if (hs !== curHand) {
      handImgs.forEach((im) => im.classList.toggle("on", +im.dataset.s! === hs));
      curHand = hs;
    }

    // 3) Full bleed → rounded card
    const k = seg(p, 0.44, 0.58);
    bg.style.setProperty("--ct", ((k * (nar ? 12 : 14) * vh) / 100).toFixed(1) + "px");
    bg.style.setProperty("--cb", ((k * (nar ? 3 : 14) * vh) / 100).toFixed(1) + "px");
    bg.style.setProperty("--cs", ((k * (nar ? 4 : 6) * vw) / 100).toFixed(1) + "px");
    bg.style.setProperty("--cr", (k * 36).toFixed(1) + "px");
    nav.classList.toggle("over", k <= 0.3);

    // 4) Phone lifts out of the hand into the hero; hero fades in
    const hand = seg(p, 0.63, 0.82);
    const fade = seg(p, 0.62, 0.67);
    const pc = pl.map(PHONE_C[0], PHONE_C[1]);
    const photoW =
      (((Math.hypot(Q[1][0] - Q[0][0], Q[1][1] - Q[0][1]) +
        Math.hypot(Q[2][0] - Q[3][0], Q[2][1] - Q[3][1])) /
        2) *
        pl.S) /
      0.93 *
      1.09;
    const finalW = nar
      ? Math.min(vw * 0.42, 190, vh * 0.22)
      : Math.min(vw * 0.23, 310, vh * 0.37);
    const fcx = nar ? vw / 2 : vw * 0.68;
    const fcy = nar ? vh * 0.8 : vh * 0.53;
    const wpx = lerp(photoW, finalW, hand);
    const x = lerp(pc[0], fcx, hand);
    const y = lerp(pc[1], fcy, hand);
    iphone.style.setProperty("--w", wpx.toFixed(1) + "px");
    iphone.style.setProperty("--rz", lerp(-14, 1, hand).toFixed(2) + "deg");
    iphone.style.setProperty("--rx", lerp(9, 6, hand).toFixed(2) + "deg");
    iphone.style.setProperty("--ry", lerp(0, -14, hand).toFixed(2) + "deg");
    phone.style.transform = `translate(${(x - wpx / 2).toFixed(1)}px,${(y - (wpx * 149.6) / 71.5 / 2).toFixed(1)}px)`;
    const lifted = p >= 0.62;
    phone.style.opacity = lifted ? (nar ? (1 - seg(p, 0.84, 0.9)).toFixed(3) : "1") : "0";
    inhand.style.visibility = lifted ? "hidden" : "visible";
    bg.style.opacity = (1 - fade).toFixed(3);
    const ps = p < 0.78 ? 1 : 2;
    if (ps !== curPhone) {
      phoneImgs.forEach((im) => im.classList.toggle("on", +im.dataset.s! === ps));
      curPhone = ps;
    }
    const h = seg(p, 0.8, 0.9);
    hero.style.opacity = h.toFixed(3);
    hero.classList.toggle("live", h > 0.5);
    hero.style.transform = nar
      ? `translateY(${((1 - h) * 20).toFixed(1)}px)`
      : `translateY(calc(-50% + ${((1 - h) * 20).toFixed(1)}px))`;
  }

  return onScrollFrame(frame);
}

/**
 * Right-hand section rail: highlights where you are, turns white over the
 * photo and the navy trust section, and scrolls to a section on click.
 */
function rail(): Cleanup {
  const railEl = document.getElementById("rail");
  const track = document.getElementById("ixTrack");
  const nav = document.getElementById("nav");
  const trust = document.getElementById("trust");
  if (!railEl || !track || !nav || !trust) return () => {};
  const btns = Array.from(railEl.querySelectorAll<HTMLButtonElement>("button"));

  function target(go: string) {
    if (go.startsWith("intro:")) {
      const total = track!.offsetHeight - innerHeight;
      return track!.getBoundingClientRect().top + scrollY + total * parseFloat(go.slice(6));
    }
    const el = document.getElementById(go)!;
    return el.getBoundingClientRect().top + scrollY - (go === "about" ? 0 : 68);
  }

  const clicks = btns.map((b) => {
    const onClick = () =>
      scrollTo({ top: target(b.dataset.go!), behavior: reducedMotion() ? "auto" : "smooth" });
    b.addEventListener("click", onClick);
    return () => b.removeEventListener("click", onClick);
  });

  let cur = -1;
  function update() {
    const total = track!.offsetHeight - innerHeight;
    const ip = -track!.getBoundingClientRect().top / total;
    let idx: number;
    if (ip < 1) {
      idx = ip < 0.3 ? 0 : ip < 0.8 ? 1 : 2;
    } else {
      idx = 2;
      const mid = innerHeight * 0.5;
      btns.forEach((b, i) => {
        if (i < 3) return;
        const el = document.getElementById(b.dataset.go!);
        if (el && el.getBoundingClientRect().top <= mid) idx = i;
      });
    }
    if (idx !== cur) {
      btns.forEach((b, i) => {
        b.classList.toggle("on", i === idx);
        if (i === idx) b.setAttribute("aria-current", "true");
        else b.removeAttribute("aria-current");
      });
      cur = idx;
    }
    const r = trust!.getBoundingClientRect();
    const overTrust = r.top < innerHeight * 0.5 && r.bottom > innerHeight * 0.5;
    railEl!.classList.toggle("light", nav!.classList.contains("over") || overTrust);
  }

  const stop = onScrollFrame(update);
  return () => {
    stop();
    clicks.forEach((off) => off());
  };
}

/**
 * Requester / worker sections: scroll position picks the open step and swaps
 * the phone screen to match. Clicking a step scrolls to it.
 */
function features(): Cleanup {
  const cleanups = Array.from(document.querySelectorAll<HTMLElement>("[data-feat]")).map(
    (sec) => {
      const items = Array.from(sec.querySelectorAll<HTMLElement>(".feat-item"));
      const bases = Array.from(sec.querySelectorAll<HTMLElement>(".scr .base"));
      const track = sec.querySelector<HTMLElement>(".feat-track")!;
      let cur = -1;

      function set(i: number) {
        if (i === cur) return;
        sec.style.setProperty("--dir", String(i > cur ? 1 : -1));
        cur = i;
        const name = items[i].dataset.screen;
        items.forEach((el, k) => {
          el.classList.toggle("is-on", k === i);
          el.querySelector(".feat-head")!.setAttribute("aria-expanded", String(k === i));
        });
        bases.forEach((img) => {
          if (img.dataset.name === name) {
            img.classList.remove("is-out");
            img.classList.add("is-on");
          } else if (img.classList.contains("is-on")) {
            img.classList.remove("is-on");
            img.classList.add("is-out");
          } else {
            img.classList.remove("is-out");
          }
        });
      }

      const clicks = items.map((it, k) => {
        const head = it.querySelector(".feat-head")!;
        const onClick = () => {
          const top = track.getBoundingClientRect().top + scrollY;
          const total = track.offsetHeight - innerHeight;
          scrollTo({
            top: top + (total * (k + 0.5)) / items.length,
            behavior: reducedMotion() ? "auto" : "smooth",
          });
        };
        head.addEventListener("click", onClick);
        return () => head.removeEventListener("click", onClick);
      });

      set(0);
      const stop = onScrollFrame(() => {
        const r = track.getBoundingClientRect();
        const total = r.height - innerHeight;
        const p = Math.min(Math.max(-r.top / total, 0), 0.9999);
        set(Math.floor(p * items.length));
      });
      return () => {
        stop();
        clicks.forEach((off) => off());
      };
    },
  );
  return () => cleanups.forEach((off) => off());
}

/** Wires up the home page's scroll-driven motion. Renders nothing. */
export default function HomeEffects() {
  useEffect(() => {
    const cleanups = [reveal(), intro(), rail(), features()];
    return () => cleanups.forEach((off) => off());
  }, []);

  return null;
}
