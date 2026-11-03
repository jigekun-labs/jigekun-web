/* eslint-disable @next/next/no-img-element -- every image here is sized and
   animated by site.css (stacked phone screens, the 1376×768 intro photos),
   which next/image's wrapper and srcset would fight. */
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import IPhone from "@/components/home/IPhone";
import HomeEffects from "@/components/home/HomeEffects";

const APP_STORE_URL =
  "https://apps.apple.com/kr/app/%EC%A7%80%EA%B2%8C%EA%BE%BC/id6763435966";
const PLAY_STORE_URL =
  "https://play.google.com/store/apps/details?id=kr.co.jigekun.labs";

type Step = { screen: string; alt: string; title: string; body: string };

const REQUESTER_STEPS: Step[] = [
  {
    screen: "r-chat",
    alt: "지게꾼 Agent 대화로 요청하는 화면",
    title: "한마디로 시작해요",
    body: "“내일 성수 팝업에 3명 필요해요”처럼 장소·시간·인원만 말하면 요청서가 만들어져요. 직접 조건을 골라도 좋아요.",
  },
  {
    screen: "r-assign",
    alt: "배정 중 화면: 4명 중 2명 확정",
    title: "확정 인원을 바로 봐요",
    body: "배정이 진행되는 동안 몇 명 중 몇 명이 확정됐는지, 남은 인원을 찾고 있는지 바로 보여드려요.",
  },
  {
    screen: "r-moving",
    alt: "작업자 이동 중 화면: 배정, 출발, 도착 단계",
    title: "도착까지 실시간으로 봐요",
    body: "배정, 출발, 도착까지 작업자별 이동 상태와 도착 예정 시간을 보여드려요.",
  },
  {
    screen: "r-pro",
    alt: "담당 프로와 1:1 대화 화면",
    title: "현장은 담당 프로와 조율해요",
    body: "프로가 배정된 현장은 담당 프로에게 요청 사항을 전하면 팀원들과 소통하고 현장을 조율해요.",
  },
];

const WORKER_STEPS: Step[] = [
  {
    screen: "w-nearby",
    alt: "내 주변 호출 화면: 가까운 순으로 정렬된 일자리",
    title: "가까운 호출부터 봐요",
    body: "현재 위치와 거리 안에서 할 수 있는 일을 보여드려요. 가까운 순, 보수 높은 순, 빠른 날짜로 골라봐요.",
  },
  {
    screen: "w-training",
    alt: "출근 준비 화면: 집결 위치와 안내 자료",
    title: "확정된 일만 준비해요",
    body: "일이 확정되면 집결 위치와 준비물, 짧은 안내 자료를 확인하고 길찾기로 바로 출발해요.",
  },
  {
    screen: "w-settle",
    alt: "작업 완료 화면: 받을 예정 금액과 입금 예정일",
    title: "받을 금액을 바로 확인해요",
    body: "작업이 끝나면 받을 예정 금액과 입금 예정일이 바로 보여요.",
  },
  {
    screen: "w-history",
    alt: "내 완료 이력 화면",
    title: "완료한 일이 이력으로 쌓여요",
    body: "어떤 일을 언제 몇 시간 했는지, 정산 금액과 함께 내 완료 이력에 차곡차곡 남아요.",
  },
];

const CATEGORIES = [
  { img: "transport", alt: "엘리베이터와 트럭 사이로 박스를 나르는 작업자", title: "운반·물류", body: "박스 운반부터 차량 상차까지" },
  { img: "event", alt: "행사장 부스를 설치하는 작업자", title: "행사 운영", body: "설치, 안내, 현장의 마무리" },
  { img: "retail", alt: "진열과 계산대를 준비하는 매장 팀", title: "매장·리테일", body: "진열과 재고, 매장 속 짧은 일" },
  { img: "filming", alt: "카페 장면을 촬영하는 제작진과 보조출연자", title: "촬영·콘텐츠", body: "보조출연과 촬영 현장 지원" },
  { img: "customer", alt: "방문객을 안내하는 고객 응대 작업자", title: "고객 응대", body: "처음 만나는 사람을 반갑게" },
  { img: "technical", alt: "장비를 다루는 작업자", title: "전문·장비", body: "장비를 다루는 경험이 있다면" },
];

const TRUST = [
  { icon: "i-shield", title: "결제는 미리, 안전하게", body: "요청할 때 카드로 선결제하고, 결제 내역은 요청별로 확인해요. 결제는 토스페이먼츠로 처리돼요." },
  { icon: "i-star", title: "서로 남기는 후기", body: "작업이 끝나면 요청자는 함께한 사람별로, 작업자는 업체에 후기를 남겨요." },
  { icon: "i-history", title: "확인된 이력과 신뢰도", body: "스스로 입력한 경험과 플랫폼에서 완료한 이력을 구분해서 보여드려요." },
];

