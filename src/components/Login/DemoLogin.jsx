import { useNavigate } from "react-router-dom";
import { roleUser } from "../../demo/db";
import { resetDb } from "../../demo/mockAdapter";
import { DEMO_VENDOR_USER } from "../../demo/vendorMock";
import { startSession } from "../../services/session.service";

const ROLES = [
  { role: "admin", label: "Admin", route: "/admin", icon: "🏢", desc: "Owner view: restaurants, staff, menu, tables, reports" },
  { role: "manager", label: "Manager", route: "/manager", icon: "📋", desc: "Daily operations, tables, staff and sales" },
  { role: "waiter", label: "Waiter", route: "/waiter", icon: "🧑‍🍽️", desc: "Take orders, manage tables, send to billing" },
  { role: "chef", label: "Chef", route: "/chef", icon: "👨‍🍳", desc: "Kitchen queue: accept, prepare, mark ready" },
  { role: "accountant", label: "Accountant", route: "/accountant", icon: "🧾", desc: "Billing, payments and daily sales" },
  { role: "inventory_manager", label: "Inventory Manager", route: "/inventorymanager", icon: "📦", desc: "Stock, suppliers and approvals" },
  { role: "vendor", label: "Vendor", route: "/vendor", icon: "🚚", desc: "Supplier view: products, orders, settlements, negotiations" },
];

export default function DemoLogin() {
  const navigate = useNavigate();

  const enter = (item) => {
    resetDb();
    const user = item.role === "vendor" ? DEMO_VENDOR_USER : roleUser(item.role);
    localStorage.setItem("token", "demo-token");
    localStorage.setItem("user", JSON.stringify(user));
    startSession();
    navigate(item.route, { replace: true });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-900 px-4 py-10">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8 text-center text-white">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-emerald-300">Live Demo</p>
          <h1 className="mt-2 text-3xl font-bold sm:text-4xl">The Grand Bistro</h1>
          <p className="mx-auto mt-3 max-w-xl text-sm text-slate-300">
            Pick a role to explore the full restaurant management system. Everything here uses sample data;
            changes you make are not saved and reset when you refresh.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {ROLES.map((item) => (
            <button
              key={item.role}
              type="button"
              onClick={() => enter(item)}
              className="flex items-start gap-4 rounded-2xl border border-white/10 bg-white/5 p-4 text-left text-white backdrop-blur transition hover:-translate-y-0.5 hover:border-emerald-400/60 hover:bg-white/10"
            >
              <span className="text-3xl">{item.icon}</span>
              <span>
                <span className="block text-base font-semibold">{item.label}</span>
                <span className="mt-1 block text-xs text-slate-300">{item.desc}</span>
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
