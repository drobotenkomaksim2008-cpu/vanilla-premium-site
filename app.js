const menu = [
  {
    id: "vanilla-latte",
    name: "Vanilla Cloud Latte",
    category: "Кофе",
    price: 2200,
    text: "Эспрессо, молоко и воздушная ванильная крем-пена.",
    image: "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?auto=format&fit=crop&w=700&q=80"
  },
  {
    id: "flat-white",
    name: "Signature Flat White",
    category: "Кофе",
    price: 1900,
    text: "Плотный specialty flat white на зерне средней обжарки.",
    image: "https://images.unsplash.com/photo-1497636577773-f1231844b336?auto=format&fit=crop&w=700&q=80"
  },
  {
    id: "matcha",
    name: "Ceremonial Matcha",
    category: "Напитки",
    price: 2400,
    text: "Японская матча, овсяное молоко и мягкая сладость.",
    image: "https://images.unsplash.com/photo-1515823064-d6e0c04616a7?auto=format&fit=crop&w=700&q=80"
  },
  {
    id: "basque",
    name: "Basque Cheesecake",
    category: "Десерты",
    price: 2600,
    text: "Кремовый чизкейк с карамельной корочкой и ягодным соусом.",
    image: "https://images.unsplash.com/photo-1533134242443-d4fd215305ad?auto=format&fit=crop&w=700&q=80"
  },
  {
    id: "croissant",
    name: "Pistachio Croissant",
    category: "Десерты",
    price: 2300,
    text: "Слоеный круассан, фисташковый крем и хрустящий декор.",
    image: "https://images.unsplash.com/photo-1509365465985-25d11c17e812?auto=format&fit=crop&w=700&q=80"
  },
  {
    id: "brunch",
    name: "Avocado Brunch",
    category: "Блюда",
    price: 3900,
    text: "Авокадо-тост, яйцо пашот, зелень и цитрусовая заправка.",
    image: "https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=700&q=80"
  },
  {
    id: "salmon",
    name: "Salmon Brioche",
    category: "Блюда",
    price: 4200,
    text: "Бриошь, слабосоленый лосось, крем-сыр и травы.",
    image: "https://images.unsplash.com/photo-1559847844-5315695dadae?auto=format&fit=crop&w=700&q=80"
  },
  {
    id: "coldbrew",
    name: "Vanilla Cold Brew",
    category: "Напитки",
    price: 2100,
    text: "18 часов холодной экстракции, ваниль и лед.",
    image: "https://images.unsplash.com/photo-1517701604599-bb29b565090c?auto=format&fit=crop&w=700&q=80"
  }
];

const instagramPosts = [
  ["https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=600&q=80", "Утренний бар и свежая выпечка."],
  ["https://images.unsplash.com/photo-1559925393-8be0ec4767c8?auto=format&fit=crop&w=600&q=80", "Новая партия Эфиопии уже в продаже."],
  ["https://images.unsplash.com/photo-1521017432531-fbd92d768814?auto=format&fit=crop&w=600&q=80", "Тихие столики для рабочих встреч."],
  ["https://images.unsplash.com/photo-1445116572660-236099ec97a0?auto=format&fit=crop&w=600&q=80", "Vanilla Cloud Latte стал хитом недели."]
];

const bonusHistory = [
  ["Заказ #1084", "+190 баллов"],
  ["Flat White Set", "+95 баллов"],
  ["Бронирование brunch", "+60 баллов"],
  ["День рождения Vanilla", "+500 баллов"]
];

let activeCategory = "Все";
let query = "";
const cart = new Map();

const $ = (selector) => document.querySelector(selector);
const api = {
  async get(path) {
    const response = await fetch(path, { headers: { Accept: "application/json" } });
    if (!response.ok) throw new Error(`API error ${response.status}`);
    return response.json();
  },
  async post(path, payload) {
    const response = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(payload)
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: "Ошибка сервера" }));
      throw new Error(error.message || "Ошибка сервера");
    }
    return response.json();
  }
};

const formatPrice = (value) => `${value.toLocaleString("ru-RU")} ₸`;

function cartRows() {
  return [...cart.entries()].map(([id, qty]) => {
    const item = menu.find((entry) => entry.id === id);
    return { ...item, qty };
  });
}

function cartTotal() {
  return cartRows().reduce((sum, item) => sum + item.qty * item.price, 0);
}