// Right-hand rail targets: "intro:<p>" is a point within the intro's scroll.
const RAIL = [
  { go: "intro:0", label: "시작" },
  { go: "intro:.34", label: "한마디면 끝나는 요청" },
  { go: "intro:.93", label: "필요한 일손" },
  { go: "about", label: "지게꾼 소개" },
  { go: "requester", label: "요청자" },
  { go: "worker", label: "작업자" },
  { go: "categories", label: "업무 카테고리" },
  { go: "trust", label: "믿고 맡길 수 있게" },
  { go: "download", label: "앱 다운로드" },
];

const delay = (i: number) => (i % 3 ? ` d${i % 3}` : "");

function Icons() {
  return (
    <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden="true">
      <symbol id="i-apple" viewBox="0 0 24 24">
        <path fill="currentColor" d="M16.4 12.6c0-2.4 2-3.6 2.1-3.7-1.1-1.7-2.9-1.9-3.5-1.9-1.5-.2-2.9.9-3.7.9-.8 0-1.9-.9-3.2-.8-1.6 0-3.1 1-4 2.4-1.7 3-.4 7.3 1.2 9.7.8 1.2 1.8 2.5 3 2.4 1.2 0 1.7-.8 3.2-.8s1.9.8 3.2.8 2.1-1.2 2.9-2.4c.9-1.3 1.3-2.6 1.3-2.7 0 0-2.5-1-2.5-3.9zM14 5.5c.7-.8 1.1-1.9 1-3-1 0-2.1.7-2.8 1.5-.6.7-1.2 1.8-1 2.9 1 .1 2.1-.6 2.8-1.4z" />
      </symbol>
      <symbol id="i-play" viewBox="0 0 24 24">
        <path fill="currentColor" d="M4.2 2.6c-.3.3-.4.7-.4 1.2v16.4c0 .5.1.9.4 1.2l9.2-9.4-9.2-9.4zm10.4 8.2 2.6-2.6L6 1.9c-.4-.2-.8-.3-1.1-.2l9.7 9.1zm0 2.4-9.7 9.1c.3.1.7 0 1.1-.2l11.2-6.3-2.6-2.6zm6.3-2.6-2.7-1.5-2.8 2.9 2.8 2.9 2.7-1.5c.9-.5.9-2.3 0-2.8z" />
      </symbol>
      <symbol id="i-shield" viewBox="0 0 24 24">
        <path d="M12 3l8 3v6c0 4.5-3.4 8.3-8 9-4.6-.7-8-4.5-8-9V6l8-3z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
        <path d="M8.5 12l2.5 2.5 4.5-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </symbol>
      <symbol id="i-star" viewBox="0 0 24 24">
        <path d="M12 3.5l2.6 5.4 5.9.8-4.3 4.1 1 5.8L12 16.8l-5.2 2.8 1-5.8-4.3-4.1 5.9-.8L12 3.5z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      </symbol>
      <symbol id="i-history" viewBox="0 0 24 24">
        <rect x="4" y="3.5" width="16" height="17" rx="3" fill="none" stroke="currentColor" strokeWidth="2" />
        <path d="M8 8.5h8M8 12.5h8M8 16.5h5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </symbol>
    </svg>
  );
}

function StepList({ steps }: { steps: Step[] }) {
  return (
    <ol className="feat-list">
      {steps.map((s, i) => (
        <li key={s.screen} className={i === 0 ? "feat-item is-on" : "feat-item"} data-screen={s.screen}>
          <button type="button" className="feat-head" aria-expanded={i === 0}>
            <span className="no">{i + 1}</span>
            {s.title}
          </button>
          <div className="feat-body">
            <div>
              <p>{s.body}</p>
            </div>
          </div>
        </li>
      ))}
    </ol>
  );
}

function StepPhone({ steps, flip }: { steps: Step[]; flip?: boolean }) {
  return (
    <div className="feat-stage">
      <IPhone flip={flip}>
        {steps.map((s, i) => (
          <img
            key={s.screen}
            className={i === 0 ? "base is-on" : "base"}
            data-name={s.screen}
            src={`/assets/screens/${s.screen}.svg`}
            alt={s.alt}
            width={402}
            height={874}
            loading="lazy"
          />
        ))}
      </IPhone>
      <p className="caption">화면 예시 · 데모 데이터</p>
    </div>
  );
}

