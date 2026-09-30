#!/usr/bin/env python3
"""Gera dados/candidatos.json e fotos/*.jpg a partir dos dados abertos do TSE.

Fontes (oficiais, sem autenticação):
  consulta_cand_2026.zip          -> CSV de candidaturas
  foto_cand2026_SP_div.zip        -> fotos de SP (Dep., Senador, Governador)
  foto_cand2026_BR_div.zip        -> fotos de Presidente

Uso:  python tools/extrair_tse.py [UF]      (padrão: SP)
Requer: pip install pillow
"""
import csv, io, json, re, sys, zipfile, urllib.request
from pathlib import Path
from PIL import Image

UF = (sys.argv[1] if len(sys.argv) > 1 else "SP").upper()
RAIZ = Path(__file__).resolve().parent.parent
TMP = RAIZ / "tools" / ".cache"; TMP.mkdir(exist_ok=True)
CDN = "https://cdn.tse.jus.br/estatistica/sead/"
LADO = 150          # miniatura quadrada em px
QUALIDADE = 70

CARGOS = {"DEPUTADO FEDERAL": "fed", "DEPUTADO ESTADUAL": "est", "SENADOR": "sen",
          "GOVERNADOR": "gov", "PRESIDENTE": "pres"}

def baixar(url, nome):
    dest = TMP / nome
    if not dest.exists():
        print("baixando", url)
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
        dest.write_bytes(urllib.request.urlopen(req, timeout=300).read())
    return zipfile.ZipFile(dest)

def ler(z, arq):
    return csv.DictReader(io.TextIOWrapper(z.open(arq), encoding="latin-1"), delimiter=";")

def miniatura(dados):
    im = Image.open(io.BytesIO(dados)).convert("RGB")
    w, h = im.size; l = min(w, h)
    # corte quadrado ancorado no topo (rosto)
    x = (w - l) // 2
    im = im.crop((x, 0, x + l, l)).resize((LADO, LADO), Image.LANCZOS)
    b = io.BytesIO(); im.save(b, "JPEG", quality=QUALIDADE, optimize=True, progressive=True)
    return b.getvalue()

def main():
    zc = baixar(CDN + "odsele/consulta_cand/consulta_cand_2026.zip", "cand.zip")
    linhas = []
    for arq, uf in ((f"consulta_cand_2026_{UF}.csv", UF), ("consulta_cand_2026_BRASIL.csv", "BR")):
        for r in ler(zc, arq):
            c = CARGOS.get(r["DS_CARGO"])
            if not c: continue
            if c == "pres" and uf != "BR": continue
            if c != "pres" and uf == "BR": continue
            linhas.append((c, uf, r))

    fotos = {"SP": baixar(CDN + f"eleicoes/eleicoes2026/fotos/foto_cand2026_{UF}_div.zip", "fotos_uf.zip"),
             "BR": baixar(CDN + "eleicoes/eleicoes2026/fotos/foto_cand2026_BR_div.zip", "fotos_br.zip")}
    idx = {}
    for k, z in fotos.items():
        for n in z.namelist():
            m = re.search(r"(\d{12})_div", n)      # ex.: FSP250002537984_div.jpg
            if m: idx[m.group(1)] = (z, n)

    (RAIZ / "fotos").mkdir(exist_ok=True)
    saida = {c: {} for c in CARGOS.values()}
    sem_foto = 0
    partidos = {}
    for c, uf, r in linhas:
        if c == "est": partidos[int(r["NR_PARTIDO"])] = [int(r["NR_PARTIDO"]), r["SG_PARTIDO"], r["NM_PARTIDO"]]
        nr = r["NR_CANDIDATO"]; nome = r["NM_URNA_CANDIDATO"].strip(); sq = r["SQ_CANDIDATO"]
        # TSE traz números duplicados (mesmo nº/nome com SQ diferente): fica o 1º
        if (nr, nome) in saida[c]: continue
        foto = 0
        if sq in idx:
            z, n = idx[sq]
            (RAIZ / "fotos" / f"{sq}.jpg").write_bytes(miniatura(z.read(n)))
            foto = 1
        else:
            sem_foto += 1
        saida[c][(nr, nome)] = [int(nr), nome, r["SG_PARTIDO"], sq if foto else ""]
    out = {"uf": UF, "ano": 2026, "fonte": "TSE - Dados Abertos (consulta_cand_2026)"}
    for c, d in saida.items():
        out[c] = sorted(d.values(), key=lambda x: (x[1], x[0]))
    out["part"] = sorted(partidos.values())   # voto de legenda (só cargos proporcionais)
    (RAIZ / "dados").mkdir(exist_ok=True)
    (RAIZ / "dados" / "candidatos.json").write_text(json.dumps(out, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    print({c: len(v) for c, v in saida.items()}, "sem_foto:", sem_foto)

main()
