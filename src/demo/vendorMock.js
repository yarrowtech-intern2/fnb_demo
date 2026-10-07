// Sample vendor data + mock endpoints for the demo (vendor as a real user).
import { RESTAURANT_ID } from "./db.js";

const now = Date.now();
const day = 86400000;
const iso = (d) => new Date(now - d * day).toISOString();
let seq = 5000;
const nid = (p) => `${p}${++seq}`;

export const DEMO_VENDOR_ID = "ven1";

export const DEMO_VENDOR_USER = {
  id: DEMO_VENDOR_ID,
  _id: DEMO_VENDOR_ID,
  vendorId: "VEN-001",
  name: "Fresh Farms Supplies",
  email: "vendor@demo.com",
  phone: "9876500011",
  role: "vendor",
  vendorType: "global",
};

const REST = {
  _id: RESTAURANT_ID,
  name: "The Grand Bistro",
  restaurantCode: "TGB01",
  address: "12, MG Road, Bengaluru",
  phone: "9999999999",
  gstNo: "29ABCDE1234F1Z5",
};

const prod = (name, category, price, buying, stock, unit, extra = {}) => ({
  id: nid("p"),
  name,
  category,
  description: `${name} - fresh, quality checked`,
  price,
  buyingPrice: buying,
  stock,
  stockUnit: unit,
  unit,
  displayUnit: unit,
  imageUrl: "",
  isForSale: true,
  isListedInMyProducts: true,
  isPriceNegotiable: true,
  lowStockThreshold: 20,
  discountType: "none",
  discountValue: 0,
  orderPackQuantity: 1,
  orderUnitsPerStockUnit: 1,
  ...extra,
});

const mkOrder = (no, days, status, items, paymentStatus = "unpaid", paymentMethod = "") => {
  const lines = items.map(([name, unit, price, quantity]) => ({ name, unit, price, quantity, lineTotal: price * quantity }));
  const id = nid("o");
  return {
    id,
    _id: id,
    orderNo: no,
    restaurant: REST,
    items: lines,
    totalAmount: lines.reduce((s, l) => s + l.lineTotal, 0),
    status,
    paymentStatus,
    paymentMethod,
    settlementStatus: paymentStatus === "paid" ? "settled" : "pending",
    createdAt: iso(days),
    updatedAt: iso(days),
    delivery: {},
  };
};

const build = () => ({
  products: [
    prod("Basmati Rice", "Grains", 95, 78, 400, "kg"),
    prod("Refined Oil", "Oil", 140, 118, 150, "ltr"),
    prod("Paneer", "Dairy", 320, 270, 40, "kg", { lowStockThreshold: 50 }),
    prod("Onion", "Vegetables", 32, 24, 600, "kg"),
    prod("Tomato", "Vegetables", 28, 19, 250, "kg"),
    prod("Chicken (Fresh)", "Meat", 210, 175, 120, "kg"),
    prod("Garam Masala", "Spices", 480, 390, 35, "kg"),
    prod("Milk", "Dairy", 58, 49, 300, "ltr"),
  ],
  orders: [
    mkOrder("VO-1001", 1, "processing", [["Basmati Rice", "kg", 95, 50], ["Refined Oil", "ltr", 140, 20]]),
    mkOrder("VO-1002", 2, "ready", [["Paneer", "kg", 320, 10], ["Milk", "ltr", 58, 40]]),
    mkOrder("VO-1000", 6, "completed", [["Chicken (Fresh)", "kg", 210, 25]], "unpaid"),
    mkOrder("VO-0998", 12, "completed", [["Onion", "kg", 32, 100], ["Tomato", "kg", 28, 60]], "paid", "UPI"),
    mkOrder("VO-0995", 20, "completed", [["Garam Masala", "kg", 480, 5], ["Basmati Rice", "kg", 95, 80]], "paid", "BANK"),
  ],
  settlements: [
    {
      id: nid("s"),
      settlementNo: "SET-2026-014",
      cycle: "15_days",
      periodStart: iso(35),
      periodEnd: iso(20),
      orderCount: 4,
      status: "paid",
      paymentMethod: "BANK",
      totals: { grossAmount: 21400, discountAmount: 400, taxableAmount: 21000, taxAmount: 1050, netPayable: 22050 },
    },
    {
      id: nid("s"),
      settlementNo: "SET-2026-015",
      cycle: "15_days",
      periodStart: iso(20),
      periodEnd: iso(5),
      orderCount: 3,
      status: "pending",
      paymentMethod: "",
      totals: { grossAmount: 9060, discountAmount: 0, taxableAmount: 9060, taxAmount: 453, netPayable: 9513 },
    },
  ],
  negotiations: [
    {
      id: nid("n"),
      product: { name: "Paneer" },
      productName: "Paneer",
      restaurant: REST,
      status: "open",
      messages: [
        { _id: nid("m"), senderRole: "admin", offeredPrice: 290, text: "Can you do Rs 290/kg for 50 kg monthly?", createdAt: iso(1) },
      ],
    },
    {
      id: nid("n"),
      product: { name: "Basmati Rice" },
      productName: "Basmati Rice",
      restaurant: REST,
      status: "accepted",
      messages: [
        { _id: nid("m"), senderRole: "admin", offeredPrice: 90, text: "Bulk order of 500 kg, Rs 90?", createdAt: iso(5) },
        { _id: nid("m"), senderRole: "vendor", offeredPrice: 92, text: "Best we can do is Rs 92.", createdAt: iso(4) },
      ],
    },
  ],
  vendors: [
    { id: DEMO_VENDOR_ID, vendorId: "VEN-001", name: "Fresh Farms Supplies", email: "vendor@demo.com", phone: "9876500011", category: "Grocery", vendorType: "global", loginAccess: "required", isActive: true, governmentId: "29AAAAA0000A1Z5", governmentIdType: "GST", address: { city: "Bengaluru" }, primaryRestaurant: REST, accessibleRestaurants: [REST] },
    { id: "ven2", vendorId: "VEN-002", name: "Local Dairy Co-op", email: "dairy@example.com", phone: "9876500022", category: "Dairy", vendorType: "local", loginAccess: "required", isActive: true, governmentId: "AADHAAR-1234", governmentIdType: "Aadhaar", address: { city: "Bengaluru" }, primaryRestaurant: REST, accessibleRestaurants: [REST] },
    { id: "ven3", vendorId: "VEN-003", name: "Ramesh Vegetables", email: "", phone: "9876500033", category: "Vegetables", vendorType: "local", loginAccess: "not_required", isActive: true, governmentId: "PAN-ABCDE1234F", governmentIdType: "PAN", address: { city: "Bengaluru" }, primaryRestaurant: REST, accessibleRestaurants: [REST] },
  ],
});

