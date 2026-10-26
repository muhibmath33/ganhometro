// Calculator logic ported 1:1 from the Main.dc.html design (Handoff §4).

export type CalcInput = {
  listed: string;
  received: string;
  paid: string;
  unpaid: string;
  rate: string;
};

export type CalcResult = {
  realBrl: string;
  realUsd: string;
  gapText: string;
  unpaidShare: string;
};

// Brazilian input: if the string has ",", drop "." and turn "," into "."; otherwise drop ",".
export function parseNumber(s: string): number {
  let t = String(s || "").trim();
  if (t.indexOf(",") >= 0) {
    t = t.replace(/\./g, "").replace(",", ".");
  } else {
    t = t.replace(/,/g, "");
  }
  const n = parseFloat(t);
  return isNaN(n) ? 0 : n;
}

// "R$ 1.234,56"
export function formatMoney(prefix: string, n: number): string {
  return (
    prefix +
    " " +
    n
      .toFixed(2)
      .replace(".", ",")
      .replace(/\B(?=(\d{3})+(?!\d))/g, ".")
  );
}

export function calculate(input: CalcInput): CalcResult {
  const listed = parseNumber(input.listed);
  const received = parseNumber(input.received);
  const paid = parseNumber(input.paid);
  const unpaid = parseNumber(input.unpaid);
  const rate = parseNumber(input.rate);

  const hours = paid + unpaid;
  const realUsd = hours > 0 ? received / hours : 0;
  const realBrl = realUsd * rate;

  let gapText = "—";
  if (listed > 0 && hours > 0) {
    const pct = Math.round((1 - realUsd / listed) * 100);
    gapText =
      pct > 0
        ? pct + "% a menos que o anunciado"
        : pct < 0
          ? Math.abs(pct) + "% a mais que o anunciado"
          : "Igual ao anunciado";
  }
  const unpaidShare =
    hours > 0
      ? Math.round((unpaid / hours) * 100) + "% das suas horas não foram pagas"
      : "—";

  return {
    realBrl: formatMoney("R$", realBrl) + "/h",
    realUsd: formatMoney("US$", realUsd) + "/h",
    gapText,
    unpaidShare,
  };
}
