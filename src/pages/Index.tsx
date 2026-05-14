import { useState, useEffect, useCallback } from "react";
import Icon from "@/components/ui/icon";

const VOTES_URL = "https://functions.poehali.dev/2226445f-ee55-4e2d-b2ac-c981f87bd7b2";

const COUNTRIES = [
  { id: "malta",    name: "Мальта",    flag: "🇲🇹" },
  { id: "croatia",  name: "Хорватия",  flag: "🇭🇷" },
  { id: "armenia",  name: "Армения",   flag: "🇦🇲" },
  { id: "cyprus",   name: "Кипр",      flag: "🇨🇾" },
  { id: "bulgaria", name: "Болгария",  flag: "🇧🇬" },
  { id: "albania",  name: "Албания",   flag: "🇦🇱" },
  { id: "norway",   name: "Норвегия",  flag: "🇳🇴" },
  { id: "israel",   name: "Израиль",   flag: "🇮🇱" },
];

const VOTE_START  = new Date("2026-05-14T20:00:00");
const VOTE_END    = new Date("2026-05-16T15:00:00");
const RESULTS_OPEN = new Date("2026-05-18T00:00:00");
const SECRET_CODE = "2013";
const MAX_VOTES_PER_COUNTRY = 3;

function getVoterId(): string {
  let id = localStorage.getItem("av2026_voter_id");
  if (!id) {
    id = Math.random().toString(36).slice(2) + Date.now().toString(36);
    localStorage.setItem("av2026_voter_id", id);
  }
  return id;
}

type Section = "vote" | "results" | "rules" | "participants";

function useCountdown(target: Date) {
  const [diff, setDiff] = useState(() => target.getTime() - Date.now());
  useEffect(() => {
    const id = setInterval(() => setDiff(target.getTime() - Date.now()), 1000);
    return () => clearInterval(id);
  }, [target]);
  if (diff <= 0) return null;
  const total = Math.max(0, diff);
  return {
    d: Math.floor(total / 86400000),
    h: Math.floor((total % 86400000) / 3600000),
    m: Math.floor((total % 3600000) / 60000),
    s: Math.floor((total % 60000) / 1000),
  };
}

function CountdownUnit({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center min-w-[48px]">
      <div className="font-display text-4xl md:text-5xl font-bold tabular-nums" style={{ color: "#fff" }}>
        {String(value).padStart(2, "0")}
      </div>
      <div className="text-xs uppercase tracking-widest mt-1" style={{ color: "rgba(255,255,255,0.45)" }}>
        {label}
      </div>
    </div>
  );
}

function ProgressBar({ value, max }: { value: number; max: number }) {
  const pct = max === 0 ? 0 : Math.min(100, Math.round((value / max) * 100));
  return (
    <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.1)" }}>
      <div className="h-full rounded-full transition-all duration-700"
        style={{ width: `${pct}%`, background: "linear-gradient(90deg, #c084fc, #818cf8, #38bdf8)" }} />
    </div>
  );
}

function SectionHeader({ title, sub }: { title: string; sub: string }) {
  return (
    <div className="mb-8">
      <h2 className="font-display font-black text-3xl md:text-4xl uppercase euro-text">{title}</h2>
      <p className="mt-2 text-sm" style={{ color: "rgba(255,255,255,0.45)" }}>{sub}</p>
    </div>
  );
}

function LoadingSpinner() {
  return (
    <div className="flex justify-center py-16">
      <div className="w-10 h-10 rounded-full border-2"
        style={{ borderColor: "rgba(192,132,252,0.2)", borderTopColor: "#c084fc", animation: "spin-loader 0.8s linear infinite" }} />
    </div>
  );
}