let state = build();
export const resetVendorDb = () => {
  state = build();
};

const mkPlan = (code, name, sortOrder, monthlyPrice, tagline, badgeLabel, restaurantLimitLabel, includedFeatures, excludedFeatures, isPopular = false) => ({
  code,
  name,
  sortOrder,
  monthlyPrice,
  priceDisplay: `Rs ${monthlyPrice} / month`,
  tagline,
  description: tagline,
  badgeLabel,
  restaurantLimitLabel,
  isPopular,
  includedFeatures,
  excludedFeatures,
  featureSummary: includedFeatures,
});

const PLANS = [
  mkPlan("BASIC_VENDOR", "Basic", 1, 499, "Start selling to restaurants", "Starter Access", "Up to 3 restaurants",
    ["My Products & Inventory", "Order management", "Price negotiations"],
    ["Account & settlements", "Analytics", "Reports"]),
  mkPlan("PRO_VENDOR", "Pro", 2, 999, "Grow with insights", "Growth Access", "Up to 10 restaurants",
    ["Everything in Basic", "Accounts & settlements", "Analytics & Reports"],
    ["Unlimited restaurant coverage"], true),
  mkPlan("BUSINESS_VENDOR", "Business", 3, 1999, "Full supplier toolkit", "Full Access", "Unlimited restaurants",
    ["Everything in Pro", "Unlimited restaurant coverage", "Priority support"], []),
];
const SUBSCRIPTION = {
  status: "active",
  planCode: "BUSINESS_VENDOR",
  plan: PLANS[2],
  startedAt: iso(30),
  expiryDate: new Date(now + 335 * day).toISOString(),
  scheduledPlanCode: "",
};

