// In-memory sample database for the client demo. Nothing is persisted:
// a page refresh restores this data.

const now = Date.now();
const mins = (m) => new Date(now - m * 60000).toISOString();
let seq = 1000;
export const uid = (p = "id") => `${p}${++seq}`;

export const RESTAURANT_ID = "rest1";

const restaurant = {
  _id: RESTAURANT_ID,
  name: "The Grand Bistro",
  restaurantCode: "TGB01",
  address: "12, MG Road, Bengaluru",
  phone: "9999999999",
  gstNo: "29ABCDE1234F1Z5",
  restaurantType: "HYBRID",
  isActive: true,
  billingStartNumber: 1,
  nextBillNumber: 25,
  createdAt: mins(60 * 24 * 90),
};

const emp = (id, name, role, code) => ({
  _id: id,
  id,
  employeeId: `TGB01-${code}-001`,
  name,
  role,
  email: `${role.toLowerCase()}@demo.com`,
  phone: "9888888888",
  isActive: true,
  restaurant,
  restaurantId: RESTAURANT_ID,
  createdAt: mins(60 * 24 * 60),
});

export const buildDb = () => {
  const employees = [
    emp("e_mgr", "Aditya Rao", "MANAGER", "MGR"),
    emp("e_wtr", "Meera Nair", "WAITER", "WTR"),
    emp("e_wtr2", "Karan Shah", "WAITER", "WTR2"),
    emp("e_chf", "Rohit Verma", "CHEF", "CHF"),
    emp("e_suc", "Sana Iqbal", "SUCHEF", "SUC"),
    emp("e_acc", "Neha Kapoor", "ACCOUNTANT", "ACC"),
    emp("e_inv", "Vikram Singh", "INVENTORY_MANAGER", "INV"),
    emp("e_cln", "Ramesh Kumar", "CLEANER", "CLN"),
  ];

  const kitchenSections = [
    { _id: "ks1", name: "Indian", restaurant: RESTAURANT_ID },
    { _id: "ks2", name: "Chinese", restaurant: RESTAURANT_ID },
    { _id: "ks3", name: "Beverages", restaurant: RESTAURANT_ID },
    { _id: "ks4", name: "Desserts", restaurant: RESTAURANT_ID },
  ];
  const ks = (id) => kitchenSections.find((k) => k._id === id);

  const mk = (id, code, name, price, sec, course, desc) => ({
    _id: id, menuCode: code, name, price, cuisine: ks(sec), courseType: course,
    description: desc, isAvailable: true, restaurant: RESTAURANT_ID,
  });
  const menu = [
    mk("mn1", "PT01", "Paneer Tikka", 220, "ks1", "Starter", "Char-grilled cottage cheese"),
    mk("mn2", "VB01", "Veg Biryani", 210, "ks1", "Main Course", "Fragrant basmati rice"),
    mk("mn3", "BN01", "Butter Naan", 45, "ks1", "Main Course", "Soft tandoor bread"),
    mk("mn4", "DM01", "Dal Makhani", 190, "ks1", "Main Course", "Slow cooked black lentils"),
    mk("mn5", "MC01", "Manchow Soup", 120, "ks2", "Starter", "Spicy vegetable soup"),
    mk("mn6", "HN01", "Hakka Noodles", 170, "ks2", "Main Course", "Wok tossed noodles"),
    mk("mn7", "CC01", "Cold Coffee", 90, "ks3", "Beverage", "Chilled and creamy"),
    mk("mn8", "LM01", "Fresh Lime Soda", 70, "ks3", "Beverage", "Sweet or salted"),
    mk("mn9", "GJ01", "Gulab Jamun", 80, "ks4", "Dessert", "Warm, with syrup"),
    mk("mn10", "BR01", "Brownie", 130, "ks4", "Dessert", "With vanilla ice cream"),
  ];

  const T = (id, n, cap, zone, x, y, shape = "square", rot = 0, status = "available") => ({
    _id: id, restaurant: RESTAURANT_ID, tableNumber: n, capacity: cap, status, zone,
    layout: { x, y, shape, rotation: rot }, occupiedAt: null,
    reservation: { customerName: "", phone: "", partySize: null, reservedFor: null, notes: "" },
    mergedWith: [], mergedGroupId: null, isMergePrimary: false, createdAt: mins(60 * 24 * 30),
  });
  const tables = [
    T("t1", 1, 2, "Main Hall", 8, 12, "round", 0, "occupied"),
    T("t2", 2, 2, "Main Hall", 8, 32, "round"),
    T("t3", 3, 4, "Main Hall", 26, 12),
    T("t4", 4, 4, "Main Hall", 26, 32, "square", 0, "occupied"),
    T("t5", 5, 6, "Main Hall", 46, 16, "rect"),
    T("t6", 6, 4, "Main Hall", 68, 12, "square", 45),
    T("t7", 7, 2, "Main Hall", 68, 32, "round", 0, "reserved"),
    T("t8", 8, 4, "Terrace", 20, 20),
    T("t9", 9, 2, "Terrace", 45, 20, "round"),
    T("t10", 10, 8, "Terrace", 70, 24, "rect"),
  ];
  tables[0].occupiedAt = mins(42);
  tables[3].occupiedAt = mins(15);
  tables[6].reservation = { customerName: "Priya Sharma", phone: "9876543210", partySize: 2, reservedFor: new Date(now + 90 * 60000).toISOString(), notes: "" };

  const item = (mid, qty, status = "PENDING") => {
    const m = menu.find((x) => x._id === mid);
    return { _id: uid("oi"), menuItem: m, name: m.name, quantity: qty, price: m.price, status };
  };
  const orders = [
    {
      _id: "o1", orderNo: "ORD-1042", restaurant: RESTAURANT_ID, table: "t1", tableNumber: 1, orderType: "DINE_IN",
      waiter: { _id: "e_wtr", name: "Meera Nair", employeeId: "TGB01-WTR-001" }, chef: null,
      items: [item("mn1", 1, "PREPARING"), item("mn3", 3, "PREPARING")], status: "PREPARING",
      createdAt: mins(42), tableChangeHistory: [],
    },
    {
      _id: "o2", orderNo: "ORD-1043", restaurant: RESTAURANT_ID, table: "t4", tableNumber: 4, orderType: "DINE_IN",
      waiter: { _id: "e_wtr", name: "Meera Nair", employeeId: "TGB01-WTR-001" }, chef: null,
      items: [item("mn2", 2), item("mn7", 2)], status: "PENDING",
      createdAt: mins(15), tableChangeHistory: [],
    },
    {
      _id: "o3", orderNo: "ORD-1041", restaurant: RESTAURANT_ID, table: "t3", tableNumber: 3, orderType: "DINE_IN",
      waiter: { _id: "e_wtr2", name: "Karan Shah", employeeId: "TGB01-WTR2-001" }, chef: { _id: "e_chf", name: "Rohit Verma" },
      items: [item("mn4", 1, "SERVED"), item("mn9", 2, "SERVED")], status: "PAID",
      createdAt: mins(180), paidAt: mins(120), tableChangeHistory: [],
    },
  ];

  return {
    restaurants: [restaurant],
    employees,
    kitchenSections,
    menu,
    tables,
    orders,
    floorMarkers: [
      { _id: "m1", restaurant: RESTAURANT_ID, type: "entrance", label: "Entrance", zone: "Main Hall", layout: { x: 2, y: 2, width: 10 } },
      { _id: "m2", restaurant: RESTAURANT_ID, type: "kitchen", label: "Kitchen", zone: "Main Hall", layout: { x: 84, y: 2, width: 12 } },
      { _id: "m3", restaurant: RESTAURANT_ID, type: "bar", label: "Bar", zone: "Terrace", layout: { x: 2, y: 2, width: 8 } },
    ],
    zoneSettings: [
      { restaurant: RESTAURANT_ID, zone: "Main Hall", widthFt: 50, heightFt: 30, backgroundImageUrl: "", backgroundOpacity: 0.6 },
      { restaurant: RESTAURANT_ID, zone: "Terrace", widthFt: 30, heightFt: 20, backgroundImageUrl: "", backgroundOpacity: 0.6 },
    ],
    bills: [],
  };
};

export const DEMO_ADMIN = {
  id: "admin1", _id: "admin1", adminId: "TGB-ADM-001", email: "owner@grandbistro.demo",
  businessName: "The Grand Bistro", role: "admin",
};

export const roleUser = (role) => {
  if (role === "admin") return DEMO_ADMIN;
  const found = buildDb().employees.find((e) => e.role.toLowerCase() === role.toLowerCase());
  return {
    id: found._id, employeeId: found.employeeId, name: found.name, role: found.role.toLowerCase(),
    restaurant: { _id: RESTAURANT_ID, name: restaurant.name, restaurantType: "HYBRID" },
    restaurantId: RESTAURANT_ID, restaurantName: restaurant.name, restaurantType: "HYBRID",
  };
};
