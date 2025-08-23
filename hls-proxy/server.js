// server.js
import express from "express";
import fetch from "node-fetch";
import { URL as NodeURL } from "url";

const app = express();
const PORT = process.env.PORT || 3000;

app.use((req,res,next)=>{
  res.setHeader("Access-Control-Allow-Origin","*");
  res.setHeader("Access-Control-Allow-Methods","GET,HEAD,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers","Content-Type");
  next();
});

app.get("/", (req,res)=>res.send("proxy ok"));

// /proxy.m3u8?url=<URL_ORIGEN_M3U8>
app.get("/proxy.m3u8", async (req,res)=>{
  const src = req.query.url;
  if(!src) return res.status(400).send("Falta parámetro url");
  try {
    const r = await fetch(src, { timeout: 20000 });
    let text = await r.text();

    const base = new NodeURL(src);
    base.pathname = base.pathname.replace(/\/[^/]*$/, "/");

    text = text.split("\n").map(line=>{
      if(line && !line.startsWith("#")) {
        const absolute = line.startsWith("http") ? line : new NodeURL(line, base).toString();
        return ${req.protocol}://${req.get("host")}/seg?url=${encodeURIComponent(absolute)};
      }
      return line;
    }).join("\n");

    res.type("application/vnd.apple.mpegurl").send(text);
  } catch(e){
    console.error("ERR proxy.m3u8", e);
    res.status(502).send("Bad gateway");
  }
});

// /seg?url=...
app.get("/seg", async (req,res)=>{
  const u = req.query.url;
  if(!u) return res.status(400).send("Falta parámetro url");
  try {
    const r = await fetch(u, { timeout: 20000 });
    r.headers.forEach((v,k)=>res.set(k,v));
    const buf = Buffer.from(await r.arrayBuffer());
    res.send(buf);
  } catch(e){
    console.error("ERR seg", e);
    res.status(502).send("Bad gateway");
  }
});

app.listen(PORT, ()=>console.log("Servidor corriendo en puerto " + PORT));
