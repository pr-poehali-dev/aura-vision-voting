import { useState, useEffect } from "react";
import Icon from "@/components/ui/icon";

const COUNTRIES = [
  { id: "malta", name: "Мальта", flag: "🇲🇹", artist: "Mirabel", song: "Golden Shore", color: "#CF0A2C" },
  { id: "croatia", name: "Хорватия", flag: "🇭🇷", artist: "Luka Vukić", song: "Rim Tim Tagi Dim", color: "#FF0000" },
  { id: "armenia", name: "Армения", flag: "🇦🇲", artist: "Parg", song: "Survivor", color: "#D90012" },
  { id: "cyprus", name: "Кипр", flag: "🇨🇾", artist: "Theo Evan", song: "Midnight Blue", color: "#003680" },
  { id: "bulgaria", name: "Болгария", flag: "🇧🇬", artist: "ALMA", song: "Vivaldi", color: "#00966E" },
  { id: "albania", name: "Албания", flag: "🇦🇱", artist: "Muharrem Ahmeti", song: "Zjarm", color: "#E41E20" },
  { id: "norway", name: "Норвегия", flag: "🇳🇴", artist: "Kyle Alessandro", song: "Lighter", color: "#EF2B2D" },
  { id: "israel", name: "Израиль", flag: "🇮🇱", artist: "Yuval Raphael", song: "New Day Will Rise", color: "#0038B8" },
];

const VOTE_START = new Date("2026-05-14T20:00:00");
const VOTE_END = new Date("2026-05-16T15:00:00");
const RESULTS_OPEN = new Date("2026-05-18T00:00:00");
const SECRET_CODE = "2013";
const MAX_VOTES_PER_COUNTRY = 3;

type Section = "vote" | "results" | "rules" | "participants";

function useCountdown(target: Date) {
  const [diff, setDiff] = useState(() => target.getTime() - Date.now());
  useEffect(() => {
    const id = setInterval(() => setDiff(target.getTime() - Date.now()), 1000);
    return () => clearInterval(id);
  }, [target]);
  if (diff <= 0) return null;
  const total = Math.max(0, diff);
  const d = Math.floor(total / 86400000);
  const h = Math.floor((total % 86400000) / 3600000);
  const m = Math.floor((total % 3600000) / 60000);
  const s = Math.floor((total % 60000) / 1000);
  return { d, h, m, s };
}

function CountdownUnit({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center min-w-[48px]">
      <div className="font-display text-4xl md:text-5xl font-bold tabular-nums" style={{ color: "var(--av-white)" }}>
        {String(value).padStart(2, "0")}
      </div>
      <div className="text-xs uppercase tracking-widest mt-1" style={{ color: "var(--av-gray)" }}>
        {label}
      </div>
    </div>
  );
}

function ProgressBar({ value, max }: { value: number; max: number }) {
  const pct = max === 0 ? 0 : Math.round((value / max) * 100);
  return (
    <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: "var(--av-border)" }}>
      <div className="progress-fill" style={{ width: `${pct}%` }} />
    </div>
  );
}

