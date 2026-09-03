import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState, type ReactNode } from "react";
import {
  Mail,
  CalendarCheck2,
  Sparkles,
  Gem,
  Loader2,
  Menu,
  X,
  Copy,
  Check,
} from "lucide-react";
import {
  generateReviewResponse,
  generateDailyPlan,
  generateTrendInsights,
} from "@/lib/ai.functions";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Glossy Nails AI Co-Pilot — Salon Owner Dashboard" },
      {
        name: "description",
        content:
          "AI co-pilot for nail salon owners: resolve reviews & complaints, plan the daily schedule, and turn nail-art trends into ready-to-use marketing.",
      },
      { property: "og:title", content: "Glossy Nails AI Co-Pilot" },
      {
        property: "og:description",
        content:
          "Review & complaint solver, daily salon scheduler, and trend insights — an AI co-pilot for nail salon owners.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

/* ---------------- Markdown-lite renderer ---------------- */

function renderInline(text: string): ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) =>
    part.startsWith("**") && part.endsWith("**") ? (
      <strong key={i} className="font-semibold text-foreground">
        {part.slice(2, -2)}
      </strong>
    ) : (
      <span key={i}>{part}</span>
    ),
  );
}

function MarkdownLite({ text }: { text: string }) {
  const lines = text.split("\n");
  const out: ReactNode[] = [];
  let list: string[] = [];
  let key = 0;

  const flushList = () => {
    if (list.length === 0) return;
    out.push(
      <ul key={key++} className="my-2 list-disc space-y-1 pl-5 text-sm text-foreground/90">
        {list.map((item, i) => (
          <li key={i}>{renderInline(item)}</li>
        ))}
      </ul>,
    );
    list = [];
  };

  for (const raw of lines) {
    const line = raw.trimEnd();
    const t = line.trim();
    if (/^[-*•]\s+/.test(t)) {
      list.push(t.replace(/^[-*•]\s+/, ""));
      continue;
    }
    if (/^\d+[.)]\s+/.test(t)) {
      list.push(t.replace(/^\d+[.)]\s+/, ""));
      continue;
    }
    flushList();
    if (!t) {
      out.push(<div key={key++} className="h-2" />);
    } else if (t.startsWith("### ")) {
      out.push(
        <h4 key={key++} className="mt-4 text-base font-semibold text-foreground">
          {renderInline(t.slice(4))}
        </h4>,
      );
    } else if (t.startsWith("## ")) {
      out.push(
        <h3
          key={key++}
          className="mt-5 border-b border-border pb-1.5 text-lg font-semibold text-primary"
        >
          {renderInline(t.slice(3))}
        </h3>,
      );
    } else if (t.startsWith("# ")) {
      out.push(
        <h3 key={key++} className="mt-4 text-xl font-semibold text-foreground">
          {renderInline(t.slice(2))}
        </h3>,
      );
    } else if (/^---+$/.test(t)) {
      out.push(<hr key={key++} className="my-3 border-border" />);
    } else {
      out.push(
        <p key={key++} className="text-sm leading-relaxed text-foreground/90">
          {renderInline(t)}
        </p>,
      );
    }
  }
  flushList();
  return <div>{out}</div>;
}

/* ---------------- Shared UI ---------------- */

function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      {children}
    </label>
  );
}

function GenerateButton({
  onClick,
  loading,
  children,
}: {
  onClick: () => void;
  loading: boolean;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      className="btn-glossy inline-flex w-full items-center justify-center gap-2 px-5 py-3 text-sm font-semibold sm:w-auto"
    >
      {loading ? (
        <span className="spinner" aria-hidden />
      ) : (
        <Sparkles className="h-4 w-4" aria-hidden />
      )}
      {loading ? "Generating…" : children}
    </button>
  );
}

function ResultPanel({
  loading,
  result,
  error,
  emptyHint,
}: {
  loading: boolean;
  result: string;
  error: string;
  emptyHint: string;
}) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(result);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable */
    }
  };

  return (
    <div className="result-panel flex min-h-[320px] flex-col p-5 sm:p-6">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          AI Output
        </h3>
        {result && !loading && (
          <button
            type="button"
            onClick={copy}
            className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-2.5 py-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? "Copied" : "Copy"}
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin text-primary" aria-hidden />
          <p className="text-sm">Polishing your result…</p>
        </div>
      ) : error ? (
        <div className="flex flex-1 items-center justify-center">
          <p className="max-w-md rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-center text-sm text-destructive">
            {error}
          </p>
        </div>
      ) : result ? (
        <div className="animate-fade-up">
          <MarkdownLite text={result} />
        </div>
      ) : (
        <div className="flex flex-1 items-center justify-center">
          <p className="max-w-xs text-center text-sm text-muted-foreground">{emptyHint}</p>
        </div>
      )}
    </div>
  );
}

