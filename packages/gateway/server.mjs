/**
 * MetalNest ERP Gateway — mock harici sunucu (openapi.yaml kontratını sunar).
 * Gerçek deploy'da bu süreç SAP/Logo adaptörü + MQTT köprüsü olur; tarayıcı
 * tarafı DEĞİŞMEZ. Çalıştır: npm run gateway  (http://localhost:8787)
 */
import { createServer } from "node:http";
import { WebSocketServer } from "ws";

const PORT = process.env.PORT ?? 8787;

// "Harici ERP"nin kendi verisi — bilerek yerel mock'tan FARKLI:
// PRT-007 canlıda patlamış satış → kuyruk sırası değişir = canlı kaynağın kanıtı
const STOCK = [
  { sku: "ERP-316L-A", materialType: "316L Paslanmaz 2.0mm", dimensions: { width: 1250, length: 2500, thickness: 2 }, quantityAvailable: 60, arrivalDate: "2026-04-02T00:00:00Z", unitCost: 4290, isStale: true },
  { sku: "ERP-304BA-A", materialType: "304 Paslanmaz (BA) 1.5mm", dimensions: { width: 1500, length: 3000, thickness: 1.5 }, quantityAvailable: 44, arrivalDate: "2026-06-18T00:00:00Z", unitCost: 3510 },
  { sku: "ERP-304SB-A", materialType: "304 Paslanmaz (SB) 1.5mm", dimensions: { width: 1200, length: 2400, thickness: 1.5 }, quantityAvailable: 35, arrivalDate: "2026-03-15T00:00:00Z", unitCost: 3390, isStale: true },
  { sku: "ERP-430-A", materialType: "430 Paslanmaz (2B) 1.0mm", dimensions: { width: 1200, length: 2400, thickness: 1 }, quantityAvailable: 28, arrivalDate: "2026-06-25T00:00:00Z", unitCost: 2140 },
  { sku: "ERP-304-30", materialType: "304 Paslanmaz 3.0mm", dimensions: { width: 1200, length: 2400, thickness: 3 }, quantityAvailable: 15, arrivalDate: "2026-05-30T00:00:00Z", unitCost: 5120 },
];
const SALES = [
  { sku: "PRT-007", productName: "Mimari Dekoratif Panel 200×200", unitsSoldLast30Days: 540, unitsSoldLast90Days: 900, revenueLast30Days: 1_050_000, trend: "rising" },
  { sku: "PRT-001", productName: "Endüstriyel Gıda Tank Paneli 400×300", unitsSoldLast30Days: 380, unitsSoldLast90Days: 1100, revenueLast30Days: 760_000, trend: "stable" },
  { sku: "PRT-002", productName: "Asansör Kapı Sacı 800×600", unitsSoldLast30Days: 250, unitsSoldLast90Days: 860, revenueLast30Days: 755_000, trend: "falling" },
  { sku: "PRT-009", productName: "Montaj Braketi 180×120", unitsSoldLast30Days: 210, unitsSoldLast90Days: 480, revenueLast30Days: 63_000, trend: "rising" },
  { sku: "PRT-008", productName: "Bağlantı Flanşı 150×100", unitsSoldLast30Days: 120, unitsSoldLast90Days: 300, revenueLast30Days: 67_000, trend: "rising" },
  { sku: "PRT-004", productName: "Davlumbaz Gövde Paneli 600×400", unitsSoldLast30Days: 60, unitsSoldLast90Days: 210, revenueLast30Days: 162_000, trend: "stable" },
];

let seq = 0;
const json = (res, body) => {
  res.writeHead(200, {
    "content-type": "application/json",
    "access-control-allow-origin": "*",
  });
  res.end(JSON.stringify(body));
};

const server = createServer((req, res) => {
  // CORS preflight (tarayıcı POST'u OPTIONS ile önden sorar)
  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "access-control-allow-origin": "*",
      "access-control-allow-methods": "GET, POST, OPTIONS",
      "access-control-allow-headers": "content-type",
    });
    return res.end();
  }
  if (req.url === "/api/v1/health") return json(res, { status: "ok", snapshotSeq: seq });
  if (req.url === "/api/v1/stock") return json(res, STOCK);
  if (req.url === "/api/v1/sales") return json(res, SALES);
  // Sipariş Girişi formu buraya POST eder → tüm istemcilere order.created yayılır
  if (req.url === "/api/v1/orders" && req.method === "POST") {
    let body = "";
    req.on("data", (c) => (body += c));
    req.on("end", () => {
      try {
        const { sku, qty, dueDate } = JSON.parse(body);
        broadcast({ type: "order.created", order: { sku, qty, dueDate } });
        console.log(`[GW] Yeni sipariş alındı: ${sku} ×${qty} (termin ${dueDate})`);
        json(res, { accepted: true, seq });
      } catch {
        res.writeHead(400, { "access-control-allow-origin": "*" });
        res.end();
      }
    });
    return;
  }
  res.writeHead(404, { "access-control-allow-origin": "*" });
  res.end();
});

// --- WebSocket: 1 Hz makine telemetrisi + 4 Hz AGV pozu + ara sıra sipariş ---
const wss = new WebSocketServer({ server, path: "/ws" });
const jitter = (b, a) => Math.round((b + (Math.random() - 0.5) * a) * 10) / 10;
const broadcast = (msg) => {
  const s = JSON.stringify({ ...msg, seq: ++seq, ts: Date.now() });
  for (const c of wss.clients) if (c.readyState === 1) c.send(s);
};

setInterval(() => {
  for (const [id, p, oee] of [["CTL-1", 46, 88], ["SLT-1", 74, 91], ["LSR-2", 58, 84]]) {
    broadcast({
      type: "machine.telemetry",
      machineId: id,
      status: Math.random() < 0.9 ? "RUNNING" : "IDLE",
      oee: jitter(oee, 3),
      powerKw: jitter(p, p * 0.15),
      tempC: jitter(42, 4),
      vibration: jitter(2.1, 1.2),
    });
  }
}, 1000);

let agvT = 0;
setInterval(() => {
  agvT += 0.25;
  broadcast({
    type: "agv.pose",
    agvId: "AGV-EXT-1",
    x: Math.round(Math.cos(agvT * 0.2) * 80) / 10,
    z: Math.round(Math.sin(agvT * 0.2) * 40) / 10,
    heading: Math.round((agvT * 0.2 + Math.PI / 2) * 100) / 100,
    battery: Math.max(20, 100 - (agvT % 600) / 8),
  });
}, 250);

setInterval(() => {
  const s = SALES[Math.floor(Math.random() * SALES.length)];
  broadcast({ type: "order.created", order: { sku: s.sku, qty: 10 + Math.floor(Math.random() * 50), dueDate: "2026-07-14" } });
}, 25_000);

wss.on("connection", (c) => {
  console.log(`[GW] istemci bağlandı (${wss.clients.size} aktif)`);
  c.on("close", () => console.log(`[GW] istemci ayrıldı (${wss.clients.size} aktif)`));
});

server.listen(PORT, () => {
  console.log(`[GW] MetalNest ERP Gateway → http://localhost:${PORT}  (WS: /ws)`);
});
