"use client";

type SummaryFramingProps = {
  executiveSnapshot: string[];
  readinessGaps: string[];
  topBlockers: string[];
  recommendedNextActions: string[];
  traceabilityHighlights: string[];
  implementationProvenance: string[];
};

export function SummaryFraming({
  executiveSnapshot,
  readinessGaps,
  topBlockers,
  recommendedNextActions,
  traceabilityHighlights,
  implementationProvenance,
}: SummaryFramingProps) {
  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
      <FramingPanel title="Executive Snapshot" eyebrow="At a glance">
        <List items={executiveSnapshot} />
      </FramingPanel>

      <FramingPanel title="Readiness Gap" eyebrow="What blocks handoff">
        <List items={readinessGaps} />
      </FramingPanel>

      <FramingPanel title="Top Blockers" eyebrow="Fix these first">
        <List items={topBlockers} />
      </FramingPanel>

      <FramingPanel title="Recommended Next Actions" eyebrow="Pragmatic planner">
        <List items={recommendedNextActions} />
      </FramingPanel>

      <FramingPanel title="Traceability Highlights" eyebrow="Coverage signals">
        <List items={traceabilityHighlights} />
      </FramingPanel>

      <FramingPanel title="Implementation Provenance" eyebrow="Why tasks exist">
        <List items={implementationProvenance} />
      </FramingPanel>
    </div>
  );
}

function FramingPanel({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-border/70 bg-background/60 p-6 shadow-sm">
      <p className="text-readable-xs uppercase tracking-[0.16em] text-muted-foreground">
        {eyebrow}
      </p>
      <h3 className="mt-2 text-lg font-semibold text-foreground">{title}</h3>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function List({ items }: { items: string[] }) {
  if (items.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">No signal available yet.</p>
    );
  }

  return (
    <ul className="space-y-3">
      {items.map((item, index) => (
        <li
          key={`${item}-${index}`}
          className="rounded-2xl border border-border/60 bg-background/80 px-4 py-3 text-sm leading-6 text-foreground"
        >
          {item}
        </li>
      ))}
    </ul>
  );
}