export default function Home() {
  return (
    <>
      <Icons />
      <Header home />

      <main id="top">
        {/* Intro + hero: one screen pinned for 700vh of scroll. Wide office
            shot → close-up of the phone in hand (the app lights up) → shrinks
            to a rounded card → the phone lifts out into the hero. */}
        <section className="ix" id="intro" aria-labelledby="hero-title">
          <div className="ix-track" id="ixTrack">
            <div className="ix-stage">
              <div className="ix-bg" id="ixBg">
                <div className="ix-shot" id="ixWide">
                  <img
                    className="ix-photo"
                    src="/assets/office-wide.webp"
                    alt="이사 박스가 잔뜩 쌓인 사무실에서 휴대폰으로 일손을 부르는 담당자"
                    width={1376}
                    height={768}
                    fetchPriority="high"
                  />
                </div>
                <div className="ix-shot" id="ixClose" style={{ opacity: 0 }}>
                  <img
                    className="ix-photo"
                    src="/assets/office-close.webp"
                    alt="박스가 쌓인 사무실에서 두 손으로 휴대폰을 들고 지게꾼으로 인력을 요청하는 모습"
                    width={1376}
                    height={768}
                  />
                  <div className="ix-shade-l" id="ixShadeL" />
                  <div className="ix-inhand" id="ixInhand">
                    <div className="ix-screen" id="ixHandScreen">
                      <img className="on" data-s="0" src="/assets/screens/r-chat.svg" alt="" width={402} height={874} />
                      <img data-s="1" src="/assets/screens/r-assign.svg" alt="" width={402} height={874} />
                    </div>
                  </div>
                </div>
                <div className="ix-shade-b" id="ixShadeB" />
                <p className="ix-words" id="ixWords">
                  <span>현장의 일손부터</span>
                  <span>정산까지</span>
                  <span>지게꾼 하나로</span>
                </p>
                <div className="ix-copy1" id="ixCopy1">
                  <h2>
                    한마디면
                    <br />
                    끝나는 요청
                  </h2>
                  <p>
                    장소·시간·인원만 말하면 요청서가 만들어지고,
                    <br />
                    확정된 인원과 도착까지 앱에서 바로 확인해요.
                  </p>
                </div>
                <p className="ix-hint" id="ixHint">
                  아래로 스크롤해 보세요
                </p>
              </div>

              {/* The hero that appears once the intro finishes */}
              <div className="hero ix-hero" id="ixHero">
                <p className="eyebrow">현장 단기 인력 매칭</p>
                <h1 id="hero-title">
                  필요한 일손,
                  <br />
                  <span className="hl">한마디면</span>
                  <br />
                  충분해요.
                </h1>
                <p className="lead">
                  업체는 대화로 인력을 요청하고, 작업자는 가까운 일을 골라요. 요청부터 현장, 정산까지 지게꾼
                  하나로 이어져요.
                </p>
                <div className="roles">
                  <a className="role role--req" href="#requester">
                    인력이 필요해요 <small>요청자</small>
                  </a>
                  <a className="role role--wrk" href="#worker">
                    일하고 싶어요 <small>작업자</small>
                  </a>
                </div>
                <div className="stores">
                  <a href={APP_STORE_URL} target="_blank" rel="noopener noreferrer">
                    <svg aria-hidden="true">
                      <use href="#i-apple" />
                    </svg>
                    App Store
                  </a>
                  <a href={PLAY_STORE_URL} target="_blank" rel="noopener noreferrer">
                    <svg aria-hidden="true">
                      <use href="#i-play" />
                    </svg>
                    Google Play
                  </a>
                </div>
              </div>

              <div className="ix-phone" id="ixPhone">
                <IPhone id="ixIphone">
                  <img className="on" data-s="1" src="/assets/screens/r-assign.svg" alt="배정 중 화면" width={402} height={874} />
                  <img
                    data-s="2"
                    src="/assets/screens/r-home.svg"
                    alt="지게꾼 요청자 홈 화면: 어떤 도움이 필요하세요?"
                    width={402}
                    height={874}
                  />
                </IPhone>
              </div>
            </div>
          </div>
        </section>

        <section className="manifesto" id="about" aria-label="지게꾼 소개">
          <div className="wrap">
            <p className="rv">
              <b>지게꾼</b>은 짧은 일손이 필요한 <span className="r">업체</span>와, 가까운 곳에서 일하고 싶은{" "}
              <span className="w">작업자</span>를 <b>현장에서 바로</b> 이어줘요.
            </p>
          </div>
        </section>

        {/* Requester: scrolling opens each step and flips the phone to its screen */}
        <section className="feat feat--req" id="requester" aria-labelledby="req-title" data-feat>
          <div className="feat-track" style={{ "--n": REQUESTER_STEPS.length } as React.CSSProperties}>
            <div className="feat-sticky">
              <div className="wrap feat-grid">
                <div className="feat-copy">
                  <p className="kicker">
                    <i />
                    요청자 · 업체
                  </p>
                  <h2 id="req-title" className="h2">
                    바쁜 현장일수록
                    <br />
                    요청은 <em>짧게.</em>
                  </h2>
                  <StepList steps={REQUESTER_STEPS} />
                </div>
                <StepPhone steps={REQUESTER_STEPS} flip />
              </div>
            </div>
          </div>
        </section>

        <section className="feat feat--wrk" id="worker" aria-labelledby="wrk-title" data-feat>
          <div className="feat-track" style={{ "--n": WORKER_STEPS.length } as React.CSSProperties}>
            <div className="feat-sticky">
              <div className="wrap feat-grid">
                <StepPhone steps={WORKER_STEPS} />
                <div className="feat-copy">
                  <p className="kicker">
                    <i />
                    작업자
                  </p>
                  <h2 id="wrk-title" className="h2">
                    가까운 일부터,
                    <br />
                    <em>가능한 날만.</em>
                  </h2>
                  <StepList steps={WORKER_STEPS} />
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="sec" id="categories" aria-labelledby="cat-title">
          <div className="wrap">
            <h2 id="cat-title" className="h2 rv">
              어떤 현장이든,
              <br />
              짧은 일손이 필요할 때.
            </h2>
            <p className="sub rv d1">직업명보다 실제로 할 일을 먼저 보여드려요.</p>
            <div className="cat-grid">
              {CATEGORIES.map((c, i) => (
                <article key={c.img} className={`cat rv${delay(i)}`}>
                  <figure>
                    <img src={`/assets/${c.img}.webp`} alt={c.alt} width={1536} height={1024} loading="lazy" />
                  </figure>
                  <h3>{c.title}</h3>
                  <p>{c.body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="sec trust" id="trust" aria-labelledby="trust-title">
          <div className="wrap">
            <div>
              <h2 id="trust-title" className="h2 rv d1">
                처음 만나는 현장도
                <br />
                믿고 맡길 수 있게.
              </h2>
              <ul className="trust-list">
                {TRUST.map((t, i) => (
                  <li key={t.icon} className={`rv d${i + 1}`}>
                    <span className="ico">
                      <svg width="22" height="22" aria-hidden="true">
                        <use href={`#${t.icon}`} />
                      </svg>
                    </span>
                    <div>
                      <h3>{t.title}</h3>
                      <p>{t.body}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
            <div className="single stage tilt rv rise d2">
              <div className="glow" aria-hidden="true" />
              <IPhone flip>
                <img
                  src="/assets/screens/w-card.svg"
                  alt="작업자 프로필 카드: 신뢰도 점수와 완료 횟수"
                  width={402}
                  height={874}
                  loading="lazy"
                />
              </IPhone>
            </div>
          </div>
        </section>

        <section className="sec final" id="download" aria-labelledby="dl-title">
          <div className="wrap">
            <img className="mark rv" src="/icon.png" alt="" width={88} height={88} />
            <h2 id="dl-title" className="h2 rv d1">
              오늘 필요한 일손,
              <br />
              지게꾼에서.
            </h2>
            <p className="sub rv d2">앱을 설치하고 시작할 때 역할을 고르면 돼요.</p>
            <div className="store-btns rv d3">
              <a className="store-btn" href={APP_STORE_URL} target="_blank" rel="noopener noreferrer">
                <svg aria-hidden="true">
                  <use href="#i-apple" />
                </svg>
                App Store에서 받기
              </a>
              <a className="store-btn" href={PLAY_STORE_URL} target="_blank" rel="noopener noreferrer">
                <svg aria-hidden="true">
                  <use href="#i-play" />
                </svg>
                Google Play에서 받기
              </a>
            </div>
          </div>
        </section>
      </main>

      {/* Section rail: lights up where you are; click to jump there */}
      <nav className="rail light" id="rail" aria-label="페이지 내 위치">
        {RAIL.map((r) => (
          <button key={r.go} type="button" data-go={r.go}>
            <i />
            <span>{r.label}</span>
          </button>
        ))}
      </nav>

      <Footer />
      <HomeEffects />
    </>
  );
}
