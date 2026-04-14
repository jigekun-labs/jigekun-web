import Image from "next/image";
import { getTranslations } from "next-intl/server";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

async function HeroSection() {
  const t = await getTranslations("Hero");

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
      <div className="absolute inset-0 bg-gradient-to-br from-[var(--primary-light)] via-white to-white" />
      <div className="absolute top-20 right-0 w-[500px] h-[500px] bg-[var(--primary)] opacity-5 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-[var(--accent)] opacity-5 rounded-full blur-3xl" />

      <div className="relative max-w-7xl mx-auto px-6 py-24 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        <div className="animate-fade-in-up">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[var(--primary)]/10 text-[var(--primary)] text-sm font-medium mb-6">
            <span className="w-2 h-2 rounded-full bg-[var(--primary)] animate-pulse" />
            {t("badge")}
          </div>

          <h1 className="text-5xl md:text-6xl font-bold leading-tight tracking-tight text-[var(--gray-900)]">
            {t("title1")}
            <br />
            {t("title2")}
            <br />
            <span className="text-[var(--primary)]">{t("title3")}</span>
          </h1>

          <p className="mt-6 text-lg text-[var(--gray-600)] max-w-lg leading-relaxed">
            {t("description")}
          </p>

          <div className="mt-10 flex flex-col sm:flex-row gap-4">
            <a
              href="#download"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 text-base font-semibold text-white bg-[var(--primary)] rounded-2xl hover:bg-[var(--primary-dark)] transition-all hover:shadow-lg hover:shadow-blue-500/25"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
              </svg>
              {t("appStore")}
            </a>
            <a
              href="#download"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 text-base font-semibold text-[var(--gray-900)] bg-white border-2 border-[var(--gray-200)] rounded-2xl hover:border-[var(--primary)] hover:text-[var(--primary)] transition-all"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M3.609 1.814L13.792 12 3.61 22.186a.996.996 0 01-.61-.92V2.734a1 1 0 01.609-.92zm10.89 10.893l2.302 2.302-10.937 6.333 8.635-8.635zm3.199-3.199l2.302 2.302a1 1 0 010 1.38l-2.302 2.302L15.2 12.7l2.498-3.192zM5.864 2.658L16.8 8.99l-2.302 2.302L5.864 2.658z" />
              </svg>
              {t("googlePlay")}
            </a>
          </div>
        </div>

        <div className="hidden lg:flex justify-center animate-fade-in-up-delay">
          <div className="relative flex items-center gap-6">
            <div className="animate-float rounded-[2.5rem] border-[6px] border-gray-900 shadow-2xl overflow-hidden bg-black">
              <Image
                src="/hero-screen-1.png"
                alt="GGUN App Splash Screen"
                width={240}
                height={520}
                className="object-contain"
                priority
              />
            </div>
            <div className="animate-float rounded-[2.5rem] border-[6px] border-gray-900 shadow-2xl overflow-hidden bg-black" style={{ animationDelay: "0.3s" }}>
              <Image
                src="/hero-screen-2.png"
                alt="GGUN App Role Selection Screen"
                width={240}
                height={520}
                className="object-contain"
                priority
              />
            </div>
            <div className="absolute -top-4 -right-4 w-24 h-24 bg-[var(--accent)] opacity-20 rounded-full blur-xl" />
            <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-[var(--primary)] opacity-10 rounded-full blur-xl" />
          </div>
        </div>
      </div>

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--gray-400)" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
        </svg>
      </div>
    </section>
  );
}

const featureIcons = [
  <svg key="loc" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" /></svg>,
  <svg key="rel" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" /></svg>,
  <svg key="chat" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" /></svg>,
  <svg key="pay" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" /></svg>,
  <svg key="notif" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" /></svg>,
  <svg key="map" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z" /></svg>,
];

const featureKeys = [
  { title: "locationMatching", desc: "locationMatchingDesc" },
  { title: "reliabilityScoring", desc: "reliabilityScoringDesc" },
  { title: "teamCoordination", desc: "teamCoordinationDesc" },
  { title: "seamlessPayments", desc: "seamlessPaymentsDesc" },
  { title: "realTimeNotifications", desc: "realTimeNotificationsDesc" },
  { title: "mapIntegration", desc: "mapIntegrationDesc" },
];

