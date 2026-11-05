import { Badge, type BadgeTone } from "@/components/ui";
import { STATUS_LABEL, type ContractStatus } from "./types";

const statusTone: Record<ContractStatus, BadgeTone> = {
  draft: "neutral",
  legal_review: "warn",
  engineer_signoff: "aqua",
  sent: "aqua",
  signed: "success",
};

export function StatusBadge({ status }: { status: ContractStatus }) {
  return (
    <Badge tone={statusTone[status]} dot>
      {STATUS_LABEL[status]}
    </Badge>
  );
}

/** "€16,800". Formatted by hand, not Intl, so the server and the browser always print the same text. */
export const formatEur = (n: number) => (n > 0 ? `€${String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}` : "—");

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
/** Timezone-independent date label from an ISO string (avoids SSR/client hydration drift). */
export function formatDay(iso: string) {
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  if (!y || !m || !d) return iso;
  return `${d} ${MONTHS[m - 1]} ${y}`;
}
