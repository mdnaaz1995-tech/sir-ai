export type SectionKind =
  | "vision"
  | "prerequisites"
  | "phases"
  | "accelerators"
  | "toolkit"
  | "other";

export interface RoadmapSection {
  title: string;
  content: string;
  kind: SectionKind;
}

function detectKind(title: string): SectionKind {
  const t = title.toLowerCase();
  if (t.includes("vision")) return "vision";
  if (t.includes("prerequisite")) return "prerequisites";
  if (
    t.includes("mastery path") ||
    t.includes("phase") ||
    t.includes("roadmap") ||
    t.includes("journey")
  )
    return "phases";
  if (
    t.includes("accelerator") ||
    t.includes("pro-tip") ||
    t.includes("pro tip") ||
    t.includes("shortcut") ||
    t.includes("secret")
  )
    return "accelerators";
  if (t.includes("toolkit") || t.includes("tools")) return "toolkit";
  return "other";
}

function isSectionHeader(line: string): boolean {
  const trimmed = line.trim();
  if (/^#{1,3}\s+/.test(trimmed)) return true;
  if (/^\d+\.\s+/.test(trimmed) && /[🎯🛠🗺⚡🧰]|vision|prerequisite|mastery|phase|accelerator|toolkit/i.test(trimmed))
    return true;
  if (/^\*\*[^*]+\*\*:?\s*$/.test(trimmed)) return true;
  if (/^[🎯🛠🗺⚡🧰]/.test(trimmed) && trimmed.length < 120) return true;
  return false;
}

function cleanTitle(line: string): string {
  return line
    .trim()
    .replace(/^#{1,3}\s+/, "")
    .replace(/^\d+\.\s+/, "")
    .replace(/^\*\*|\*\*$/g, "")
    .replace(/:$/, "")
    .trim();
}

export function parseRoadmapSections(markdown: string): RoadmapSection[] {
  const lines = markdown.split("\n");
  const sections: RoadmapSection[] = [];
  let currentTitle = "Overview";
  let currentLines: string[] = [];

  const flush = () => {
    const content = currentLines.join("\n").trim();
    if (content || sections.length === 0) {
      sections.push({
        title: currentTitle,
        content: content || markdown,
        kind: detectKind(currentTitle),
      });
    }
    currentLines = [];
  };

  for (const line of lines) {
    if (isSectionHeader(line) && currentLines.length > 0) {
      flush();
      currentTitle = cleanTitle(line);
    } else if (isSectionHeader(line) && currentLines.length === 0 && sections.length > 0) {
      currentTitle = cleanTitle(line);
    } else if (isSectionHeader(line) && sections.length === 0 && currentLines.length === 0) {
      currentTitle = cleanTitle(line);
    } else {
      currentLines.push(line);
    }
  }

  flush();

  if (sections.length === 1 && sections[0].kind === "other") {
    return [{ title: "Your Mastery Roadmap", content: markdown, kind: "other" }];
  }

  return sections.filter((s) => s.content.length > 0);
}

export function extractPhases(content: string): { title: string; body: string }[] {
  const phases: { title: string; body: string }[] = [];
  const blocks = content.split(/(?=(?:^|\n)(?:#{2,4}\s+|\*\*)?Phase\s+\d+)/gi);

  for (const block of blocks) {
    const trimmed = block.trim();
    if (!trimmed) continue;
    const firstLine = trimmed.split("\n")[0] ?? "";
    const phaseMatch = firstLine.match(/Phase\s+(\d+)[:\s—-]*(.*)/i);
    if (phaseMatch) {
      const title = `Phase ${phaseMatch[1]}${phaseMatch[2] ? `: ${phaseMatch[2].replace(/[*#]/g, "").trim()}` : ""}`;
      const body = trimmed.split("\n").slice(1).join("\n").trim();
      phases.push({ title, body: body || trimmed });
    }
  }

  if (phases.length === 0) {
    const altBlocks = content.split(/(?=\n[-*]\s+\*\*Phase)/i);
    for (const block of altBlocks) {
      const m = block.match(/Phase\s+(\d+)[^*\n]*/i);
      if (m) phases.push({ title: m[0].replace(/[*#]/g, "").trim(), body: block.trim() });
    }
  }

  return phases;
}
