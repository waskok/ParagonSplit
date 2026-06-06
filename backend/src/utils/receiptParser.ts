export type ParsedReceiptItem = {
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
};

export type ParsedReceipt = {
  storeName: string | null;
  total: number | null;
  items: ParsedReceiptItem[];
};

const PRICE = /\d+[,.]\d{2}/g;

const QTY_BLOCK =
  /(\d+(?:[,.]\d+)?)\s*[xX×*]\s*(\d+[,.]\d{2})\s+(\d+[,.]\d{2})\s*([A-D])?/i;

const QTY_LINE_START = /(\d+(?:[,.]\d+)?)\s*[xX×*]\s*$/i;

const DISCOUNT_WORD = /opust|rabat|ulga|zniżk|znizk|promo|bon|kupon/i;

const HARD_FOOTER =
  /DO ZAPŁATY|DO ZAPLATY|MOJE ZAKUPY|MOJE OSZCZĘDNOŚCI|Nr transakcji:|Numer karty:|Numer:/i;

const STORE_PATTERNS: Array<{ pattern: RegExp; name: string }> = [
  { pattern: /biedronka/i, name: "Biedronka" },
  { pattern: /rossmann/i, name: "Rossmann" },
  { pattern: /lidl/i, name: "Lidl" },
  { pattern: /kaufland/i, name: "Kaufland" },
  { pattern: /carrefour/i, name: "Carrefour" },
  { pattern: /żabka|zabka/i, name: "Żabka" },
  { pattern: /auchan/i, name: "Auchan" }
];

const parsePrice = (value: string): number => Number(value.replace(",", "."));

const pricesIn = (line: string): string[] => line.match(PRICE) ?? [];

const hasLetters = (text: string): boolean =>
  /[a-zA-ZąćęłńóśźżĄĆĘŁŃÓŚŹŻ]{2,}/.test(text);

const normalizeLine = (line: string): string =>
  line
    .replace(/(\d+[,.]\d{2})([A-D])(?=\s*$)/gi, "$1 $2")
    .replace(/(\d+(?:[,.]\d+)?)[xX×*](\d)/g, "$1 x $2")
    .replace(/\s{2,}/g, " ")
    .trim();

const isDiscountLine = (line: string): boolean => {
  const lower = line.toLowerCase();
  if (DISCOUNT_WORD.test(lower)) return true;
  if (/^\s*-+\s*\d+[,.]\d{2}/.test(line)) return true;
  if (/^-\d+[,.]\d{2}/.test(line.replace(/\s/g, ""))) return true;
  return false;
};

const isSkipLine = (line: string): boolean => {
  if (line.length <= 1) return true;
  if (/^[a-zA-Z]?$/i.test(line)) return true;
  if (/^nr:/i.test(line)) return true;
  if (/^\d{1,4}$/.test(line)) return true;
  if (/^[\d\s,.-]+$/.test(line) && pricesIn(line).length > 0 && !QTY_BLOCK.test(line)) {
    return true;
  }
  if (
    /^(SUMA|PTU|PARAGON|NIP|FISK|NIEFISK|SPRZEDAZ|ROZLICZENIE|Kasa|#Kasa|Kasjer|Nr sys|www\.|CCH |000\d+|Codziennie|Sklep |Polska|S\.A\.|ul\.|Jeronimo|Modlnica|Wydania opakowań|Opis:|Numer:|Udzielono|Nr rej\.|Nr transakcji|KARTA )/i.test(
      line
    )
  ) {
    return true;
  }
  if (/^[A-F0-9]{20,}$/i.test(line.replace(/\s/g, ""))) return true;
  if (/^\d{2}:\d{2}$/.test(line)) return true;
  if (/^\d+%$/.test(line)) return true;
  if (/^KB\/s$|^✓$|^,$/.test(line)) return true;
  if (/^\d+\s+Czerw/i.test(line)) return true;
  return false;
};

const cleanName = (raw: string): string =>
  raw
    .replace(/\\[A-D]{1,2}$/i, "")
    .replace(/[,]\s*[A-D]\s*$/i, "")
    .replace(/\s+[A-D]\s*$/i, "")
    .replace(/\s+\d+\.?\d*\s*[xX×*]\s*$/i, "")
    .replace(/\s{2,}/g, " ")
    .trim();

const isNameCandidate = (line: string): boolean => {
  if (isSkipLine(line) || isDiscountLine(line) || QTY_BLOCK.test(line)) return false;
  if (QTY_LINE_START.test(line)) return false;
  if (!hasLetters(line)) return false;
  if (pricesIn(line).length > 0) return false;
  const cleaned = cleanName(line);
  return cleaned.length >= 2 && hasLetters(cleaned);
};

type QtyMatch = {
  lineIndex: number;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  inlineName?: string;
};

const parseQtyFromLine = (line: string, lineIndex: number): QtyMatch | null => {
  const match = line.match(QTY_BLOCK);
  if (!match) return null;

  const quantity = parsePrice(match[1]);
  const unitPrice = parsePrice(match[2]);
  const totalPrice = parsePrice(match[3]);

  if (totalPrice <= 0 || totalPrice >= 50_000) return null;

  const before = line.slice(0, match.index!).trim();
  const inlineName =
    before.length >= 2 && hasLetters(before) && !isDiscountLine(before)
      ? cleanName(before)
      : undefined;

  return { lineIndex, quantity, unitPrice, totalPrice, inlineName };
};

