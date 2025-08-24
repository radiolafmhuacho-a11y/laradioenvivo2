// server.js — Proxy HLS definitivo (Node 18+)
// Usa tu origen fijo y expone: / , /debug , /stream.m3u8 , /seg , /proxy
import express from "express";
import { URL as NodeURL } from "url";

const app = express();
const PORT = process.env.PORT || 3000;

// --- CONFIG: cambia solo si tu origen cambia ---
const ORIG = "https://live20.bozztv.com/akamaissh101/ssh101/laradioenvivo/playlist.m3u8";
// -------------------------------------------------

const COMMON_HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36",
  "Referer": "https://live20.bozztv.com/"
};

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  next();
});

app.get("/", (req, res) => res.send("proxy ok — /debug /stream.m3u8 /seg /proxy"));

app.get("/debug", async (req, res) => {
  try {
    const r = await fetch(ORIG, { headers: COMMON_HEADERS, cache: "no-store" });
    const status = r.status;
    const txt = await r.text().catch(()=>"");
    return res.json({ ok: r.ok, status, snippet: txt.slice(0, 800) });
  } catch (e) {
    console.error("ERR debug:", e);
    return res.status(502).json({ ok: false, error: String(e) });
  }
});

// /stream.m3u8