function ResultsView({ votes }: { votes: Record<string, number> }) {
  const total = Object.values(votes).reduce((a, b) => a + b, 0) || 1;
  const sorted = [...COUNTRIES].sort((a, b) => (votes[b.id] || 0) - (votes[a.id] || 0));

  return (
    <div className="space-y-3">
      {sorted.map((country, i) => {
        const count = votes[country.id] || 0;
        const pct = Math.round((count / total) * 100);
        const isFirst = i === 0 && count > 0;
        return (
          <div
            key={country.id}
            className="rounded-sm border p-4 animate-slide-in"
            style={{
              background: "var(--av-card)",
              borderColor: isFirst ? "rgba(232,16,42,0.4)" : "var(--av-border)",
              animationDelay: `${i * 0.06}s`,
              opacity: 0,
              animationFillMode: "forwards",
            }}
          >
            <div className="flex items-center gap-3 mb-3">
              <div
                className="w-7 h-7 flex items-center justify-center rounded-sm font-display font-bold text-sm flex-shrink-0"
                style={{
                  background: isFirst ? "var(--av-red)" : "var(--av-border)",
                  color: isFirst ? "#fff" : "var(--av-gray)",
                }}
              >
                {i + 1}
              </div>
              <span style={{ fontSize: 24 }}>{country.flag}</span>
              <div className="flex-1 min-w-0">
                <div className="font-heading font-bold text-sm" style={{ color: "var(--av-white)" }}>
                  {country.name}
                </div>
                <div className="text-xs" style={{ color: "var(--av-gray)" }}>{country.artist}</div>
              </div>
              <div className="text-right flex-shrink-0">
                <div className="font-display font-bold text-lg" style={{ color: count > 0 ? "var(--av-white)" : "var(--av-gray)" }}>
                  {count}
                </div>
                <div className="text-xs" style={{ color: "var(--av-gray)" }}>{pct}%</div>
              </div>
            </div>
            <ProgressBar value={count} max={MAX_VOTES_PER_COUNTRY} />
          </div>
        );
      })}
    </div>
  );
}

