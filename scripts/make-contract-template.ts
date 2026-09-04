import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

import PizZip from "pizzip";

/**
 * Generates src/templates/contract.docx.
 *
 * A .docx is a zip of XML parts, so the template is a binary file — which makes
 * it the one thing in the repo a reviewer cannot read in a diff. Generating it
 * from this script instead of committing an opaque blob means the placeholders
 * are reviewable, and regenerating after an edit is one command.
 *
 * In production the template would be owned by ops and edited in Word; this
 * script is the bootstrap, not the workflow.
 *
 * Run: npm run build:template
 */

const OUTPUT = path.join(process.cwd(), "src", "templates", "contract.docx");

/** Word needs every part it will read declared here, by extension and by name. */
const CONTENT_TYPES = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`;

const ROOT_RELS = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`;

const W = "http://schemas.openxmlformats.org/wordprocessingml/2006/main";

/**
 * One paragraph. `bold` and `size` are half-points, so 28 renders as 14pt.
 *
 * Every run of text is a separate <w:t>. docxtemplater replaces placeholders
 * across runs, but a placeholder split by Word's own formatting is the classic
 * cause of "Unopened tag" errors — so each placeholder is written as a single
 * unbroken run here.
 */
function paragraph(text: string, options: { bold?: boolean; size?: number } = {}) {
  const properties = [
    options.bold ? "<w:b/>" : "",
    options.size ? `<w:sz w:val="${options.size}"/>` : "",
  ].join("");
  const runProps = properties ? `<w:rPr>${properties}</w:rPr>` : "";
  return `<w:p><w:r>${runProps}<w:t xml:space="preserve">${text}</w:t></w:r></w:p>`;
}

/**
 * Spike B only needs {clientName} to prove the template resolves on Vercel.
 * Prompt 7 replaces this body with the real line schedule, terms and signature
 * block; the packaging around it does not change.
 */
const BODY = [
  paragraph("Island Media Co", { bold: true, size: 36 }),
  paragraph("Advertising contract", { bold: true, size: 28 }),
  paragraph(""),
  paragraph("Client: {clientName}"),
  paragraph(""),
  paragraph(
    "This template exists to prove that docxtemplater can read, render and " +
      "return a .docx from a serverless function. The contract body is built " +
      "in Prompt 7.",
  ),
].join("");

const DOCUMENT = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="${W}"><w:body>${BODY}<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440"/></w:sectPr></w:body></w:document>`;

const zip = new PizZip();
zip.file("[Content_Types].xml", CONTENT_TYPES);
zip.folder("_rels")!.file(".rels", ROOT_RELS);
zip.folder("word")!.file("document.xml", DOCUMENT);

// DEFLATE, because Word rejects some stored-only packages and the file is
// checked into git.
const buffer = zip.generate({ type: "nodebuffer", compression: "DEFLATE" });

mkdirSync(path.dirname(OUTPUT), { recursive: true });
writeFileSync(OUTPUT, buffer);

console.log(`Wrote ${OUTPUT} (${buffer.byteLength} bytes)`);
