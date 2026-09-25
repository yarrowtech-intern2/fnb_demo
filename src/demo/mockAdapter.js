import axios from "axios";
import { buildDb, uid, RESTAURANT_ID, DEMO_ADMIN } from "./db.js";

// Fake backend for the client demo. Every axios request in the app is
// answered from the in-memory `db` below - no server, no database.
let db = buildDb();
export const resetDb = () => {
  db = buildDb();
};

const ok = (data, status = 200) => ({ status, data });
const fail = (status, message) => ({ status, data: { success: false, message } });
const clone = (v) => JSON.parse(JSON.stringify(v));

const tableOf = (id) => db.tables.find((t) => t._id === id);
const isActive = (o) => !["PAID", "CANCELLED"].includes(o.status);

const withActiveOrders = () =>
  db.tables.map((t) => {
    const active = db.orders.find((o) => o.table === t._id && isActive(o));
    return { ...clone(t), activeOrder: active ? clone(active) : null };
  });

const syncTableStatus = (tableId) => {
  const t = tableOf(tableId);
  if (!t) return;
  const active = db.orders.some((o) => o.table === tableId && isActive(o));
  if (active) {
    t.status = "occupied";
    t.occupiedAt = t.occupiedAt || new Date().toISOString();
  } else if (t.status === "occupied") {
    t.status = "available";
    t.occupiedAt = null;
  }
};

const nextOrderNo = () => `ORD-${1040 + db.orders.length + 1}`;

const statusStep = (name) => (req) => {
  const o = db.orders.find((x) => x._id === req.p.id);
  if (!o) return fail(404, "Order not found");
  o.status = name;
  o[`${name.toLowerCase()}At`] = new Date().toISOString();
  o.items.forEach((i) => {
    if (i.status !== "CANCELLED") i.status = name === "PAID" ? "SERVED" : name;
  });
  if (name === "PAID") syncTableStatus(o.table);
  return ok({ success: true, data: clone(o) });
};

// Route table. `:x` segments become req.p.x
const routes = [];
const on = (method, pattern, handler) => {
  const keys = [];
  const re = new RegExp(
    "^" +
      pattern.replace(/:(\w+)/g, (_, k) => {
        keys.push(k);
        return "([^/]+)";
      }) +
      "/?$"
  );
  routes.push({ method, re, keys, handler });
};

/* ---------- auth / session ---------- */
["employee", "admin", "super_admin", "superadmin", "vendor"].forEach((r) =>
  on("POST", `/${r}/login`, () => ok({ success: true, token: "demo-token", user: DEMO_ADMIN }))
);
on("POST", "/session/logout", () => ok({ success: true }));
on("GET", "/employees/me", () => ok(clone(db.employees[0])));
on("GET", "/admin/me", () => ok(clone(DEMO_ADMIN)));
on("PUT", "/admin/profile", () => ok({ success: true }));

/* ---------- restaurants ---------- */
on("GET", "/restaurants", () => ok(clone(db.restaurants)));
on("POST", "/restaurants", (r) => {
  const rest = {
    _id: uid("rest"),
    restaurantCode: "NEW01",
    isActive: true,
    restaurantType: "HYBRID",
    ...r.body,
    createdAt: new Date().toISOString(),
  };
  db.restaurants.push(rest);
  return ok({ success: true, restaurant: rest }, 201);
});
on("GET", "/restaurants/:id", (r) =>
  ok(clone(db.restaurants.find((x) => x._id === r.p.id) || db.restaurants[0]))
);
on("PUT", "/restaurants/:id", (r) => {
  const x = db.restaurants.find((y) => y._id === r.p.id);
  if (x) Object.assign(x, r.body);
  return ok({ success: true, restaurant: x });
});
on("DELETE", "/restaurants/:id", (r) => {
  db.restaurants = db.restaurants.filter((x) => x._id !== r.p.id);
  return ok({ success: true });
});
on("GET", "/restaurants/:id/employees", () => ok(clone(db.employees)));

