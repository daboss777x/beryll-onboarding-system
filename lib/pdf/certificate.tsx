import "server-only";
import { createElement as h, type ReactElement } from "react";
import { Document, Page, Path, StyleSheet, Svg, Text, View, renderToBuffer } from "@react-pdf/renderer";

// Built with createElement rather than JSX: tsconfig keeps JSX as "preserve" for Next, which
// Vitest cannot parse, and this module must be testable (the certificate route test renders it).

export type CertificateStage = "day30" | "day90";

export interface CertificateData {
  stage: CertificateStage;
  hireName: string;
  hireTitle: string;
  date: string; // ISO
  managerName: string;
  certificateId: string;
}

const AQUA = "#2dd4d4";
const AQUA_DEEP = "#0b7f80";
const INK = "#0f1416";
const GREY = "#6b7479";
const GREY_LIGHT = "#e6eaec";

const COPY: Record<CertificateStage, { title: string; line: string; detail: string }> = {
  day30: {
    title: "Certified for Solo Client Contact",
    line: "has completed the Day 30 certification at Beryll Cyber Security",
    detail: "AI client role-play and manager observation passed on the BDM rubric: accuracy, tone, escalation, data handling, no over-promising and next steps.",
  },
  day90: {
    title: "Onboarding Complete: Independent BDM",
    line: "has completed the 90-day onboarding programme at Beryll Cyber Security",
    detail: "Scorecard reviewed and the 90-day conversation signed off with their manager.",
  },
};

const s = StyleSheet.create({
  page: { backgroundColor: "#ffffff", padding: 36, fontFamily: "Helvetica", color: INK },
  frame: { flex: 1, borderWidth: 1.5, borderColor: GREY_LIGHT, borderRadius: 10, padding: 40, position: "relative" },
  band: { position: "absolute", top: 0, left: 0, right: 0, height: 8, backgroundColor: AQUA, borderTopLeftRadius: 9, borderTopRightRadius: 9 },
  header: { flexDirection: "row", alignItems: "center", marginBottom: 34 },
  brand: { marginLeft: 12 },
  brandName: { fontSize: 18, fontFamily: "Helvetica-Bold", letterSpacing: 1 },
  brandSub: { fontSize: 9, color: GREY, letterSpacing: 2, marginTop: 2 },
  eyebrow: { fontSize: 10, color: AQUA_DEEP, letterSpacing: 3, fontFamily: "Helvetica-Bold" },
  title: { fontSize: 30, fontFamily: "Helvetica-Bold", marginTop: 8 },
  presented: { fontSize: 11, color: GREY, marginTop: 26 },
  name: { fontSize: 34, fontFamily: "Helvetica-Bold", marginTop: 6, color: INK },
  role: { fontSize: 11, color: GREY, marginTop: 4 },
  line: { fontSize: 13, marginTop: 16 },
  detail: { fontSize: 10, color: GREY, marginTop: 8, maxWidth: 520, lineHeight: 1.4 },
  footer: { position: "absolute", left: 40, right: 40, bottom: 34, flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end" },
  sigBlock: { width: 220 },
  sigLine: { borderBottomWidth: 1, borderBottomColor: INK, height: 28 },
  sigLabel: { fontSize: 9, color: GREY, marginTop: 5 },
  sigName: { fontSize: 11, marginTop: 2, fontFamily: "Helvetica-Bold" },
  meta: { alignItems: "flex-end" },
  metaLabel: { fontSize: 8, color: GREY, letterSpacing: 1.5 },
  metaValue: { fontSize: 11, marginTop: 2, marginBottom: 8 },
  watermark: { position: "absolute", right: 40, top: 110, opacity: 0.08 },
});

/** Beryll faceted gem mark, drawn with react-pdf SVG primitives (same geometry as GemLogo). */
export function GemMark({ size = 40 }: { size?: number }): ReactElement {
  const line = { fill: "none", stroke: "#ffffff", strokeWidth: 0.8 } as const;
  return h(
    Svg,
    { width: size, height: size, viewBox: "0 0 48 48" },
    h(Path, { d: "M24 3 L10 15 L24 15 Z", fill: "#7fe8e8" }),
    h(Path, { d: "M24 3 L38 15 L24 15 Z", fill: AQUA }),
    h(Path, { d: "M10 15 L3 17 L24 45 L24 15 Z", fill: "#17a9ab" }),
    h(Path, { d: "M38 15 L45 17 L24 45 L24 15 Z", fill: AQUA_DEEP }),
    h(Path, { d: "M3 17 L10 15 L24 15 L38 15 L45 17 L24 45 Z", ...line, strokeOpacity: 0.6 }),
    h(Path, { d: "M24 3 L24 15 M10 15 L24 45 M38 15 L24 45", ...line, strokeOpacity: 0.5 }),
  );
}

export function formatCertDate(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString("en-IE", { day: "numeric", month: "long", year: "numeric", timeZone: "Europe/Dublin" });
}

export function CertificateDocument({ data }: { data: CertificateData }): ReactElement {
  const c = COPY[data.stage];
  const t = (style: (typeof s)[keyof typeof s], text: string) => h(Text, { style }, text);
  return h(
    Document,
    { title: `${c.title} - ${data.hireName}`, author: "Beryll Cyber Security", subject: "Beryll Onboard certificate" },
    h(
      Page,
      { size: "A4", orientation: "landscape", style: s.page },
      h(
        View,
        { style: s.frame },
        h(View, { style: s.band }),
        h(View, { style: s.watermark }, h(GemMark, { size: 260 })),
        h(View, { style: s.header }, h(GemMark, { size: 40 }), h(View, { style: s.brand }, t(s.brandName, "BERYLL"), t(s.brandSub, "CYBER SECURITY · DUBLIN"))),
        t(s.eyebrow, "CERTIFICATE"),
        t(s.title, c.title),
        t(s.presented, "This certifies that"),
        t(s.name, data.hireName),
        t(s.role, data.hireTitle),
        t(s.line, `${c.line}.`),
        t(s.detail, c.detail),
        h(
          View,
          { style: s.footer },
          h(View, { style: s.sigBlock }, h(View, { style: s.sigLine }), t(s.sigLabel, "Manager signature"), t(s.sigName, data.managerName)),
          h(View, { style: s.meta }, t(s.metaLabel, "DATE"), t(s.metaValue, formatCertDate(data.date)), t(s.metaLabel, "CERTIFICATE ID"), t(s.metaValue, data.certificateId)),
        ),
      ),
    ),
  );
}

export async function renderCertificatePdf(data: CertificateData): Promise<Buffer> {
  return renderToBuffer(h(CertificateDocument, { data }) as Parameters<typeof renderToBuffer>[0]);
}
