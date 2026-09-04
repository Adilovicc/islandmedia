import { readFile } from "node:fs/promises";
import path from "node:path";

import Docxtemplater from "docxtemplater";
import PizZip from "pizzip";

/**
 * SPIKE B — docxtemplater on Vercel.
 *
 * The risk is not the rendering, it is the FILE. A .docx is not imported by any
 * module, so nothing in the dependency graph points at it: Next traces what the
 * code imports, and a path built at runtime from process.cwd() is invisible to
 * that analysis. The template then works perfectly in dev, where the whole repo
 * is on disk, and 404s in production, where only traced files are deployed.
 *
 * The fix used here is `outputFileTracingIncludes` in next.config.ts, which
 * tells the tracer to ship src/templates/** alongside the function. That is the
 * supported mechanism, and it beats the two alternatives:
 *
 *   /public       would serve the raw template to anyone who guessed the URL.
 *                 It is an internal artefact, not a public asset.
 *   base64 inline would bloat the JS bundle and — worse — make the template
 *                 uneditable by the ops people who are supposed to own it.
 *
 * Reading from process.cwd() is kept exactly as the brief specifies, so the
 * spike proves the real path resolution rather than a workaround.
 */

export const dynamic = "force-dynamic";
// The Node runtime, not Edge: docxtemplater and pizzip need node:fs and Buffer.
export const runtime = "nodejs";

const TEMPLATE_PATH = path.join(process.cwd(), "src", "templates", "contract.docx");

export async function GET() {
  try {
    const template = await readFile(TEMPLATE_PATH);

    const zip = new PizZip(template);
    const doc = new Docxtemplater(zip, { paragraphLoop: true, linebreaks: true });

    doc.render({ clientName: "Northshore Retail Group Ltd" });

    const rendered = doc.toBuffer();

    return new Response(new Uint8Array(rendered), {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": 'attachment; filename="spike-contract.docx"',
        "Content-Length": String(rendered.byteLength),
        // Proof for the spike: confirms the file was read from disk in this
        // environment rather than served from somewhere else.
        "X-Template-Path": TEMPLATE_PATH,
        "X-Template-Bytes": String(template.byteLength),
      },
    });
  } catch (error) {
    return Response.json(
      {
        spike: "B — docxtemplater",
        passed: false,
        templatePath: TEMPLATE_PATH,
        cwd: process.cwd(),
        error: String(error),
        hint: "If this is ENOENT in production, the template was not traced into the bundle. Check outputFileTracingIncludes in next.config.ts.",
      },
      { status: 500 },
    );
  }
}