/* ---------- employees ---------- */
on("GET", "/employees", () => ok(clone(db.employees)));
on("GET", "/employees/restaurant/list", () => ok(clone(db.employees)));
on("GET", "/employees/history/deleted", () => ok([]));
on("POST", "/employees", (r) => {
  const role = String(r.body.role || "WAITER").toUpperCase();
  const e = {
    _id: uid("e"),
    employeeId: `TGB01-${role.slice(0, 3)}-${String(db.employees.length + 1).padStart(3, "0")}`,
    isActive: true,
    restaurant: db.restaurants[0],
    ...r.body,
    role,
    createdAt: new Date().toISOString(),
  };
  delete e.password;
  db.employees.push(e);
  return ok(clone(e), 201);
});
on("PUT", "/employees/:id", (r) => {
  const e = db.employees.find((x) => x._id === r.p.id);
  if (e) Object.assign(e, r.body);
  return ok(clone(e || {}));
});
on("DELETE", "/employees/:id", (r) => {
  db.employees = db.employees.filter((x) => x._id !== r.p.id);
  return ok({ success: true });
});
on("PUT", "/employees/:id/reset-password", () => ok({ success: true }));
on("PUT", "/employees/:id/remove-restaurant", () => ok({ success: true }));
on("GET", "/employees/:id", (r) => ok(clone(db.employees.find((x) => x._id === r.p.id) || {})));

/* ---------- tables + floor plan ---------- */
on("GET", "/tables/:rid", () => ok({ success: true, data: withActiveOrders() }));
on("POST", "/tables/:rid", (r) => {
  if (db.tables.some((t) => t.tableNumber === Number(r.body.tableNumber))) {
    return fail(400, "Table number already exists for this restaurant");
  }
  const t = {
    _id: uid("t"),
    restaurant: r.p.rid,
    status: "available",
    zone: "Main Hall",
    layout: { x: 5, y: 5, shape: "square", rotation: 0 },
    mergedWith: [],
    mergedGroupId: null,
    reservation: {},
    ...r.body,
    tableNumber: Number(r.body.tableNumber),
    capacity: Number(r.body.capacity),
  };
  db.tables.push(t);
  return ok({ success: true, data: t }, 201);
});
on("PUT", "/tables/:rid/layout", (r) => {
  (r.body.tables || []).forEach((u) => {
    const t = tableOf(u._id);
    if (t) {
      t.layout = { ...t.layout, ...u.layout };
      if (u.zone) t.zone = u.zone;
    }
  });
  return ok({ success: true });
});
on("PUT", "/tables/:rid/merge", (r) => {
  const g = uid("merge");
  (r.body.tableIds || []).forEach((id, i) => {
    const t = tableOf(id);
    if (t) {
      t.mergedGroupId = g;
      t.mergedWith = r.body.tableIds;
      t.isMergePrimary = i === 0;
    }
  });
  return ok({ success: true });
});
on("PUT", "/tables/:rid/unmerge", (r) => {
  db.tables
    .filter((t) => t.mergedGroupId === r.body.mergedGroupId)
    .forEach((t) => {
      t.mergedGroupId = null;
      t.mergedWith = [];
      t.isMergePrimary = false;
    });
  return ok({ success: true });
});
on("PUT", "/tables/:rid/:id/status", (r) => {
  const t = tableOf(r.p.id);
  if (!t) return fail(404, "Table not found");
  t.status = r.body.status;
  t.occupiedAt = t.status === "occupied" ? t.occupiedAt || new Date().toISOString() : null;
  if (t.status === "reserved") t.reservation = { ...r.body.reservation };
  if (t.status === "available") t.reservation = {};
  return ok({ success: true, data: clone(t) });
});
on("PUT", "/tables/:rid/:id", (r) => {
  const t = tableOf(r.p.id);
  if (t) {
    Object.assign(t, r.body);
    if (r.body.layout) t.layout = { ...t.layout, ...r.body.layout };
  }
  return ok({ success: true, data: clone(t) });
});
on("DELETE", "/tables/:rid/:id", (r) => {
  db.tables = db.tables.filter((t) => t._id !== r.p.id);
  return ok({ success: true });
});

on("GET", "/floor-markers/:rid", () => ok({ success: true, data: clone(db.floorMarkers) }));
on("POST", "/floor-markers/:rid", (r) => {
  const m = { _id: uid("m"), restaurant: r.p.rid, ...r.body };
  db.floorMarkers.push(m);
  return ok({ success: true, data: m }, 201);
});
on("PUT", "/floor-markers/:rid/:id", (r) => {
  const m = db.floorMarkers.find((x) => x._id === r.p.id);
  if (m) Object.assign(m, r.body);
  return ok({ success: true, data: m });
});
on("DELETE", "/floor-markers/:rid/:id", (r) => {
  db.floorMarkers = db.floorMarkers.filter((x) => x._id !== r.p.id);
  return ok({ success: true });
});
on("GET", "/floor-zone-settings/:rid", () => ok({ success: true, data: clone(db.zoneSettings) }));
on("PUT", "/floor-zone-settings/:rid", (r) => {
  let z = db.zoneSettings.find((x) => x.zone === r.body.zone);
  if (!z) {
    z = { restaurant: r.p.rid, zone: r.body.zone, backgroundImageUrl: "", backgroundOpacity: 0.6 };
    db.zoneSettings.push(z);
  }
  const { imageDataUrl, removeBackground, ...rest } = r.body;
  Object.assign(z, rest);
  if (imageDataUrl) z.backgroundImageUrl = imageDataUrl;
  if (removeBackground) z.backgroundImageUrl = "";
  return ok({ success: true, data: clone(z) });
});

