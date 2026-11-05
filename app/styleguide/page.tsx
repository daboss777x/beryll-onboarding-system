"use client";

import { useState, type ReactNode } from "react";
import { Bell, Gauge, Plus, Trash2, Users } from "lucide-react";
import { FacetNode, GemLogo } from "@/components/brand";
import {
  Avatar, Badge, Button, Checkbox, Dialog, EmptyState, GlassCard, Input, ProgressBar, ProgressRing, RankBadge, Select,
  Sheet, Skeleton, Stat, Stepper, Tabs, Textarea, ThemeToggle, Tooltip, TrophyBadge, XpBar, useToast, useTheme,
} from "@/components/ui";

const swatches = [
  "bg", "bg-elevated", "surface", "border", "text", "muted", "accent", "accent-soft", "aqua", "aqua-deep",
  "gold", "success", "warn", "danger", "grey-100", "grey-300", "grey-500", "grey-700", "grey-900",
];

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-4">
      <h2 className="text-xl font-semibold">{title}</h2>
      {children}
    </section>
  );
}

export default function StyleguidePage() {
  const [dialog, setDialog] = useState(false);
  const [sheet, setSheet] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();

  return (
    <main className="mx-auto max-w-5xl space-y-12 px-4 py-8 sm:px-6 sm:py-12">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <GemLogo size={40} />
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted">Theme: {theme}</span>
          <Button size="sm" variant="secondary" onClick={() => setTheme("light")}>Light</Button>
          <Button size="sm" variant="secondary" onClick={() => setTheme("dark")}>Dark</Button>
          <ThemeToggle />
        </div>
      </header>

      <GlassCard variant="prism" padding="lg">
        <h1 className="text-3xl font-semibold sm:text-4xl">Beryll design system</h1>
        <p className="mt-2 max-w-xl text-muted">Glass surfaces, aqua accents, gem motifs. Toggle the theme above to check both modes.</p>
      </GlassCard>

      <Section title="Colour tokens">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-5">
          {swatches.map((s) => (
            <div key={s} className="glass rounded-lg p-2">
              <div className="h-10 rounded-md border border-border" style={{ background: `var(--${s})` }} />
              <p className="mt-1.5 text-xs font-medium">--{s}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Brand">
        <div className="flex flex-wrap items-center gap-8">
          <GemLogo size={48} />
          <GemLogo size={32} variant="mono" />
          <GemLogo size={36} withWordmark={false} />
        </div>
        <div className="flex flex-wrap items-center gap-6">
          <FacetNode state="done" label="Stage 1" />
          <FacetNode state="active" label="Stage 2" onClick={() => toast({ title: "Stage 2 opened", tone: "info" })}>2</FacetNode>
          <FacetNode state="available" label="Stage 3">3</FacetNode>
          <FacetNode state="locked" label="Stage 4" />
        </div>
      </Section>

      <Section title="Buttons and badges">
        <div className="flex flex-wrap items-center gap-3">
          <Button>Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="danger" leftIcon={<Trash2 size={16} />}>Delete</Button>
          <Button size="sm">Small</Button>
          <Button size="lg" rightIcon={<Plus size={18} />}>Large</Button>
          <Button disabled>Disabled</Button>
          <Button loading={loading} onClick={() => { setLoading(true); setTimeout(() => setLoading(false), 1500); }}>
            {loading ? "Saving" : "Click to load"}
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge>Neutral</Badge>
          <Badge tone="aqua" dot>Active</Badge>
          <Badge tone="success">Done</Badge>
          <Badge tone="warn">At risk</Badge>
          <Badge tone="danger">Overdue</Badge>
        </div>
      </Section>

      <Section title="Progress, XP, steps">
        <GlassCard className="grid gap-6 sm:grid-cols-[1fr_auto] sm:items-center">
          <div className="space-y-5">
            <ProgressBar value={64} label="Stage progress" showValue />
            <ProgressBar value={30} size="sm" label="Thin" />
            <XpBar xp={340} nextAt={500} levelLabel="Co-pilot" nextLabel="Solo" />
          </div>
          <ProgressRing value={72} size={96} label="Week progress" />
        </GlassCard>
        <GlassCard><Stepper current={2} steps={[{ label: "Welcome", description: "Pre-boarding" }, { label: "Learn", description: "Contracts" }, { label: "Practise", description: "Walkthroughs" }, { label: "Certify" }]} /></GlassCard>
        <GlassCard><Stepper orientation="vertical" current={1} steps={[{ label: "Day 1", description: "Set up accounts" }, { label: "Week 1", description: "Shadow a call" }, { label: "Day 30" }]} /></GlassCard>
      </Section>

      <Section title="Forms">
        <GlassCard className="grid gap-4 sm:grid-cols-2">
          <Input label="Full name" placeholder="Aoife Murphy" hint="As on your contract" />
          <Input label="Email" type="email" defaultValue="not-an-email" error="Enter a valid email address" />
          <Select label="Team" defaultValue="bd"><option value="bd">Business development</option><option value="sec">Security</option></Select>
          <Input label="Disabled" disabled defaultValue="Locked" />
          <Textarea label="Notes" placeholder="Anything your buddy should know" wrapperClassName="sm:col-span-2" />
          <Checkbox label="I have read the data policy" description="Required before Day 1" />
          <Checkbox label="Checked example" defaultChecked />
        </GlassCard>
      </Section>

      <Section title="Tabs, tooltip, overlays, toast">
        <Tabs
          aria-label="Example tabs"
          items={[
            { value: "a", label: "Overview", content: <GlassCard>Overview panel content.</GlassCard> },
            { value: "b", label: "Tasks", content: <GlassCard>Tasks panel content.</GlassCard> },
            { value: "c", label: "Disabled", disabled: true },
          ]}
        />
        <div className="flex flex-wrap items-center gap-3">
          <Tooltip content="Notifications"><Button variant="secondary" aria-label="Notifications" size="sm"><Bell size={16} /></Button></Tooltip>
          <Button variant="secondary" onClick={() => setDialog(true)}>Open dialog</Button>
          <Button variant="secondary" onClick={() => setSheet(true)}>Open sheet</Button>
          <Button onClick={() => toast({ title: "Task complete", description: "+25 XP", tone: "success" })}>Success toast</Button>
          <Button variant="ghost" onClick={() => toast({ title: "Check-in overdue", tone: "warn" })}>Warn toast</Button>
        </div>
        <Dialog open={dialog} onClose={() => setDialog(false)} title="Confirm submission" description="You can edit your answers until your buddy reviews them." footer={<><Button variant="ghost" onClick={() => setDialog(false)}>Cancel</Button><Button onClick={() => setDialog(false)}>Submit</Button></>}>
          <Input label="Add a note" placeholder="Optional" />
        </Dialog>
        <Sheet open={sheet} onClose={() => setSheet(false)} title="Details" description="Side panel on desktop, bottom sheet on phones.">
          <p>Sheet content goes here.</p>
        </Sheet>
      </Section>

      <Section title="People, KPIs, ranks">
        <div className="flex flex-wrap items-center gap-3">
          <Avatar name="Aoife Murphy" /><Avatar name="Luca Rossi" /><Avatar name="Sofia Alvarez" /><Avatar name="Tomás Ó Briain" /><Avatar name="Nadia" size={56} />
        </div>
        <div className="flex flex-wrap gap-3">
          <RankBadge rank="observer" /><RankBadge rank="copilot" /><RankBadge rank="solo" /><RankBadge rank="independent" />
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <Stat label="Active hires" value="5" icon={<Users size={18} />} delta="+2" hint="this quarter" />
          <Stat label="Avg. day to Solo" value="41" icon={<Gauge size={18} />} delta="-3d" hint="vs last cohort" />
          <Stat label="At risk" value="1" delta="0" trend="flat" />
        </div>
      </Section>

      <Section title="Trophies (the only place gold appears)">
        <GlassCard className="flex flex-wrap justify-around gap-6">
          <TrophyBadge tier="facet" title="First Steps" description="Finish Day 1" size="sm" />
          <TrophyBadge tier="gem" title="Clause Hunter" description="Find 5 risky clauses" />
          <TrophyBadge tier="crown" title="Certified for Solo" description="Pass certification" size="lg" celebrate />
          <TrophyBadge tier="gem" title="Connector" description="Complete 3 quests" locked />
        </GlassCard>
      </Section>

      <Section title="Empty and loading">
        <div className="grid gap-4 sm:grid-cols-2">
          <EmptyState title="No trophies yet" description="Complete your first task to earn one." action={<Button size="sm">Go to Today</Button>} />
          <GlassCard className="space-y-3">
            <div className="flex items-center gap-3"><Skeleton className="size-10 rounded-full" /><div className="flex-1 space-y-2"><Skeleton className="h-3 w-1/2" /><Skeleton className="h-3 w-3/4" /></div></div>
            <Skeleton className="h-20" />
          </GlassCard>
        </div>
      </Section>
    </main>
  );
}
