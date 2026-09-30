/* Interface da colinha. Nada é gravado: as escolhas vivem só na memória da página
 * e no código alfanumérico (Codigo) que o próprio eleitor copia ou compartilha. */
(function () {
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var CDN = "https://cdn.jsdelivr.net/gh/Cacio-Frigerio-Resolver/RD-Colinha-Vinholi@v2/"; var CDN_DADOS = "https://cdn.jsdelivr.net/gh/Cacio-Frigerio-Resolver/RD-Colinha-Vinholi@v3/";
  var FED = { num: 1002, nome: "MARCO VINHOLI", partido: "REPUBLICANOS", sq: "250002537984" };
  var CARGOS = [
    { k: "fed", rot: "DEPUTADO FEDERAL", lista: "fed", fixo: true },
    { k: "est", rot: "DEPUTADO ESTADUAL", lista: "est", legenda: true },
    { k: "sen1", rot: "SENADOR (A)", lista: "sen" },
    { k: "sen2", rot: "SENADOR (A)", lista: "sen" },
    { k: "gov", rot: "GOVERNADOR (A)", lista: "gov" },
    { k: "pres", rot: "PRESIDENTE", lista: "pres" }
  ];
  var PADRAO = { sen1: 222, sen2: 111, gov: 10 };
  var dados = null, st = {}, modo = "cor", fotosOn = true, grande = false;

  var norm = function (s) { return String(s).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase(); };
  function objs(arr) { return arr.map(function (a) { return { num: a[0], nome: a[1], partido: a[2], sq: a[3], n: norm(a[1]), p: norm(a[2]) }; }); }
  function candLegenda(p) { return { num: p.num, nome: "VOTO NA LEGENDA · " + p.sigla, partido: "", sq: "", legenda: true, sigla: p.sigla }; }
  function achar(lista, num) { var l = dados[lista]; for (var i = 0; i < l.length; i++) if (l[i].num === num) return l[i]; return null; }

  /* ---------- dados ---------- */
  function carregarDados() {
    return fetch("dados/candidatos.json").then(function (r) { if (!r.ok) throw 0; return r.json(); })
      .catch(function () { return fetch(CDN_DADOS + "dados/candidatos.json").then(function (r) { return r.json(); }); })
      .then(function (j) {
        dados = {}; ["fed", "est", "sen", "gov", "pres"].forEach(function (k) { dados[k] = objs(j[k] || []); });
        dados.part = (j.part || []).map(function (a) { return { num: a[0], sigla: a[1], nome: a[2], n: norm(a[1] + " " + a[2]), s: norm(a[1]) }; });
        var f = achar("fed", 1002); if (f) FED = f;
      });
  }

  /* ---------- estado ---------- */
  function iniciar() {
    st = { fed: { tipo: "cand", cand: FED }, est: { tipo: "vazio" }, sen1: { tipo: "vazio" }, sen2: { tipo: "vazio" }, gov: { tipo: "vazio" }, pres: { tipo: "vazio" } };
    Object.keys(PADRAO).forEach(function (k) {
      var c = achar(CARGOS.filter(function (x) { return x.k === k; })[0].lista, PADRAO[k]);
      if (c) st[k] = { tipo: "cand", cand: c };
    });
  }
  function valorCodigo(k) { var s = st[k]; return s.tipo === "vazio" ? null : s.tipo === "branco" ? "branco" : s.cand.num; }
  function codigoAtual() {
    return Codigo.codificar({ est: valorCodigo("est"), sen1: valorCodigo("sen1"), sen2: valorCodigo("sen2"), gov: valorCodigo("gov"), pres: valorCodigo("pres") });
  }
  function aplicarCodigo(txt) {
    var o = Codigo.decodificar(txt); if (!o) return false;
    CARGOS.forEach(function (c) {
      if (c.fixo) return;
      var v = o[c.k], cand = null;
      if (typeof v === "number") {
        if (c.legenda && v < 100) { var pt = dados.part.filter(function (x) { return x.num === v; })[0]; cand = pt ? candLegenda(pt) : null; }
        else cand = achar(c.lista, v);
      }
      st[c.k] = v === "branco" ? { tipo: "branco" } : cand ? { tipo: "cand", cand: cand } : { tipo: "vazio" };
    });
    return true;
  }
  function estadoRender() {
    return { rows: CARGOS.map(function (c) { var s = st[c.k]; return { k: c.k, rot: c.rot, fixo: !!c.fixo, tipo: s.tipo, cand: s.cand }; }), codigo: codigoAtual() };
  }

  /* ---------- lista de cargos (editor) ---------- */
  var elCargos = $("#cargos");
  function fotoUrl(sq) { return CDN + "fotos/" + sq + ".jpg"; }

  function montarLinhas() {
    elCargos.innerHTML = "";
    CARGOS.forEach(function (c) {
      var li = document.createElement("article"); li.className = "cargo" + (c.fixo ? " cargo--fixo" : ""); li.id = "linha-" + c.k;
      li.innerHTML =
        '<div class="cargo__topo"><span class="cargo__rot">' + c.rot + '</span><span class="cargo__chip"></span></div>' +
        '<div class="cargo__meio"><div class="cargo__foto"></div><div class="cargo__corpo">' +
        '<div class="cargo__num"></div>' +
        '<div class="cargo__busca"><input type="text" inputmode="search" autocomplete="off" placeholder="' + (c.legenda ? "Nome, número ou sigla do partido" : "Digite o nome, o número ou a sigla") + '" aria-label="Buscar ' + c.rot.toLowerCase() + '"><ul class="lista" role="listbox" hidden></ul></div>' +
        '<div class="cargo__nome"></div><div class="cargo__acoes"></div></div></div>';
      elCargos.appendChild(li);
      ligarBusca(c, li);
      pintar(c.k);
    });
  }

  function pintar(k) {
    var c = CARGOS.filter(function (x) { return x.k === k; })[0], s = st[k], li = $("#linha-" + k);
    var foto = $(".cargo__foto", li), nome = $(".cargo__nome", li), num = $(".cargo__num", li), busca = $(".cargo__busca", li), ac = $(".cargo__acoes", li);
    li.dataset.tipo = s.tipo; $(".cargo__chip", li).textContent = c.fixo ? "✓ candidato fixo" : s.tipo === "cand" ? "✓ preenchido" : s.tipo === "branco" ? "voto em branco" : "escolha um candidato"; foto.innerHTML = ""; num.innerHTML = ""; ac.innerHTML = "";
    if (s.tipo === "cand") {
      if (s.cand.legenda) { foto.innerHTML = "<b class='sigla'></b>"; $(".sigla", foto).textContent = s.cand.sigla; }
      else { var im = new Image(); im.alt = s.cand.nome; im.src = fotoUrl(s.cand.sq); im.onerror = function () { im.remove(); }; foto.appendChild(im); }
      nome.textContent = s.cand.nome + (s.cand.partido ? " · " + s.cand.partido : "");
      String(s.cand.num).split("").forEach(function (d) { var b = document.createElement("i"); b.textContent = d; num.appendChild(b); });
      var ok = document.createElement("span"); ok.className = "confirma"; ok.textContent = "CONFIRMA"; num.appendChild(ok);
      busca.hidden = true;
      if (!c.fixo) ac.appendChild(botaoTxt("Limpar / Alterar", function () { st[k] = { tipo: "vazio" }; pintar(k); $("input", li).focus(); mudou(); }));
    } else if (s.tipo === "branco") {
      nome.textContent = "";
      num.innerHTML = '<span class="branco-box">VOTO EM BRANCO</span><span class="confirma confirma--branco">BRANCO</span>';
      busca.hidden = true;
      ac.appendChild(botaoTxt("Limpar / Alterar", function () { st[k] = { tipo: "vazio" }; pintar(k); $("input", li).focus(); mudou(); }));
    } else {
      nome.textContent = ""; busca.hidden = false; $("input", li).value = "";
      ac.appendChild(botaoTxt("Votar em BRANCO", function () { st[k] = { tipo: "branco" }; pintar(k); mudou(); }, "link"));
    }
  }
  function botaoTxt(t, fn, cls) { var b = document.createElement("button"); b.type = "button"; b.className = "mini" + (cls ? " mini--" + cls : ""); b.textContent = t; b.onclick = fn; return b; }

  function ligarBusca(c, li) {
    if (c.fixo) return;
    var inp = $("input", li), ul = $(".lista", li), itens = [], ativo = -1;
    function fechar() { ul.hidden = true; ul.innerHTML = ""; itens = []; ativo = -1; }
    function escolher(cand) { st[c.k] = { tipo: "cand", cand: cand }; fechar(); pintar(c.k); mudou(); }
    function outro() { return c.k === "sen1" ? st.sen2 : c.k === "sen2" ? st.sen1 : null; }
    function abrir() {
      var q = norm(inp.value.trim()); if (!q) { fechar(); return; }
      var o = outro(), ex = o && o.tipo === "cand" ? o.cand.num : -1, l = dados[c.lista], r, pts = [];
      if (/^\d+$/.test(q)) {
        r = l.filter(function (x) { return String(x.num).indexOf(q) === 0 && x.num !== ex; }).sort(function (a, b) { return a.num - b.num; });
        if (c.legenda) pts = dados.part.filter(function (p) { return String(p.num).indexOf(q) === 0; });
      } else {
        r = l.filter(function (x) { return (x.n.indexOf(q) >= 0 || x.p.indexOf(q) >= 0) && x.num !== ex; })
          .sort(function (a, b) { return (a.p !== q) - (b.p !== q) || (a.n.indexOf(q) !== 0) - (b.n.indexOf(q) !== 0) || a.n.localeCompare(b.n); });
        if (c.legenda) pts = dados.part.filter(function (p) { return p.n.indexOf(q) >= 0; }).sort(function (a, b) { return (a.s !== q) - (b.s !== q); });
      }
      r = pts.slice(0, 3).map(candLegenda).concat(r).slice(0, 9);
      itens = r; ativo = -1; ul.innerHTML = "";
      if (!r.length) { ul.innerHTML = '<li class="lista__vazio">Nenhum candidato encontrado</li>'; ul.hidden = false; return; }
      r.forEach(function (x, i) {
        var it = document.createElement("li"); it.setAttribute("role", "option");
        it.innerHTML = (x.legenda ? '<b class="sigla sigla--peq"></b>' : '<img loading="lazy" src="' + fotoUrl(x.sq) + '" alt="">') + '<span class="lista__nome"></span><span class="lista__num"></span>';
        $(".lista__nome", it).textContent = x.nome + (x.partido ? " · " + x.partido : ""); $(".lista__num", it).textContent = x.num;
        if (x.legenda) $(".sigla", it).textContent = x.sigla; else $("img", it).onerror = function () { this.style.visibility = "hidden"; };
        it.addEventListener("mousedown", function (e) { e.preventDefault(); escolher(x); });
        ul.appendChild(it);
      });
      ul.hidden = false;
    }
    function marca() { Array.prototype.forEach.call(ul.children, function (li2, i) { li2.classList.toggle("on", i === ativo); }); }
    inp.addEventListener("input", abrir);
    inp.addEventListener("blur", function () { setTimeout(fechar, 120); });
    inp.addEventListener("keydown", function (e) {
      if (e.key === "ArrowDown") { ativo = Math.min(itens.length - 1, ativo + 1); marca(); e.preventDefault(); }
      else if (e.key === "ArrowUp") { ativo = Math.max(0, ativo - 1); marca(); e.preventDefault(); }
      else if (e.key === "Enter") { if (itens[ativo >= 0 ? ativo : 0]) { escolher(itens[ativo >= 0 ? ativo : 0]); e.preventDefault(); } }
      else if (e.key === "Escape") fechar();
    });
  }

  /* ---------- prévia e código ---------- */
  var previa = $("#previa"), agendado = false;
  function todasFotos() { return CARGOS.map(function (c) { return st[c.k].tipo === "cand" ? st[c.k].cand.sq : null; }); }
  function desenharPrevia() {
    agendado = false;
    var cv = Render.card(estadoRender(), modo, fotosOn, grande);
    [previa, $("#previaHero")].forEach(function (t) { if (!t) return; t.width = cv.width; t.height = cv.height; t.getContext("2d").drawImage(cv, 0, 0); });
    $("#codigo").textContent = codigoAtual();
  }
  function mudou() {
    Render.garantir(todasFotos()).then(agendar); agendar();
  }
  function agendar() { $("#codigo").textContent = codigoAtual(); if (!agendado) { agendado = true; requestAnimationFrame(desenharPrevia); } }

  /* ---------- avisos e modal ---------- */
  var toastT;
  function aviso(t) { var e = $("#toast"); e.textContent = t; e.classList.add("on"); clearTimeout(toastT); toastT = setTimeout(function () { e.classList.remove("on"); }, 2800); }

  /* Garante que nenhuma posição fique vazia: pede escolha ou voto em branco */
  function garantirCompleto() {
    var vazios = CARGOS.filter(function (c) { return st[c.k].tipo === "vazio"; });
    if (!vazios.length) return Promise.resolve(true);
    return new Promise(function (ok) {
      var m = $("#modal"), nomes = vazios.map(function (c) { return c.rot.replace(" (A)", ""); });
      $("#modalTxt").textContent = "Você não escolheu: " + nomes.join(", ") + ". Escolha um candidato agora ou deixe em branco (voto em BRANCO).";
      m.hidden = false;
      $("#modalEscolher").onclick = function () { m.hidden = true; var li = $("#linha-" + vazios[0].k); li.scrollIntoView({ behavior: "smooth", block: "center" }); setTimeout(function () { $("input", li).focus(); }, 350); ok(false); };
      $("#modalBranco").onclick = function () { vazios.forEach(function (c) { st[c.k] = { tipo: "branco" }; pintar(c.k); }); m.hidden = true; mudou(); ok(true); };
    });
  }

  function preparar() {
    return garantirCompleto().then(function (ok) {
      if (!ok) return null;
      return Render.garantir(todasFotos()).then(function () { return estadoRender(); });
    });
  }
  function link() { return SITE + "?c=" + codigoAtual(); }

  /* ---------- ações ---------- */
  function nomeArq(s) { return "colinha-marco-vinholi-1002-" + modo + (grande ? "-numeros-grandes" : "") + (s || ""); }
  function acao(id, fn) { $(id).addEventListener("click", function () { preparar().then(function (e) { if (e) fn(e); }); }); }

  var SITE = /^(localhost|127\.)/.test(location.hostname) ? "https://www.marcovinholi.com.br/colinha/" : location.origin + location.pathname;
  function textoZap() {
    return "Essa é a minha colinha! 🗳️ Já sei em quem votar e não erro na urna." +
      "\nMonte a sua em 1 minuto: " + SITE +
      "\n\nMeu código (copie e cole no site para gerar igual):\n" + codigoAtual();
  }
  // Envia a IMAGEM da colinha (com o texto e o código)
  acao("#btnZap", function (e) {
    var texto = textoZap();
    Exportar.blobJpg(Render.card(e, modo, fotosOn, grande), 0.92).then(function (b) {
      var arq = new File([b], nomeArq(".jpg"), { type: "image/jpeg" });
      if (navigator.canShare && navigator.canShare({ files: [arq] })) {
        navigator.share({ files: [arq], text: texto }).catch(function () {});
      } else {
        Exportar.baixar(b, nomeArq(".jpg"));
        window.open("https://wa.me/?text=" + encodeURIComponent(texto), "_blank", "noopener");
        aviso("Imagem baixada. Anexe no WhatsApp.");
      }
    });
  });
  // Envia só o LINK do site (o WhatsApp mostra a miniatura da página) + código
  $("#btnZapLink").addEventListener("click", function () {
    garantirCompleto().then(function (ok) { if (ok) window.open("https://wa.me/?text=" + encodeURIComponent(textoZap()), "_blank", "noopener"); });
  });
  acao("#btnJpg", function (e) { Exportar.blobJpg(Render.card(e, modo, fotosOn, grande), 0.92).then(function (b) { Exportar.baixar(b, nomeArq(".jpg")); aviso("Imagem baixada."); }); });
  acao("#btnPdf1", function (e) { Exportar.pdf(Exportar.folha(e, modo, fotosOn, 1, grande)).then(function (b) { Exportar.baixar(b, nomeArq("-1-por-folha.pdf")); aviso("PDF baixado."); }); });
  acao("#btnPdf4", function (e) { Exportar.pdf(Exportar.folha(e, modo, fotosOn, 4, grande)).then(function (b) { Exportar.baixar(b, nomeArq("-4-por-folha.pdf")); aviso("PDF baixado."); }); });
  acao("#btnPrint1", function (e) { Exportar.imprimir(Exportar.folha(e, modo, fotosOn, 1, grande)); });
  acao("#btnPrint4", function (e) { Exportar.imprimir(Exportar.folha(e, modo, fotosOn, 4, grande)); });

  function copiar(txt, msg) {
    var f = function () { var t = document.createElement("textarea"); t.value = txt; document.body.appendChild(t); t.select(); try { document.execCommand("copy"); } catch (x) {} t.remove(); aviso(msg); };
    if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(txt).then(function () { aviso(msg); }, f); else f();
  }
  $("#btnLink").addEventListener("click", function () { garantirCompleto().then(function (ok) { if (ok) copiar(link(), "Link copiado!"); }); });
  $("#btnCopiaCodigo").addEventListener("click", function () { copiar(codigoAtual(), "Código copiado!"); });
  $("#formCodigo").addEventListener("submit", function (ev) {
    ev.preventDefault();
    if (aplicarCodigo($("#entradaCodigo").value)) { CARGOS.forEach(function (c) { pintar(c.k); }); mudou(); $("#entradaCodigo").value = ""; aviso("Colinha carregada!"); }
    else aviso("Código inválido. Confira e tente de novo.");
  });

  /* ---------- estilo ---------- */
  function ajustarEstilo() {
    modo = $("input[name=estilo]:checked").value; grande = $("#numGrandes").checked; fotosOn = $("#comFoto").checked; agendar();
  }
  Array.prototype.forEach.call(document.querySelectorAll("input[name=estilo]"), function (r) {
    r.addEventListener("change", function () { $("#comFoto").checked = r.value === "cor"; ajustarEstilo(); });
  });
  $("#comFoto").addEventListener("change", ajustarEstilo);
  $("#numGrandes").addEventListener("change", ajustarEstilo);

  /* ---------- início ---------- */
  carregarDados().then(function () {
    iniciar();
    var c = new URLSearchParams(location.search).get("c");
    if (c) { if (!aplicarCodigo(c)) aviso("Código do link inválido."); }
    montarLinhas();
    var fonteOk = document.fonts && document.fonts.load ? Promise.all([document.fonts.load("900 40px Montserrat"), document.fonts.load("500 20px Montserrat")]).catch(function () {}) : Promise.resolve();
    fonteOk.then(mudou);
    $("#carregando").hidden = true;
  }).catch(function () { $("#carregando").textContent = "Não foi possível carregar a lista de candidatos. Atualize a página."; });
})();