/* ---------- kitchen sections + menu ---------- */
on("GET", "/kitchen-sections/:rid", () => ok({ success: true, data: clone(db.kitchenSections) }));
on("POST", "/kitchen-sections/:rid", (r) => {
  const k = { _id: uid("ks"), restaurant: r.p.rid, ...r.body };
  db.kitchenSections.push(k);
  return ok({ success: true, data: k }, 201);
});
on("PUT", "/kitchen-sections/:rid/:id", (r) => {
  const k = db.kitchenSections.find((x) => x._id === r.p.id);
  if (k) Object.assign(k, r.body);
  return ok({ success: true, data: k });
});
on("DELETE", "/kitchen-sections/:rid/:id", (r) => {
  db.kitchenSections = db.kitchenSections.filter((x) => x._id !== r.p.id);
  return ok({ success: true });
});

on("GET", "/menu/orders-by-date/:rid", () => ok([]));
on("GET", "/menu/:rid", () => ok(clone(db.menu)));
on("POST", "/menu/:rid", (r) => {
  const cuisine = db.kitchenSections.find((k) => k._id === r.body.cuisine) || r.body.cuisine;
  const m = { _id: uid("mn"), isAvailable: true, restaurant: r.p.rid, ...r.body, cuisine };
  db.menu.push(m);
  return ok(clone(m), 201);
});
on("PUT", "/menu/:rid/:id", (r) => {
  const m = db.menu.find((x) => x._id === r.p.id);
  if (m) {
    Object.assign(m, r.body);
    if (r.body.cuisine) {
      m.cuisine = db.kitchenSections.find((k) => k._id === r.body.cuisine) || m.cuisine;
    }
  }
  return ok(clone(m || {}));
});
on("DELETE", "/menu/:rid/:id", (r) => {
  db.menu = db.menu.filter((x) => x._id !== r.p.id);
  return ok({ success: true });
});

/* ---------- orders ---------- */
const listOrders = (filter) => ok({ success: true, data: clone(db.orders.filter(filter)) });
on("GET", "/order/waiter/dashboard", () =>
  ok({
    success: true,
    data: {
      activeOrders: db.orders.filter(isActive).length,
      todayOrders: db.orders.length,
      servedOrders: db.orders.filter((o) => o.status === "PAID").length,
      totalTables: db.tables.length,
      occupiedTables: db.tables.filter((t) => t.status === "occupied").length,
    },
  })
);
on("GET", "/order/chef/dashboard", () =>
  ok({
    success: true,
    data: {
      pending: db.orders.filter((o) => o.status === "PENDING").length,
      preparing: db.orders.filter((o) => o.status === "PREPARING").length,
      ready: db.orders.filter((o) => o.status === "READY").length,
      completedToday: db.orders.filter((o) => o.status === "PAID").length,
    },
  })
);
on("GET", "/order/waiter", (r) => listOrders((o) => r.query.type === "all" || isActive(o)));
on("GET", "/order/chef", (r) => listOrders((o) => (r.query.type === "mine" ? o.chef : isActive(o))));
on("GET", "/order", () => ok(clone(db.orders)));
on("GET", "/order/:id", (r) => ok(clone(db.orders.find((o) => o._id === r.p.id) || {})));
on("POST", "/order", (r) => {
  const b = r.body;
  const items = (b.items || []).map((i) => {
    const m = db.menu.find((x) => x._id === (i.menuItem || i.menuItemId));
    return {
      _id: uid("oi"),
      menuItem: m,
      name: m?.name,
      quantity: Number(i.quantity) || 1,
      price: m?.price || 0,
      status: "PENDING",
      note: i.note,
    };
  });
  const o = {
    _id: uid("o"),
    orderNo: nextOrderNo(),
    restaurant: RESTAURANT_ID,
    table: b.tableId || b.table || null,
    orderType: b.orderType || "DINE_IN",
    waiter: { _id: db.employees[1]._id, name: db.employees[1].name },
    chef: null,
    items,
    status: "PENDING",
    createdAt: new Date().toISOString(),
    tableChangeHistory: [],
  };
  o.tableNumber = tableOf(o.table)?.tableNumber;
  db.orders.unshift(o);
  syncTableStatus(o.table);
  return ok({ success: true, data: clone(o) }, 201);
});
on("PUT", "/order/:id/accept", (r) => {
  const o = db.orders.find((x) => x._id === r.p.id);
  if (o) {
    o.status = "ACCEPTED";
    o.chef = { _id: "e_chf", name: "Rohit Verma" };
  }
  return ok({ success: true, data: clone(o) });
});
on("PUT", "/order/:id/preparing", statusStep("PREPARING"));
on("PUT", "/order/:id/ready", statusStep("READY"));
on("PUT", "/order/:id/served", statusStep("SERVED"));
on("PUT", "/order/:id/paid", statusStep("PAID"));
on("PUT", "/order/:id/add-items", (r) => {
  const o = db.orders.find((x) => x._id === r.p.id);
  (r.body.items || []).forEach((i) => {
    const m = db.menu.find((x) => x._id === (i.menuItem || i.menuItemId));
    if (o && m) {
      o.items.push({
        _id: uid("oi"),
        menuItem: m,
        name: m.name,
        quantity: Number(i.quantity) || 1,
        price: m.price,
        status: "PENDING",
      });
    }
  });
  return ok({ success: true, data: clone(o) });
});
on("PUT", "/order/:id/table", (r) => {
  const o = db.orders.find((x) => x._id === r.p.id);
  if (o) {
    const from = o.table;
    o.table = r.body.tableId;
    o.tableNumber = tableOf(o.table)?.tableNumber;
    syncTableStatus(from);
    syncTableStatus(o.table);
  }
  return ok({ success: true, data: clone(o) });
});
on("PUT", "/order/:id/items/:itemId/cancel", (r) => {
  const o = db.orders.find((x) => x._id === r.p.id);
  const i = o?.items.find((x) => x._id === r.p.itemId);
  if (i) i.status = "CANCELLED";
  return ok({ success: true, data: clone(o) });
});
on("POST", "/order/:id/kot", (r) =>
  ok({ success: true, data: clone(db.orders.find((x) => x._id === r.p.id)) })
);
on("POST", "/order/:id/bill", (r) => {
  const o = db.orders.find((x) => x._id === r.p.id);
  if (o) o.status = "SERVED";
  return ok({ success: true, data: clone(o) });
});
on("GET", "/kot/my-print-jobs", () => ok({ success: true, data: [] }));