const findNameBefore = (lines: string[], qtyIndex: number): string | null => {
  for (let i = qtyIndex - 1; i >= Math.max(0, qtyIndex - 12); i--) {
    const line = lines[i];
    if (QTY_BLOCK.test(line)) break;
    if (isDiscountLine(line)) continue;
    if (isSkipLine(line)) continue;
    if (isNameCandidate(line)) return cleanName(line);
  }
  return null;
};

const extractNegativeDiscount = (line: string): number | null => {
  if (!/-/.test(line)) return null;
  const ps = pricesIn(line);
  if (ps.length !== 1) return null;
  const value = parsePrice(ps[0]);
  return value > 0 ? value : null;
};

const isProductNameLine = (line: string): boolean => {
  if (/^rabat$/i.test(line.trim())) return false;
  if (isNameCandidate(line)) return true;
  return hasLetters(line) && line.replace(/[^a-zA-ZąćęłńóśźżĄĆĘŁŃÓŚŹŻ]/g, "").length >= 8 && pricesIn(line).length === 0;
};

const isFinalPriceOnlyLine = (line: string): boolean => {
  if (QTY_BLOCK.test(line) || isDiscountLine(line)) return false;
  const ps = pricesIn(line);
  if (ps.length !== 1) return false;
  const rest = line.replace(PRICE, "").replace(/[A-D\s\-–—.,]/gi, "").trim();
  return rest.length <= 2;
};

const extractReducedPriceAfterQty = (
  lines: string[],
  startIndex: number,
  grossTotal: number
): number | null => {
  let lastFinal: number | null = null;

  for (let i = startIndex + 1; i < Math.min(lines.length, startIndex + 8); i++) {
    const line = lines[i];
    if (QTY_BLOCK.test(line)) break;
    if (isProductNameLine(line)) break;

    if (isFinalPriceOnlyLine(line)) {
      const final = parsePrice(pricesIn(line)[0]);
      if (final > 0 && final < grossTotal) {
        lastFinal = final;
        if (/[A-D]\s*$/i.test(line.replace(PRICE, "").trim()) || /\d[,.]\d{2}[A-D]/i.test(line)) {
          break;
        }
      }
    }
  }

  return lastFinal;
};

const extractRossmannNames = (lines: string[]): string[] => {
  const names: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (/OPUSTY ŁĄCZNIE|OPUSTY LACZNIE|SPRZEDAZ OPODATKOWANA|^\d+\s*x/i.test(line)) {
      break;
    }
    if (/^OPUST/i.test(line)) continue;

    const next = lines[i + 1];
    if (next && /^OPUST Rossmann/i.test(next) && isNameCandidate(line)) {
      names.push(cleanName(line));
    }
  }

  return names;
};

const isHeaderName = (line: string): boolean =>
  /^(Biedronka|Rossmann|Codziennie|Sklep |NIP |PARAGON|ul\.|al\. |S\.A\.|Polska|Modlnica|Jeronimo|Kraków|Kostrzyn|\d{2}-\d{3}|\d{4}-\d{2}-\d{2}|Nr rej)/i.test(
    line
  );

const extractProductNamesBeforeQty = (lines: string[], firstQtyIndex: number): string[] => {
  const paragonIndex = lines.findIndex((l) => /PARAGON/i.test(l));
  const dateIndex = lines.findIndex((l) => /^\d{4}-\d{2}-\d{2}/.test(l));
  const startHint = Math.max(paragonIndex, dateIndex);
  const from = startHint >= 0 ? startHint + 1 : Math.max(0, firstQtyIndex - 12);

  const names: string[] = [];
  for (let i = from; i < firstQtyIndex; i++) {
    if (isHeaderName(lines[i])) continue;
    if (isNameCandidate(lines[i])) {
      names.push(cleanName(lines[i]));
    }
  }
  return names;
};

const mergeFragmentedQtyLines = (lines: string[]): string[] => {
  const output: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (QTY_LINE_START.test(line) || /\d+[,.]?\d*\s*x\s*$/i.test(line)) {
      const prefix =
        output.length > 0 && isNameCandidate(output[output.length - 1])
          ? output.pop()!
          : "";
      const parts = [prefix ? `${prefix} ${line.trim()}` : line.trim()];
      let j = i + 1;
      let combinedQty = false;

      while (j < lines.length && j <= i + 4) {
        parts.push(lines[j]);
        const combined = parts.join(" ");
        if (QTY_BLOCK.test(combined)) {
          output.push(combined.replace(/\s+/g, " ").trim());
          i = j;
          combinedQty = true;
          break;
        }
        j++;
      }

      if (combinedQty) continue;
    }

    const next = lines[i + 1];
    if (
      next &&
      pricesIn(line).length === 0 &&
      hasLetters(line) &&
      !isDiscountLine(line) &&
      !isSkipLine(line) &&
      (/^\d+(?:[,.]\d+)?\s*[xX×*]/i.test(next.trim()) || /^\d+[,.]\d{2}/.test(next.trim()))
    ) {
      output.push(`${line} ${next}`.replace(/\s+/g, " ").trim());
      i++;
      continue;
    }

    output.push(line);
  }

  return output.map(normalizeLine).filter((l) => l.length > 0);
};

