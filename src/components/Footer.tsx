/* eslint-disable @next/next/no-img-element -- sized entirely by site.css */
import { Link } from "@/i18n/navigation";

export default function Footer() {
  return (
    <footer>
      <div className="wrap">
        <div className="foot">
          <div>
            <Link href="/" className="brand">
              <img src="/icon.png" alt="" width={32} height={32} />
              지게꾼
            </Link>
            <address>
              주식회사 지게꾼랩스 · 대표 유준형
              <br />
              서울특별시 중구 동호로14길 19, 4층 454호 (신당동)
              <br />
              사업자등록번호 315-88-03756 · 통신판매업신고 2026-서울중구-847
              <br />
              전화 <a href="tel:01049668305">010-4966-8305</a> · 이메일{" "}
              <a href="mailto:info@jigekun.com">info@jigekun.com</a>
            </address>
          </div>
          <nav className="foot-links" aria-label="정책 및 고객지원">
            <Link href="/terms">이용약관</Link>
            <Link href="/privacy">
              <b>개인정보처리방침</b>
            </Link>
            <Link href="/refund-policy">환불정책</Link>
            <Link href="/delete-account">계정 삭제</Link>
            <a href="mailto:info@jigekun.com">문의하기</a>
          </nav>
        </div>
        <p className="copy">
          © {new Date().getFullYear()} 지게꾼랩스. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
