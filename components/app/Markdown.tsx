import type { ReactNode } from "react";
import { cn } from "@/components/ui";

/**
 * Tiny, safe markdown renderer for trusted lesson content (no raw HTML).
 * Supports: # headings, paragraphs, - / 1. lists, | tables |, > quotes, **bold**, *italic*, `code`, [links](url).
 */
export function Markdown({ source, className }: { source: string; className?: string }) {
  return <div className={cn("flex flex-col gap-3 text-[15px] leading-relaxed", className)}>{blocks(source)}</div>;
}

function inline(text: string, keyPrefix = "i"): ReactNode[] {
  const out: ReactNode[] = [];
  const re = /(\*\*([^*]+)\*\*|\*([^*]+)\*|`([^`]+)`|\[([^\]]+)\]\(([^)\s]+)\))/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let n = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const k = `${keyPrefix}-${n++}`;
    if (m[2]) out.push(<strong key={k} className="font-semibold">{m[2]}</strong>);
    else if (m[3]) out.push(<em key={k}>{m[3]}</em>);
    else if (m[4]) out.push(<code key={k} className="rounded bg-surface-strong px-1 py-0.5 text-[0.9em]">{m[4]}</code>);
    else if (m[5]) {
      const href = m[6];
      const safe = href.startsWith("/") || href.startsWith("https://") || href.startsWith("#");
      out.push(
        safe ? (
          <a key={k} href={href} className="font-medium text-accent underline underline-offset-2" {...(href.startsWith("https://") ? { target: "_blank", rel: "noreferrer" } : {})}>
            {m[5]}
          </a>
        ) : (
          m[5]
        ),
      );
    }
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

const cells = (row: string) => row.trim().replace(/^\|/, "").replace(/\|$/, "").split("|").map((c) => c.trim());

function blocks(src: string): ReactNode[] {
  const lines = src.replace(/\r\n/g, "\n").split("\n");
  const out: ReactNode[] = [];
  let i = 0;
  let key = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) {
      i++;
      continue;
    }
    const k = `b${key++}`;
    const h = /^(#{1,4})\s+(.*)$/.exec(line);
    if (h) {
      const level = h[1].length;
      const cls = level <= 2 ? "font-display text-lg font-semibold mt-2" : "font-semibold mt-1";
      out.push(level <= 2 ? <h3 key={k} className={cls}>{inline(h[2], k)}</h3> : <h4 key={k} className={cls}>{inline(h[2], k)}</h4>);
      i++;
      continue;
    }
    if (line.trim().startsWith("|")) {
      const rows: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith("|")) rows.push(lines[i++]);
      const [head, sep, ...rest] = rows;
      const hasHead = sep && /^\|?\s*:?-{2,}/.test(sep.trim());
      const body = hasHead ? rest : rows.slice(1);
      out.push(
        <div key={k} className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full min-w-[20rem] text-left text-sm">
            <thead className="bg-surface-strong">
              <tr>
                {cells(head).map((c, j) => (
                  <th key={j} scope="col" className="px-3 py-2 font-semibold">
                    {inline(c, `${k}h${j}`)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {body.map((r, ri) => (
                <tr key={ri} className="border-t border-border">
                  {cells(r).map((c, j) => (
                    <td key={j} className="px-3 py-2 align-top">
                      {inline(c, `${k}r${ri}c${j}`)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>,
      );
      continue;
    }
    if (/^\s*([-*]|\d+\.)\s+/.test(line)) {
      const ordered = /^\s*\d+\./.test(line);
      const items: string[] = [];
      while (i < lines.length && /^\s*([-*]|\d+\.)\s+/.test(lines[i])) items.push(lines[i++].replace(/^\s*([-*]|\d+\.)\s+/, ""));
      const Tag = ordered ? "ol" : "ul";
      out.push(
        <Tag key={k} className={cn("flex flex-col gap-1.5 pl-5", ordered ? "list-decimal" : "list-disc")}>
          {items.map((it, j) => (
            <li key={j}>{inline(it, `${k}l${j}`)}</li>
          ))}
        </Tag>,
      );
      continue;
    }
    if (line.startsWith(">")) {
      const q: string[] = [];
      while (i < lines.length && lines[i].startsWith(">")) q.push(lines[i++].replace(/^>\s?/, ""));
      out.push(
        <blockquote key={k} className="border-l-2 border-accent pl-4 text-muted italic">
          {inline(q.join(" "), k)}
        </blockquote>,
      );
      continue;
    }
    const para: string[] = [];
    while (i < lines.length && lines[i].trim() && !/^(#{1,4}\s|\||>|\s*([-*]|\d+\.)\s)/.test(lines[i])) para.push(lines[i++]);
    if (!para.length) para.push(lines[i++]);
    out.push(<p key={k}>{inline(para.join(" "), k)}</p>);
  }
  return out;
}
