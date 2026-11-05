import "server-only";
import { buildDemoData, DEMO_IDS, DEMO_PASSWORD } from "../../content/demo";
import { contracts as SAMPLE_CONTRACTS } from "../../content/demo-contracts";
import { staff } from "../../content/staff";
import type { StaffMember } from "../types";

/**
 * Seed source data (spec C9). Everything comes from Tom's content/ folder;
 * lib/data/seed.ts adapts it to the repository row shapes.
 */
export { buildDemoData, DEMO_IDS, SAMPLE_CONTRACTS };

/** Staff directory comes from content/staff.ts. */
export const STAFF: StaffMember[] = staff;

/** Used when DEMO_PASSWORD is not set in env. */
export const DEMO_PASSWORD_FALLBACK = DEMO_PASSWORD;