export function registerVendorRoutes(on, { ok, fail, clone }) {
  const find = (list, id) => list.find((x) => x.id === id || x._id === id);

  /* ----- vendor self ----- */
  on("GET", "/vendor/me", () => ok({ success: true, vendor: clone(state.vendors[0]) }));
  on("GET", "/vendor/dashboard-scope", () =>
    ok({ success: true, scope: { restaurants: [REST], vendorType: "global" } })
  );
  on("GET", "/vendor/orders/history", () => ok({ success: true, orders: clone(state.orders) }));
  on("GET", "/vendor/explore/global", () => ok({ success: true, vendors: clone(state.vendors.filter((v) => v.vendorType === "global")) }));
  on("GET", "/vendor/explore/global/:id/products", () => ok({ success: true, products: clone(state.products) }));
  on("POST", "/vendor/upgrade-request", () => ok({ success: true, message: "Upgrade request submitted", vendor: clone(state.vendors[0]) }));
  on("GET", "/vendor-subscriptions/status", () => ok({ success: true, subscription: SUBSCRIPTION }));
  on("GET", "/vendor-subscriptions/me", () =>
    ok({ success: true, subscription: SUBSCRIPTION, plans: PLANS, status: "active" })
  );
  on("POST", "/vendor-subscriptions/me/order", () =>
    ok({ success: true, freeActivation: true, message: "Plan updated successfully", vendor: clone(state.vendors[0]) })
  );

  /* ----- admin: vendor list / CRUD ----- */
  on("GET", "/vendor", () => ok({ success: true, vendors: clone(state.vendors) }));
  on("POST", "/vendor/local", (r) => {
    const v = {
      id: nid("ven"),
      vendorId: `VEN-${String(state.vendors.length + 1).padStart(3, "0")}`,
      vendorType: "local",
      isActive: true,
      primaryRestaurant: REST,
      accessibleRestaurants: [REST],
      ...r.body,
    };
    delete v.password;
    state.vendors.push(v);
    return ok({ success: true, vendor: clone(v) }, 201);
  });
  on("PUT", "/vendor/:id/reset-password", () => ok({ success: true }));
  on("POST", "/vendor/:id/connect", () => ok({ success: true }));

  /* ----- products ----- */
  on("GET", "/vendor/:id/products", () => ok({ success: true, products: clone(state.products) }));
  on("POST", "/vendor/:id/products", (r) => {
    const p = { ...prod(r.body.name || "New Product", r.body.category || "General", 0, 0, 0, "kg"), ...r.body, id: nid("p") };
    state.products.unshift(p);
    return ok({ success: true, product: clone(p) }, 201);
  });
  on("PUT", "/vendor/:id/products/:pid", (r) => {
    const p = find(state.products, r.p.pid);
    if (!p) return fail(404, "Product not found");
    Object.assign(p, r.body);
    return ok({ success: true, product: clone(p) });
  });
  on("DELETE", "/vendor/:id/products/:pid", (r) => {
    state.products = state.products.filter((p) => p.id !== r.p.pid);
    return ok({ success: true });
  });

  /* ----- orders ----- */
  const orders = () => ok({ success: true, orders: clone(state.orders) });
  on("GET", "/vendor/:id/orders", orders);
  on("POST", "/vendor/:id/orders", () => ok({ success: true }, 201));
  on("PUT", "/vendor/:id/orders/:oid/status", (r) => {
    const o = find(state.orders, r.p.oid);
    if (!o) return fail(404, "Order not found");
    o.status = r.body.status;
    o.updatedAt = new Date().toISOString();
    return orders();
  });
  on("PUT", "/vendor/:id/orders/:oid/bill", (r) => {
    const o = find(state.orders, r.p.oid);
    if (o) o.billGeneratedAt = new Date().toISOString();
    return orders();
  });
  on("PUT", "/vendor/:id/orders/:oid/payment", (r) => {
    const o = find(state.orders, r.p.oid);
    if (o) {
      o.paymentStatus = "paid";
      o.paymentMethod = r.body.paymentMethod || "CASH";
      o.paidAt = new Date().toISOString();
      o.settlementStatus = "settled";
    }
    return orders();
  });
  on("POST", "/vendor/:id/orders/:oid/send-email", () => ok({ success: true }));

  /* ----- settlements ----- */
  on("GET", "/vendor/:id/settlements", () => ok({ success: true, settlements: clone(state.settlements) }));
  on("POST", "/vendor/:id/settlements", () => {
    const s = {
      id: nid("s"),
      settlementNo: `SET-2026-${String(state.settlements.length + 14).padStart(3, "0")}`,
      cycle: "manual",
      periodStart: iso(5),
      periodEnd: iso(0),
      orderCount: 1,
      status: "pending",
      paymentMethod: "",
      totals: { grossAmount: 5250, discountAmount: 0, taxableAmount: 5250, taxAmount: 262, netPayable: 5512 },
    };
    state.settlements.unshift(s);
    return ok({ success: true, settlement: clone(s) }, 201);
  });
  on("PUT", "/vendor/:id/settlements/:sid/pay", (r) => {
    const s = find(state.settlements, r.p.sid);
    if (s) {
      s.status = "paid";
      s.paymentMethod = r.body?.paymentMethod || "BANK";
    }
    return ok({ success: true, settlement: clone(s || {}) });
  });

  /* ----- negotiations ----- */
  on("GET", "/vendor/:id/price-negotiations", () => ok({ success: true, negotiations: clone(state.negotiations) }));
  on("POST", "/vendor/:id/price-negotiations/:nid/reply", (r) => {
    const n = find(state.negotiations, r.p.nid);
    if (!n) return fail(404, "Negotiation not found");
    n.messages.push({
      _id: nid("m"),
      senderRole: "vendor",
      offeredPrice: r.body.offeredPrice ?? null,
      text: r.body.message || r.body.text || (r.body.action === "accept" ? "Offer accepted." : ""),
      createdAt: new Date().toISOString(),
    });
    if (r.body.action === "accept") n.status = "accepted";
    return ok({ success: true, negotiation: clone(n) });
  });
  on("GET", "/vendor/:id/inventory-links", () => ok({ success: true, links: [] }));

  /* ----- generic vendor record (keep after the specific /vendor/:id/... routes) ----- */
  on("GET", "/vendor/:id", (r) => ok({ success: true, vendor: clone(find(state.vendors, r.p.id) || state.vendors[0]) }));
  on("PUT", "/vendor/:id", (r) => {
    const v = find(state.vendors, r.p.id);
    if (!v) return fail(404, "Vendor not found");
    Object.assign(v, r.body);
    return ok({ success: true, vendor: clone(v) });
  });
  on("DELETE", "/vendor/:id", (r) => {
    state.vendors = state.vendors.filter((v) => v.id !== r.p.id);
    return ok({ success: true });
  });
}
