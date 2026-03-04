const ITEM_IDS = [
  '1.1','1.2','2.1','2.2','2.3','2.4','2.5',
  '3.1','3.2','3.3','3.4','3.5','3.6','3.7','3.8',
  '4.1','4.2','4.3','4.4','4.5','4.6','4.7','4.8',
  '5.1','5.2','5.3','5.4','5.5',
  '6.1','6.2','6.3','6.4','6.5',
  '7.1','7.2','7.3','7.4','7.5','7.6','7.7','7.8',
];

export async function extractScoresFromPdf(file: File): Promise<Record<string, number>> {
  const pdfjsLib = await import('pdfjs-dist');
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) }).promise;
  const scores: Record<string, number> = {};

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const textContent = await page.getTextContent();

    const Y_TOLERANCE = 5;
    const lineMap = new Map<number, Array<{ x: number; text: string }>>();

    for (const item of textContent.items) {
      if (!('str' in item) || !('transform' in item)) continue;
      const ti = item as { str: string; transform: number[] };
      if (!ti.str.trim()) continue;
      const y = Math.round(ti.transform[5] / Y_TOLERANCE) * Y_TOLERANCE;
      const x = ti.transform[4];
      if (!lineMap.has(y)) lineMap.set(y, []);
      lineMap.get(y)!.push({ x, text: ti.str.trim() });
    }

    for (const [, lineItems] of lineMap) {
      lineItems.sort((a, b) => a.x - b.x);
      const lineText = lineItems.map(i => i.text).join(' ');

      for (const itemId of ITEM_IDS) {
        if (scores[itemId] !== undefined) continue;
        const escaped = itemId.replace('.', '\\.');
        const pattern = new RegExp(`(?:^|\\s)${escaped}\\s`);
        if (pattern.test(lineText) || lineText.startsWith(itemId + ' ')) {
          const scoreMatches = lineText.match(/(?:^|\s)(25|50|75|100)(?:\s|$)/g);
          if (scoreMatches) {
            const score = parseInt(scoreMatches[0].trim());
            if ([25, 50, 75, 100].includes(score)) {
              scores[itemId] = score;
            }
          }
        }
      }
    }
  }

  return scores;
}
