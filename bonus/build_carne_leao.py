"""Builds "Carnê-leão 2026 para quem recebe em dólar", the Ganhômetro signup bonus.

    python bonus/build_carne_leao.py                  -> public/Carne-leao-2026-Ganhometro.xlsx
    python bonus/build_carne_leao.py --update-rates   -> refresh bonus/ptax.json from the BCB first
    python bonus/verify_carne_leao.py                 -> checks every formula (see that file)

Rules follow the Ganhômetro handoff (section 5). Formulas stay live in the workbook; the
Python model below only supplies the cached values (so previews show numbers) and the
expected results for the verification script.
"""

import datetime as dt
import json
import sys
import urllib.request
from decimal import ROUND_HALF_UP, Decimal
from pathlib import Path

import xlsxwriter

HERE = Path(__file__).parent
OUT = HERE.parent / "public" / "Carne-leao-2026-Ganhometro.xlsx"
PTAX_FILE = HERE / "ptax.json"  # BCB PTAX daily rates, plus the date they were downloaded

YEAR = 2026
PAY_FIRST, PAY_LAST = 7, 306  # payment input rows (Excel numbering)
EXAMPLE_ROW = 6
MONTHS = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho",
          "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"]

# --- 2026 rules (Handoff §5) -------------------------------------------------
BRACKETS = [  # base above (R$), up to, rate, amount to deduct
    (0.00, 2428.80, 0.000, 0.00),
    (2428.80, 2826.65, 0.075, 182.16),
    (2826.65, 3751.05, 0.150, 394.16),
    (3751.05, 4664.68, 0.225, 675.49),
    (4664.68, None, 0.275, 908.73),
]
SIMPLIFIED = 607.20
PER_DEPENDENT = 189.59
EXEMPT_UP_TO = 5000.00
REDUCTION_MAX = 312.89
PARTIAL_UP_TO = 7350.00
PARTIAL_K = 978.62
PARTIAL_F = 0.133145
DARF_MIN = 10.00
HOLIDAYS = [  # days without bank service, used for the DARF due date
    ("2026-01-01", "Confraternização Universal"), ("2026-02-16", "Carnaval"),
    ("2026-02-17", "Carnaval"), ("2026-04-03", "Sexta-feira Santa"),
    ("2026-04-21", "Tiradentes"), ("2026-05-01", "Dia do Trabalho"),
    ("2026-06-04", "Corpus Christi"), ("2026-09-07", "Independência"),
    ("2026-10-12", "Nossa Senhora Aparecida"), ("2026-11-02", "Finados"),
    ("2026-11-15", "Proclamação da República"), ("2026-11-20", "Consciência Negra"),
    ("2026-12-25", "Natal"), ("2026-12-31", "Último dia do ano (sem expediente bancário)"),
    ("2027-01-01", "Confraternização Universal"),
]
HOLIDAY_DATES = {dt.date.fromisoformat(d) for d, _ in HOLIDAYS}


def round2(x: float) -> float:
    """Excel-style ROUND(x, 2): Excel works on 15 significant digits, so 1702.6149999999998
    (the float for 1702.615) rounds to 1702.62, half away from zero."""
    return float(Decimal(format(x, ".15g")).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP))