const detectTotal = (lines: string[]): number | null => {
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (/DO ZAPŁATY|DO ZAPLATY/i.test(line)) {
      const ps = pricesIn(line);
      if (ps.length > 0) return parsePrice(ps[ps.length - 1]);
      const next = lines[i + 1];
      if (next) {
        const nps = pricesIn(next);
        if (nps.length > 0) return parsePrice(nps[nps.length - 1]);
      }
    }
  }

  for (let i = lines.length - 1; i >= 0; i--) {
    if (/PLN/i.test(lines[i])) {
      const ps = pricesIn(lines[i]);
      if (ps.length > 0) {
        const value = parsePrice(ps[ps.length - 1]);
        if (value > 5) return value;
      }
    }
  }

  return null;
};

const extractAllQtyMatches = (lines: string[]): QtyMatch[] => {
  const matches: QtyMatch[] = [];
  const receiptTotal = detectTotal(lines);

  for (let i = 0; i < lines.length; i++) {
    if (HARD_FOOTER.test(lines[i])) break;

    const qty = parseQtyFromLine(lines[i], i);
    if (!qty) continue;

    if (receiptTotal !== null && qty.totalPrice === receiptTotal && qty.quantity <= 1) {
      continue;
    }

    if (qty.totalPrice > 120) continue;

    matches.push(qty);
  }

  return matches;
};

const buildItems = (lines: string[], qtyMatches: QtyMatch[]): ParsedReceiptItem[] => {
  if (qtyMatches.length === 0) return [];

  const isRossmann = /OPUST/i.test(lines.join("\n")) && /rossmann/i.test(lines.join("\n"));
  const rossmannNames = isRossmann ? extractRossmannNames(lines) : [];

  const firstQtyIndex = qtyMatches[0].lineIndex;
  const hasRabatBlocks = /rabat/i.test(lines.join("\n"));
  const namesBeforeQty = hasRabatBlocks
    ? []
    : extractProductNamesBeforeQty(lines, firstQtyIndex);

  const items: ParsedReceiptItem[] = [];
  let nameQueueIndex = 0;

  for (let i = 0; i < qtyMatches.length; i++) {
    const qty = qtyMatches[i];
    let name = qty.inlineName ?? null;

    if (isRossmann && rossmannNames.length === qtyMatches.length) {
      name = rossmannNames[i];
    } else if (!name && !qty.inlineName && nameQueueIndex < namesBeforeQty.length) {
      name = namesBeforeQty[nameQueueIndex];
      nameQueueIndex++;
    } else if (!name) {
      name = findNameBefore(lines, qty.lineIndex);
    }

    if (!name) name = `Pozycja ${i + 1}`;
    name = cleanName(name);

    if (!hasLetters(name) || isDiscountLine(name) || isHeaderName(name)) continue;

    let totalPrice = qty.totalPrice;

    if (totalPrice > 120) continue;

    const nextLine = lines[qty.lineIndex + 1];
    if (nextLine && isRossmann) {
      const negativeDiscount = extractNegativeDiscount(nextLine);
      if (negativeDiscount !== null) {
        totalPrice = Number((qty.totalPrice - negativeDiscount).toFixed(2));
      }
    }

    const reducedPrice = hasRabatBlocks
      ? extractReducedPriceAfterQty(lines, qty.lineIndex, qty.totalPrice)
      : null;
    if (reducedPrice !== null) {
      totalPrice = reducedPrice;
    }

    const quantity = qty.quantity;
    const unitPrice = Number((totalPrice / quantity).toFixed(2));

    items.push({ name, quantity, unitPrice, totalPrice });
  }

  return items;
};

const detectStoreName = (lines: string[]): string | null => {
  const head = lines.slice(0, 20).join("\n");
  for (const store of STORE_PATTERNS) {
    if (store.pattern.test(head)) return store.name;
  }

  for (let i = 0; i < Math.min(lines.length, 8); i++) {
    if (pricesIn(lines[i]).length === 0 && hasLetters(lines[i]) && !isSkipLine(lines[i])) {
      return cleanName(lines[i]);
    }
  }

  return null;
};

export const parseReceiptText = (rawText: string): ParsedReceipt => {
  const rawLines = rawText
    .split(/\r?\n/)
    .map(normalizeLine)
    .filter((l) => l.length > 0);

  const lines = mergeFragmentedQtyLines(rawLines);

  const storeName = detectStoreName(lines);
  const total = detectTotal(lines);
  const qtyMatches = extractAllQtyMatches(lines);
  const items = buildItems(lines, qtyMatches);

  const computedTotal =
    total ??
    (items.length > 0
      ? Number(items.reduce((sum, item) => sum + item.totalPrice, 0).toFixed(2))
      : null);

  return { storeName, total: computedTotal, items };
};