/* ---------- admin dashboard ---------- */
const MONTHLY = [
  { month: "4/2026", revenue: 182000, orders: 640 },
  { month: "5/2026", revenue: 214500, orders: 735 },
  { month: "6/2026", revenue: 198300, orders: 690 },
  { month: "7/2026", revenue: 241800, orders: 812 },
  { month: "8/2026", revenue: 265400, orders: 880 },
  { month: "9/2026", revenue: 143200, orders: 470 },
];
const TOP_ITEMS = [
  { name: "Paneer Tikka", totalSold: 412, revenue: 90640 },
  { name: "Veg Biryani", totalSold: 388, revenue: 81480 },
  { name: "Butter Naan", totalSold: 1210, revenue: 54450 },
  { name: "Cold Coffee", totalSold: 356, revenue: 32040 },
  { name: "Dal Makhani", totalSold: 301, revenue: 57190 },
];
const DAILY = Array.from({ length: 14 }, (_, i) => {
  const d = new Date(Date.now() - (13 - i) * 86400000);
  return {
    date: `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`,
    revenue: 6000 + ((i * 1373) % 5200),
    orders: 18 + ((i * 7) % 22),
  };
});
on("GET", "/admin-dashboard/summary", () =>
  ok({
    success: true,
    data: {
      totalOrders: 4227,
      totalRevenue: 1245200,
      totalRestaurants: db.restaurants.length,
      totalEmployees: db.employees.length,
      totalVendorSpend: 184000,
      pendingVendorPayables: 32000,
      totalActiveVendors: 6,
      totalVendorSettlements: 14,
      paidVendorSettlements: 11,
      settledVendorAmount: 152000,
    },
  })
);
on("GET", "/admin-dashboard/monthly", () => ok({ success: true, data: MONTHLY }));
on("GET", "/admin-dashboard/top-items", () => ok({ success: true, data: TOP_ITEMS }));
on("GET", "/admin-dashboard/daily-sales", () => ok({ success: true, data: DAILY }));
on("GET", "/admin-dashboard/restaurant-breakdown", () =>
  ok({
    success: true,
    data: db.restaurants.map((r) => ({
      _id: r._id,
      name: r.name,
      totalOrders: 4227,
      totalRevenue: 1245200,
      totalEmployees: db.employees.length,
      employeeRoles: [],
      topItems: TOP_ITEMS.slice(0, 3),
      vendorOrders: 38,
      vendorSpend: 184000,
      vendorOutstanding: 32000,
      activeVendorCount: 6,
      topVendors: [],
    })),
  })
);
on("GET", "/admin-dashboard/restaurants", () => ok({ success: true, data: clone(db.restaurants) }));
on("GET", "/admin-dashboard/account-history", () => ok({ success: true, data: [], total: 0 }));