function ResultsView({ globalTotals }: { globalTotals: Record<string, number> }) {
  const maxVotes = Math.max(...COUNTRIES.map((c) => globalTotals[c.id] || 0), 1);
  const totalAll = Object.values(globalTotals).reduce((a, b) => a + b, 0);
  const sorted = [...COUNTRIES].sort((a, b) => (globalTotals[b.id] || 0) - (globalTotals[a.id] || 0));

  return (
    <div>
      <div className="mb-6 px-5 py-3 rounded-xl inline-flex items-center gap-3"
        style={{ background: "rgba(192,132,252,0.1)", border: "1px solid rgba(192,132,252,0.3)" }}>
        <Icon name="Users" size={16} style={{ color: "#c084fc" } as React.CSSProperties} />
        <span className="font-heading font-semibold text-sm" style={{ color: "#e9d5ff" }}>
          Суммарно голосов:{" "}
          <span style={{ color: "#fff", fontWeight: 700 }}>{totalAll}</span>
        </span>
      </div>

      <div className="space-y-3">
        {sorted.map((country, i) => {
          const count = globalTotals[country.id] || 0;
          const pct = totalAll === 0 ? 0 : Math.round((count / totalAll) * 100);
          const isFirst = i === 0 && count > 0;
          return (
            <div key={country.id} className="rounded-2xl border p-4 animate-slide-in"
              style={{
                background: isFirst ? "linear-gradient(135deg, rgba(192,132,252,0.1), rgba(56,189,248,0.06))" : "rgba(255,255,255,0.04)",
                borderColor: isFirst ? "rgba(192,132,252,0.4)" : "rgba(255,255,255,0.08)",
                animationDelay: `${i * 0.06}s`, opacity: 0, animationFillMode: "forwards",
              }}>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 flex items-center justify-center rounded-lg font-display font-bold text-sm flex-shrink-0"
                  style={{
                    background: isFirst ? "linear-gradient(135deg, #c084fc, #38bdf8)" : "rgba(255,255,255,0.08)",
                    color: isFirst ? "#fff" : "rgba(255,255,255,0.35)",
                  }}>
                  {i + 1}
                </div>
                <span style={{ fontSize: 26 }}>{country.flag}</span>
                <div className="flex-1">
                  <div className="font-heading font-bold text-base" style={{ color: "#fff" }}>{country.name}</div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="font-display font-bold text-xl" style={{ color: count > 0 ? "#fff" : "rgba(255,255,255,0.25)" }}>
                    {count}
                  </div>
                  <div className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>{pct}%</div>
                </div>
              </div>
              <ProgressBar value={count} max={maxVotes} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function Index() {
  const [section, setSection] = useState<Section>("vote");
  const [myVotes, setMyVotes] = useState<Record<string, number>>(() => {
    try { return JSON.parse(localStorage.getItem("av2026_votes") || "{}"); } catch { return {}; }
  });
  const [globalTotals, setGlobalTotals] = useState<Record<string, number>>({});
  const [loadingTotals, setLoadingTotals] = useState(false);
  const [justVoted, setJustVoted] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [codeUnlocked, setCodeUnlocked] = useState(false);
  const [codeError, setCodeError] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [savingVotes, setSavingVotes] = useState(false);

  const now = new Date();
  const isVotingActive = now >= VOTE_START && now <= VOTE_END;
  const isVotingOver   = now > VOTE_END;
  const isResultsOpen  = now >= RESULTS_OPEN;
  const countdownTarget = now < VOTE_START ? VOTE_START : VOTE_END;
  const countdown = useCountdown(countdownTarget);

  const fetchTotals = useCallback(async () => {
    setLoadingTotals(true);
    try {
      const res = await fetch(VOTES_URL);
      const data = await res.json();
      setGlobalTotals(data.totals || {});
    } catch { /* silent */ } finally {
      setLoadingTotals(false);
    }
  }, []);

  useEffect(() => { if (section === "results") fetchTotals(); }, [section, fetchTotals]);
  useEffect(() => {
    if (section !== "results") return;
    const id = setInterval(fetchTotals, 5 * 60 * 1000);
    return () => clearInterval(id);
  }, [section, fetchTotals]);

  const saveVotesToServer = useCallback(async (votes: Record<string, number>) => {
    setSavingVotes(true);
    try {
      await fetch(VOTES_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ voter_id: getVoterId(), votes }),
      });
    } catch { /* silent */ } finally { setSavingVotes(false); }
  }, []);

  const handleVote = (countryId: string) => {
    if (!isVotingActive) return;
    const current = myVotes[countryId] || 0;
    if (current >= MAX_VOTES_PER_COUNTRY) return;
    const newVotes = { ...myVotes, [countryId]: current + 1 };
    setMyVotes(newVotes);
    localStorage.setItem("av2026_votes", JSON.stringify(newVotes));
    setJustVoted(countryId);
    setTimeout(() => setJustVoted(null), 1200);
    saveVotesToServer(newVotes);
  };

  const handleCodeSubmit = () => {
    if (code === SECRET_CODE) { setCodeUnlocked(true); setCodeError(false); fetchTotals(); }
    else { setCodeError(true); setTimeout(() => setCodeError(false), 1500); }
  };

  const totalMyVotes = Object.values(myVotes).reduce((a, b) => a + b, 0);
  const maxMyVotes = COUNTRIES.length * MAX_VOTES_PER_COUNTRY;

  const navItems: { key: Section; label: string; icon: string }[] = [
    { key: "vote",         label: "Голосование", icon: "Vote"     },
    { key: "results",      label: "Результаты",  icon: "BarChart3" },
    { key: "participants", label: "Участники",   icon: "Users"    },
    { key: "rules",        label: "Правила",     icon: "BookOpen" },
  ];

  return (
    <div className="min-h-screen relative" style={{ color: "#fff" }}>

      {/* ── ФОН ЕВРОВИДЕНИЕ ── */}
      <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 0 }}>
        <div className="absolute inset-0" style={{
          background: "linear-gradient(135deg, #07001a 0%, #0d0030 35%, #010a1a 65%, #07001a 100%)"
        }} />
        <div className="absolute" style={{ top: "-20%", left: "-15%", width: "65%", height: "65%",
          background: "radial-gradient(ellipse, rgba(192,132,252,0.2) 0%, transparent 70%)", filter: "blur(50px)" }} />
        <div className="absolute" style={{ bottom: "-15%", right: "-10%", width: "60%", height: "60%",
          background: "radial-gradient(ellipse, rgba(56,189,248,0.18) 0%, transparent 70%)", filter: "blur(50px)" }} />
        <div className="absolute" style={{ top: "35%", left: "45%", width: "45%", height: "45%",
          background: "radial-gradient(ellipse, rgba(236,72,153,0.1) 0%, transparent 70%)", filter: "blur(70px)", transform: "translateX(-50%)" }} />
        {Array.from({ length: 70 }).map((_, i) => (
          <div key={i} className="absolute rounded-full" style={{
            width: Math.random() * 2 + 0.5, height: Math.random() * 2 + 0.5,
            left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%`,
            background: "#fff", opacity: Math.random() * 0.5 + 0.1,
            animation: `star-pulse ${Math.random() * 3 + 2}s ease-in-out infinite`,
            animationDelay: `${Math.random() * 4}s`,
          }} />
        ))}
      </div>

      {/* ── HEADER ── */}
      <header className="sticky top-0 z-50 border-b backdrop-blur-xl"
        style={{ background: "rgba(7,0,26,0.88)", borderColor: "rgba(192,132,252,0.2)" }}>
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center font-display font-black text-sm"
              style={{ background: "linear-gradient(135deg, #c084fc, #38bdf8)", color: "#fff" }}>AV</div>
            <div>
              <div className="font-display font-black text-base leading-none euro-text">AURAVISION</div>
              <div className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>2026 · ФИНАЛ</div>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-6">
            {navItems.map(item => (
              <button key={item.key} onClick={() => setSection(item.key)}
                className="nav-euro font-heading font-semibold text-sm uppercase tracking-wider transition-colors duration-200"
                style={{ color: section === item.key ? "#fff" : "rgba(255,255,255,0.45)" }}
                data-active={section === item.key}>
                {item.label}
              </button>
            ))}
          </nav>

          <button className="md:hidden p-2" onClick={() => setMobileMenuOpen(v => !v)}
            style={{ color: "rgba(255,255,255,0.55)" }}>
            <Icon name={mobileMenuOpen ? "X" : "Menu"} size={22} />
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden border-t animate-fade-in"
            style={{ borderColor: "rgba(192,132,252,0.12)", background: "rgba(7,0,26,0.97)" }}>
            {navItems.map(item => (
              <button key={item.key} onClick={() => { setSection(item.key); setMobileMenuOpen(false); }}
                className="w-full text-left px-6 py-4 font-heading font-semibold text-sm uppercase tracking-wider border-b flex items-center gap-3"
                style={{ borderColor: "rgba(255,255,255,0.06)", color: section === item.key ? "#c084fc" : "rgba(255,255,255,0.45)" }}>
                <Icon name={item.icon} size={16} />
                {item.label}
              </button>
            ))}
          </div>
        )}
      </header>

      {/* ── HERO ── */}
      <section className="relative z-10 border-b" style={{ borderColor: "rgba(192,132,252,0.12)" }}>
        <div className="max-w-6xl mx-auto px-4 py-12 md:py-18 text-center">
          <div className="animate-fade-in">
            {/* Live badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-6 text-xs font-heading font-bold uppercase tracking-widest"
              style={{ background: "rgba(192,132,252,0.1)", border: "1px solid rgba(192,132,252,0.3)", color: "#c084fc" }}>
              <span className="w-2 h-2 rounded-full" style={{ background: "#c084fc", display: "inline-block", animation: "dot-pulse 1.5s ease-in-out infinite" }} />
              {isVotingActive ? "Голосование открыто" : isVotingOver ? "Голосование завершено" : "Скоро старт"}
            </div>

            {/* Main title */}
            <h1 className="font-display font-black uppercase leading-none mb-3"
              style={{ fontSize: "clamp(3.5rem, 11vw, 8rem)", letterSpacing: "-0.03em" }}>
              <span className="euro-text">AURA</span>
              <span style={{ color: "#fff" }}>VISION</span>
            </h1>
            <div className="font-heading font-medium text-base md:text-lg mb-10"
              style={{ color: "rgba(255,255,255,0.45)", letterSpacing: "0.15em" }}>
              МУЗЫКАЛЬНЫЙ КОНКУРС · ФИНАЛ 2026
            </div>

            {/* VIDEO */}
            <div className="max-w-3xl mx-auto mb-10 rounded-2xl overflow-hidden animate-fade-in delay-200"
              style={{ border: "1px solid rgba(192,132,252,0.25)", boxShadow: "0 0 80px rgba(192,132,252,0.18), 0 0 30px rgba(56,189,248,0.12)" }}>
              <div style={{ position: "relative", paddingBottom: "56.25%", height: 0 }}>
                <iframe
                  src="https://www.youtube.com/embed/R0YFL8jc6ao"
                  title="AuraVision 2026 Final"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", border: "none" }}
                />
              </div>
            </div>

            {/* Countdown */}
            {countdown && !isVotingOver && (
              <div className="inline-flex items-center gap-3 md:gap-5 px-6 md:px-10 py-5 rounded-2xl border mb-8 animate-fade-in delay-300"
                style={{ background: "rgba(255,255,255,0.03)", borderColor: "rgba(192,132,252,0.2)" }}>
                <div className="text-xs uppercase tracking-widest hidden sm:block" style={{ color: "rgba(255,255,255,0.38)" }}>
                  {now < VOTE_START ? "До старта" : "До конца"}
                </div>
                <div className="hidden sm:block w-px h-8 opacity-15" style={{ background: "#fff" }} />
                <CountdownUnit value={countdown.d} label="дней" />
                <span className="font-display text-2xl font-bold" style={{ color: "#c084fc", marginBottom: "1.2rem" }}>:</span>
                <CountdownUnit value={countdown.h} label="часов" />
                <span className="font-display text-2xl font-bold" style={{ color: "#c084fc", marginBottom: "1.2rem" }}>:</span>
                <CountdownUnit value={countdown.m} label="минут" />
                <span className="font-display text-2xl font-bold" style={{ color: "#c084fc", marginBottom: "1.2rem" }}>:</span>
                <CountdownUnit value={countdown.s} label="секунд" />
              </div>
            )}

            {/* My votes progress */}
            <div className="max-w-sm mx-auto text-left animate-fade-in delay-400">
              <div className="flex justify-between text-xs mb-2" style={{ color: "rgba(255,255,255,0.38)" }}>
                <span>Ваших голосов отдано</span>
                <span style={{ color: "#fff" }}>{totalMyVotes} / {maxMyVotes}</span>
              </div>
              <ProgressBar value={totalMyVotes} max={maxMyVotes} />
            </div>
          </div>
        </div>
      </section>

      {/* ── MAIN ── */}
      <main className="max-w-6xl mx-auto px-4 py-12 relative z-10">

        {/* ГОЛОСОВАНИЕ */}
        {section === "vote" && (
          <div className="animate-fade-in">
            <SectionHeader title="Голосование"
              sub={isVotingActive ? "До 3 голосов за страну · Голосование открыто"
                : isVotingOver ? "Голосование завершено · Итоги 18 мая"
                : "Старт: 14 мая 2026 в 20:00"} />

            {!isVotingActive && (
              <div className="rounded-2xl border p-6 mb-8 text-center"
                style={{ borderColor: "rgba(192,132,252,0.2)", background: "rgba(192,132,252,0.05)" }}>
                <Icon name={isVotingOver ? "CheckCircle" : "Clock"} size={32} className="mx-auto mb-3"
                  style={{ color: "#c084fc" } as React.CSSProperties} />
                <div className="font-heading font-semibold text-base mb-1">
                  {isVotingOver ? "Голосование завершено" : "Голосование ещё не началось"}
                </div>
                <div className="text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>
                  {isVotingOver ? "Итоги откроются 18 мая 2026" : "Старт: 14 мая 2026 в 20:00"}
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {COUNTRIES.map((country, i) => {
                const voteCount = myVotes[country.id] || 0;
                const canVote = isVotingActive && voteCount < MAX_VOTES_PER_COUNTRY;
                const isJust = justVoted === country.id;
                return (
                  <div key={country.id} className="animate-fade-in rounded-2xl p-5 flex flex-col gap-4"
                    style={{
                      background: voteCount > 0 ? "rgba(192,132,252,0.07)" : "rgba(255,255,255,0.04)",
                      border: `1px solid ${voteCount > 0 ? "rgba(192,132,252,0.3)" : "rgba(255,255,255,0.08)"}`,
                      animationDelay: `${i * 0.07}s`, opacity: 0, animationFillMode: "forwards",
                      transition: "border-color 0.25s, background 0.25s",
                    }}>
                    <div className="flex flex-col items-center gap-2 text-center">
                      <span style={{ fontSize: 44, lineHeight: 1 }}>{country.flag}</span>
                      <div className="font-display font-bold text-lg uppercase" style={{ color: "#fff" }}>
                        {country.name}
                      </div>
                    </div>

                    {/* Dots */}
                    <div className="flex items-center gap-1.5 justify-center">
                      {[0, 1, 2].map(dot => (
                        <div key={dot} className="flex-1 h-1.5 rounded-full transition-all duration-300"
                          style={{ background: dot < voteCount ? "linear-gradient(90deg, #c084fc, #38bdf8)" : "rgba(255,255,255,0.1)" }} />
                      ))}
                      <span className="text-xs ml-1.5 font-heading font-bold"
                        style={{ color: voteCount > 0 ? "#c084fc" : "rgba(255,255,255,0.3)" }}>
                        {voteCount}/3
                      </span>
                    </div>

                    <button onClick={() => handleVote(country.id)} disabled={!canVote}
                      className={`w-full py-2.5 rounded-xl font-heading font-bold text-sm uppercase tracking-wider transition-all duration-200 ${isJust ? "scale-95" : ""}`}
                      style={{
                        background: canVote
                          ? "linear-gradient(135deg, #c084fc, #818cf8, #38bdf8)"
                          : "rgba(255,255,255,0.07)",
                        color: canVote ? "#fff" : "rgba(255,255,255,0.3)",
                        cursor: canVote ? "pointer" : "not-allowed",
                        boxShadow: canVote && !isJust ? "0 4px 20px rgba(192,132,252,0.3)" : "none",
                      }}>
                      {isJust ? "✓ Принято!" : voteCount >= MAX_VOTES_PER_COUNTRY ? "Лимит" : "+1 голос"}
                    </button>
                  </div>
                );
              })}
            </div>
            {savingVotes && (
              <div className="mt-4 text-center text-xs" style={{ color: "rgba(192,132,252,0.6)" }}>Сохраняю...</div>
            )}
          </div>
        )}

        {/* РЕЗУЛЬТАТЫ */}
        {section === "results" && (
          <div className="animate-fade-in">
            <SectionHeader title="Результаты" sub="Суммарные голоса всех участников · обновление каждые 5 мин" />

            {isResultsOpen ? (
              loadingTotals ? <LoadingSpinner /> : <ResultsView globalTotals={globalTotals} />
            ) : (
              <div className="max-w-md mx-auto">
                <div className="rounded-2xl border p-8 text-center mb-4"
                  style={{ borderColor: "rgba(192,132,252,0.2)", background: "rgba(255,255,255,0.04)" }}>
                  <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                    style={{ background: "rgba(192,132,252,0.1)", border: "1px solid rgba(192,132,252,0.3)" }}>
                    <Icon name="Lock" size={28} style={{ color: "#c084fc" } as React.CSSProperties} />
                  </div>
                  <div className="font-heading font-bold text-xl mb-2">Результаты засекречены</div>
                  <div className="text-sm mb-6" style={{ color: "rgba(255,255,255,0.4)" }}>
                    Открытый доступ с 18 мая 2026.<br />Промежуточные данные — по секретному коду.
                  </div>
                  {!codeUnlocked && (
                    <div className="space-y-3">
                      <input type="password" placeholder="Секретный код" value={code}
                        onChange={e => setCode(e.target.value)}
                        onKeyDown={e => e.key === "Enter" && handleCodeSubmit()}
                        className="w-full px-4 py-3 rounded-xl text-center font-heading font-bold text-xl tracking-widest outline-none"
                        style={{
                          background: "rgba(255,255,255,0.06)",
                          border: `1px solid ${codeError ? "#f472b6" : "rgba(192,132,252,0.25)"}`,
                          color: "#fff", transition: "border-color 0.2s",
                        }} />
                      {codeError && <p className="text-xs" style={{ color: "#f472b6" }}>Неверный код</p>}
                      <button onClick={handleCodeSubmit}
                        className="w-full py-3 rounded-xl font-heading font-bold text-sm uppercase tracking-wider"
                        style={{ background: "linear-gradient(135deg, #c084fc, #38bdf8)", color: "#fff" }}>
                        Разблокировать
                      </button>
                    </div>
                  )}
                </div>

                {codeUnlocked && (
                  <div className="animate-fade-in">
                    <div className="flex items-center gap-2 mb-5 px-4 py-2.5 rounded-xl w-fit text-sm"
                      style={{ background: "rgba(192,132,252,0.1)", border: "1px solid rgba(192,132,252,0.25)", color: "#c084fc" }}>
                      <Icon name="Eye" size={14} />
                      <span className="font-heading font-semibold">Промежуточные результаты</span>
                      <button onClick={fetchTotals} className="ml-2 opacity-60 hover:opacity-100 transition-opacity">
                        <Icon name="RefreshCw" size={12} />
                      </button>
                    </div>
                    {loadingTotals ? <LoadingSpinner /> : <ResultsView globalTotals={globalTotals} />}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* УЧАСТНИКИ */}
        {section === "participants" && (
          <div className="animate-fade-in">
            <SectionHeader title="Участники" sub="8 стран · Финал AuraVision 2026" />
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {COUNTRIES.map((country, i) => (
                <div key={country.id} className="animate-fade-in rounded-2xl p-6 flex flex-col items-center text-center gap-3"
                  style={{
                    background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
                    animationDelay: `${i * 0.08}s`, opacity: 0, animationFillMode: "forwards",
                    transition: "border-color 0.2s, transform 0.2s",
                  }}
                  onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = "rgba(192,132,252,0.35)"; el.style.transform = "translateY(-3px)"; }}
                  onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = "rgba(255,255,255,0.08)"; el.style.transform = "translateY(0)"; }}>
                  <span style={{ fontSize: 52, lineHeight: 1 }}>{country.flag}</span>
                  <div className="font-display font-bold text-xl uppercase euro-text">{country.name}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ПРАВИЛА */}
        {section === "rules" && (
          <div className="animate-fade-in max-w-3xl">
            <SectionHeader title="Правила" sub="AuraVision 2026 · Официальное голосование" />
            <div className="space-y-4">
              {[
                { icon: "Calendar", title: "Период голосования", text: "14 мая 2026 (20:00) — 16 мая 2026 (15:00). Вне этого периода голосование недоступно." },
                { icon: "Vote", title: "Лимит голосов", text: "Каждый аккаунт может отдать максимум 3 голоса за одну страну. Итого 24 голоса на все 8 стран." },
                { icon: "Shield", title: "Защита от ботов", text: "Система учитывает исключительно реальные голоса. Голоса от ботов автоматически исключаются." },
                { icon: "RefreshCw", title: "Обновление данных", text: "Суммарные результаты обновляются каждые 5 минут с момента старта голосования." },
                { icon: "Lock", title: "Конфиденциальность", text: "Результаты засекречены до 18 мая 2026. Промежуточные данные доступны только по специальному коду." },
                { icon: "Globe", title: "Страны-участницы", text: "В финале участвуют 8 стран: Мальта, Хорватия, Армения, Кипр, Болгария, Албания, Норвегия и Израиль." },
              ].map((rule, i) => (
                <div key={i} className="animate-fade-in flex gap-5 rounded-2xl border p-5"
                  style={{
                    background: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.08)",
                    animationDelay: `${i * 0.09}s`, opacity: 0, animationFillMode: "forwards",
                  }}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: "rgba(192,132,252,0.12)" }}>
                    <Icon name={rule.icon} size={18} style={{ color: "#c084fc" } as React.CSSProperties} />
                  </div>
                  <div>
                    <div className="font-heading font-bold text-base mb-1">{rule.title}</div>
                    <div className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.48)" }}>{rule.text}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* ── FOOTER ── */}
      <footer className="border-t relative z-10 mt-16" style={{ borderColor: "rgba(192,132,252,0.15)" }}>
        <div className="max-w-6xl mx-auto px-4 py-8 flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="font-display font-bold text-sm uppercase euro-text">
            AuraVision 2026 · Официальное голосование
          </div>
          <div className="text-xs" style={{ color: "rgba(255,255,255,0.28)" }}>
            14–16 мая 2026 · Итоги открыты с 18 мая
          </div>
        </div>
      </footer>

      <style>{`
        .euro-text {
          background: linear-gradient(90deg, #f9a8d4, #c084fc, #818cf8, #38bdf8, #c084fc, #f9a8d4);
          background-size: 300% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: euro-shimmer 4s linear infinite;
        }
        .nav-euro { position: relative; }
        .nav-euro::after {
          content: '';
          position: absolute; bottom: -4px; left: 0;
          width: 0; height: 2px;
          background: linear-gradient(90deg, #c084fc, #38bdf8);
          transition: width 0.25s ease; border-radius: 2px;
        }
        .nav-euro[data-active="true"]::after { width: 100%; }
        .nav-euro[data-active="true"] { color: #fff !important; }
        @keyframes euro-shimmer {
          0% { background-position: 0% center; }
          100% { background-position: 300% center; }
        }
        @keyframes dot-pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.3; transform: scale(0.6); }
        }
        @keyframes star-pulse {
          0%, 100% { opacity: 0.12; }
          50% { opacity: 0.55; }
        }
        @keyframes spin-loader {
          to { transform: rotate(360deg); }
        }
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(14px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slide-in {
          from { opacity: 0; transform: translateX(-16px); }
          to { opacity: 1; transform: translateX(0); }
        }
        .animate-fade-in { animation: fade-in 0.5s ease forwards; }
        .animate-slide-in { animation: slide-in 0.4s ease forwards; }
        .animate-fade-in-fast { animation: fade-in 0.2s ease forwards; }
        .delay-200 { animation-delay: 0.2s; }
        .delay-300 { animation-delay: 0.3s; }
        .delay-400 { animation-delay: 0.4s; }
      `}</style>
    </div>
  );
}
