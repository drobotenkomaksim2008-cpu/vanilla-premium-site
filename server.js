const http = require("http");
const fs = require("fs");
const path = require("path");
const { URL } = require("url");

const PORT = Number(process.env.PORT || 8092);
const ROOT = __dirname;
const DATA_DIR = path.join(ROOT, "data");
const STORE_FILE = path.join(DATA_DIR, "store.json");

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml"
};

const initialStore = {
  orders: [
    {
      id: 1001,
      createdAt: new Date(Date.now() - 18 * 60 * 1000).toISOString(),
      status: "preparing",
      method: "Самовывоз",
      total: 4500,
      customerName: "Алия",
      phone: "+7 700 000 00 01",
      address: "18:40",
      items: [
        { id: "flat-white", name: "Signature Flat White", price: 1900, qty: 1 },
        { id: "basque", name: "Basque Cheesecake", price: 2600, qty: 1 }
      ]
    },
    {
      id: 1002,
      createdAt: new Date(Date.now() - 7 * 60 * 1000).toISOString(),
      status: "new",
      method: "Доставка",
      total: 6300,
      customerName: "Гость Vanilla",
      phone: "+7 700 000 00 02",
      address: "центр города",
      items: [
        { id: "salmon", name: "Salmon Brioche", price: 4200, qty: 1 },
        { id: "coldbrew", name: "Vanilla Cold Brew", price: 2100, qty: 1 }
      ]
    }
  ],
  reservations: [
    {
      id: 501,
      createdAt: new Date(Date.now() - 50 * 60 * 1000).toISOString(),
      status: "booked",
      name: "Дина",
      phone: "+7 700 000 00 03",
      guests: 3,
      table: 4,
      time: new Date(Date.now() + 70 * 60 * 1000).toISOString()
    },
    {
      id: 502,
      createdAt: new Date(Date.now() - 35 * 60 * 1000).toISOString(),
      status: "booked",
      name: "Марат",
      phone: "+7 700 000 00 04",
      guests: 2,
      table: 7,
      time: new Date(Date.now() + 120 * 60 * 1000).toISOString()
    },
    {
      id: 503,
      createdAt: new Date(Date.now() - 12 * 60 * 1000).toISOString(),
      status: "booked",
      name: "Vanilla Club",
      phone: "+7 700 000 00 05",
      guests: 4,
      table: 9,
      time: new Date(Date.now() + 150 * 60 * 1000).toISOString()
    }
  ]
};

function ensureStore() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(STORE_FILE)) {
    fs.writeFileSync(STORE_FILE, JSON.stringify(initialStore, null, 2), "utf8");
  }
}

function readStore() {
  ensureStore();
  return JSON.parse(fs.readFileSync(STORE_FILE, "utf8"));
}

function writeStore(store) {
  ensureStore();
  fs.writeFileSync(STORE_FILE, JSON.stringify(store, null, 2), "utf8");
}

function sendJson(res, status, payload) {
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store"
  });
  res.end(JSON.stringify(payload));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > 1_000_000) {
        reject(new Error("Слишком большой запрос"));
        req.destroy();
      }
    });
    req.on("end", () => {
      if (!body) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(body));
      } catch (error) {
        reject(new Error("Некорректный JSON"));
      }
    });
  });
}

function activeOrders(store) {
  return store.orders.filter((order) => ["new", "preparing", "ready"].includes(order.status));
}

function bookedReservations(store) {
  const now = Date.now();
  const dayEnd = now + 24 * 60 * 60 * 1000;
  return store.reservations.filter((reservation) => {
    const time = new Date(reservation.time).getTime();
    return reservation.status === "booked" && time >= now - 2 * 60 * 60 * 1000 && time <= dayEnd;
  });
}

function nextId(items, start) {
  return items.reduce((max, item) => Math.max(max, Number(item.id) || start), start) + 1;
}

function nextTable(store) {
  const used = new Set(bookedReservations(store).map((reservation) => reservation.table));
  for (let table = 1; table <= 14; table += 1) {
    if (!used.has(table)) return table;
  }
  return 14;
}

function statsPayload(store) {
  const orders = activeOrders(store);
  const reservations = bookedReservations(store);
  return {
    activeOrders: orders.length,
    bookedTables: reservations.length,
    orders,
    reservations,
    updatedAt: new Date().toISOString()
  };
}

async function handleApi(req, res, pathname) {
  const store = readStore();

  if (req.method === "GET" && pathname === "/api/stats") {
    sendJson(res, 200, statsPayload(store));
    return;
  }

  if (req.method === "GET" && pathname === "/api/orders") {
    sendJson(res, 200, { orders: store.orders });
    return;
  }

  if (req.method === "GET" && pathname === "/api/reservations") {
    sendJson(res, 200, { reservations: store.reservations });
    return;
  }

  if (req.method === "POST" && pathname === "/api/orders") {
    const body = await readBody(req);
    if (!Array.isArray(body.items) || body.items.length === 0) {
      sendJson(res, 400, { message: "В заказе нет позиций" });
      return;
    }
    const order = {
      id: nextId(store.orders, 1000),
      createdAt: new Date().toISOString(),
      status: "new",
      method: body.method || "Самовывоз",
      total: Number(body.total || 0),
      customerName: body.customerName || "Гость Vanilla",
      phone: body.phone || "",
      address: body.address || "",
      items: body.items.map((item) => ({
        id: String(item.id || ""),
        name: String(item.name || "Позиция меню"),
        price: Number(item.price || 0),
        qty: Number(item.qty || 1)
      }))
    };
    store.orders.push(order);
    writeStore(store);
    sendJson(res, 201, { order, bonus: Math.round(order.total * 0.05), stats: statsPayload(store) });
    return;
  }

  if (req.method === "POST" && pathname === "/api/reservations") {
    const body = await readBody(req);
    const guests = Math.max(1, Math.min(12, Number(body.guests || 2)));
    const reservation = {
      id: nextId(store.reservations, 500),
      createdAt: new Date().toISOString(),
      status: "booked",
      name: body.name || "Гость Vanilla",
      phone: body.phone || "",
      guests,
      table: nextTable(store),
      time: body.time ? new Date(body.time).toISOString() : new Date(Date.now() + 60 * 60 * 1000).toISOString()
    };
    store.reservations.push(reservation);
    writeStore(store);
    sendJson(res, 201, { reservation, stats: statsPayload(store) });
    return;
  }

  sendJson(res, 404, { message: "API route not found" });
}

function serveStatic(res, pathname) {
  const safePath = pathname === "/" ? "/index.html" : pathname;
  const filePath = path.normalize(path.join(ROOT, safePath));
  if (!filePath.startsWith(ROOT)) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }
  fs.readFile(filePath, (error, data) => {
    if (error) {
      res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("Not found");
      return;
    }
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, { "Content-Type": mimeTypes[ext] || "application/octet-stream" });
    res.end(data);
  });
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  try {
    if (url.pathname.startsWith("/api/")) {
      await handleApi(req, res, url.pathname);
      return;
    }
    serveStatic(res, url.pathname);
  } catch (error) {
    sendJson(res, 500, { message: error.message || "Server error" });
  }
});

server.listen(PORT, () => {
  console.log(`Vanilla backend is running on port ${PORT}`);
});
