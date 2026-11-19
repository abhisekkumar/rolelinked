import "server-only";

import mammoth from "mammoth";
import { extractText, getDocumentProxy } from "unpdf";

const MAX_EXTRACTED_CHARACTERS = 250_000;
const MAX_PDF_PAGES = 30;

function cleanExtractedText(value: string) {
  return value
    .replace(/\0/g, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{4,}/g, "\n\n\n")
    .trim()
    .slice(0, MAX_EXTRACTED_CHARACTERS);
}

export async function extractResumeText(bytes: ArrayBuffer, contentType: string) {
  if (contentType === "application/pdf") {
    const pdf = await getDocumentProxy(new Uint8Array(bytes));
    if (pdf.numPages > MAX_PDF_PAGES) {
      throw new Error(`This PDF has ${pdf.numPages} pages. ATS checks support up to ${MAX_PDF_PAGES}.`);
    }
    const extracted = await extractText(pdf, { mergePages: true });
    const text = cleanExtractedText(Array.isArray(extracted.text) ? extracted.text.join("\n\n") : extracted.text);
    if (!text) throw new Error("No selectable text was found. This may be a scanned or image-only PDF.");
    return { text, pageCount: extracted.totalPages, format: "PDF" };
  }

  if (contentType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
    const extracted = await mammoth.extractRawText({ buffer: Buffer.from(bytes) });
    const text = cleanExtractedText(extracted.value);
    if (!text) throw new Error("No readable text was found in this DOCX file.");
    return { text, pageCount: null, format: "DOCX" };
  }

  if (["text/plain", "text/markdown", "application/x-tex"].includes(contentType)) {
    const text = cleanExtractedText(new TextDecoder("utf-8", { fatal: false }).decode(bytes));
    if (!text) throw new Error("No readable text was found in this resume.");
    return { text, pageCount: null, format: contentType === "application/x-tex" ? "TeX" : "Text" };
  }

  throw new Error("This resume format is not supported by the ATS checker.");
}