async function FeaturesSection() {
  const t = await getTranslations("Features");

  return (
    <section id="features" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <p className="text-sm font-semibold text-[var(--primary)] uppercase tracking-wider mb-3">
            {t("label")}
          </p>
          <h2 className="text-4xl font-bold text-[var(--gray-900)] tracking-tight">
            {t("title")}
          </h2>
          <p className="mt-4 text-lg text-[var(--gray-500)]">
            {t("subtitle")}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {featureKeys.map((f, i) => (
            <div
              key={i}
              className="group p-8 rounded-2xl border border-[var(--gray-100)] hover:border-[var(--primary)]/30 hover:shadow-lg hover:shadow-blue-500/5 transition-all duration-300"
            >
              <div className="w-14 h-14 rounded-xl bg-[var(--primary-light)] text-[var(--primary)] flex items-center justify-center mb-5 group-hover:bg-[var(--primary)] group-hover:text-white transition-colors duration-300">
                {featureIcons[i]}
              </div>
              <h3 className="text-lg font-semibold text-[var(--gray-900)] mb-2">
                {t(f.title)}
              </h3>
              <p className="text-sm text-[var(--gray-500)] leading-relaxed">
                {t(f.desc)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

async function HowItWorksSection() {
  const t = await getTranslations("HowItWorks");

  const steps = [
    { num: "01", title: t("step1Title"), desc: t("step1Desc") },
    { num: "02", title: t("step2Title"), desc: t("step2Desc") },
    { num: "03", title: t("step3Title"), desc: t("step3Desc") },
    { num: "04", title: t("step4Title"), desc: t("step4Desc") },
  ];

  return (
    <section id="how-it-works" className="py-24 bg-[var(--gray-50)]">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <p className="text-sm font-semibold text-[var(--primary)] uppercase tracking-wider mb-3">
            {t("label")}
          </p>
          <h2 className="text-4xl font-bold text-[var(--gray-900)] tracking-tight">
            {t("title")}
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((s, i) => (
            <div key={i} className="relative">
              <span className="text-6xl font-black text-[var(--primary)]/10">
                {s.num}
              </span>
              <h3 className="mt-2 text-xl font-semibold text-[var(--gray-900)]">
                {s.title}
              </h3>
              <p className="mt-3 text-sm text-[var(--gray-500)] leading-relaxed">
                {s.desc}
              </p>
              {i < steps.length - 1 && (
                <div className="hidden lg:block absolute top-8 right-0 translate-x-1/2 text-[var(--gray-200)]">
                  <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

async function EmployersSection() {
  const t = await getTranslations("Employers");

  const benefits = [
    t("benefit1"), t("benefit2"), t("benefit3"), t("benefit4"), t("benefit5"),
  ];

  return (
    <section id="employers" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        <div>
          <p className="text-sm font-semibold text-[var(--primary)] uppercase tracking-wider mb-3">
            {t("label")}
          </p>
          <h2 className="text-4xl font-bold text-[var(--gray-900)] tracking-tight">
            {t("title")}
          </h2>
          <p className="mt-4 text-lg text-[var(--gray-500)] leading-relaxed">
            {t("description")}
          </p>

          <ul className="mt-8 space-y-4">
            {benefits.map((item, i) => (
              <li key={i} className="flex items-start gap-3">
                <svg className="w-5 h-5 text-[var(--primary)] mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                </svg>
                <span className="text-[var(--gray-600)]">{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex justify-center">
          <div className="w-full max-w-sm bg-[var(--gray-50)] rounded-3xl p-8 border border-[var(--gray-100)]">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-[var(--primary-light)] flex items-center justify-center">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
              </div>
              <span className="font-semibold text-[var(--gray-900)]">{t("cardTitle")}</span>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-[var(--gray-400)] uppercase tracking-wider">{t("jobType")}</label>
                <div className="mt-1 h-10 bg-white rounded-lg border border-[var(--gray-200)] flex items-center px-3 text-sm text-[var(--gray-600)]">{t("jobTypeValue")}</div>
              </div>
              <div>
                <label className="text-xs text-[var(--gray-400)] uppercase tracking-wider">{t("workersNeeded")}</label>
                <div className="mt-1 h-10 bg-white rounded-lg border border-[var(--gray-200)] flex items-center px-3 text-sm text-[var(--gray-600)]">{t("workersNeededValue")}</div>
              </div>
              <div>
                <label className="text-xs text-[var(--gray-400)] uppercase tracking-wider">{t("hourlyRate")}</label>
                <div className="mt-1 h-10 bg-white rounded-lg border border-[var(--gray-200)] flex items-center px-3 text-sm text-[var(--gray-600)]">{t("hourlyRateValue")}</div>
              </div>
              <button className="w-full h-12 bg-[var(--primary)] text-white rounded-xl font-semibold text-sm hover:bg-[var(--primary-dark)] transition-colors">
                {t("findWorkers")}
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

async function WorkersSection() {
  const t = await getTranslations("Workers");

  const jobs = [
    { type: t("job1Type"), location: t("job1Location"), pay: t("job1Pay"), time: t("job1Time"), spots: t("job1Spots") },
    { type: t("job2Type"), location: t("job2Location"), pay: t("job2Pay"), time: t("job2Time"), spots: t("job2Spots") },
    { type: t("job3Type"), location: t("job3Location"), pay: t("job3Pay"), time: t("job3Time"), spots: t("job3Spots") },
  ];

  const benefits = [
    t("benefit1"), t("benefit2"), t("benefit3"), t("benefit4"), t("benefit5"),
  ];

  return (
    <section id="workers" className="py-24 bg-[var(--gray-50)]">
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        <div className="order-2 lg:order-1 flex justify-center">
          <div className="w-full max-w-sm space-y-4">
            {jobs.map((job, i) => (
              <div key={i} className="bg-white rounded-2xl p-5 border border-[var(--gray-100)] hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-semibold text-[var(--gray-900)]">{job.type}</h4>
                    <p className="text-sm text-[var(--gray-400)] mt-1">{job.location}</p>
                  </div>
                  <span className="text-sm font-bold text-[var(--primary)]">{job.pay}</span>
                </div>
                <div className="mt-3 flex items-center gap-4 text-xs text-[var(--gray-400)]">
                  <span>{job.time}</span>
                  <span>{job.spots}</span>
                </div>
                <button className="mt-3 w-full h-9 bg-[var(--primary)]/10 text-[var(--primary)] rounded-lg text-sm font-medium hover:bg-[var(--primary)] hover:text-white transition-colors">
                  {t("acceptJob")}
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="order-1 lg:order-2">
          <p className="text-sm font-semibold text-[var(--primary)] uppercase tracking-wider mb-3">
            {t("label")}
          </p>
          <h2 className="text-4xl font-bold text-[var(--gray-900)] tracking-tight">
            {t("title")}
          </h2>
          <p className="mt-4 text-lg text-[var(--gray-500)] leading-relaxed">
            {t("description")}
          </p>

          <ul className="mt-8 space-y-4">
            {benefits.map((item, i) => (
              <li key={i} className="flex items-start gap-3">
                <svg className="w-5 h-5 text-[var(--accent)] mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                </svg>
                <span className="text-[var(--gray-600)]">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

async function CTASection() {
  const t = await getTranslations("CTA");

  return (
    <section id="download" className="py-24 bg-white">
      <div className="max-w-4xl mx-auto px-6 text-center">
        <div className="relative bg-gradient-to-br from-[var(--primary)] to-[var(--primary-dark)] rounded-3xl p-12 md:p-20 overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />

          <div className="relative">
            <h2 className="text-3xl md:text-5xl font-bold text-white tracking-tight">
              {t("title")}
            </h2>
            <p className="mt-4 text-lg text-white/70 max-w-lg mx-auto">
              {t("description")}
            </p>

            <div className="mt-10 flex flex-col sm:flex-row justify-center gap-4">
              <a
                href="#"
                className="inline-flex items-center justify-center gap-3 px-8 py-4 bg-white text-[var(--primary)] font-semibold rounded-2xl hover:bg-white/90 transition-colors"
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
                </svg>
                {t("ios")}
              </a>
              <a
                href="#"
                className="inline-flex items-center justify-center gap-3 px-8 py-4 bg-white/15 text-white font-semibold rounded-2xl border border-white/25 hover:bg-white/25 transition-colors"
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M3.609 1.814L13.792 12 3.61 22.186a.996.996 0 01-.61-.92V2.734a1 1 0 01.609-.92zm10.89 10.893l2.302 2.302-10.937 6.333 8.635-8.635zm3.199-3.199l2.302 2.302a1 1 0 010 1.38l-2.302 2.302L15.2 12.7l2.498-3.192zM5.864 2.658L16.8 8.99l-2.302 2.302L5.864 2.658z" />
                </svg>
                {t("android")}
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function Home() {
  return (
    <>
      <Header />
      <main>
        <HeroSection />
        <FeaturesSection />
        <HowItWorksSection />
        <EmployersSection />
        <WorkersSection />
        <CTASection />
      </main>
      <Footer />
    </>
  );
}
