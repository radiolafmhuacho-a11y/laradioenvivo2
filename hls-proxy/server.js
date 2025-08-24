// server.js — Proxy HLS muy simple + debug (Node 18+)
// Usa concatenación en lugar de template literals en respuestas de error
import express from "express";
import { URL as NodeURL } from "url";

const app = express();
const PORT = process.env.PORT || 3000;

// Cabeceras comunes para evitar bloqueos
const COMMON_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36",
  "Referer": "https://live20.bozztv.com/"
};

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  next();
});

app.get("/", (req, res) => res.send("proxy ok — /debug /stream.m3u8 /seg"));

/*
 Debug rápido: intenta traer la cabecera y los primeros 600 caracteres del origen
 https://TU_SERVICIO.onrender.com/debug
*/
app.get("/debug", async (req, res) => {
  const ORIG = "https://live20.bozztv.com/akamaissh101/ssh101/laradioenvivo/playlist.m3u8";
  try {
    const r = await fetch(ORIG, { headers: COMMON_HEADERS, cache: "no-store" });
    const status = r.status;
    const txt = await r.text();
    return res.json({ ok: r.ok, status: status, snippet: txt.slice(0, 600) });
  } catch (e) {
    console.error("ERR debug:", e);
    return res.status(502).json({ ok: false, error: String(e) });
  }
});

/*
 /stream.m3u8 -> reescribe playlist del origen a rutas /seg?url=...
 Ejemplo que usará siempre tu origen fijo (simplifica el uso en el HTML)
*/
app.get("/stream.m3u8", async (req, res) => {
  const ORIG = "https://live20.bozztv.com/akamaissh101/ssh101/laradioenvivo/playlist.m3u8";
  try {
    const r = await fetch(ORIG, { headers: COMMON_HEADERS, cache: "no-store" });
    if (!r.ok) return res.status(r.status).send('Origen respondió ' + r.status);
    let text = await r.text();

    const base = new NodeURL(ORIG);
    base.pathname = base.pathname.replace(/\/[^/]*$/, "/");

    const rewritten = text
      .split("\n")
      .map((line) => {
        if (line && !line.startsWith("#")) {
          const absolute = line.startsWith("http") ? line : new NodeURL(line, base).toString();
          return req.protocol + "://" + req.get("host") + "/seg?url=" + encodeURIComponent(absolute);
        }
        return line;
      })
      .join("\n");

    res.setHeader("Content-Type", "application/vnd.apple.mpegurl");
    res.setHeader("Cache-Control", "no-store");
    res.send(rewritten);
  } catch (e) {
    console.error("ERR stream.m3u8:", e);
    res.status(502).send("Bad gateway en stream.m3u8");
  }
});

/*
 /seg?url=... -> proxifica segmentos (.ts, etc.)
*/
app.get("/seg", async (req, res) => {
  const u = req.query.url;
  if (!u) return res.status(400).send("Falta parámetro url");
  try {
    const r = await fetch(u, { headers: COMMON_HEADERS, cache: "no-store" });
    if (!r.ok) return res.status(r.status).send('Origen respondió ' + r.status);
    const type = r.headers.get("content-type") || "application/octet-stream";
    res.setHeader("Content-Type", type);
    res.setHeader("Cache-Control", "no-store");
    const buf = Buffer.from(await r.arrayBuffer());
    res.send(buf);
  } catch (e) {
    console.error("ERR seg:", e);
    res.status(502).send("Bad gateway en seg");
  }
});

// Alias cómodo: /proxy -> /stream.m3u8
app.get('/proxy', (req,res)=>{
  // redirige a la playlist interna
  res.redirect('/stream.m3u8');
});

app.listen(PORT, () => console.log("Proxy escuchando en puerto " + PORT));