function renderCategories() {
  const categories = ["Все", ...new Set(menu.map((item) => item.category))];
  $("#categoryTabs").innerHTML = categories.map((category) => (
    `<button class="${category === activeCategory ? "is-active" : ""}" data-category="${category}">${category}</button>`
  )).join("");
}

function renderMenu() {
  const normalized = query.trim().toLowerCase();
  const filtered = menu.filter((item) => {
    const categoryMatch = activeCategory === "Все" || item.category === activeCategory;
    const textMatch = `${item.name} ${item.category} ${item.text}`.toLowerCase().includes(normalized);
    return categoryMatch && textMatch;
  });

  $("#menuGrid").innerHTML = filtered.map((item, index) => `
    <article class="menu-card" style="animation-delay:${index * 0.045}s">
      <img src="${item.image}" alt="${item.name}">
      <div class="card-body">
        <span class="eyebrow">${item.category}</span>
        <h3>${item.name}</h3>
        <p>${item.text}</p>
        <div class="card-bottom">
          <span class="price">${formatPrice(item.price)}</span>
          <button class="add-btn" data-add="${item.id}" aria-label="Добавить ${item.name}">+</button>
        </div>
      </div>
    </article>
  `).join("") || `<p class="empty">Ничего не найдено. Попробуйте другой запрос.</p>`;
}

function updateCart() {
  const rows = cartRows();
  const count = rows.reduce((sum, item) => sum + item.qty, 0);
  const total = rows.reduce((sum, item) => sum + item.qty * item.price, 0);

  $("#cartCount").textContent = count;
  $("#cartTotal").textContent = formatPrice(total);
  $("#cartItems").innerHTML = rows.length ? rows.map((item) => `
    <div class="cart-row">
      <span>${item.name}<br><small>${item.qty} × ${formatPrice(item.price)}</small></span>
      <strong>${formatPrice(item.qty * item.price)}</strong>
      <button data-remove="${item.id}" aria-label="Убрать ${item.name}">−</button>
    </div>
  `).join("") : `<p>Корзина пока пустая. Добавьте кофе, десерт или бранч из меню.</p>`;
}

function openModal(id) {
  const modal = document.getElementById(id);
  modal.classList.add("is-open");
  modal.setAttribute("aria-hidden", "false");
}

function closeModal(id) {
  const modal = document.getElementById(id);
  modal.classList.remove("is-open");
  modal.setAttribute("aria-hidden", "true");
}

function drawQr() {
  const canvas = $("#qrCanvas");
  const ctx = canvas.getContext("2d");
  const size = canvas.width;
  const cells = 29;
  const cell = Math.floor(size / cells);
  const offset = Math.floor((size - cell * cells) / 2);
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, size, size);
  ctx.fillStyle = "#1f1a16";

  const seed = `${location.origin}/#menu`.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0);
  const finder = (x, y) => {
    ctx.fillRect(offset + x * cell, offset + y * cell, cell * 7, cell * 7);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(offset + (x + 1) * cell, offset + (y + 1) * cell, cell * 5, cell * 5);
    ctx.fillStyle = "#1f1a16";
    ctx.fillRect(offset + (x + 2) * cell, offset + (y + 2) * cell, cell * 3, cell * 3);
  };

  finder(1, 1);
  finder(21, 1);
  finder(1, 21);

  for (let y = 0; y < cells; y += 1) {
    for (let x = 0; x < cells; x += 1) {
      const inFinder = (x < 9 && y < 9) || (x > 19 && y < 9) || (x < 9 && y > 19);
      const value = (x * 13 + y * 17 + seed + x * y) % 7;
      if (!inFinder && (value === 0 || value === 3 || (x + y) % 11 === 0)) {
        ctx.fillRect(offset + x * cell, offset + y * cell, cell, cell);
      }
    }
  }
}

function renderBonusHistory() {
  $("#bonusHistory").innerHTML = bonusHistory.map(([title, value]) => (
    `<li><span>${title}</span><b>${value}</b></li>`
  )).join("");
}

function loadInstagram() {
  setTimeout(() => {
    $("#instaLoader").style.display = "none";
    $("#instaGrid").innerHTML = instagramPosts.map(([image, caption]) => `
      <article class="insta-post">
        <img src="${image}" alt="${caption}">
        <p>${caption}</p>
      </article>
    `).join("");
  }, 850);
}