function ModuleHeader({
  icon,
  title,
  subtitle,
}: {
  icon: ReactNode;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="mb-6 flex items-start gap-4">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-secondary text-primary">
        {icon}
      </div>
      <div>
        <h2 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
          {title}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
      </div>
    </div>
  );
}

/* ---------------- Module 1: Review & Complaint Solver ---------------- */

const AUDIENCES = ["Client", "Manager", "Team"] as const;
const TONES = ["Formal Apology", "Informal/Friendly", "Persuasive/Promotional"] as const;

function ReviewSolver() {
  const run = useServerFn(generateReviewResponse);
  const [review, setReview] = useState("");
  const [audience, setAudience] = useState<(typeof AUDIENCES)[number]>("Client");
  const [tone, setTone] = useState<(typeof TONES)[number]>("Formal Apology");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");
  const [error, setError] = useState("");

  const generate = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await run({ data: { review, audience, tone } });
      setResult(res.result);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section>
      <ModuleHeader
        icon={<Mail className="h-5 w-5" aria-hidden />}
        title="Review & Complaint Solver"
        subtitle="Turn any customer review or complaint into a polished, ready-to-send email."
      />
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="surface-card space-y-4 p-5 sm:p-6">
          <Field label="Customer review or complaint">
            <textarea
              value={review}
              onChange={(e) => setReview(e.target.value)}
              rows={7}
              placeholder="Paste the customer's review or complaint here… e.g. “My gel manicure chipped after two days and no one answered the phone.”"
              className="field-input w-full resize-y p-3 text-sm"
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Audience type">
              <select
                value={audience}
                onChange={(e) => setAudience(e.target.value as (typeof AUDIENCES)[number])}
                className="field-input w-full p-3 text-sm"
              >
                {AUDIENCES.map((a) => (
                  <option key={a}>{a}</option>
                ))}
              </select>
            </Field>
            <Field label="Tone variation">
              <select
                value={tone}
                onChange={(e) => setTone(e.target.value as (typeof TONES)[number])}
                className="field-input w-full p-3 text-sm"
              >
                {TONES.map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </Field>
          </div>
          <GenerateButton onClick={generate} loading={loading}>
            Generate Response
          </GenerateButton>
        </div>
        <ResultPanel
          loading={loading}
          result={result}
          error={error}
          emptyHint="Your tailored email response will appear here once you generate it."
        />
      </div>
    </section>
  );
}

/* ---------------- Module 2: Daily Checklist & Scheduler ---------------- */

function DailyPlanner() {
  const run = useServerFn(generateDailyPlan);
  const [staff, setStaff] = useState("");
  const [tasks, setTasks] = useState("");
  const [busyHours, setBusyHours] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");
  const [error, setError] = useState("");

  const generate = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await run({ data: { staff, tasks, busyHours } });
      setResult(res.result);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section>
      <ModuleHeader
        icon={<CalendarCheck2 className="h-5 w-5" aria-hidden />}
        title="Daily Salon Checklist & Scheduler"
        subtitle="Distribute the day's tasks across your team and get a peak-hours game plan."
      />
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="surface-card space-y-4 p-5 sm:p-6">
          <Field label="Available staff members">
            <textarea
              value={staff}
              onChange={(e) => setStaff(e.target.value)}
              rows={3}
              placeholder={"e.g. Thandi (senior nail tech), Lerato (nail tech), Sipho (front desk / junior tech)"}
              className="field-input w-full resize-y p-3 text-sm"
            />
          </Field>
          <Field label="High-priority salon tasks">
            <textarea
              value={tasks}
              onChange={(e) => setTasks(e.target.value)}
              rows={4}
              placeholder={"e.g. Restock gel polish, deep-clean stations, confirm tomorrow's bookings, post today's nail set to Instagram, sterilize tools"}
              className="field-input w-full resize-y p-3 text-sm"
            />
          </Field>
          <Field label="Estimated busy hours">
            <input
              value={busyHours}
              onChange={(e) => setBusyHours(e.target.value)}
              placeholder="e.g. 12:00–15:00 and 17:00–19:00"
              className="field-input w-full p-3 text-sm"
            />
          </Field>
          <GenerateButton onClick={generate} loading={loading}>
            Generate Daily Plan
          </GenerateButton>
        </div>
        <ResultPanel
          loading={loading}
          result={result}
          error={error}
          emptyHint="Your structured daily schedule — including a Time Optimization Strategy — will appear here."
        />
      </div>
    </section>
  );
}

/* ---------------- Module 3: Trend Design Generator ---------------- */

