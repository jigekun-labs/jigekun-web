/* eslint-disable @next/next/no-img-element -- sized entirely by site.css */
import NavScroll from "@/components/NavScroll";

/**
 * Site header. On the home page it starts in the transparent `over` state that
 * sits on the intro photo; the intro script takes over that class from there.
 * Elsewhere the section links point back at the home page.
 */
export default function Header({ home = false }: { home?: boolean }) {
  const base = home ? "" : "/ko";

  return (
    <header className={home ? "nav over" : "nav"} id="nav">
      <div className="wrap">
        <a href={home ? "#top" : "/ko"} className="brand" aria-label="지게꾼 홈">
          <img src="/icon.png" alt="" width={32} height={32} />
          지게꾼
        </a>
        <nav className="nav-links" aria-label="주요 메뉴">
          <a href={`${base}#requester`}>
            <span className="dot" style={{ background: "var(--req)" }} />
            요청자
          </a>
          <a href={`${base}#worker`}>
            <span className="dot" style={{ background: "var(--wrk)" }} />
            작업자
          </a>
        </nav>
        <a className="nav-cta" href={`${base}#download`}>
          앱 다운로드
        </a>
      </div>
      <NavScroll />
    </header>
  );
}