export default function Index() {
  const [section, setSection] = useState<Section>("vote");
  const [votes, setVotes] = useState<Record<string, number>>(() => {
    try {
      const stored = localStorage.getItem("av2026_votes");
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });
  const [justVoted, setJustVoted] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [codeUnlocked, setCodeUnlocked] = useState(false);
  const [codeError, setCodeError] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const now = new Date();
  const isVotingActive = now >= VOTE_START && now <= VOTE_END;
  const isVotingOver = now > VOTE_END;
  const isResultsOpen = now >= RESULTS_OPEN;

  const countdownTarget = now < VOTE_START ? VOTE_START : VOTE_END;
  const countdown = useCountdown(countdownTarget);

  const totalVotes = Object.values(votes).reduce((a, b) => a + b, 0);
  const maxVotes = COUNTRIES.length * MAX_VOTES_PER_COUNTRY;

  useEffect(() => {
    localStorage.setItem("av2026_votes", JSON.stringify(votes));
  }, [votes]);

  const handleVote = (countryId: string) => {
    if (!isVotingActive) return;
    const current = votes[countryId] || 0;
    if (current >= MAX_VOTES_PER_COUNTRY) return;
    setVotes((v) => ({ ...v, [countryId]: current + 1 }));
    setJustVoted(countryId);
    setTimeout(() => setJustVoted(null), 1200);
  };

  const handleCodeSubmit = () => {
    if (code === SECRET_CODE) {
      setCodeUnlocked(true);
      setCodeError(false);
    } else {
      setCodeError(true);
      setTimeout(() => setCodeError(false), 1500);
    }
  };

  const navItems: { key: Section; label: string; icon: string }[] = [
    { key: "vote", label: "Голосование", icon: "Vote" },
    { key: "results", label: "Результаты", icon: "BarChart3" },
    { key: "participants", label: "Участники", icon: "Users" },
    { key: "rules", label: "Правила", icon: "BookOpen" },
  ];

  return (
    <div className="min-h-screen relative z-10" style={{ color: "var(--av-white)" }}>

      {/* ── HEADER ── */}
      <header
        className="sticky top-0 z-50 border-b backdrop-blur-md"
        style={{ background: "rgba(10,10,10,0.92)", borderColor: "var(--av-border)" }}
      >
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-sm flex items-center justify-center font-display font-bold text-sm"
              style={{ background: "var(--av-red)", color: "#fff" }}
            >
              AV
            </div>
            <div>
              <div className="font-display font-bold text-base leading-none" style={{ color: "var(--av-white)" }}>AURAVISION</div>
              <div className="text-xs" style={{ color: "var(--av-gray)" }}>2026</div>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-8">
            {navItems.map((item) => (
              <button
                key={item.key}
                onClick={() => setSection(item.key)}
                className={`nav-link font-heading font-semibold text-sm uppercase tracking-wider ${section === item.key ? "active" : ""}`}
                style={{ color: section === item.key ? "var(--av-white)" : "var(--av-gray)" }}
              >
                {item.label}
              </button>
            ))}
          </nav>

          <button
            className="md:hidden p-2"
            onClick={() => setMobileMenuOpen((v) => !v)}
            style={{ color: "var(--av-gray)" }}
          >
            <Icon name={mobileMenuOpen ? "X" : "Menu"} size={22} />
          </button>
        </div>

        {mobileMenuOpen && (
          <div
            className="md:hidden border-t animate-fade-in"
            style={{ borderColor: "var(--av-border)", background: "rgba(10,10,10,0.98)" }}
          >
            {navItems.map((item) => (
              <button
                key={item.key}
                onClick={() => { setSection(item.key); setMobileMenuOpen(false); }}
                className="w-full text-left px-6 py-4 font-heading font-semibold text-sm uppercase tracking-wider border-b flex items-center gap-3"
                style={{ borderColor: "var(--av-border)", color: section === item.key ? "var(--av-red)" : "var(--av-gray)" }}
              >
                <Icon name={item.icon} size={16} />
                {item.label}
              </button>
            ))}
          </div>
        )}
      </header>

      {/* ── HERO ── */}
      <section className="relative overflow-hidden border-b" style={{ borderColor: "var(--av-border)" }}>
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(ellipse at 50% 0%, rgba(232,16,42,0.12) 0%, transparent 70%)" }}
        />

        <div className="max-w-6xl mx-auto px-4 py-16 md:py-24 text-center relative">
          <div className="animate-fade-in">
            <div className="av-tag mx-auto mb-6 w-fit">
              <span className="dot" />
              {isVotingActive ? "Голосование открыто" : isVotingOver ? "Голосование завершено" : "Скоро старт"}
            </div>

            <h1
              className="font-display font-black uppercase leading-none mb-4"
              style={{ fontSize: "clamp(3rem, 10vw, 7rem)", letterSpacing: "-0.02em" }}
            >
              <span className="gradient-text">AURA</span>
              <span style={{ color: "var(--av-white)" }}>VISION</span>
            </h1>

            <div className="font-heading font-semibold text-lg md:text-xl mb-10" style={{ color: "var(--av-gray)" }}>
              Музыкальный конкурс · Финал 2026
            </div>

            {countdown && !isVotingOver && (
              <div
                className="inline-flex items-center gap-3 md:gap-5 px-6 md:px-10 py-5 rounded-sm border animate-fade-in delay-300"
                style={{ background: "rgba(255,255,255,0.03)", borderColor: "var(--av-border)" }}
              >
                <div className="text-xs uppercase tracking-widest" style={{ color: "var(--av-gray)" }}>
                  {now < VOTE_START ? "До старта" : "До конца"}
                </div>
                <div className="w-px h-8 opacity-20" style={{ background: "var(--av-white)" }} />
                <CountdownUnit value={countdown.d} label="дней" />
                <span className="font-display text-2xl font-bold pb-3" style={{ color: "var(--av-red)" }}>:</span>
                <CountdownUnit value={countdown.h} label="часов" />
                <span className="font-display text-2xl font-bold pb-3" style={{ color: "var(--av-red)" }}>:</span>
                <CountdownUnit value={countdown.m} label="минут" />
                <span className="font-display text-2xl font-bold pb-3" style={{ color: "var(--av-red)" }}>:</span>
                <CountdownUnit value={countdown.s} label="секунд" />
              </div>
            )}

            <div className="mt-8 max-w-sm mx-auto text-left animate-fade-in delay-400">
              <div className="flex justify-between text-xs mb-2" style={{ color: "var(--av-gray)" }}>
                <span>Ваших голосов отдано</span>
                <span style={{ color: "var(--av-white)" }}>{totalVotes} / {maxVotes}</span>
              </div>
              <ProgressBar value={totalVotes} max={maxVotes} />
            </div>
          </div>
        </div>
      </section>

      {/* ── MAIN ── */}
      <main className="max-w-6xl mx-auto px-4 py-12">

        {/* ГОЛОСОВАНИЕ */}
        {section === "vote" && (
          <div className="animate-fade-in">
            <div className="mb-8">
              <h2 className="font-display font-bold text-3xl uppercase section-line" style={{ color: "var(--av-white)" }}>
                Голосование
              </h2>
              <p className="mt-3 text-sm" style={{ color: "var(--av-gray)" }}>
                До 3 голосов за каждую страну ·{" "}
                {isVotingActive ? "Голосование открыто" : isVotingOver ? "Голосование завершено" : "Откроется 14 мая в 20:00"}
              </p>
            </div>

            {!isVotingActive && !isVotingOver && (
              <div className="rounded-sm border p-6 mb-8 text-center"
                style={{ borderColor: "rgba(232,16,42,0.3)", background: "rgba(232,16,42,0.05)" }}>
                <Icon name="Clock" size={32} className="mx-auto mb-3" style={{ color: "var(--av-red)" } as React.CSSProperties} />
                <div className="font-heading font-semibold text-base mb-1">Голосование ещё не началось</div>
                <div className="text-sm" style={{ color: "var(--av-gray)" }}>Старт: 14 мая 2026 в 20:00</div>
              </div>
            )}

            {isVotingOver && (
              <div className="rounded-sm border p-6 mb-8 text-center"
                style={{ borderColor: "rgba(232,16,42,0.3)", background: "rgba(232,16,42,0.05)" }}>
                <Icon name="CheckCircle" size={32} className="mx-auto mb-3" style={{ color: "var(--av-red)" } as React.CSSProperties} />
                <div className="font-heading font-semibold text-base mb-1">Голосование завершено</div>
                <div className="text-sm" style={{ color: "var(--av-gray)" }}>Результаты будут открыты 18 мая 2026</div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {COUNTRIES.map((country, i) => {
                const voteCount = votes[country.id] || 0;
                const canVote = isVotingActive && voteCount < MAX_VOTES_PER_COUNTRY;
                const isJust = justVoted === country.id;

                return (
                  <div
                    key={country.id}
                    className="country-card rounded-sm p-5 flex flex-col gap-4 animate-fade-in"
                    style={{
                      background: "var(--av-card)",
                      animationDelay: `${i * 0.07}s`,
                      opacity: 0,
                      animationFillMode: "forwards",
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <span style={{ fontSize: 36 }}>{country.flag}</span>
                      <div>
                        <div className="font-heading font-bold text-base" style={{ color: "var(--av-white)" }}>{country.name}</div>
                        <div className="text-xs" style={{ color: "var(--av-gray)" }}>{country.artist}</div>
                      </div>
                    </div>

                    <div className="text-xs px-3 py-2 rounded-sm" style={{ background: "rgba(255,255,255,0.04)", color: "var(--av-gray)" }}>
                      ♪ {country.song}
                    </div>

                    <div className="flex items-center gap-2">
                      {[0, 1, 2].map((dot) => (
                        <div
                          key={dot}
                          className="flex-1 h-1.5 rounded-full transition-all duration-300"
                          style={{ background: dot < voteCount ? "var(--av-red)" : "var(--av-border)" }}
                        />
                      ))}
                      <span className="text-xs ml-1 font-heading font-semibold"
                        style={{ color: voteCount > 0 ? "var(--av-red)" : "var(--av-gray)" }}>
                        {voteCount}/3
                      </span>
                    </div>

                    <button
                      onClick={() => handleVote(country.id)}
                      disabled={!canVote}
                      className={`vote-btn w-full py-2.5 px-4 rounded-sm font-heading font-bold text-sm uppercase tracking-wider transition-all ${isJust ? "scale-95" : ""}`}
                      style={{
                        background: canVote ? (isJust ? "var(--av-red-dim)" : "var(--av-red)") : "var(--av-border)",
                        color: canVote ? "#fff" : "var(--av-gray)",
                        cursor: canVote ? "pointer" : "not-allowed",
                      }}
                    >
                      {isJust ? "✓ Голос принят!" : voteCount >= MAX_VOTES_PER_COUNTRY ? "Лимит исчерпан" : "Голосовать"}
                    </button>
                  </div>
                );
              })}
            </div>

            {totalVotes > 0 && (
              <div className="mt-8 text-center">
                <p className="text-sm" style={{ color: "var(--av-gray)" }}>
                  Вы отдали{" "}
                  <span className="font-bold" style={{ color: "var(--av-white)" }}>{totalVotes}</span>{" "}
                  из {maxVotes} возможных голосов
                </p>
              </div>
            )}
          </div>
        )}

        {/* РЕЗУЛЬТАТЫ */}
        {section === "results" && (
          <div className="animate-fade-in">
            <div className="mb-8">
              <h2 className="font-display font-bold text-3xl uppercase section-line" style={{ color: "var(--av-white)" }}>
                Результаты
              </h2>
              <p className="mt-3 text-sm" style={{ color: "var(--av-gray)" }}>
                Промежуточные данные · Открытые итоги с 18 мая 2026
              </p>
            </div>

            {isResultsOpen ? (
              <ResultsView votes={votes} />
            ) : (
              <div className="max-w-md mx-auto">
                <div className="rounded-sm border p-8 text-center mb-6"
                  style={{ borderColor: "var(--av-border)", background: "var(--av-card)" }}>
                  <div
                    className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                    style={{ background: "rgba(232,16,42,0.1)", border: "1px solid rgba(232,16,42,0.3)" }}
                  >
                    <Icon name="Lock" size={28} style={{ color: "var(--av-red)" } as React.CSSProperties} />
                  </div>
                  <div className="font-heading font-bold text-xl mb-2" style={{ color: "var(--av-white)" }}>
                    Результаты засекречены
                  </div>
                  <div className="text-sm mb-6" style={{ color: "var(--av-gray)" }}>
                    Открытый доступ с 18 мая 2026.<br />Промежуточные данные — по секретному коду.
                  </div>

                  {!codeUnlocked && (
                    <div className="space-y-3">
                      <input
                        type="password"
                        placeholder="Введите секретный код"
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleCodeSubmit()}
                        className="w-full px-4 py-3 rounded-sm text-center font-heading font-bold text-lg tracking-widest outline-none transition-all"
                        style={{
                          background: "rgba(255,255,255,0.05)",
                          border: `1px solid ${codeError ? "#E8102A" : "var(--av-border)"}`,
                          color: "var(--av-white)",
                        }}
                      />
                      {codeError && (
                        <p className="text-xs animate-fade-in-fast" style={{ color: "var(--av-red)" }}>
                          Неверный код. Попробуйте снова.
                        </p>
                      )}
                      <button
                        onClick={handleCodeSubmit}
                        className="vote-btn w-full py-3 rounded-sm font-heading font-bold text-sm uppercase tracking-wider"
                        style={{ background: "var(--av-red)", color: "#fff" }}
                      >
                        Разблокировать
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {codeUnlocked && !isResultsOpen && (
              <div className="animate-fade-in">
                <div
                  className="flex items-center gap-2 mb-6 px-4 py-3 rounded-sm border w-fit"
                  style={{ borderColor: "rgba(232,16,42,0.3)", background: "rgba(232,16,42,0.08)", color: "var(--av-red)" }}
                >
                  <Icon name="Eye" size={16} />
                  <span className="text-sm font-heading font-semibold">Промежуточные результаты (ваши голоса)</span>
                </div>
                <ResultsView votes={votes} />
              </div>
            )}
          </div>
        )}

        {/* УЧАСТНИКИ */}
        {section === "participants" && (
          <div className="animate-fade-in">
            <div className="mb-8">
              <h2 className="font-display font-bold text-3xl uppercase section-line" style={{ color: "var(--av-white)" }}>
                Участники
              </h2>
              <p className="mt-3 text-sm" style={{ color: "var(--av-gray)" }}>8 стран · Финал AuraVision 2026</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {COUNTRIES.map((country, i) => (
                <div
                  key={country.id}
                  className="animate-fade-in flex items-center gap-5 rounded-sm border p-5"
                  style={{
                    background: "var(--av-card)",
                    borderColor: "var(--av-border)",
                    animationDelay: `${i * 0.08}s`,
                    opacity: 0,
                    animationFillMode: "forwards",
                    transition: "border-color 0.2s",
                  }}
                >
                  <span style={{ fontSize: 48, lineHeight: 1 }}>{country.flag}</span>
                  <div className="flex-1 min-w-0">
                    <div className="font-display font-bold text-xl uppercase" style={{ color: "var(--av-white)" }}>
                      {country.name}
                    </div>
                    <div className="font-heading font-semibold text-base mt-0.5" style={{ color: "var(--av-red)" }}>
                      {country.artist}
                    </div>
                    <div className="text-sm mt-1 truncate" style={{ color: "var(--av-gray)" }}>♪ {country.song}</div>
                  </div>
                  <div className="w-1 self-stretch rounded-full flex-shrink-0" style={{ background: country.color, opacity: 0.6 }} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ПРАВИЛА */}
        {section === "rules" && (
          <div className="animate-fade-in max-w-3xl">
            <div className="mb-8">
              <h2 className="font-display font-bold text-3xl uppercase section-line" style={{ color: "var(--av-white)" }}>
                Правила
              </h2>
            </div>

            <div className="space-y-4">
              {[
                { icon: "Calendar", title: "Период голосования", text: "14 мая 2026 (20:00) — 16 мая 2026 (15:00). Вне этого периода голосование недоступно." },
                { icon: "Vote", title: "Лимит голосов", text: "Каждый аккаунт может отдать максимум 3 голоса за одну страну. Итого 24 голоса на все 8 стран." },
                { icon: "Shield", title: "Защита от ботов", text: "Система учитывает исключительно реальные голоса. Голоса от ботов автоматически исключаются." },
                { icon: "RefreshCw", title: "Обновление данных", text: "Промежуточные результаты обновляются каждые 5 минут с момента старта голосования." },
                { icon: "Lock", title: "Конфиденциальность", text: "Результаты засекречены до 18 мая 2026. Промежуточные данные доступны только по специальному коду." },
                { icon: "Globe", title: "Страны-участницы", text: "В финале участвуют 8 стран: Мальта, Хорватия, Армения, Кипр, Болгария, Албания, Норвегия и Израиль." },
              ].map((rule, i) => (
                <div
                  key={i}
                  className="animate-fade-in flex gap-5 rounded-sm border p-5"
                  style={{
                    background: "var(--av-card)",
                    borderColor: "var(--av-border)",
                    animationDelay: `${i * 0.09}s`,
                    opacity: 0,
                    animationFillMode: "forwards",
                  }}
                >
                  <div className="w-10 h-10 rounded-sm flex items-center justify-center flex-shrink-0"
                    style={{ background: "rgba(232,16,42,0.1)" }}>
                    <Icon name={rule.icon} size={18} style={{ color: "var(--av-red)" } as React.CSSProperties} />
                  </div>
                  <div>
                    <div className="font-heading font-bold text-base mb-1" style={{ color: "var(--av-white)" }}>{rule.title}</div>
                    <div className="text-sm leading-relaxed" style={{ color: "var(--av-gray)" }}>{rule.text}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* ── FOOTER ── */}
      <footer className="border-t mt-20" style={{ borderColor: "var(--av-border)" }}>
        <div className="max-w-6xl mx-auto px-4 py-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="font-display font-bold text-sm uppercase" style={{ color: "var(--av-gray)" }}>
            AuraVision 2026 · Официальное голосование
          </div>
          <div className="text-xs" style={{ color: "var(--av-gray)", opacity: 0.5 }}>
            14–16 мая 2026 · Итоги открыты с 18 мая
          </div>
        </div>
      </footer>
    </div>
  );
}
