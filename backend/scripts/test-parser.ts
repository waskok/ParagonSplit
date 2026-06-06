import { parseReceiptText } from "../src/utils/receiptParser";

const biedronkaPaper = `Biedronka
Codziennie niskie ceny
Sklep 5384 ul. Czestochowska 32-085, 3
2-085 ModlnicaJeronimo Martins Polska
S.A.ul. Zniwna 5, 62-025 Kostrzyn
NIP 779-10-11-327
PARAGON FISKALNY
2026-06-06 10:39
WodaNGNałęczo1,5l
TostSzynSer120g
C
SPRZEDAZ OPODATKOWANA A
PTU A 23,00 %
SPRZEDAZ OPODATKOWANA C
PTU C 5,00 %
SUMA PTU
SUMA PLN
00030 #Kasa 14 Kasjer nr 35
338759
6 x2,89 17,34A
2 x4,49 8,98C
17,34
3,24
8,98
0,43
3,67
26,32
2026-06-06 10:39
A50ED6097C004DA15377241F2AA2720992555837
CCH 1901002255
www.www
1000053842971234814261
Nr sys, 2971
NIE FISKALNY
Rozliczenie opakowań zwrotnych
Wydania opakowań
Opakowanie zwr.1
6,000×0,50 3,00
Opis: But Plastik kaucja
DO ZAPŁATY
29,32 PLN
Karta VISA 07 1
29,32 PLN`;

const biedronkaDigital = `LodBigMilkInCzeko, C
91
Rabat
1.0 x
19,99
19,99C
10,00
9.99C
KetchupPikantny470 B 1.0 x
g
PassatazZioł700g C 1.0 x
3,49
,
3,49B
6,75
6,75C
Rabat
2,87
3.88C
PassatazZioł700g C 1.0 x
6,75
6,75C
Rabat
2,88
3.87C
Papryka Słodka
C 0.69 x
12,99
8,96C
Czerw
Rabat
3,45
5.51C
PrzyCzoskamis16-20 C
1.0 x
2,49
2,49C
g
PierśPieczonaKW100 C 1.0 x
3,99
3,99C
g
ParSz/KurKrak200g C 1.0 x
6,89
6,89C
Rabat
2,90
3.99C
PizzaKurPiecz600g C 1.0 x
16,99
16,99C
Rabat
3,00
13.99C
PizzaKurPiecz600g C 1.0 x
16,99
16,99C
Rabat
3,00
13.99C`;

const rossmann = `Rossmann SDP SP. Z 0.0. Sklep nr 689
NIP 7270019183
al. Pokoju 67
31-580 Kraków
Nr rej. 000003093
PARAGON
YOPE MEN ZEL P/PR\\AX
OPUST Rossmann Run 50%
ISANA MEN HYDRO Z\\AX
OPUST Rossmann Run 50%
OLD SPICE WOLFTHO\\AX
OPUST Rossmann Run 50%
NEBOA THERMO PROT\\AX
OPUST Rossmann Run 50%
BIOTANIQE D.EXPER\\AX
OPUST Rossmann Run 50%
PROKUDENT INTER. \\AX
OPUST Rossmann Run 50%
RIMMEL KIND&FREE \\AX
OPUST Rossmann Run 50%
LOVELY SWEET'N JU\\AX
OPUST Rossmann Run 50%
AA WINGS IT GIRL \\AX
OPUST Rossmann Run 50%
EVELINE FACE GRIP\\AX
OPUST Rossmann Run 50%
OPUSTY ŁĄCZNIE
SPRZEDAZ OPODATKOWANA A
PTU A 23%
SUMA PTU
SUMA PLN
ROZLICZENIE PŁATNOŚCI
KARTA Visa Debit B
FISKALNY
nr:119220
2 x24,99 49,98A
-24,99A
2 x10,99 21,98A
-10.99A
1 x19,49 19,49A
-9,75A
1 x28,99 28,99A
-14,49A
1 x23,49 23,49A
-11.74A
1 x7,79 7,79A
-3.89A
1 x37,99 37,99A
-18,99A
1 x23.99 23,99A
-12.00A
1 x47,99 47,99A
-24,00A
1 x37,99 37,99A
-19,00A
-149.84
149,84
28.02
28.02
149,84
149,84 PLN
2026-05-30 15:29`;

function printResult(label: string, text: string) {
  const result = parseReceiptText(text);
  console.log(`\n=== ${label} ===`);
  console.log(`Store: ${result.storeName}, Total: ${result.total}, Items: ${result.items.length}`);
  for (const item of result.items) {
    console.log(`  - ${item.name}: ${item.quantity} x ${item.unitPrice} = ${item.totalPrice}`);
  }
}

printResult("Biedronka paper", biedronkaPaper);
printResult("Biedronka digital", biedronkaDigital);
printResult("Rossmann", rossmann);