def update_rates():
    """Download PTAX rates from December of the previous year until today (BCB Olinda API)."""
    today = dt.date.today()
    url = ("https://olinda.bcb.gov.br/olinda/servico/PTAX/versao/v1/odata/"
           "CotacaoDolarPeriodo(dataInicial=@dataInicial,dataFinalCotacao=@dataFinalCotacao)"
           f"?@dataInicial='12-01-{YEAR - 1}'&@dataFinalCotacao='{today:%m-%d-%Y}'"
           "&$top=1000&$format=json&$select=cotacaoCompra,cotacaoVenda,dataHoraCotacao")
    with urllib.request.urlopen(url, timeout=60) as resp:
        data = json.load(resp)
    PTAX_FILE.write_text(json.dumps({"consultado": f"{today:%d/%m/%Y}", **data},
                                    ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"Saved {len(data['value'])} PTAX days to {PTAX_FILE.name}")


def ptax_consulted() -> str:
    return json.loads(PTAX_FILE.read_text(encoding="utf-8"))["consultado"]


def load_rates():
    """Reference date and PTAX buying rate for each receipt month of 2026."""
    rows = json.loads(PTAX_FILE.read_text(encoding="utf-8"))["value"]
    quotes = {r["dataHoraCotacao"][:10]: r["cotacaoCompra"] for r in rows}
    out = {}
    for m in range(1, 13):
        y, pm = (YEAR - 1, 12) if m == 1 else (YEAR, m - 1)
        days = sorted(d for d in quotes if d.startswith(f"{y}-{pm:02d}-") and int(d[8:]) <= 15)
        if days:
            out[m] = (dt.date.fromisoformat(days[-1]), quotes[days[-1]])
        else:  # not published yet: last business day up to the 15th, rate to be filled in
            d = dt.date(y, pm, 15)
            while d.weekday() >= 5 or d in HOLIDAY_DATES:
                d -= dt.timedelta(days=1)
            out[m] = (d, None)
    return out


def due_date(month: int) -> dt.date:
    """Last business day of the month after receipt."""
    d = dt.date(YEAR + (month == 12), month % 12 + 1, 1)
    d = dt.date(d.year + (d.month == 12), d.month % 12 + 1, 1) - dt.timedelta(days=1)
    while d.weekday() >= 5 or d in HOLIDAY_DATES:
        d -= dt.timedelta(days=1)
    return d


def table_tax(base: float) -> float:
    rate, ded = next((r, dd) for low, _, r, dd in reversed(BRACKETS) if base >= low)
    return max(0.0, round2(base * rate - ded))


def reduction(gross: float, tax: float) -> float:
    if gross <= 0:
        return 0.0
    if gross <= EXEMPT_UP_TO:
        return min(tax, REDUCTION_MAX)
    if gross <= PARTIAL_UP_TO:
        return min(tax, max(0.0, round2(PARTIAL_K - PARTIAL_F * gross)))
    return 0.0


def compute(payments, deductions, rates):
    """Expected value of every formula cell. payments: [(date|None, platform, usd|None)];
    deductions: {month: (inss, dependents, alimony, other)}."""
    pay = []
    for date, _platform, usd in payments:
        month = date.month if date and date.year == YEAR else ""
        rate = rates[month][1] if month else None
        rate = "" if rate is None else rate
        brl = round2(usd * rate) if rate != "" and isinstance(usd, (int, float)) else ""
        if date is None and usd is None:
            warn = ""
        elif date is None:
            warn = "Falta a data"
        elif date.year != YEAR:
            warn = "Use uma data de 2026"
        elif usd is None:
            warn = "Falta o valor"
        elif rate == "":
            warn = "Falta a cotação deste mês (aba Cotações)"
        else:
            warn = ""
        pay.append({"month": month, "rate": rate, "brl": brl, "warn": warn})

    ded, summary = {}, {}
    carry = 0.0
    for m in range(1, 13):
        inss, deps, alimony, other = deductions.get(m, (0, 0, 0, 0))
        legal = round(inss + deps * PER_DEPENDENT + alimony + other, 10)
        used = max(legal, SIMPLIFIED)
        ded[m] = {"legal": legal, "simplified": SIMPLIFIED, "used": used,
                  "choice": "Deduções legais" if legal > SIMPLIFIED else "Desconto simplificado"}

        gross = round(sum(p["brl"] for p in pay if p["month"] == m and p["brl"] != ""), 10)
        used_here = 0.0 if gross == 0 else used
        base = max(0.0, gross - used_here)
        tax = table_tax(base)
        red = reduction(gross, tax)
        month_tax = round2(tax - red)
        darf = round(month_tax + carry, 10) if month_tax + carry >= DARF_MIN else 0.0
        if darf > 0:
            status = "Pagar DARF (código 0190) até o vencimento"
        elif month_tax + carry > 0:
            status = "Menos de R$ 10: soma no mês seguinte"
        elif gross == 0:
            status = "Sem rendimentos lançados"
        else:
            status = "Isento neste mês"
        summary[m] = {"gross": gross, "ded": used_here, "base": base, "tax": tax, "red": red,
                      "month_tax": month_tax, "carry": carry, "darf": darf,
                      "due": due_date(m), "status": status}
        carry = round(month_tax + carry, 10) if darf == 0 else 0.0
    return pay, ded, summary


def excel_date(d: dt.date) -> int:
    return (d - dt.date(1899, 12, 30)).days


def build(path=OUT, payments=(), deductions=None, rates=None):
    rates = rates or load_rates()
    consulted = ptax_consulted()
    deductions = deductions or {}
    payments = list(payments)
    rows = payments + [(None, None, None)] * (PAY_LAST - PAY_FIRST + 1 - len(payments))
    example = (dt.date(YEAR, 1, 5), "Exemplo: Outlier", 480.00)
    pay, ded, summary = compute(rows, deductions, rates)
    ex = compute([example], {}, rates)[0][0]

    wb = xlsxwriter.Workbook(path)
    wb.formats[0].set_font_name("Arial")
    wb.set_calc_mode("auto")
    wb.set_properties({"title": "Carnê-leão 2026 para quem recebe em dólar",
                       "author": "Ganhômetro", "comments": "Estimativa. Não é orientação contábil."})

    INK, GREEN, GREEN_TINT, LINE = "#13201B", "#0B6B4F", "#E2F1EA", "#E4E0D5"
    AMBER_TINT, AMBER_INK, MUTED, INPUT = "#FDF1E3", "#7A3A06", "#5C6762", "#FFF2CC"
    BRL = '"R$" #,##0.00;-"R$" #,##0.00;"–"'

    def F(**kw):
        base = {"font_name": "Arial", "font_size": 10, "valign": "vcenter"}
        base.update(kw)
        return wb.add_format(base)

    cell = {"border": 1, "border_color": LINE}
    title = F(bold=True, font_size=16, font_color=INK)
    big_title = F(bold=True, font_size=20, font_color=INK)
    sub = F(font_color=MUTED, text_wrap=True)
    section = F(bold=True, font_size=12, font_color=GREEN)
    text = F(font_color=INK, text_wrap=True)
    note = F(font_color=MUTED, italic=True, text_wrap=True)
    head = F(bold=True, font_color="#FFFFFF", bg_color=INK, text_wrap=True, border=1, border_color=INK)
    inp = dict(cell, bg_color=INPUT, font_color="#0000FF", locked=False)
    inp_date = F(**inp, num_format="dd/mm/yyyy", align="center")
    inp_text = F(**inp)
    inp_usd = F(**inp, num_format='"US$" #,##0.00')
    inp_brl = F(**inp, num_format=BRL)
    inp_int = F(**inp, num_format="0", align="center")
    inp_rate = F(**inp, num_format="0.0000")
    calc_brl = F(**cell, num_format=BRL)
    calc_brl_bold = F(**cell, num_format=BRL, bold=True)
    calc_rate = F(**cell, num_format="0.0000")
    calc_int = F(**cell, num_format="0", align="center", font_color=MUTED)
    calc_date = F(**cell, num_format="dd/mm/yyyy", align="center")
    calc_text = F(**cell)
    warn = F(**cell, font_color=AMBER_INK, bold=True)
    fixed_rate = F(**cell, num_format="0.0000", font_color="#0000FF")
    fixed_date = F(**cell, num_format="dd/mm/yyyy", align="center")
    fixed_brl = F(**cell, num_format='"R$" #,##0.00', font_color="#0000FF")
    fixed_pct = F(**cell, num_format="0.0%", font_color="#0000FF")
    fixed_num = F(**cell, num_format="0.000000", font_color="#0000FF")
    fixed_text = F(**cell, font_color="#0000FF")
    label = F(**cell, font_color=INK)
    total_label = F(**cell, bold=True, bg_color=GREEN_TINT)
    total_brl = F(**cell, bold=True, bg_color=GREEN_TINT, num_format=BRL)
    total_blank = F(**cell, bg_color=GREEN_TINT)
    ex_fmt = dict(cell, italic=True, font_color=MUTED, bg_color="#F3F3F3")
    ex_date = F(**ex_fmt, num_format="dd/mm/yyyy", align="center")
    ex_text = F(**ex_fmt)
    ex_usd = F(**ex_fmt, num_format='"US$" #,##0.00')
    ex_int = F(**ex_fmt, num_format="0", align="center")
    ex_rate = F(**ex_fmt, num_format="0.0000")
    ex_brl = F(**ex_fmt, num_format=BRL)
    legend_input = F(bg_color=INPUT, font_color="#0000FF", border=1, border_color=LINE)
    legend_calc = F(font_color=INK, border=1, border_color=LINE)
    disclaimer = F(bg_color=AMBER_TINT, font_color=AMBER_INK, bold=True, text_wrap=True,
                   border=1, border_color="#F3D9B8")
    brand = F(bold=True, font_color=GREEN)

    protect_opts = {"format_columns": True, "format_rows": True,
                    "select_locked_cells": True, "select_unlocked_cells": True}

    def setup(ws, tab):
        ws.hide_gridlines(2)
        ws.set_tab_color(tab)
        ws.set_column("A:A", 2)
        ws.set_paper(9)
        ws.set_landscape()
        ws.fit_to_pages(1, 0)

    # References into "Tabelas" (layout fixed below)
    T = {
        "lows": "'Tabelas'!$B$6:$B$10", "rates": "'Tabelas'!$D$6:$D$10",
        "deds": "'Tabelas'!$E$6:$E$10", "simpl": "'Tabelas'!$C$14", "dep": "'Tabelas'!$C$15",
        "exempt": "'Tabelas'!$C$19", "redmax": "'Tabelas'!$C$20", "partial": "'Tabelas'!$C$21",
        "k": "'Tabelas'!$C$22", "f": "'Tabelas'!$C$23", "min": "'Tabelas'!$C$27",
        "hol": f"'Tabelas'!$B$32:$B${31 + len(HOLIDAYS)}",
    }
    RATES_REF = "'Cotações'!$E$6:$E$17"

    # ---- Comece aqui --------------------------------------------------------
    ws = wb.add_worksheet("Comece aqui")
    setup(ws, GREEN)
    ws.set_column("B:B", 135)
    ws.write("B2", "Carnê-leão 2026 para quem recebe em dólar", big_title)
    ws.write("B3", "Planilha gratuita do Ganhômetro. Lance seus pagamentos em dólar e veja o "
                   "imposto estimado de cada mês, com as regras de 2026.", sub)
    lines = [
        ("B5", "Como usar", section),
        ("B6", "1. Na aba Pagamentos, lance cada pagamento: a data em que o dinheiro foi creditado "
               "a você, a plataforma e o valor bruto em dólares.", text),
        ("B7", "2. A cotação oficial e o valor em reais aparecem sozinhos (dólar de compra do "
               "Banco Central, aba Cotações).", text),
        ("B8", "3. Paga INSS, tem dependentes ou paga pensão alimentícia? Preencha a aba Deduções. "
               "Se não, pode pular.", text),
        ("B9", "4. Na aba Resumo do mês, veja quanto pagar de DARF e até quando.", text),
        ("B11", "Legenda", section),
        ("B12", "Célula amarela: você preenche.", legend_input),
        ("B13", "Célula branca: calculada pela planilha. Não precisa mexer.", legend_calc),
        ("B14", "As abas estão protegidas, sem senha, para evitar apagar fórmulas sem querer "
                "(Revisão > Desproteger planilha).", note),
        ("B16", "Regras usadas", section),
        ("B17", "• Conversão: cada pagamento vira reais pelo dólar de compra (PTAX) do último dia "
                "útil da 1ª quinzena do mês anterior ao recebimento.", text),
        ("B18", "• Até R$ 5.000,00 recebidos no mês: imposto zero. De R$ 5.000,01 a R$ 7.350,00: "
                "redução parcial. Acima disso: tabela normal (Lei nº 15.270/2025).", text),
        ("B19", "• A planilha usa o desconto simplificado de R$ 607,20 ou as suas deduções legais, "
                "o que for maior. A aba Deduções mostra qual escolher no Carnê-Leão Web.", text),
        ("B20", "• O DARF (código 0190) é gerado no Carnê-Leão Web, no e-CAC, com conta gov.br "
                "prata ou ouro.", text),
        ("B21", "• Vencimento: último dia útil do mês seguinte ao recebimento. Atraso: multa de "
                "0,33% ao dia (até 20%) mais juros Selic.", text),
        ("B22", "• DARF abaixo de R$ 10,00 não é pago: o valor é somado ao imposto do mês seguinte.", text),
        ("B23", "• Carnê-leão é imposto de renda e não conta para o INSS. A contribuição ao INSS "
                "é separada.", text),
        ("B25", "Antes de usar", section),
        ("B26", "• Recebeu em outra moeda (euro, libra)? Converta para dólar pela cotação do dia do "
                "recebimento e lance o valor em dólar.", text),
        ("B27", "• Lance o valor bruto pago pela plataforma, antes das taxas do PayPal, Wise, "
                "Payoneer ou do banco.", text),
        ("B28", "• Tem salário CLT também? Ele já tem imposto descontado na fonte. O acerto entre "
                "os dois acontece na declaração anual.", text),
        ("B29", "• A cotação usada para pagamentos de dezembro só sai em 13/11/2026. A aba "
                "Cotações mostra onde consultar.", text),
        ("B31", "Estimativa baseada nas regras publicadas para 2026. Não é orientação contábil. "
                "Em caso de dúvida, consulte um contador.", disclaimer),
        ("B33", "Feito pelo Ganhômetro: descubra quanto cada plataforma paga de verdade, por hora, "
                "em reais.", brand),
        ("B34", f"Cotações do Banco Central consultadas em {consulted}.", note),
    ]
    for ref, value, fmt in lines:
        ws.write(ref, value, fmt)
    ws.set_row(30, 30)
    ws.protect("", protect_opts)
    ws.activate()

    # ---- Pagamentos ---------------------------------------------------------
    ws = wb.add_worksheet("Pagamentos")
    setup(ws, "#E8A33D")
    for col, width in {"B:B": 14, "C:C": 26, "D:D": 16, "E:E": 7, "F:F": 15, "G:G": 18, "H:H": 40}.items():
        ws.set_column(col, width)
    ws.write("B2", "Pagamentos recebidos em 2026", title)
    ws.write("B3", "Um pagamento por linha. Preencha só as colunas amarelas: data, plataforma e "
                   "valor em dólares.", sub)
    ws.write("F3", "Total em reais:", F(bold=True, align="right"))
    total_brl_value = round(sum(p["brl"] for p in pay if p["brl"] != ""), 10)
    ws.write_formula("G3", f"=SUM(G{PAY_FIRST}:G{PAY_LAST})",
                     F(bold=True, num_format=BRL), total_brl_value)
    headers = ["Data do recebimento", "Plataforma", "Valor bruto (US$)", "Mês",
               "Cotação usada (R$ por US$)", "Valor em reais (R$)", "Aviso"]
    ws.write_row("B5", headers, head)
    ws.set_row(4, 30)

    def pay_formulas(r):
        return {
            "E": f'=IFERROR(IF(B{r}="","",IF(YEAR(B{r})<>{YEAR},"",MONTH(B{r}))),"")',
            "F": f'=IF(E{r}="","",IF(INDEX({RATES_REF},E{r})="","",INDEX({RATES_REF},E{r})))',
            "G": f'=IF(OR(F{r}="",NOT(ISNUMBER(D{r}))),"",ROUND(D{r}*F{r},2))',
            "H": (f'=IF(AND(B{r}="",D{r}=""),"",IF(B{r}="","Falta a data",'
                  f'IF(IFERROR(YEAR(B{r}),0)<>{YEAR},"Use uma data de {YEAR}",'
                  f'IF(D{r}="","Falta o valor",IF(NOT(ISNUMBER(D{r})),"O valor precisa ser um número",'
                  f'IF(F{r}="","Falta a cotação deste mês (aba Cotações)",""))))))'),
        }

    r = EXAMPLE_ROW
    fx = pay_formulas(r)
    ws.write_datetime(f"B{r}", dt.datetime.combine(example[0], dt.time()), ex_date)
    ws.write(f"C{r}", example[1], ex_text)
    ws.write_number(f"D{r}", example[2], ex_usd)
    ws.write_formula(f"E{r}", fx["E"], ex_int, ex["month"])
    ws.write_formula(f"F{r}", fx["F"], ex_rate, ex["rate"])
    ws.write_formula(f"G{r}", fx["G"], ex_brl, ex["brl"])
    ws.write(f"H{r}", "← Exemplo: não entra no total", ex_text)

    for i, (date, platform, usd) in enumerate(rows):
        r = PAY_FIRST + i
        fx = pay_formulas(r)
        if date:
            ws.write_datetime(f"B{r}", dt.datetime.combine(date, dt.time()), inp_date)
        else:
            ws.write_blank(f"B{r}", None, inp_date)
        ws.write(f"C{r}", platform, inp_text) if platform else ws.write_blank(f"C{r}", None, inp_text)
        ws.write_number(f"D{r}", usd, inp_usd) if usd is not None else ws.write_blank(f"D{r}", None, inp_usd)
        p = pay[i]
        ws.write_formula(f"E{r}", fx["E"], calc_int, p["month"])
        ws.write_formula(f"F{r}", fx["F"], calc_rate, p["rate"])
        ws.write_formula(f"G{r}", fx["G"], calc_brl, p["brl"])
        ws.write_formula(f"H{r}", fx["H"], warn, p["warn"])

    ws.data_validation(f"B{PAY_FIRST}:B{PAY_LAST}", {
        "validate": "date", "criteria": "between",
        "minimum": dt.datetime(YEAR, 1, 1), "maximum": dt.datetime(YEAR, 12, 31),
        "input_title": "Data do recebimento", "input_message": "Dia em que o dinheiro foi creditado a você. Ex.: 05/01/2026",
        "error_title": "Data inválida", "error_message": "Use uma data de 2026, no formato dd/mm/aaaa."})
    ws.data_validation(f"D{PAY_FIRST}:D{PAY_LAST}", {
        "validate": "decimal", "criteria": ">=", "value": 0,
        "input_title": "Valor bruto (US$)", "input_message": "Valor pago pela plataforma, antes das taxas. Ex.: 480,00",
        "error_title": "Valor inválido", "error_message": "Digite só o número, em dólares. Ex.: 480,00"})
    ws.freeze_panes(5, 0)
    ws.repeat_rows(4)
    ws.protect("", protect_opts)

    # ---- Resumo do mês ------------------------------------------------------
    ws = wb.add_worksheet("Resumo do mês")
    setup(ws, INK)
    for col, width in {"B:B": 5, "C:C": 12, "D:K": 15, "L:L": 13, "M:M": 40}.items():
        ws.set_column(col, width)
    ws.write("B2", "Resumo do mês: quanto pagar de carnê-leão", title)
    ws.write("B3", "Tudo aqui é calculado a partir das abas Pagamentos e Deduções. Estimativa com "
                   "as regras de 2026, não é orientação contábil.", sub)
    ws.write_row("B5", ["Nº", "Mês", "Recebido no mês (R$)", "Deduções usadas (R$)",
                        "Base de cálculo (R$)", "Imposto pela tabela (R$)", "Redução 2026 (R$)",
                        "Imposto do mês (R$)", "Saldo de meses anteriores (R$)",
                        "DARF a pagar (R$)", "Vencimento", "Situação"], head)
    ws.set_row(4, 42)
    for m in range(1, 13):
        r, s = 5 + m, summary[m]
        ws.write_number(f"B{r}", m, calc_int)
        ws.write(f"C{r}", MONTHS[m - 1], label)
        ws.write_formula(f"D{r}", f"=SUMIFS('Pagamentos'!$G${PAY_FIRST}:$G${PAY_LAST},"
                                  f"'Pagamentos'!$E${PAY_FIRST}:$E${PAY_LAST},$B{r})", calc_brl, s["gross"])
        ws.write_formula(f"E{r}", f"=IF(D{r}=0,0,'Deduções'!J{r})", calc_brl, s["ded"])
        ws.write_formula(f"F{r}", f"=MAX(0,D{r}-E{r})", calc_brl, s["base"])
        ws.write_formula(f"G{r}", f"=MAX(0,ROUND(F{r}*INDEX({T['rates']},MATCH(F{r},{T['lows']},1))"
                                  f"-INDEX({T['deds']},MATCH(F{r},{T['lows']},1)),2))", calc_brl, s["tax"])
        ws.write_formula(f"H{r}", f"=IF(D{r}<=0,0,IF(D{r}<={T['exempt']},MIN(G{r},{T['redmax']}),"
                                  f"IF(D{r}<={T['partial']},MIN(G{r},MAX(0,ROUND({T['k']}-{T['f']}*D{r},2))),0)))",
                         calc_brl, s["red"])
        ws.write_formula(f"I{r}", f"=ROUND(G{r}-H{r},2)", calc_brl, s["month_tax"])
        if m == 1:
            ws.write_number(f"J{r}", 0, calc_brl)
        else:
            ws.write_formula(f"J{r}", f"=IF(K{r - 1}=0,ROUND(I{r - 1}+J{r - 1},2),0)", calc_brl, s["carry"])
        ws.write_formula(f"K{r}", f"=IF(I{r}+J{r}>={T['min']},ROUND(I{r}+J{r},2),0)", calc_brl_bold, s["darf"])
        ws.write_formula(f"L{r}", f"=WORKDAY(EOMONTH(DATE({YEAR},B{r},1),1)+1,-1,{T['hol']})",
                         calc_date, excel_date(s["due"]))
        ws.write_formula(f"M{r}", f'=IF(K{r}>0,"Pagar DARF (código 0190) até o vencimento",'
                                  f'IF(I{r}+J{r}>0,"Menos de R$ 10: soma no mês seguinte",'
                                  f'IF(D{r}=0,"Sem rendimentos lançados","Isento neste mês")))',
                         calc_text, s["status"])
    ws.write("B18", "", total_label)
    ws.write("C18", "Total 2026", total_label)
    for col, key in {"D": "gross", "I": "month_tax", "K": "darf"}.items():
        ws.write_formula(f"{col}18", f"=SUM({col}6:{col}17)", total_brl,
                         round(sum(summary[m][key] for m in summary), 10))
    for col in "EFGHJLM":
        ws.write(f"{col}18", "", total_blank)
    ws.conditional_format("M6:M17", {"type": "text", "criteria": "begins with", "value": "Pagar",
                                     "format": wb.add_format({"bg_color": AMBER_TINT, "font_color": AMBER_INK, "bold": True})})
    ws.conditional_format("M6:M17", {"type": "text", "criteria": "begins with", "value": "Isento",
                                     "format": wb.add_format({"bg_color": GREEN_TINT, "font_color": GREEN})})
    ws.write("B20", "Vencimento: último dia útil do mês seguinte ao recebimento. Pagar atrasado gera "
                    "multa de 0,33% ao dia (até 20%) mais juros Selic.", note)
    ws.write("B21", "O DARF é gerado no Carnê-Leão Web (e-CAC, conta gov.br prata ou ouro). Lá, use a "
                    "opção indicada na coluna \"Opção mais vantajosa\" da aba Deduções.", note)
    ws.write("B22", "Redução 2026: até R$ 5.000,00 no mês o imposto fica zero; de R$ 5.000,01 a "
                    "R$ 7.350,00 a redução diminui aos poucos (detalhes na aba Tabelas).", note)
    ws.freeze_panes(5, 3)
    ws.repeat_rows(4)
    ws.protect("", protect_opts)

    # ---- Deduções -----------------------------------------------------------
    ws = wb.add_worksheet("Deduções")
    setup(ws, "#E8A33D")
    for col, width in {"B:B": 5, "C:C": 12, "D:J": 15, "K:K": 22}.items():
        ws.set_column(col, width)
    ws.write("B2", "Deduções (opcional)", title)
    ws.write("B3", "Preencha só se você paga INSS como autônomo, tem dependentes ou paga pensão "
                   "alimentícia. Em branco, a planilha usa o desconto simplificado de R$ 607,20.", sub)
    ws.write_row("B5", ["Nº", "Mês", "INSS pago no mês (R$)", "Nº de dependentes",
                        "Pensão alimentícia (R$)", "Outras deduções (R$)", "Deduções legais (R$)",
                        "Desconto simplificado (R$)", "Usado no cálculo (R$)", "Opção mais vantajosa"], head)
    ws.set_row(4, 42)
    for m in range(1, 13):
        r, d = 5 + m, ded[m]
        inss, deps, alimony, other = deductions.get(m, (None, None, None, None))
        ws.write_number(f"B{r}", m, calc_int)
        ws.write(f"C{r}", MONTHS[m - 1], label)
        for col, value, fmt in (("D", inss, inp_brl), ("E", deps, inp_int),
                                ("F", alimony, inp_brl), ("G", other, inp_brl)):
            ws.write_number(f"{col}{r}", value, fmt) if value else ws.write_blank(f"{col}{r}", None, fmt)
        ws.write_formula(f"H{r}", f"=D{r}+E{r}*{T['dep']}+F{r}+G{r}", calc_brl, d["legal"])
        ws.write_formula(f"I{r}", f"={T['simpl']}", calc_brl, d["simplified"])
        ws.write_formula(f"J{r}", f"=MAX(H{r},I{r})", calc_brl_bold, d["used"])
        ws.write_formula(f"K{r}", f'=IF(H{r}>I{r},"Deduções legais","Desconto simplificado")', calc_text, d["choice"])
    for rng in ("D6:D17", "F6:G17"):
        ws.data_validation(rng, {"validate": "decimal", "criteria": ">=", "value": 0,
                                 "error_title": "Valor inválido", "error_message": "Digite só o número, em reais."})
    ws.data_validation("E6:E17", {"validate": "integer", "criteria": "between", "minimum": 0, "maximum": 20,
                                  "error_title": "Valor inválido", "error_message": "Digite o número de dependentes (0 a 20)."})
    ws.write("B19", "INSS: valor da guia do INSS paga neste mês, como contribuinte individual.", note)
    ws.write("B20", "Dependentes: R$ 189,59 por dependente, por mês. Pensão: só a paga por decisão "
                    "judicial ou acordo homologado.", note)
    ws.write("B21", "Outras deduções: por exemplo, livro-caixa. Use só com orientação de um contador.", note)
    ws.freeze_panes(5, 3)
    ws.protect("", protect_opts)

    # ---- Cotações -----------------------------------------------------------
    ws = wb.add_worksheet("Cotações")
    setup(ws, MUTED)
    for col, width in {"B:B": 5, "C:C": 22, "D:D": 18, "E:E": 20, "F:F": 60}.items():
        ws.set_column(col, width)
    ws.write("B2", "Cotações do dólar (PTAX de compra, Banco Central)", title)
    ws.write("B3", "Para cada mês de recebimento vale a cotação de compra do último dia útil da "
                   "1ª quinzena do mês anterior.", sub)
    ws.write_row("B5", ["Nº", "Mês do recebimento", "Data de referência",
                        "Cotação de compra (R$ por US$)", "Fonte"], head)
    ws.set_row(4, 30)
    for m in range(1, 13):
        r = 5 + m
        ref_date, rate = rates[m]
        ws.write_number(f"B{r}", m, calc_int)
        ws.write(f"C{r}", f"{MONTHS[m - 1]} de {YEAR}", label)
        ws.write_datetime(f"D{r}", dt.datetime.combine(ref_date, dt.time()), fixed_date)
        if rate is not None:
            ws.write_number(f"E{r}", rate, fixed_rate)
            ws.write(f"F{r}", f"Banco Central (PTAX), consultado em {consulted}", calc_text)
        else:
            ws.write_blank(f"E{r}", None, inp_rate)
            ws.write(f"F{r}", f"Preencha após {ref_date:%d/%m/%Y}: cotação de compra desse dia no site do Banco Central", warn)
    ws.data_validation("E6:E17", {"validate": "decimal", "criteria": "between", "minimum": 1, "maximum": 20,
                                  "error_title": "Cotação inválida", "error_message": "Use a cotação de compra, por exemplo 5,0515."})
    ws.write("B19", "Fonte: Banco Central do Brasil, PTAX, cotação de compra do dólar. Consulta: "
                    "https://www.bcb.gov.br/estabilidadefinanceira/historicocotacoes", note)
    ws.write("B20", "Só a cotação de dezembro fica liberada para preencher. Para mudar outra, desproteja "
                    "a planilha (Revisão > Desproteger planilha).", note)
    ws.protect("", protect_opts)

    # ---- Tabelas ------------------------------------------------------------
    ws = wb.add_worksheet("Tabelas")
    setup(ws, MUTED)
    for col, width in {"B:B": 44, "C:C": 16, "D:D": 12, "E:E": 20, "F:F": 50}.items():
        ws.set_column(col, width)
    ws.write("B2", "Regras e tabelas usadas (2026)", title)
    ws.write("B3", "A planilha calcula tudo a partir destes valores. Se uma regra mudar, atualize aqui.", sub)

    ws.write("B4", "Tabela progressiva mensal do IRPF (vigente desde maio de 2025)", section)
    ws.write_row("B5", ["Base de cálculo acima de (R$)", "Até (R$)", "Alíquota", "Parcela a deduzir (R$)"], head)
    for i, (low, high, rate, dd) in enumerate(BRACKETS):
        r = 6 + i
        ws.write_number(f"B{r}", low, fixed_brl)
        ws.write_number(f"C{r}", high, fixed_brl) if high else ws.write(f"C{r}", "sem limite", calc_text)
        ws.write_number(f"D{r}", rate, fixed_pct)
        ws.write_number(f"E{r}", dd, fixed_brl)
    ws.write("F6", "Fonte: Lei nº 15.191/2025", note)

    ws.write("B13", "Deduções", section)
    ws.write("B14", "Desconto simplificado mensal (R$)", label)
    ws.write_number("C14", SIMPLIFIED, fixed_brl)
    ws.write("D14", "25% da faixa isenta da tabela mensal; substitui as deduções legais", note)
    ws.write("B15", "Dedução por dependente, por mês (R$)", label)
    ws.write_number("C15", PER_DEPENDENT, fixed_brl)
    ws.write("D15", "Fonte: Lei nº 9.250/1995", note)

    ws.write("B18", "Redução do imposto em 2026 (Lei nº 15.270/2025)", section)
    reduction_rows = [
        ("B19", "Imposto zero para rendimento mensal até (R$)", EXEMPT_UP_TO, fixed_brl),
        ("B20", "Redução máxima nessa faixa (R$)", REDUCTION_MAX, fixed_brl),
        ("B21", "Redução parcial para rendimento até (R$)", PARTIAL_UP_TO, fixed_brl),
        ("B22", "Redução parcial: valor fixo (R$)", PARTIAL_K, fixed_brl),
        ("B23", "Redução parcial: fator sobre o rendimento", PARTIAL_F, fixed_num),
    ]
    for ref, text_, value, fmt in reduction_rows:
        ws.write(ref, text_, label)
        ws.write_number("C" + ref[1:], value, fmt)
    ws.write("D21", "De R$ 5.000,01 a R$ 7.350,00: redução = 978,62 − 0,133145 × rendimento do mês, "
                    "nunca maior que o imposto.", note)

    ws.write("B26", "DARF", section)
    ws.write("B27", "Valor mínimo do DARF (R$)", label)
    ws.write_number("C27", DARF_MIN, fixed_brl)
    ws.write("D27", "Abaixo disso, o imposto é somado ao do mês seguinte", note)
    ws.write("B28", "Código do DARF (carnê-leão)", label)
    ws.write("C28", "0190", fixed_text)

    ws.write("B30", "Dias sem expediente bancário (usados para calcular o vencimento)", section)
    ws.write_row("B31", ["Data", "Feriado"], head)
    for i, (d, name) in enumerate(HOLIDAYS):
        ws.write_datetime(f"B{32 + i}", dt.datetime.fromisoformat(d), fixed_date)
        ws.write(f"C{32 + i}", name, calc_text)
    ws.protect("", protect_opts)

    wb.close()
    return path


if __name__ == "__main__":
    if "--update-rates" in sys.argv:
        update_rates()
    print("Wrote", build())