function setLiveStatus(text, ok = true) {
  $("#liveStatus").textContent = ok ? "OPEN" : "WAIT";
  $("#liveUpdated").textContent = text;
}

async function refreshStats() {
  try {
    const stats = await api.get("/api/stats");
    $("#liveOrders").textContent = stats.activeOrders;
    $("#liveReservations").textContent = stats.bookedTables;
    setLiveStatus(`обновлено ${new Date(stats.updatedAt).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })}`);
  } catch (error) {
    setLiveStatus("данные обновятся после открытия бара", false);
  }
}

async function submitOrder() {
  const rows = cartRows();
  if (!rows.length) {
    alert("Корзина пустая. Добавьте блюдо или напиток.");
    return;
  }

  const fields = [...document.querySelectorAll("#cartModal .checkout-fields input")].map((input) => input.value.trim());
  const method = document.querySelector("input[name='delivery']:checked").value;
  const payload = {
    customerName: fields[0] || "Гость Vanilla",
    phone: fields[1] || "",
    address: fields[2] || "",
    method,
    total: cartTotal(),
    items: rows.map(({ id, name, price, qty }) => ({ id, name, price, qty }))
  };

  try {
    const result = await api.post("/api/orders", payload);
    cart.clear();
    updateCart();
    await refreshStats();
    closeModal("cartModal");
    alert(`Заказ #${result.order.id} принят сервером. Начислено ${result.bonus} бонусов Vanilla Club.`);
  } catch (error) {
    alert(`Не удалось отправить заказ: ${error.message}. Проверьте, что сервер запущен.`);
  }
}

async function submitReservation() {
  const payload = {
    name: $("#reservationName").value.trim() || "Гость Vanilla",
    phone: $("#reservationPhone").value.trim(),
    guests: Number($("#reservationGuests").value || 2),
    time: $("#reservationTime").value || new Date(Date.now() + 60 * 60 * 1000).toISOString()
  };

  try {
    const result = await api.post("/api/reservations", payload);
    $("#reservationNote").textContent = `Бронь #${result.reservation.id} сохранена на сервере.`;
    await refreshStats();
    setTimeout(() => closeModal("reservationModal"), 700);
  } catch (error) {
    $("#reservationNote").textContent = `Не удалось сохранить бронь: ${error.message}`;
  }
}

document.addEventListener("click", (event) => {
  const category = event.target.closest("[data-category]");
  const add = event.target.closest("[data-add]");
  const remove = event.target.closest("[data-remove]");
  const close = event.target.closest("[data-close]");

  if (category) {
    activeCategory = category.dataset.category;
    renderCategories();
    renderMenu();
  }

  if (add) {
    const id = add.dataset.add;
    cart.set(id, (cart.get(id) || 0) + 1);
    updateCart();
    add.animate([
      { transform: "scale(1)" },
      { transform: "scale(1.18)" },
      { transform: "scale(1)" }
    ], { duration: 260, easing: "ease-out" });
  }

  if (remove) {
    const id = remove.dataset.remove;
    const next = (cart.get(id) || 0) - 1;
    if (next > 0) {
      cart.set(id, next);
    } else {
      cart.delete(id);
    }
    updateCart();
  }

  if (close) {
    closeModal(close.dataset.close);
  }

  if (event.target.classList.contains("modal")) {
    closeModal(event.target.id);
  }
});

$("#menuSearch").addEventListener("input", (event) => {
  query = event.target.value;
  renderMenu();
});

$("#openCart").addEventListener("click", () => openModal("cartModal"));
$("#openCartWide").addEventListener("click", () => openModal("cartModal"));
$("#openAccount").addEventListener("click", () => openModal("accountModal"));
$("#openQr").addEventListener("click", () => openModal("qrModal"));
$("#heroQr").addEventListener("click", () => openModal("qrModal"));
$("#openReservation").addEventListener("click", () => openModal("reservationModal"));
$("#submitOrder").addEventListener("click", submitOrder);
$("#submitReservation").addEventListener("click", submitReservation);

window.addEventListener("load", () => {
  setTimeout(() => $("#loader").classList.add("is-hidden"), 500);
});

renderCategories();
renderMenu();
updateCart();
drawQr();
renderBonusHistory();
loadInstagram();
refreshStats();
setInterval(refreshStats, 15000);
