import express from "express";
import fetch from "node-fetch";

const app = express();
const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => {
  res.send("proxy ok");
});

app.get("/proxy.m3u8", async (req, res) => {
  const target = req.query.url;
  if (!target) return res.status(400).send("Falta parámetro url");

  try {
    const response = await fetch(target);
    res.set("Content-Type", "application/vnd.apple.mpegurl");
    response.body.pipe(res);
  } catch (err) {
    res.status(500).send("Error al traer stream");
  }
});

app.listen(PORT, () => console.log("Servidor corriendo en puerto " + PORT));
