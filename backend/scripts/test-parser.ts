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

const lidlDigital = `17:07 Jak wymie
25 maj 2026
Borówka amery.400g
Lidl Plus kupon
Melon żółty luz
Piwo cz.porzeczka
1 * 23.99 23.99 C
-12,00
2,608kg x 8.99 23.45 C
Lidl Plus kupon
-7,83
3 * 3.49 10.47 A
Piwo pom.czer.grej.
1
* 3.49 3.49 A
Wielokrotka Torba ś.
1
*
3.99 3.99 A
Black Napój energ.0
1
* 2.99 2.99 A
Black Napój energ.0
3 * 2.99 8.97 A
Worki 601 zawiązyw.
2
* 3.89 7.78 A
Worki 351 zawiązyw.
3
* 3.89 11.67 A
Chrupki Ser, Orzech
1
* 3.19 3.19 C
Chrupki 100g, 125g
1
* 3.49 3.49 C
Orzeszki ziem.w skor
1 *
5.24 5.24 C
Frytki Curlies
2
* 9.99 19.98 C
PTU C
Gruszka Nashi szt.
Napój jogurtowy 850g
Tiger Napój energ.2
Tiger Napój energ.2
PTU A
Kwota A 23,00%
Kwota C 5,00%
Suma
1 * 3.99 3.99 C
2
* 5.77 11.54 C
1 * 4.49 4.49 A
1
* 4.49 4.49 A
58,34
10,91
75,04
3,57
14,48
Suma PLN
133,38
ooo
68`;

const biedronka2 = `NIP 7791011327
Torba T-SHIRT
KaszaBulgur4x100g
Biedronka
Codziennie niskie ceny
BIEDRONKA "CODZIENNIE NISKIE CENY" 3645
31-867 KRAKÓW UL. OS. 11 PUŁKU LOTNICZEGO
JERONIMO MARTINS POLSKA S.A.
62-025 KOSTRZYN UL ZNIWNA 5
PARAGON FISKALNY
A
C
nr:260379
1 x0,65 0,65A
1 x3,19 3,19C
MusDawtonaJabMor0,18
C
1 x2,99 2,99C
DzemRapsBrzoskwi410g
C
1 x4,99 4,99C
MakarCavatappi 500g
C
1 x4,49 4,49C
RyżJaśminowy4x100g
C
OPUST
PrzecPomCulineo500g
C
3 x3,29 9,87C
6,58
3 x4,49 13,47C
-3,29C
OPUST
-7,500
5,97
Ziemniaki MyteLuz
C
0,980 x3,99 3,910
SkyrBezlak anil 150g
C
Banan Luz
C
OPUST
MakaGnoDiPaGus500g
OliwGalloReser0,5[
00
C
C
2 x2,99 5,98C
0.930 x6,99 6,50C
-3.72C
2,78
1 x4,69 4,69C
1 x34,99 34,99C
OPUST
-15,00C
19,99
MakEkspFusPast500g
C
1 x4,19 4,19C
OPUST
-3,190
1.00
-32.70
OPUSTY ŁĄCZNIE
Sp: A=0,65 C=66,56
PTU: A23%=0,12 C5%-3,17
SUMA PLN
ROZLICZENIE PŁATNOŚCI
KARTA Visa Debit 07 1
00068 #Kasa 11 Kasjer nr 31
SUMA PTU=3.29
67,21
67,21 PLN
2026-03-30 13:36
A272FC17754C8291377F7B1D20F9701A384F0DAA
Nr transakcji:
TEAZ 2202166101
8966
3645260330896611`;

const lidlPaper = `Adres siedziby: Poznańska 48, Jankowice 62-080 Tarnowo
Podgórne or rej: BD0 000002265 Lidl sp.z 0.0. sp.k."
ul. Zygmunta Augusta 12A, 34-600 Limanowa
NIP 7811897358
PARAGON
Filet z kurczak. św.
OPUST Filet z kurczak.św.
FISKALNY
nr: 419594
0.902 x24,80 22,37C
-8.85
13.52c
Filet z kurczak. św. F
OPUST Filet z kurczak.św.
Kamis przypr.grill
!
Kamis przypr.grill
I
Kamis przypr.grill
I
Kasza perłowa
F
Pure Filet z indyka
F
ELSEVE Szampon 2
X
Podsuma:
SPRZEDAŻ OPODATKOWANA A
SPRZEDAZ OPODATKOWANA B
SPRZEDAŻ OPODATKOWANA C
PTU A 23%
PTU B 8%
PTU C 5%
SUMA PT
0,864 x24.80 21.43C
-8.48
12,950
91016 1 x2,49 2,49B
1 x2.49 2.49B
1 x2.49 2,49B
1 x1,99 1,99C
1 x5.99 5,99C
1 x21,99 21,99A
FLOW
w qable jowe isɔ0
63,91
21,99
7,47
34.45
4.11
0.55
Tev n gangsa bsdobs 1,64
SUMA PLN
6.30
63,91
ROZLICZENIE PŁATNOŚCI
00100 #3 24 2137 nr:267906
dasquales day 63.91 PLN
2026-06-03 11:59
77CDEDB672EA7486360D5DD2604E8A0176D26A0C
PEAO 20013077350 unless
E
8882137267906003030626
NIP 7811897358
nr:419595
NIEFISKALNY
TTA
Z Lidl +
zaoszczędzono 17.33 PLN
siniqo sio
#3 24 2137 nr:267906
NIEFISKALNY
55B0E91E66205C29B02E7A7DB32054CF563345C5
EAO 2001307735
2026-06-03 11:59
nr:419596`;

printResult("Lidl digital", lidlDigital);
printResult("Biedronka 2", biedronka2);
printResult("Lidl paper", lidlPaper);
