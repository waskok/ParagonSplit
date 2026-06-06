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
  /(\d+(?:[,.]\d+)?)\s*(?:kg\s*)?[xX×*]\s*(\d+[,.]\d{2})\s+(\d+[,.]\d{2})\s*([A-D])?/i;

const QTY_LINE_START = /(\d+(?:[,.]\d+)?)\s*(?:kg\s*)?[xX×*]\s*$/i;

const DISCOUNT_WORD = /opust|rabat|ulga|zniżk|znizk|promo|bon|kupon|lidl plus/i;

const HARD_FOOTER =
  /DO ZAPŁATY|DO ZAPLATY|MOJE ZAKUPY|MOJE OSZCZĘDNOŚCI|Nr transakcji:|Numer karty:|Numer:|NIEFISKALNY|Z Lidl \+|zaoszczędzono/i;

const SUMMARY_SECTION =
  /^Suma PLN$|^Podsuma:?|^SPRZEDA[ZŻ].*OPODATKOWANA|^SUMA PTU=|^Sp: A=/i;

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
    .replace(/(\d+(?:[,.]\d+)?)\s*kg\s*[xX×*]/gi, "$1 x ")
    .replace(/(\d+(?:[,.]\d+)?)\s*[xX×*]\s*(\d)/g, "$1 x $2")
    .replace(/(\d+(?:[,.]\d+)?)\s+\*\s+(\d)/g, "$1 x $2")
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
    /^(SUMA|PTU|PARAGON|NIP|FISK|NIEFISK|SPRZEDAZ|SPRZEDAŻ|ROZLICZENIE|Kasa|#Kasa|Kasjer|Nr sys|www\.|CCH |000\d+|Codziennie|Sklep |Polska|S\.A\.|ul\.|Jeronimo|Modlnica|Wydania opakowań|Opis:|Numer:|Udzielono|Nr rej\.|Nr transakcji|KARTA |Adres siedziby|Podsuma|Kwota |BIEDRONKA|JERONIMO|FLOW|ooo$|TEAZ |PEAO |EAO )/i.test(
      line
    )
  ) {
    return true;
  }
  if (/^\d+\s+(sty|lut|mar|kwi|maj|cze|lip|sie|wrz|paź|paz|lis|gru)/i.test(line)) return true;
  if (/^17:\d{2}/.test(line)) return true;
  if (/^[A-F0-9]{20,}$/i.test(line.replace(/\s/g, ""))) return true;
  if (/^\d{2}:\d{2}$/.test(line)) return true;
  if (/^\d+%$/.test(line)) return true;
  if (/^KB\/s$|^✓$|^!$|^,$/.test(line)) return true;
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

  const ps = pricesIn(line);
  if (ps.length > 0) {
    if (ps.length === 1 && line.length >= 10) {
      const priceVal = parsePrice(ps[0]);
      const letterCount = line.replace(/[^a-zA-ZąćęłńóśźżĄĆĘŁŃÓŚŹŻ]/g, "").length;
      if (priceVal <= 9.99 && letterCount >= 8) {
        // np. MusDawtonaJabMor0,18 — rozmiar w nazwie, nie cena
      } else {
        return false;
      }
    } else {
      return false;
    }
  }

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
  let skipNames = 0;

  for (let i = qtyIndex - 1; i >= Math.max(0, qtyIndex - 20); i--) {
    const line = lines[i];
    if (QTY_BLOCK.test(line)) {
      skipNames++;
      if (skipNames > 1) break;
      continue;
    }
    if (isDiscountLine(line) || isSkipLine(line)) continue;
    if (isNameCandidate(line)) {
      if (skipNames > 0) {
        skipNames--;
        continue;
      }
      return cleanName(line);
    }
  }
  return null;
};

