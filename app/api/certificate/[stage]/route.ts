import { getRepo } from "@/lib/data";
import { jsonError } from "@/lib/ai/guard";
import { apiUser, serverError } from "@/lib/ai/route";
import { renderCertificatePdf, type CertificateStage } from "@/lib/pdf/certificate";
import { checkCertificate } from "@/lib/pdf/eligibility";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const STAGES: readonly CertificateStage[] = ["day30", "day90"];

export async function GET(_req: Request, ctx: { params: Promise<{ stage: string }> }) {
  const { stage } = await ctx.params;
  if (!STAGES.includes(stage as CertificateStage)) return jsonError(404, "Unknown certificate. Use day30 or day90.");
  const user = await apiUser("hire");
  if (user instanceof Response) return user;

  try {
    const repo = await getRepo();
    const elig = await checkCertificate(repo, user, stage as CertificateStage);
    if (!elig.ok) return jsonError(403, elig.reason, { code: "milestone_not_reached" });
    const pdf = await renderCertificatePdf(elig.data);
    const file = `beryll-certificate-${stage}-${user.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.pdf`;
    return new Response(new Uint8Array(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${file}"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (e) {
    return serverError("certificate", e);
  }
}
