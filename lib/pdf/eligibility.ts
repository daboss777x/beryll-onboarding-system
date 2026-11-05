import "server-only";
import { createHash } from "node:crypto";
import type { Repository } from "../data/repo";
import type { Profile } from "../types";
import type { CertificateData, CertificateStage } from "./certificate";

export const DAY90_SIGNOFF_TASK = "d90-conversation";

export type Eligibility = { ok: true; data: CertificateData } | { ok: false; reason: string };

export function certificateId(hireId: string, stage: CertificateStage, date: string): string {
  const h = createHash("sha256").update(`${hireId}|${stage}|${date}`).digest("hex").slice(0, 8).toUpperCase();
  return `BRL-${stage.toUpperCase()}-${h}`;
}

async function nameOf(repo: Pick<Repository, "getProfile">, id: string | undefined): Promise<string | null> {
  if (!id) return null;
  return (await repo.getProfile(id).catch(() => null))?.name ?? null;
}

/**
 * day30: the days8-30 certification is "passed".
 * day90: a days61-90 certification is "passed", or the 90-day conversation task is done
 *        (TODO(Davis): confirm how the manager screen records the day-90 sign-off).
 */
export async function checkCertificate(
  repo: Pick<Repository, "getCertification" | "getTaskProgress" | "getProfile">,
  hire: Profile,
  stage: CertificateStage,
): Promise<Eligibility> {
  let date: string | undefined;
  let signer: string | undefined;
  if (stage === "day30") {
    const c = await repo.getCertification(hire.id, "days8-30");
    if (c?.status !== "passed") return { ok: false, reason: "Your Day 30 certification isn't passed yet." };
    date = c.signedAt ?? c.updatedAt;
    signer = c.signedBy;
  } else {
    const c = await repo.getCertification(hire.id, "days61-90");
    if (c?.status === "passed") {
      date = c.signedAt ?? c.updatedAt;
      signer = c.signedBy;
    } else {
      const t = (await repo.getTaskProgress(hire.id)).find((p) => p.taskId === DAY90_SIGNOFF_TASK);
      if (t?.status !== "done") return { ok: false, reason: "Your 90-day sign-off hasn't happened yet." };
      date = t.completedAt ?? new Date().toISOString();
    }
  }
  const managerName = (await nameOf(repo, signer)) ?? (await nameOf(repo, hire.managerId)) ?? "Line manager";
  return {
    ok: true,
    data: { stage, hireName: hire.name, hireTitle: hire.title, date, managerName, certificateId: certificateId(hire.id, stage, date) },
  };
}