const findNameAfter = (lines: string[], qtyIndex: number): string | null => {
  for (let i = qtyIndex + 1; i < Math.min(lines.length, qtyIndex + 5); i++) {
    const line = lines[i];
    if (QTY_BLOCK.test(line)) break;
    if (isDiscountLine(line) || isSkipLine(line)) continue;
    if (/^OPUST/i.test(line)) break;
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
  if (/^rabat$|^kupon$/i.test(line.trim())) return false;
  if (/^OPUST/i.test(line)) return false;
  if (isNameCandidate(line)) return true;
  return (
    hasLetters(line) &&
    line.replace(/[^a-zA-ZąćęłńóśźżĄĆĘŁŃÓŚŹŻ]/g, "").length >= 8 &&
    pricesIn(line).length === 0
  );
};

const isFinalPriceOnlyLine = (line: string): boolean => {
  if (QTY_BLOCK.test(line) || isDiscountLine(line)) return false;
  const ps = pricesIn(line);
  if (ps.length !== 1) return false;
  const rest = line.replace(PRICE, "").replace(/[A-D\s\-–—.,]/gi, "").trim();
  return rest.length <= 3;
};

const extractReducedPriceAfterQty = (
  lines: string[],
  startIndex: number,
  grossTotal: number
): number | null => {
  let lastFinal: number | null = null;

  for (let i = startIndex + 1; i < Math.min(lines.length, startIndex + 10); i++) {
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

const extractOpustFinalPrice = (
  lines: string[],
  startIndex: number,
  grossTotal: number
): number | null => {
  let sawOpust = false;
  let lastFinal: number | null = null;

  for (let i = startIndex + 1; i < Math.min(lines.length, startIndex + 12); i++) {
    const line = lines[i];
    if (QTY_BLOCK.test(line)) break;
    if (isProductNameLine(line) && !/^OPUST/i.test(line)) break;

    if (/^OPUST/i.test(line)) {
      sawOpust = true;
      continue;
    }

    if (extractNegativeDiscount(line) !== null) {
      sawOpust = true;
      continue;
    }

    if (sawOpust && isFinalPriceOnlyLine(line)) {
      const final = parsePrice(pricesIn(line)[0]);
      if (final > 0 && final < grossTotal) {
        lastFinal = final;
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

const extractLidlTopNames = (lines: string[], beforeIndex: number): string[] => {
  const names: string[] = [];
  const cutoff = beforeIndex < lines.length ? beforeIndex : lines.length;

  for (let i = 0; i < cutoff; i++) {
    const line = lines[i];
    if (/^PTU [A-D]/i.test(line)) break;
    if (/^Suma$/i.test(line)) break;
    if (isDiscountLine(line)) continue;
    if (isNameCandidate(line)) {
      names.push(cleanName(line));
    }
  }

  return names;
};

const extractLidlPaperNames = (lines: string[]): string[] => {
  const names: string[] = [];

  for (const line of lines) {
    if (/^Podsuma|^SPRZEDA[ZŻ]|^PTU [A-D]|^SUMA PT/i.test(line)) break;
    if (/^OPUST/i.test(line)) continue;
    if (/rej:|Adres siedziby|sp\.z|sp\.k|NIP/i.test(line)) continue;
    if (isNameCandidate(line)) {
      names.push(cleanName(line));
    }
  }

  return names;
};

const isHeaderName = (line: string): boolean =>
  /^(Biedronka|Rossmann|Lidl|Codziennie|Sklep |NIP |PARAGON|ul\.|al\. |S\.A\.|Polska|Modlnica|Jeronimo|Kraków|Kostrzyn|KRAKÓW|LIMANOWA|Adres siedziby|Podgórne|\d{2}-\d{3}|\d{4}-\d{2}-\d{2}|Nr rej|BIEDRONKA|JERONIMO)/i.test(
    line
  );

const extractHeaderProductNames = (lines: string[]): string[] => {
  const paragonIdx = lines.findIndex((l) => /PARAGON/i.test(l));
  const limit = paragonIdx > 0 ? paragonIdx : 15;
  const names: string[] = [];

  for (let i = 0; i < Math.min(limit, lines.length); i++) {
    if (isHeaderName(lines[i])) continue;
    if (isNameCandidate(lines[i])) {
      names.push(cleanName(lines[i]));
    }
  }

  return names;
};

const extractInitialNameCluster = (lines: string[], firstQtyIndex: number): string[] => {
  const names: string[] = [];

  for (let i = 0; i < firstQtyIndex; i++) {
    if (isHeaderName(lines[i])) continue;
    if (isNameCandidate(lines[i])) {
      names.push(cleanName(lines[i]));
    }
  }

  return names;
};

type LidlPostSumaSection = {
  names: string[];
  qtyMatches: QtyMatch[];
  startIndex: number;
};

const findLidlPostSumaSection = (lines: string[]): LidlPostSumaSection | null => {
  const sumaIdx = lines.findIndex((l) => /^Suma$/i.test(l));
  if (sumaIdx < 0) return null;

  const ptuIdx = lines.findIndex((l) => /^PTU [A-D]/i.test(l));
  if (ptuIdx < 0 || ptuIdx >= sumaIdx) return null;

  const names: string[] = [];
  for (let i = ptuIdx + 1; i < sumaIdx; i++) {
    if (/^PTU [A-D]|^Kwota /i.test(lines[i])) break;
    if (isNameCandidate(lines[i])) {
      names.push(cleanName(lines[i]));
    }
  }

  const qtyMatches: QtyMatch[] = [];
  let startIndex = sumaIdx + 1;

  for (let i = sumaIdx + 1; i < lines.length; i++) {
    if (/^Suma PLN$/i.test(lines[i])) break;
    if (/^\d+[,.]\d{2}$/.test(lines[i])) continue;

    const qty = parseQtyFromLine(lines[i], i);
    if (qty) {
      if (qtyMatches.length === 0) startIndex = i;
      qtyMatches.push(qty);
    }
  }

  if (names.length === 0 || qtyMatches.length === 0) return null;
  if (names.length !== qtyMatches.length) return null;

  return { names, qtyMatches, startIndex };
};

const extractProductNamesBeforeQty = (lines: string[], firstQtyIndex: number): string[] => {
  const paragonIndex = lines.findIndex((l) => /PARAGON FISKALNY/i.test(l));
  const from =
    paragonIndex >= 0
      ? paragonIndex + 1
      : lines.findIndex((l) => /^\d{4}-\d{2}-\d{2}/.test(l)) + 1 || 0;

  const names: string[] = [];
  for (let i = Math.max(0, from); i < firstQtyIndex; i++) {
    if (isHeaderName(lines[i])) continue;
    if (isNameCandidate(lines[i])) {
      names.push(cleanName(lines[i]));
    }
  }
  return names;
};

const findDuplicateQtySectionStart = (lines: string[]): number | null => {
  if (findLidlPostSumaSection(lines)) return null;

  for (let i = 0; i < lines.length; i++) {
    if (!/^Suma$/i.test(lines[i])) continue;

    const postTotals: number[] = [];
    for (let j = i + 1; j < Math.min(lines.length, i + 8); j++) {
      if (/^Suma PLN$/i.test(lines[j])) break;
      const match = lines[j].match(QTY_BLOCK);
      if (match) postTotals.push(parsePrice(match[3]));
    }
    if (postTotals.length === 0) continue;

    const preTotals: number[] = [];
    for (let k = 0; k < i; k++) {
      const match = lines[k].match(QTY_BLOCK);
      if (match) preTotals.push(parsePrice(match[3]));
    }

    if (postTotals.every((total) => preTotals.includes(total))) {
      return i + 1;
    }
  }

  return null;
};

const isBottomQtyLayout = (lines: string[]): boolean => {
  const sprzedazIdx = lines.findIndex((l) => /SPRZEDA[ZŻ].*OPODATKOWANA/i.test(l));
  if (sprzedazIdx < 0) return false;
  const firstQtyIdx = lines.findIndex((l) => QTY_BLOCK.test(l));
  return firstQtyIdx > sprzedazIdx;
};

const extractDiscountAfterQty = (lines: string[], startIndex: number): number | null => {
  for (let i = startIndex + 1; i < Math.min(lines.length, startIndex + 6); i++) {
    const line = lines[i];
    if (QTY_BLOCK.test(line)) break;
    if (/^OPUST|^Rabat$|^Lidl Plus kupon$/i.test(line.trim())) continue;
    if (/lidl plus/i.test(line)) continue;

    const neg = extractNegativeDiscount(line);
    if (neg !== null) return neg;

    if (isProductNameLine(line)) break;
  }
  return null;
};

const mergeFragmentedQtyLines = (lines: string[]): string[] => {
  const output: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const next = lines[i + 1];

    if (/^\d+\s*\*\s*$/.test(line.trim()) && next && /^\d+[,.]\d{2}\s+\d+[,.]\d{2}/i.test(next.trim())) {
      const qtyNum = line.replace(/\*/g, "").trim();
      output.push(`${qtyNum} x ${next.trim()}`);
      i++;
      continue;
    }

    if (/^\d+$/.test(line) && next && /^\*\s*\d+[,.]\d{2}/i.test(next.trim())) {
      output.push(`${line} x ${next.trim().replace(/^\*\s*/, "")}`);
      i++;
      continue;
    }

    if (/^\*$/.test(line) && next && /^\d+[,.]\d{2}/.test(next.trim())) {
      const prev = output.length > 0 ? output[output.length - 1] : null;
      if (prev && /^\d+$/.test(prev)) {
        output.pop();
        output.push(`${prev} x ${next.trim()}`);
        i++;
        continue;
      }
    }

    if (/^\d+$/.test(line) && next === "*" && lines[i + 2] && /^\d+[,.]\d{2}/.test(lines[i + 2].trim())) {
      output.push(`${line} x ${lines[i + 2].trim()}`);
      i += 2;
      continue;
    }

    if (QTY_LINE_START.test(line) || /\d+[,.]?\d*\s*(?:kg\s*)?x\s*$/i.test(line)) {
      const prefix =
        output.length > 0 && isNameCandidate(output[output.length - 1])
          ? output.pop()!
          : "";
      const parts = [prefix ? `${prefix} ${line.trim()}` : line.trim()];
      let j = i + 1;
      let combinedQty = false;

      while (j < lines.length && j <= i + 5) {
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

    if (
      next &&
      pricesIn(line).length === 0 &&
      hasLetters(line) &&
      !isDiscountLine(line) &&
      !isSkipLine(line) &&
      !/^\d+\s*\*?\s*$/.test(next.trim()) &&
      (/^\d+(?:[,.]\d+)?\s*[xX×*]\s*\d+[,.]\d{2}/i.test(next.trim()) ||
        /^\*\s*\d+[,.]\d{2}/i.test(next.trim()) ||
        /^\d+[,.]\d{2}\s+\d+[,.]\d{2}/i.test(next.trim()))
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

    if (/^Suma PLN$/i.test(line)) {
      for (let j = i + 1; j < Math.min(lines.length, i + 4); j++) {
        const ps = pricesIn(lines[j]);
        if (ps.length === 1) {
          const value = parsePrice(ps[0]);
          if (value > 10) return value;
        }
      }
    }

    if (/^SUMA PLN$/i.test(line)) {
      for (let j = i + 1; j < Math.min(lines.length, i + 5); j++) {
        const ps = pricesIn(lines[j]);
        if (ps.length === 1) {
          const value = parsePrice(ps[0]);
          if (value > 10) return value;
        }
        if (/PLN/i.test(lines[j])) {
          const ps2 = pricesIn(lines[j]);
          if (ps2.length > 0) return parsePrice(ps2[ps2.length - 1]);
        }
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
  const duplicateSectionStart = findDuplicateQtySectionStart(lines);
  const bottomLayout = isBottomQtyLayout(lines);

  for (let i = 0; i < lines.length; i++) {
    if (HARD_FOOTER.test(lines[i])) break;

    if (duplicateSectionStart !== null && i >= duplicateSectionStart) {
      continue;
    }

    const qty = parseQtyFromLine(lines[i], i);
    if (!qty) continue;

    if (receiptTotal !== null && qty.totalPrice === receiptTotal && qty.quantity <= 1) {
      continue;
    }

    if (qty.totalPrice > 120) continue;

    matches.push(qty);
  }

  if (bottomLayout && matches.length === 0) {
    for (let i = 0; i < lines.length; i++) {
      if (HARD_FOOTER.test(lines[i])) break;
      const qty = parseQtyFromLine(lines[i], i);
      if (!qty || qty.totalPrice > 120) continue;
      if (receiptTotal !== null && qty.totalPrice === receiptTotal && qty.quantity <= 1) continue;
      matches.push(qty);
    }
  }

  const postSuma = findLidlPostSumaSection(lines);
  if (postSuma) {
    for (const qty of postSuma.qtyMatches) {
      if (!matches.some((m) => m.lineIndex === qty.lineIndex)) {
        matches.push(qty);
      }
    }
    matches.sort((a, b) => a.lineIndex - b.lineIndex);
  }

  return matches;
};

const buildItems = (lines: string[], qtyMatches: QtyMatch[]): ParsedReceiptItem[] => {
  if (qtyMatches.length === 0) return [];

  const text = lines.join("\n");
  const isRossmann = /OPUST Rossmann/i.test(text);
  const isLidl = /lidl/i.test(text);
  const rossmannNames = isRossmann ? extractRossmannNames(lines) : [];

  const firstQtyIndex = qtyMatches[0].lineIndex;
  const hasRabatBlocks = /rabat/i.test(text) && !/OPUST/i.test(text);
  const lidlPaperNames = isLidl && /Podsuma/i.test(text) ? extractLidlPaperNames(lines) : [];
  const lidlPostSuma = findLidlPostSumaSection(lines);
  const postSumaStart = lidlPostSuma?.startIndex ?? Number.POSITIVE_INFINITY;
  const ptuIdx = lines.findIndex((l) => /^PTU [A-D]/i.test(l));
  const isLidlDigital =
    isLidl && /lidl plus|^\d{1,2}:\d{2}|^\d+\s+(sty|lut|mar|kwi|maj|cze|lip|sie|wrz|paź|paz|lis|gru)/im.test(text) && !/PARAGON FISKALNY/i.test(text);
  const initialCluster = extractInitialNameCluster(lines, firstQtyIndex);
  const lidlClusterNames = (() => {
    if (!isLidlDigital || initialCluster.length === 0) return [];
    const cluster = [...initialCluster];
    const firstInline = qtyMatches[0]?.inlineName;
    if (firstInline && !cluster.some((n) => n.toLowerCase() === firstInline.toLowerCase())) {
      cluster.push(firstInline);
    }
    return [...cluster].reverse();
  })();
  const headerNames = extractHeaderProductNames(lines);
  const nrIdx = lines.findIndex((l) => /^nr:/i.test(l));
  const headerNameByLineIndex = new Map<number, string>();
  if (nrIdx >= 0 && headerNames.length > 0) {
    const afterNr = qtyMatches.filter((q) => q.lineIndex > nrIdx);
    for (let h = 0; h < Math.min(headerNames.length, afterNr.length); h++) {
      headerNameByLineIndex.set(afterNr[h].lineIndex, headerNames[h]);
    }
  }
  const namesBeforeFirstQty = extractProductNamesBeforeQty(lines, firstQtyIndex);
  const namesBeforeAllQty = extractProductNamesBeforeQty(lines, lines.length);
  const namesBeforeQty =
    namesBeforeFirstQty.length > 0 ? namesBeforeFirstQty : namesBeforeAllQty;

  const isBiedronkaFiscal = /biedronka/i.test(text) && /PARAGON FISKALNY/i.test(text);
  const useLidlPaperNames =
    lidlPaperNames.length > 0 && lidlPaperNames.length === qtyMatches.length;

  const items: ParsedReceiptItem[] = [];
  let nameQueueIndex = 0;

  for (let i = 0; i < qtyMatches.length; i++) {
    const qty = qtyMatches[i];
    let name = qty.inlineName ?? null;

    if (headerNameByLineIndex.has(qty.lineIndex)) {
      name = headerNameByLineIndex.get(qty.lineIndex)!;
    } else if (lidlPostSuma && qty.lineIndex >= postSumaStart) {
      const idx = lidlPostSuma.qtyMatches.findIndex((q) => q.lineIndex === qty.lineIndex);
      if (idx >= 0) name = lidlPostSuma.names[idx];
    } else if (isRossmann && rossmannNames.length === qtyMatches.length) {
      name = rossmannNames[i];
    } else if (useLidlPaperNames) {
      name = lidlPaperNames[i];
    } else if (isLidlDigital && ptuIdx > 0 && qty.lineIndex < ptuIdx) {
      const prePtuIdx = qtyMatches
        .filter((q) => q.lineIndex < ptuIdx)
        .findIndex((q) => q.lineIndex === qty.lineIndex);
      if (prePtuIdx >= 0 && prePtuIdx < lidlClusterNames.length) {
        name = lidlClusterNames[prePtuIdx];
      }
    }

    if (!name) {
      if (isBiedronkaFiscal && !headerNameByLineIndex.has(qty.lineIndex)) {
        name = findNameBefore(lines, qty.lineIndex);
        if (!name) name = findNameAfter(lines, qty.lineIndex);
      } else {
        name = findNameBefore(lines, qty.lineIndex);
      }
    }

    if (!name && !qty.inlineName && nameQueueIndex < namesBeforeQty.length && !isLidlDigital) {
      name = namesBeforeQty[nameQueueIndex];
      nameQueueIndex++;
    }

    if (!name) name = `Pozycja ${i + 1}`;
    name = cleanName(name);

    if (!hasLetters(name) || isDiscountLine(name) || isHeaderName(name)) continue;

    let totalPrice = qty.totalPrice;

    if (totalPrice > 120) continue;

    const discount = extractDiscountAfterQty(lines, qty.lineIndex);
    if (discount !== null && (isRossmann || /kupon|OPUST/i.test(text))) {
      totalPrice = Number((qty.totalPrice - discount).toFixed(2));
    }

    const opustFinal = !isRossmann
      ? extractOpustFinalPrice(lines, qty.lineIndex, qty.totalPrice)
      : null;
    if (opustFinal !== null) {
      totalPrice = opustFinal;
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
  const head = lines.slice(0, 25).join("\n");
  for (const store of STORE_PATTERNS) {
    if (store.pattern.test(head)) return store.name;
  }

  for (let i = 0; i < Math.min(lines.length, 10); i++) {
    if (pricesIn(lines[i]).length === 0 && hasLetters(lines[i]) && !isSkipLine(lines[i])) {
      const name = cleanName(lines[i]);
      if (!isHeaderName(name)) return name;
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
