// server.js — Proxy HLS robusto (Node 18+)
import express from "express";
import { URL as NodeURL } from "url";

const app = express();
const PORT = process.env.PORT || 3000;

// CORS para el navegador
app.use((req,res,next)=>{
  res.setHeader("Access-Control-Allow-Origin","*");
  res.setHeader("Access-Control-Allow-Methods","GET,HEAD,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers","Content-Type");
  next();
});

const COMMON_HEADERS = {
  // Algunos orígenes requieren UA/Referer para permitir hotlinking
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36",
  "Referer": "https://live20.bozztv.com/"
};

app.get("/", (req,res)=>res.send("proxy ok"));
app.get("/health", (req,res)=>res.json({ok:true}));

// /proxy.m3u8?url=<URL_ORIGEN_M3U8>
app.get("/proxy.m3u8", async (req,res)=>{
  const src = req.query.url;
  if(!src) return res.status(400).send("Falta parámetro url");
  try {
    const r = await fetch(src, { headers: COMMON_HEADERS, cache: "no-store" });
    if(!r.ok) return res.status(r.status).send(Origen respondió ${r.status});
    let text = await r.text();

    // Resolver rutas relativas y reescribir a nuestro /seg
    const base = new NodeURL(src);
    base.pathname = base.pathname.replace(/\/[^/]*$/, "/");

    const rewritten = text.split("\n").map(line=>{
      if(line && !line.startsWith("#")) {
        const absolute = line.startsWith("http") ? line : new NodeURL(line, base).toString();
        return ${req.protocol}://${req.get("host")}/seg?url=${encodeURIComponent(absolute)};
      }
      return line;
    }).join("\n");

    res.setHeader("Content-Type","application/vnd.apple.mpegurl");
    res.setHeader("Cache-Control","no-store");
    res.send(rewritten);
  } catch (e) {
    console.error("ERR proxy.m3u8:", e);
    res.status(502).send("Bad gateway en proxy.m3u8");
  }
});

// /seg?url=<URL_ABSOLUTA_DEL_SEGMENTO>
app.get("/seg", async (req,res)=>{
  const u = req.query.url;
  if(!u) return res.status(400).send("Falta parámetro url");
  try {
    const r = await fetch(u, { headers: COMMON_HEADERS, cache: "no-store" });
    if(!r.ok) return res.status(r.status).send(Origen respondió ${r.status});
    // reenviamos encabezados útiles
    res.setHeader("Content-Type", r.headers.get("content-type") || "video/mp2t");
    res.setHeader("Cache-Control","no-store");
    const buf = Buffer.from(await r.arrayBuffer());
    res.send(buf);
  } catch (e) {
    console.error("ERR seg:", e);
    res.status(502).send("Bad gateway en seg");
  }
});

app.listen(PORT, ()=>console.log("Servidor corriendo en puerto " + PORT));
});

app.listen(PORT, ()=>console.log("Servidor corriendo en puerto " + PORT));
