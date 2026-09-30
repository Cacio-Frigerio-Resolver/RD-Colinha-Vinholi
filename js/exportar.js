/* Folhas A4, JPG, PDF (escrito à mão a partir do JPG) e impressão. */
(function (g) {
  var AVISO = "Recorte na linha e leve na carteira. Celular não entra na cabine.";
  var PX = 1654 / 210;                       // A4 a 200 dpi: 1654 x 2339
  var F = Render.fonte;

  function legenda(c, txt, x, y, larg, alinha) {
    var px = 26; c.font = "600 " + px + "px " + F;
    while (c.measureText(txt).width > larg && px > 10) { px--; c.font = "600 " + px + "px " + F; }
    c.fillStyle = "#222"; c.textAlign = alinha || "left"; c.textBaseline = "middle"; c.fillText(txt, x, y);
  }
  function tracejada(c, x1, y1, x2, y2) {
    c.beginPath(); c.setLineDash([14, 10]); c.lineWidth = 2.5; c.strokeStyle = "#000";
    c.moveTo(x1, y1); c.lineTo(x2, y2); c.stroke(); c.setLineDash([]);
  }

  /* n = 1 ou 4 cartões por folha. Retorna canvas A4. */
  function folha(estado, modo, fotosOn, n) {
    var cv = document.createElement("canvas"); cv.width = 1654; cv.height = 2339;
    var c = cv.getContext("2d"); c.fillStyle = "#fff"; c.fillRect(0, 0, cv.width, cv.height);
    c.imageSmoothingQuality = "high";
    var cartao = Render.card(estado, modo, fotosOn), prop = cartao.width / cartao.height;
    if (n === 1) {
      // canto superior esquerdo da folha; corte só à direita e embaixo
      var ch = modo === "grande" ? 268 : 226, cw = ch * prop, x = 6, y = 6;
      c.drawImage(cartao, x * PX, y * PX, cw * PX, ch * PX);
      var lx = (x + cw + 3) * PX, ly = (y + ch + 3) * PX;
      tracejada(c, lx, 0, lx, ly); tracejada(c, 0, ly, lx, ly);
      legenda(c, AVISO, x * PX, ly + 7 * PX, lx - x * PX);
    } else {
      var cel = { w: 105, h: 148.5 };
      for (var i = 0; i < 4; i++) {
        var cx = (i % 2) * cel.w, cy = Math.floor(i / 2) * cel.h;
        var h = cel.h - 15, w = h * prop; if (w > cel.w - 8) { w = cel.w - 8; h = w / prop; }
        var px0 = cx + (cel.w - w) / 2, py0 = cy + 4;
        c.drawImage(cartao, px0 * PX, py0 * PX, w * PX, h * PX);
        legenda(c, AVISO, (cx + cel.w / 2) * PX, (py0 + h + 5) * PX, (cel.w - 10) * PX, "center");
      }
      tracejada(c, cel.w * PX, 0, cel.w * PX, cv.height);
      tracejada(c, 0, cel.h * PX, cv.width, cel.h * PX);
    }
    return cv;
  }

  function blobJpg(cv, q) {
    return new Promise(function (ok) {
      if (cv.toBlob) cv.toBlob(function (b) { ok(b); }, "image/jpeg", q || 0.92);
      else { var d = atob(cv.toDataURL("image/jpeg", q || 0.92).split(",")[1]), u = new Uint8Array(d.length);
        for (var i = 0; i < d.length; i++) u[i] = d.charCodeAt(i); ok(new Blob([u], { type: "image/jpeg" })); }
    });
  }

  /* PDF A4 de uma página com a imagem JPG ocupando a folha inteira */
  function pdf(cv) {
    return blobJpg(cv, 0.92).then(function (b) { return b.arrayBuffer(); }).then(function (buf) {
      var jpg = new Uint8Array(buf), enc = new TextEncoder(), partes = [], pos = 0, off = [];
      function add(x) { var u = typeof x === "string" ? enc.encode(x) : x; partes.push(u); pos += u.length; }
      function obj(n, corpo) { off[n] = pos; add(n + " 0 obj\n" + corpo + "\nendobj\n"); }
      var W = 595.28, H = 841.89;
      add("%PDF-1.4\n");
      obj(1, "<< /Type /Catalog /Pages 2 0 R >>");
      obj(2, "<< /Type /Pages /Kids [3 0 R] /Count 1 >>");
      obj(3, "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 " + W + " " + H + "] /Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>");
      off[4] = pos;
      add("4 0 obj\n<< /Type /XObject /Subtype /Image /Width " + cv.width + " /Height " + cv.height +
        " /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length " + jpg.length + " >>\nstream\n");
      add(jpg); add("\nendstream\nendobj\n");
      var cont = "q " + W + " 0 0 " + H + " 0 0 cm /Im0 Do Q";
      obj(5, "<< /Length " + cont.length + " >>\nstream\n" + cont + "\nendstream");
      var xref = pos, t = "xref\n0 6\n0000000000 65535 f \n";
      for (var i = 1; i <= 5; i++) t += ("0000000000" + off[i]).slice(-10) + " 00000 n \n";
      add(t + "trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n" + xref + "\n%%EOF");
      return new Blob(partes, { type: "application/pdf" });
    });
  }

  function baixar(blob, nome) {
    var a = document.createElement("a"), u = URL.createObjectURL(blob);
    a.href = u; a.download = nome; document.body.appendChild(a); a.click();
    setTimeout(function () { URL.revokeObjectURL(u); a.remove(); }, 4000);
  }

  function imprimir(cv) {
    var area = document.getElementById("printArea"); area.innerHTML = "";
    var im = new Image();
    im.onload = function () { setTimeout(function () { window.print(); }, 150); };
    im.src = cv.toDataURL("image/jpeg", 0.92); area.appendChild(im);
  }

  g.Exportar = { folha: folha, blobJpg: blobJpg, pdf: pdf, baixar: baixar, imprimir: imprimir };
})(window);
