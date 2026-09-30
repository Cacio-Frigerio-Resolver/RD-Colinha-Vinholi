/* Código alfanumérico da colinha (sem servidor, sem armazenamento).
 * 12 caracteres (base 32, sem 0/O/1/I): versão(4) + Est(17) + Sen1(10) + Sen2(10)
 * + Gov(7) + Pres(7) + verificador(5) = 60 bits. O Federal é fixo e não entra.
 * Cada campo: 0 = vazio, 1 = branco, n+2 = candidato de número n. */
(function (g) {
  var AL = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
  var CAMPOS = [["est", 17], ["sen1", 10], ["sen2", 10], ["gov", 7], ["pres", 7]];
  var VERSAO = 1n;

  function paraInt(v) {
    if (v === null || v === undefined) return 0n;
    if (v === "branco") return 1n;
    return BigInt(v) + 2n;
  }
  function deInt(x) { x = Number(x); return x === 0 ? null : x === 1 ? "branco" : x - 2; }

  function codificar(o) {
    var v = VERSAO;
    CAMPOS.forEach(function (c) { v = (v << BigInt(c[1])) | paraInt(o[c[0]]); });
    var full = (v << 5n) | (v % 31n), s = "";
    for (var i = 0; i < 12; i++) { s = AL[Number(full & 31n)] + s; full >>= 5n; }
    return s.slice(0, 4) + "-" + s.slice(4, 8) + "-" + s.slice(8);
  }

  function decodificar(txt) {
    var s = String(txt || "").toUpperCase().replace(/[\s-]/g, "");
    if (s.length !== 12) return null;
    var full = 0n;
    for (var i = 0; i < 12; i++) {
      var p = AL.indexOf(s[i]); if (p < 0) return null;
      full = (full << 5n) | BigInt(p);
    }
    var chk = full & 31n, v = full >> 5n;
    if (v % 31n !== chk) return null;
    var o = {};
    for (var j = CAMPOS.length - 1; j >= 0; j--) {
      var b = BigInt(CAMPOS[j][1]);
      o[CAMPOS[j][0]] = deInt(v & ((1n << b) - 1n)); v >>= b;
    }
    return v === VERSAO ? o : null;
  }

  g.Codigo = { codificar: codificar, decodificar: decodificar };
})(window);
