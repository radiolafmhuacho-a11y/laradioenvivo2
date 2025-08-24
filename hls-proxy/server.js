import express from "express";
import fetch from "node-fetch";

const app = express();
const PORT = process.env.PORT || 3000;

app.get("/stream.m3u8", async (req, res) => {
  const targetUrl = req.query.url;
  if (!targetUrl) return res.status(400).send("Falta parámetro ?url=");

  try {
    const r = await fetch(targetUrl);
    if (!r.ok) return res.status(r.status).send(Origen respondió ${r.status});
    
    res.set("Content-Type", "application/vnd.apple.mpegurl");
    const body = await r.text();
    res.send(body);
  } catch (e) {
    console.error(e);
    res.status(500).send("Error en proxy");
  }
});

app.listen(PORT, () => console.log("Proxy OK en puerto " + PORT));
