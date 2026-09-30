/* Desenho da colinha em canvas (sem bibliotecas).
 * modos: "cor" (colorida), "pb" (preto e branco), "grande" (P&B, números grandes). */
(function (g) {
  var CDN = "https://cdn.jsdelivr.net/gh/Cacio-Frigerio-Resolver/RD-Colinha-Vinholi@v2/fotos/";
  var LOCAL = "fotos/";
  var FONTE = "Montserrat, 'Arial Black', Arial, sans-serif";
  var LEGAL = "Marco Vinholi - Republicanos - CNPJ 68.411.256/0001-25";

  /* ---------- fotos ---------- */
  var cache = {}, cinza = {};
  function carregarFoto(sq) {
    if (!sq) return Promise.resolve(null);
    if (cache[sq]) return cache[sq];
    var urls = [CDN + sq + ".jpg", LOCAL + sq + ".jpg"];
    cache[sq] = new Promise(function (ok) {
      (function tenta(i) {
        if (i >= urls.length) { ok(null); return; }
        var im = new Image(); im.crossOrigin = "anonymous";
        im.onload = function () { ok(im); };
        im.onerror = function () { tenta(i + 1); };
        im.src = urls[i];
      })(0);
    });
    return cache[sq];
  }
  var prontas = {};
  function fotoPronta(sq) { return prontas[sq] || null; }
  function garantir(sqs) {
    return Promise.all(sqs.filter(Boolean).map(function (sq) {
      return carregarFoto(sq).then(function (im) { prontas[sq] = im; return im; });
    }));
  }
  function emCinza(sq, im) {
    if (cinza[sq]) return cinza[sq];
    var c = document.createElement("canvas"); c.width = im.naturalWidth; c.height = im.naturalHeight;
    var x = c.getContext("2d"); x.drawImage(im, 0, 0);
    var d = x.getImageData(0, 0, c.width, c.height), p = d.data;
    for (var i = 0; i < p.length; i += 4) { var l = p[i] * 0.3 + p[i + 1] * 0.59 + p[i + 2] * 0.11; p[i] = p[i + 1] = p[i + 2] = l; }
    x.putImageData(d, 0, 0); cinza[sq] = c; return c;
  }

  /* ---------- temas ---------- */
  var COR = { bg: "#ffffff", ink: "#0f2350", linha: "#e6e9f2", linhaBorda: null, fixoFill: "#fff6d3", fixoBorda: "#ffc82c",
    boxFill: "#0a4fb0", boxBorda: null, boxTxt: "#ffc82c", btnFill: "#1fae57", btnBorda: null, btnTxt: "#fff", fotoBorda: "#0a4fb0", cinza: false };
  var PB = { bg: "#ffffff", ink: "#000000", linha: "#ffffff", linhaBorda: "#000000", fixoFill: "#ececec", fixoBorda: "#000000",
    boxFill: "#ffffff", boxBorda: "#000000", boxTxt: "#000000", btnFill: "#ffffff", btnBorda: "#000000", btnTxt: "#000000", fotoBorda: "#000000", cinza: true };

  /* ---------- utilitários de desenho ---------- */
  function rr(c, x, y, w, h, r) {
    c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r);
    c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath();
  }
  function bloco(c, x, y, w, h, r, fill, borda, lw, tracejado) {
    rr(c, x, y, w, h, r);
    if (fill) { c.fillStyle = fill; c.fill(); }
    if (borda) { c.lineWidth = lw || 3; c.strokeStyle = borda; c.setLineDash(tracejado || []); c.stroke(); c.setLineDash([]); }
  }
  function fonte(peso, px) { return peso + " " + px + "px " + FONTE; }
  function ajusta(c, txt, peso, px, maxW) {
    c.font = fonte(peso, px);
    while (c.measureText(txt).width > maxW && px > 12) { px -= 1; c.font = fonte(peso, px); }
    return px;
  }
  function texto(c, t, x, y, peso, px, cor, alinha, maxW) {
    if (maxW) px = ajusta(c, t, peso, px, maxW); else c.font = fonte(peso, px);
    c.fillStyle = cor; c.textAlign = alinha || "left"; c.textBaseline = "middle"; c.fillText(t, x, y);
  }
  function foto(c, T, sq, x, y, lado, raio) {
    bloco(c, x, y, lado, lado, raio, "#dfe3ee", null);
    var im = fotoPronta(sq);
    c.save(); rr(c, x, y, lado, lado, raio); c.clip();
    if (im) { c.drawImage(T.cinza ? emCinza(sq, im) : im, 0, 0, im.naturalWidth, im.naturalHeight, x, y, lado, lado); }
    else { c.fillStyle = "#b8c0d4"; c.beginPath(); c.arc(x + lado / 2, y + lado * 0.38, lado * 0.17, 0, 7); c.fill();
      c.beginPath(); c.ellipse(x + lado / 2, y + lado * 0.92, lado * 0.36, lado * 0.32, 0, 0, 7); c.fill(); }
    c.restore();
    bloco(c, x, y, lado, lado, raio, null, T.fotoBorda, 6);
  }
  function digitos(c, T, num, x, y, bw, bh, gap, px) {
    var s = String(num);
    for (var i = 0; i < s.length; i++) {
      var bx = x + i * (bw + gap);
      bloco(c, bx, y, bw, bh, 12, T.boxFill, T.boxBorda, 4);
      texto(c, s[i], bx + bw / 2, y + bh / 2 + 3, 900, px, T.boxTxt, "center");
    }
    return x + s.length * bw + (s.length - 1) * gap;
  }
  function botao(c, T, rot, x, y, w, h, px, branco) {
    bloco(c, x, y, w, h, h / 2.6, branco ? "#ffffff" : T.btnFill, branco ? (T.btnBorda || "#8a93a8") : T.btnBorda, 3);
    texto(c, rot, x + w / 2, y + h / 2 + 1, 800, px, branco ? (T.btnBorda ? T.btnTxt : "#5a6580") : T.btnTxt, "center");
  }

  /* linha de um cargo. g = geometria {x,y,w,h,fotoLado,digW,digH,digPx,labelPx,btnW,btnH,fotosOn,digGap} */
  function linha(c, T, r, G) {
    var fixo = r.fixo;
    bloco(c, G.x, G.y, G.w, G.h, 34, fixo ? T.fixoFill : T.linha, fixo ? T.fixoBorda : T.linhaBorda, fixo ? 5 : 3);
    var tx = G.x + 22;
    if (G.fotosOn) {
      var fy = G.y + (G.h - G.fotoLado) / 2;
      if (r.tipo === "cand" && r.cand.legenda) {
        bloco(c, G.x + 18, fy, G.fotoLado, G.fotoLado, 26, T === COR ? "#0a4fb0" : "#fff", T.fotoBorda, 6);
        texto(c, r.cand.sigla, G.x + 18 + G.fotoLado / 2, fy + G.fotoLado / 2, 900, 40, T === COR ? "#ffc82c" : "#000", "center", G.fotoLado - 16);
      } else foto(c, T, r.tipo === "cand" ? r.cand.sq : null, G.x + 18, fy, G.fotoLado, 26);
      tx = G.x + 18 + G.fotoLado + 24;
    }
    var maxW = G.x + G.w - 22 - tx;
    var cargo = r.rot + "  ", nome = r.tipo === "cand" ? r.cand.nome : "", part = r.tipo === "cand" && r.cand.partido ? "  ·  " + r.cand.partido : "";
    var ly = G.y + G.labelY, px = G.labelPx;
    function larg(p) { c.font = fonte(700, p); var a = c.measureText(cargo).width, b = c.measureText(part).width;
      c.font = fonte(900, p); return a + c.measureText(nome).width + b; }
    while (larg(px) > maxW && px > 14) px -= 1;
    var cx = tx;
    texto(c, cargo, cx, ly, 700, px, T.ink, "left"); c.font = fonte(700, px); cx += c.measureText(cargo).width;
    if (nome) { texto(c, nome, cx, ly, 900, px, T === COR ? "#1a3e94" : T.ink, "left"); c.font = fonte(900, px); cx += c.measureText(nome).width; }
    if (part) texto(c, part, cx, ly, 700, px, T === COR ? "#3a5fb0" : T.ink, "left");
    var by = G.y + G.h - G.digH - G.padB;
    if (r.tipo === "cand") {
      var fim = digitos(c, T, r.cand.num, tx, by, G.digW, G.digH, G.digGap, G.digPx);
      botao(c, T, "CONFIRMA", fim + 26, by + (G.digH - G.btnH) / 2, G.btnW, G.btnH, G.btnPx, false);
    } else if (r.tipo === "branco") {
      var bw = 5 * G.digW + 4 * G.digGap;
      bloco(c, tx, by, bw, G.digH, 12, "#ffffff", T === COR ? "#9aa3b8" : "#000", 4);
      texto(c, "VOTO EM BRANCO", tx + bw / 2, by + G.digH / 2 + 2, 900, G.digPx * 0.5, T === COR ? "#5a6580" : "#000", "center", bw - 20);
      botao(c, T, "BRANCO", tx + bw + 26, by + (G.digH - G.btnH) / 2, G.btnW, G.btnH, G.btnPx, true);
    } else {
      var bw2 = 5 * G.digW + 4 * G.digGap;
      bloco(c, tx, by, bw2, G.digH, 12, null, "#9aa3b8", 3, [12, 9]);
      texto(c, "ESCOLHA UM CANDIDATO", tx + bw2 / 2, by + G.digH / 2, 700, G.digPx * 0.4, "#7a849b", "center", bw2 - 20);
    }
  }

  function rodape(c, T, W, y, codigo) {
    texto(c, LEGAL, W / 2, y, 600, 24, "#222", "center", W - 100);
    if (codigo) {
      texto(c, "Código desta colinha: " + codigo, W / 2, y + 48, 800, 27, T.ink, "center", W - 100);
      texto(c, "Monte a sua em marcovinholi.com.br/colinha", W / 2, y + 82, 600, 22, "#333", "center", W - 100);
    }
  }

  /* ---------- layout padrão (cor / pb): 1080 x 1965 ---------- */
  function padrao(estado, modo, fotosOn) {
    var T = modo === "cor" ? COR : PB, W = 1080, H = 1965;
    var cv = document.createElement("canvas"); cv.width = W; cv.height = H; var c = cv.getContext("2d");
    c.fillStyle = "#fff"; c.fillRect(0, 0, W, H);
    if (modo === "cor") {
      var gr = c.createRadialGradient(W, 0, 0, W, 0, 1150); gr.addColorStop(0, "#d3effc"); gr.addColorStop(1, "rgba(255,255,255,0)");
      c.fillStyle = gr; c.fillRect(0, 0, W, 1200);
      var gb = c.createLinearGradient(50, 0, W - 50, 0); gb.addColorStop(0, "#0a4fb0"); gb.addColorStop(1, "#19b4ee");
      c.fillStyle = gb; c.fillRect(50, 50, W - 100, 22);
    } else { c.fillStyle = "#000"; c.fillRect(50, 50, W - 100, 8); }
    texto(c, "Para não errar na hora do voto", W / 2, 165, 800, 60, T.ink, "center", W - 120);
    if (modo === "cor") {
      bloco(c, 190, 228, 720, 112, 6, "#ffc82c", null); bloco(c, 178, 216, 720, 112, 6, "#0a4fb0", null);
      texto(c, "LEVE A COLINHA", 538, 274, 900, 78, "#fff", "center", 680);
    } else {
      bloco(c, 178, 216, 724, 112, 6, "#fff", "#000", 5);
      texto(c, "LEVE A COLINHA", 540, 274, 900, 78, "#000", "center", 680);
    }
    var G = { x: 50, w: 980, h: 180, fotoLado: 150, digW: 68, digH: 78, digGap: 10, digPx: 62, labelPx: 30, labelY: 46, padB: 22,
      btnW: 190, btnH: 50, btnPx: 26, fotosOn: fotosOn };
    estado.rows.forEach(function (r, i) { G.y = 400 + i * 202; linha(c, T, r, G); });
    // faixa do candidato
    texto(c, "DEPUTADO FEDERAL · REPUBLICANOS", W / 2, 1632, 800, 26, T.ink, "center");
    if (modo === "cor") { var g2 = c.createLinearGradient(150, 0, 930, 0); g2.addColorStop(0, "#0a4fb0"); g2.addColorStop(1, "#19b4ee");
      bloco(c, 150, 1656, 780, 112, 30, g2, null); }
    else bloco(c, 150, 1656, 780, 112, 30, "#fff", "#000", 5);
    texto(c, "MARCO VINHOLI", 200, 1713, 900, 56, modo === "cor" ? "#fff" : "#000", "left", 450);
    bloco(c, 660, 1682, 240, 60, 14, modo === "cor" ? "#0f2350" : "#000", null);
    texto(c, "1002", 780, 1714, 900, 46, modo === "cor" ? "#ffc82c" : "#fff", "center");
    rodape(c, T, W, 1822, estado.codigo);
    return cv;
  }

  /* ---------- layout P&B com números grandes: 1080 x 1527 (proporção A4) ---------- */
  function grande(estado, modo, fotosOn) {
    var T = modo === "cor" ? COR : PB, W = 1080, H = 1527;
    var cv = document.createElement("canvas"); cv.width = W; cv.height = H; var c = cv.getContext("2d");
    c.fillStyle = "#fff"; c.fillRect(0, 0, W, H);
    if (modo === "cor") {
      var gr = c.createRadialGradient(W, 0, 0, W, 0, 1000); gr.addColorStop(0, "#d3effc"); gr.addColorStop(1, "rgba(255,255,255,0)");
      c.fillStyle = gr; c.fillRect(0, 0, W, 1100);
    }
    texto(c, "Para não errar na hora do voto", W / 2, 52, 800, 46, T.ink, "center", W - 100);
    if (modo === "cor") {
      bloco(c, 258, 100, 580, 76, 6, "#ffc82c", null); bloco(c, 250, 92, 580, 76, 6, "#0a4fb0", null);
      texto(c, "LEVE A COLINHA", 540, 131, 900, 52, "#fff", "center", 540);
    } else {
      bloco(c, 250, 92, 580, 76, 6, "#fff", "#000", 5);
      texto(c, "LEVE A COLINHA", 540, 131, 900, 52, "#000", "center", 540);
    }
    var G = { x: 40, w: 1000, h: 186, fotoLado: 130, digH: 112, digGap: 8, labelPx: 32, labelY: 34, padB: 16, btnW: 210, btnH: 58, btnPx: 26, fotosOn: fotosOn };
    var tx0 = 40 + (fotosOn ? 18 + 130 + 24 : 22);
    G.digW = Math.min(112, Math.floor((1040 - 22 - G.btnW - 26 - tx0 - 4 * G.digGap) / 5));
    G.digPx = 104;
    estado.rows.forEach(function (r, i) { G.y = 196 + i * 198; linha(c, T, r, G); });
    rodape(c, T, W, 1410, estado.codigo);
    return cv;
  }

  function card(estado, modo, fotosOn, ehGrande) {
    return ehGrande ? grande(estado, modo, fotosOn) : padrao(estado, modo, fotosOn);
  }

  g.Render = { card: card, garantir: garantir, fonte: FONTE };
})(window);