/* ---------- role dashboards ---------- */
on("GET", "/manager/dashboard", () =>
  ok({
    success: true,
    data: {
      todayOrders: 47,
      todayRevenue: 18450,
      lastWeekOrders: 312,
      lastWeekRevenue: 121800,
      lastMonthOrders: 1340,
      lastMonthRevenue: 512300,
      selectedOrders: 0,
      selectedRevenue: 0,
      selectedStartDate: "",
      selectedEndDate: "",
      todayPresentStaff: 6,
      totalStaff: db.employees.length,
      attendanceRate: 75,
    },
  })
);
on("GET", "/manager/account-history", () =>
  ok({
    success: true,
    data: {
      summary: { totalOrders: 0, totalRevenue: 0, averageBillValue: 0, todayCollections: 0 },
      filters: { startDate: "", endDate: "" },
      bills: [],
    },
  })
);
const attendance = { totalDays: 24, presentDays: 22, presentPercent: 92 };
on("GET", "/waiter/dashboard", () => ok({ todayOrders: 12, monthlyOrders: 286, attendance }));
on("GET", "/chef/dashboard", () => ok({ todayAcceptedOrders: 19, monthlyAcceptedOrders: 402, attendance }));
on("GET", "/accountant/dashboard", () =>
  ok({
    success: true,
    filter: "today",
    range: { startDate: new Date().toISOString(), endDate: new Date().toISOString() },
    summary: {
      totalBillsGenerated: 23,
      totalRevenue: 18450,
      cashCount: 8,
      cashAmount: 5200,
      cardCount: 6,
      cardAmount: 6100,
      upiCount: 9,
      upiAmount: 7150,
    },
    generatedBills: [],
    paidBills: [],
  })
);

/* ---------- misc no-ops ---------- */
on("GET", "/subscriptions/me", () =>
  ok({ success: true, data: { plan: { name: "Demo Plan", code: "DEMO" }, status: "ACTIVE" } })
);
on("GET", "/subscriptions/plans", () => ok({ success: true, data: [] }));
["/push/subscribe", "/push/unsubscribe", "/push/test", "/support-tickets"].forEach((p) =>
  on("POST", p, () => ok({ success: true }))
);

/* ---------- adapter ---------- */
const parse = (config) => {
  const raw = String(config.url || "");
  const isAbs = raw.startsWith("http");
  const full = isAbs
    ? new URL(raw).pathname + new URL(raw).search
    : String(config.baseURL || "") + raw;
  const [path0, qs = ""] = full.split("?");
  const path = path0.replace(/^\/api(?=\/)/, "").replace(/\/+$/, "") || "/";
  const query = { ...Object.fromEntries(new URLSearchParams(qs)), ...(config.params || {}) };
  let body = config.data;
  if (typeof body === "string") {
    try {
      body = JSON.parse(body);
    } catch {
      body = {};
    }
  }
  return { path, query, body: body || {} };
};

export const mockAdapter = (config) =>
  new Promise((resolve, reject) => {
    const method = String(config.method || "get").toUpperCase();
    const { path, query, body } = parse(config);
    let result = null;
    for (const route of routes) {
      if (route.method !== method) continue;
      const m = route.re.exec(path);
      if (!m) continue;
      const p = {};
      route.keys.forEach((k, i) => {
        p[k] = decodeURIComponent(m[i + 1]);
      });
      result = route.handler({ p, query, body });
      break;
    }
    if (!result) {
      console.warn(`[demo] no mock for ${method} ${path} - returning empty data`);
      result = ok(method === "GET" ? [] : { success: true });
    }
    const response = {
      data: result.data,
      status: result.status,
      statusText: String(result.status),
      headers: {},
      config,
      request: {},
    };
    const valid = result.status >= 200 && result.status < 300;
    setTimeout(() => {
      if (valid) resolve(response);
      else {
        reject(
          Object.assign(new Error(result.data?.message || "Request failed"), {
            response,
            config,
            isAxiosError: true,
          })
        );
      }
    }, 120);
  });

export const installMock = (instance) => {
  instance.defaults.adapter = mockAdapter;
};
export const installGlobalMock = () => {
  axios.defaults.adapter = mockAdapter;
};