function TrendInsights() {
  const run = useServerFn(generateTrendInsights);
  const [theme, setTheme] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");
  const [error, setError] = useState("");

  const generate = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await run({ data: { theme } });
      setResult(res.result);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section>
      <ModuleHeader
        icon={<Sparkles className="h-5 w-5" aria-hidden />}
        title="Y2K Festival Design Generator & Insights"
        subtitle="Decode any nail-art trend into techniques, materials, and ready-to-post marketing."
      />
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="surface-card space-y-4 p-5 sm:p-6">
          <Field label="Trend theme or client request">
            <textarea
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
              rows={5}
              placeholder='e.g. "Y2K Festival Vibes — chrome, butterflies, iridescent gems for a music festival weekend"'
              className="field-input w-full resize-y p-3 text-sm"
            />
          </Field>
          <GenerateButton onClick={generate} loading={loading}>
            Extract Insights
          </GenerateButton>
        </div>
        <ResultPanel
          loading={loading}
          result={result}
          error={error}
          emptyHint="Aesthetic summary, technique & material recommendations, and social media copy will appear here."
        />
      </div>
    </section>
  );
}

/* ---------------- Shell ---------------- */

const MODULES = [
  { id: "reviews", label: "Review & Complaint Solver", icon: Mail },
  { id: "planner", label: "Checklist & Scheduler", icon: CalendarCheck2 },
  { id: "trends", label: "Design Generator & Insights", icon: Sparkles },
] as const;

type ModuleId = (typeof MODULES)[number]["id"];

function Index() {
  const [active, setActive] = useState<ModuleId>("reviews");
  const [menuOpen, setMenuOpen] = useState(false);

  const nav = (
    <nav className="flex flex-col gap-1.5">
      {MODULES.map((m) => {
        const Icon = m.icon;
        const isActive = active === m.id;
        return (
          <button
            key={m.id}
            type="button"
            onClick={() => {
              setActive(m.id);
              setMenuOpen(false);
            }}
            className={`flex items-center gap-3 rounded-xl px-3.5 py-3 text-left text-sm font-medium transition-colors ${
              isActive
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:bg-secondary hover:text-foreground"
            }`}
            aria-current={isActive ? "page" : undefined}
          >
            <Icon className="h-4.5 w-4.5 shrink-0" aria-hidden />
            <span className="leading-snug">{m.label}</span>
          </button>
        );
      })}
    </nav>
  );

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <div className="flex flex-1">
        {/* Desktop sidebar */}
        <aside className="sticky top-0 hidden h-screen w-72 shrink-0 flex-col border-r border-border bg-card md:flex">
          <div className="flex items-center gap-3 border-b border-border px-5 py-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Gem className="h-5 w-5" aria-hidden />
            </div>
            <div>
              <h1 className="text-lg font-semibold leading-tight tracking-tight text-foreground">
                Glossy Nails
              </h1>
              <p className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
                AI Co-Pilot
              </p>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-4">{nav}</div>
          <div className="border-t border-border p-4">
            <p className="rounded-xl bg-champagne px-3.5 py-3 text-xs leading-relaxed text-champagne-foreground">
              Your salon's AI assistant — replies, schedules, and trend research in seconds.
            </p>
          </div>
        </aside>

        {/* Main column */}
        <div className="flex min-w-0 flex-1 flex-col">
          {/* Mobile top bar */}
          <header className="sticky top-0 z-20 flex items-center justify-between border-b border-border bg-card/95 px-4 py-3 backdrop-blur md:hidden">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Gem className="h-4 w-4" aria-hidden />
              </div>
              <span className="text-base font-semibold text-foreground">
                Glossy Nails AI Co-Pilot
              </span>
            </div>
            <button
              type="button"
              onClick={() => setMenuOpen((o) => !o)}
              className="rounded-lg border border-border p-2 text-foreground"
              aria-label={menuOpen ? "Close menu" : "Open menu"}
            >
              {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </header>
          {menuOpen && (
            <div className="border-b border-border bg-card p-3 md:hidden">{nav}</div>
          )}

          <main className="mx-auto w-full max-w-5xl flex-1 px-4 pb-24 pt-8 sm:px-8">
            {active === "reviews" && <ReviewSolver />}
            {active === "planner" && <DailyPlanner />}
            {active === "trends" && <TrendInsights />}
          </main>
        </div>
      </div>

      {/* Permanent disclaimer footer */}
      <footer className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-primary px-4 py-3">
        <p className="mx-auto max-w-5xl text-center text-xs font-medium leading-snug text-primary-foreground sm:text-sm">
          Disclaimer: Responsible AI - AI-generated text should be reviewed before sending to
          clients.
        </p>
      </footer>
    </div>
  );
}
