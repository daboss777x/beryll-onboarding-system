/**
 * Chunks the SOPs in content/sops, embeds them with OpenAI and writes public.sop_chunks
 * using the Supabase service role.  Run: npm run embed:sops
 *
 * Reads SOPs from content/sops as either:
 *   - *.md files (id = file name, title = first "# " heading), or
 *   - *.ts files exporting Sop objects / arrays ({ id, title, body }).
 * Needs OPENAI_API_KEY, NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (from env or .env.local).
 * Missing env => prints what is missing and exits 0 (no-op).
 *
 * Self-contained on purpose: lib/ai is "server-only" and cannot load under tsx.
 * chunkSop() must stay in sync with lib/ai/coach.ts.
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js";

interface SopLike {
  id: string;
  title: string;
  body: string;
}
interface Chunk {
  id: string;
  sop_id: string;
  title: string;
  text: string;
}

const ROOT = path.resolve(__dirname, "..");
const SOP_DIR = path.join(ROOT, "content", "sops");

function loadEnvFile() {
  const f = path.join(ROOT, ".env.local");
  if (!existsSync(f)) return;
  for (const line of readFileSync(f, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}

export function chunkSop(sop: SopLike, maxChars = 900): Chunk[] {
  const sections = sop.body.split(/\n(?=#{1,3} )/).map((s) => s.trim()).filter(Boolean);
  const pieces: string[] = [];
  for (const sec of sections) {
    if (sec.length <= maxChars) {
      pieces.push(sec);
      continue;
    }
    let buf = "";
    for (const para of sec.split(/\n{2,}/)) {
      if (buf && buf.length + para.length > maxChars) {
        pieces.push(buf);
        buf = "";
      }
      buf = buf ? `${buf}\n\n${para}` : para;
    }
    if (buf) pieces.push(buf);
  }
  return pieces.map((p, n) => ({ id: `${sop.id}#${n}`, sop_id: sop.id, title: sop.title, text: `${sop.title}\n${p}` }));
}

const isSop = (x: unknown): x is SopLike =>
  !!x && typeof x === "object" && typeof (x as SopLike).id === "string" && typeof (x as SopLike).title === "string" && typeof (x as SopLike).body === "string";

async function loadSops(): Promise<SopLike[]> {
  if (!existsSync(SOP_DIR)) return [];
  const out = new Map<string, SopLike>();
  for (const f of readdirSync(SOP_DIR).sort()) {
    const full = path.join(SOP_DIR, f);
    if (f.endsWith(".md")) {
      const body = readFileSync(full, "utf8");
      const title = body.match(/^#\s+(.+)$/m)?.[1]?.trim() ?? f.replace(/\.md$/, "");
      const id = f.replace(/\.md$/, "");
      out.set(id, { id, title, body: body.replace(/^#\s+.+$/m, "").trim() });
    } else if (/\.(ts|mts)$/.test(f) && !f.endsWith(".test.ts") && !f.endsWith(".d.ts")) {
      const mod = (await import(pathToFileURL(full).href)) as Record<string, unknown>;
      for (const v of Object.values(mod)) {
        for (const item of Array.isArray(v) ? v : [v]) if (isSop(item)) out.set(item.id, item);
      }
    }
  }
  return [...out.values()];
}

async function main() {
  loadEnvFile();
  const missing = ["OPENAI_API_KEY", "NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"].filter((k) => !process.env[k]?.trim());
  const sops = await loadSops();
  const chunks = sops.flatMap((s) => chunkSop(s));
  console.log(`[embed-sops] ${sops.length} SOPs -> ${chunks.length} chunks from content/sops`);
  if (missing.length) {
    console.log(`[embed-sops] Skipped: missing ${missing.join(", ")}. Ask Beryl will use in-memory/keyword retrieval instead.`);
    return;
  }
  if (!chunks.length) {
    console.log("[embed-sops] Nothing to embed (content/sops is empty).");
    return;
  }

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY, timeout: 60_000, maxRetries: 2 });
  const model = process.env.OPENAI_EMBED_MODEL?.trim() || "text-embedding-3-small";
  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const rows: (Chunk & { embedding: number[] })[] = [];
  for (let i = 0; i < chunks.length; i += 64) {
    const batch = chunks.slice(i, i + 64);
    const res = await openai.embeddings.create({ model, input: batch.map((c) => c.text) });
    res.data.sort((a, b) => a.index - b.index).forEach((d, j) => rows.push({ ...batch[j], embedding: d.embedding }));
    console.log(`[embed-sops] embedded ${Math.min(i + 64, chunks.length)}/${chunks.length}`);
  }

  const { error: upErr } = await sb.from("sop_chunks").upsert(rows, { onConflict: "id" });
  if (upErr) throw new Error(`upsert failed: ${upErr.message}`);

  const { data: existing, error: selErr } = await sb.from("sop_chunks").select("id");
  if (selErr) throw new Error(`select failed: ${selErr.message}`);
  const keep = new Set(rows.map((r) => r.id));
  const stale = (existing ?? []).map((r: { id: string }) => r.id).filter((id) => !keep.has(id));
  if (stale.length) {
    const { error: delErr } = await sb.from("sop_chunks").delete().in("id", stale);
    if (delErr) throw new Error(`delete failed: ${delErr.message}`);
  }
  console.log(`[embed-sops] Wrote ${rows.length} chunks, removed ${stale.length} stale.`);
}

main().catch((e) => {
  console.error(`[embed-sops] Failed: ${e instanceof Error ? e.message : "unknown error"}`);
  process.exit(1);
});
