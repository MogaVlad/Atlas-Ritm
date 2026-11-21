/**
 * The Pillar III payment proof the user gives their employer (the deduction goes through payroll).
 * A one-page PDF built by hand: no library, Helvetica, plain ASCII (diacritics are folded).
 */

const FOLD: Record<string, string> = {
  ă: "a", â: "a", î: "i", ș: "s", ş: "s", ț: "t", ţ: "t",
  Ă: "A", Â: "A", Î: "I", Ș: "S", Ş: "S", Ț: "T", Ţ: "T",
  "–": "-", "—": "-", "’": "'", "‘": "'", "“": '"', "”": '"', "…": "...",
};

function ascii(text: string): string {
  return text
    .replace(/[\s  ]/g, " ")
    .replace(/./g, (c) => FOLD[c] ?? c)
    .replace(/[^\x20-\x7e]/g, "?")
    .replace(/[\\()]/g, (c) => `\\${c}`);
}

/** Splits a line into pieces of at most `max` characters, on spaces. */
function wrap(line: string, max = 88): string[] {
  const out: string[] = [];
  let cur = "";
  for (const word of line.split(" ")) {
    if (cur && (cur + " " + word).length > max) {
      out.push(cur);
      cur = word;
    } else cur = cur ? `${cur} ${word}` : word;
  }
  if (cur) out.push(cur);
  return out;
}

/** Builds the PDF: a bold title, then each line (empty string = blank line). */
export function buildProofPdf(title: string, lines: string[]): Blob {
  const body = lines.flatMap((l) => (l ? wrap(l) : [""]));
  const text = [
    "BT /F2 18 Tf 56 780 Td",
    `(${ascii(title)}) Tj`,
    "/F1 11 Tf 0 -34 Td 16 TL",
    ...body.map((l) => `(${ascii(l)}) Tj T*`),
    "ET",
  ].join("\n");

  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>",
    `<< /Length ${text.length} >>\nstream\n${text}\nendstream`,
  ];

  let pdf = "%PDF-1.4\n";
  const offsets = objects.map((obj, i) => {
    const at = pdf.length;
    pdf += `${i + 1} 0 obj\n${obj}\nendobj\n`;
    return at;
  });
  const xref = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  pdf += offsets.map((o) => `${String(o).padStart(10, "0")} 00000 n \n`).join("");
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return new Blob([pdf], { type: "application/pdf" });
}

/** Starts the download in the browser. */
export function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
