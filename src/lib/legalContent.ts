export type LegalBlock =
  | { type: "heading"; text: string }
  | { type: "paragraph"; text: string };

/**
 * Admin Configs format for legal_privacy / legal_terms:
 *
 * # Section heading
 * Paragraph text here.
 *
 * Another paragraph under the same section.
 *
 * # Next heading
 * More text.
 */
export function parseLegalContent(raw: string): LegalBlock[] {
  const lines = raw.replace(/\r\n/g, "\n").split("\n");
  const blocks: LegalBlock[] = [];
  let paragraph: string[] = [];

  function flushParagraph() {
    const text = paragraph.join(" ").trim();
    paragraph = [];
    if (text) blocks.push({ type: "paragraph", text });
  }

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith("# ")) {
      flushParagraph();
      const text = trimmed.slice(2).trim();
      if (text) blocks.push({ type: "heading", text });
      continue;
    }
    if (trimmed === "") {
      flushParagraph();
      continue;
    }
    paragraph.push(trimmed);
  }
  flushParagraph();

  return blocks;
}
