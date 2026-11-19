import type { EpisodeNotes } from "./episode-practice";
import { preparePages, MAX_PAGES } from "@/lib/upload/prepare";

const MAX_BYTES = 15 * 1024 * 1024;
export async function readEpisode(file: File, onProgress: (message: string) => void): Promise<EpisodeNotes & { pages: number }> {
  if (file.size > MAX_BYTES) throw new Error(`“${file.name}” is too large. Use a file under 15 MB.`);
  const title = file.name.replace(/\.[^.]+$/, "").slice(0, 120);
  if (/\.(txt|md)$/i.test(file.name) || file.type === "text/plain") {
    return { title, text: await file.text(), pages: 0 };
  }
  const isPdf = file.type === "application/pdf" || /\.pdf$/i.test(file.name);
  if (!isPdf && !["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
    throw new Error(`“${file.name}” isn't supported. Choose PDF, TXT, MD, JPG, PNG or WebP.`);
  }
  if (isPdf) {
    const pdfjs = await import("pdfjs-dist");
    pdfjs.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url).toString();
    const task = pdfjs.getDocument({ data: await file.arrayBuffer() });
    try {
      const doc = await task.promise;
      if (doc.numPages > MAX_PAGES) throw new Error("Use at most 20 pages per session.");
      const paragraphs: string[] = [];
      let needsOcr = false;
      for (let page = 1; page <= doc.numPages; page++) {
        const content = await (await doc.getPage(page)).getTextContent();
        const text = content.items.map(item => "str" in item ? item.str + (item.hasEOL ? "\n" : " ") : "").join("");
        if (text.trim().length < 40) needsOcr = true;
        paragraphs.push(text);
      }
      const text = paragraphs.join("\n").trim();
      if (!needsOcr && text.length >= 40) return { title, text, pages: doc.numPages };
    } finally {
      await task.destroy();
    }
  }
  onProgress(`Reading the photo text in ${file.name}…`);
  const pages = await preparePages([file]);
  const { createWorker } = await import("tesseract.js");
  const worker = await createWorker("eng");
  try {
    const text: string[] = [];
    for (const [index, page] of pages.entries()) {
      onProgress(`Reading ${file.name}, page ${index + 1} of ${pages.length}…`);
      const result = await worker.recognize(page.blob);
      text.push(result.data.text);
    }
    return { title, text: text.join("\n"), pages: pages.length };
  } finally {
    await worker.terminate();
  }
}
