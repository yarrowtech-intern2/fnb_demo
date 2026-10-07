import React, { useMemo, useState } from "react";

const RESTAURANTS = ["testrestaurent", "Spice Garden", "Urban Tadka"];

const CUSTOMERS = [
  { id: 1, restaurant: "testrestaurent", name: "Guest", email: "guytech2003@gmail.com", phone: "98300 11122", visits: 1, spend: 0, rating: 4, last: "2026-07-30" },
  { id: 2, restaurant: "testrestaurent", name: "Rohit Sharma", email: "rohit@example.com", phone: "98310 22233", visits: 14, spend: 18450, rating: 5, last: "2026-10-05" },
  { id: 3, restaurant: "testrestaurent", name: "Priya Das", email: "priya@example.com", phone: "98320 33344", visits: 8, spend: 9200, rating: 4, last: "2026-10-02" },
  { id: 4, restaurant: "Spice Garden", name: "Neha Gupta", email: "neha@example.com", phone: "98330 44455", visits: 21, spend: 31800, rating: 5, last: "2026-10-03" },
  { id: 5, restaurant: "Urban Tadka", name: "Amit Verma", email: "amit@example.com", phone: "98340 55566", visits: 3, spend: 3100, rating: 2, last: "2026-10-01" },
];

const TABS = ["Customers", "Campaigns", "Loyalty & Coupons"];

const card = "rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-neutral-700 dark:bg-neutral-800";
const ctl = "rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm shadow-sm dark:border-neutral-600 dark:bg-neutral-800";
const fmt = (d) => new Date(d).toLocaleDateString("en-GB");
const money = (n) => `₹${n.toLocaleString("en-IN")}`;

const Stars = ({ n }) => (
  <span className="whitespace-nowrap text-yellow-400">
    {"★".repeat(n)}
    <span className="text-gray-300 dark:text-neutral-600">{"★".repeat(5 - n)}</span>
  </span>
);

export default function AdminCRM() {
  const [restaurant, setRestaurant] = useState(RESTAURANTS[0]);
  const [tab, setTab] = useState("Customers");
  const [q, setQ] = useState("");

  const [campaigns, setCampaigns] = useState([
    { id: 1, name: "Weekend Brunch Offer", channel: "SMS", audience: "All customers", status: "Sent", sent: 120 },
    { id: 2, name: "Festive Greetings", channel: "Email", audience: "Repeat customers", status: "Scheduled", sent: 0 },
  ]);
  const [cForm, setCForm] = useState({ name: "", channel: "SMS", audience: "All customers" });

  const [coupons, setCoupons] = useState([
    { id: 1, code: "WELCOME10", label: "10% off", uses: 42, active: true },
    { id: 2, code: "FESTIVE200", label: "₹200 off", uses: 17, active: true },
    { id: 3, code: "LUNCH15", label: "15% off", uses: 63, active: false },
  ]);
  const [kForm, setKForm] = useState({ code: "", label: "" });
  const [points, setPoints] = useState(1);

  const rows = useMemo(
    () =>
      CUSTOMERS.filter(
        (c) => c.restaurant === restaurant && (c.name + c.email + c.phone).toLowerCase().includes(q.toLowerCase())
      ),
    [restaurant, q]
  );
  const revenue = rows.reduce((s, c) => s + c.spend, 0);

  const addCampaign = () => {
    if (!cForm.name.trim()) return;
    setCampaigns([{ id: Date.now(), ...cForm, status: "Scheduled", sent: 0 }, ...campaigns]);
    setCForm({ ...cForm, name: "" });
  };
  const sendCampaign = (id) =>
    setCampaigns((p) => p.map((c) => (c.id === id ? { ...c, status: "Sent", sent: rows.length * 40 } : c)));
  const addCoupon = () => {
    if (!kForm.code.trim()) return;
    setCoupons([{ id: Date.now(), code: kForm.code.trim().toUpperCase(), label: kForm.label || "Offer", uses: 0, active: true }, ...coupons]);
    setKForm({ code: "", label: "" });
  };
  const toggleCoupon = (id) => setCoupons((p) => p.map((c) => (c.id === id ? { ...c, active: !c.active } : c)));

  return (
    <div className="space-y-5 text-gray-800 dark:text-gray-100">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <select value={restaurant} onChange={(e) => setRestaurant(e.target.value)} className={`${ctl} min-w-[240px] border-2 border-green-500 font-medium`}>
          {RESTAURANTS.map((r) => <option key={r}>{r}</option>)}
        </select>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name, phone, or email" className={`${ctl} w-full sm:w-96`} />
      </div>

      <div className={`${card} inline-flex gap-1 p-1.5`}>
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-xl px-4 py-2 text-sm font-semibold ${tab === t ? "bg-green-600 text-white" : "hover:bg-gray-100 dark:hover:bg-neutral-700"}`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "Customers" && (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className={`${card} p-5`}>
              <p className="text-xs font-semibold uppercase text-gray-500">Total Customers</p>
              <p className="mt-3 text-3xl font-bold">{rows.length}</p>
            </div>
            <div className={`${card} p-5`}>
              <p className="text-xs font-semibold uppercase text-gray-500">Total Revenue Tracked</p>
              <p className="mt-3 text-3xl font-bold">{money(revenue)}</p>
            </div>
          </div>
          <div className={`${card} overflow-x-auto`}>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left text-xs font-semibold uppercase text-gray-500 dark:border-neutral-700">
                  <th className="px-5 py-3">Customer</th>
                  <th className="px-3 py-3 text-right">Visits</th>
                  <th className="px-3 py-3 text-right">Spend</th>
                  <th className="px-3 py-3">Rating</th>
                  <th className="px-5 py-3 text-right">Last Visit</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((c) => (
                  <tr key={c.id} className="border-b border-gray-100 last:border-0 dark:border-neutral-700">
                    <td className="px-5 py-4">
                      <p className="font-medium">{c.name}</p>
                      <p className="text-xs text-gray-500">{c.email}</p>
                    </td>
                    <td className="px-3 text-right">{c.visits}</td>
                    <td className="px-3 text-right">{money(c.spend)}</td>
                    <td className="px-3"><Stars n={c.rating} /></td>
                    <td className="px-5 text-right text-gray-500">{fmt(c.last)}</td>
                  </tr>
                ))}
                {rows.length === 0 && <tr><td colSpan={5} className="p-6 text-gray-500">No customers found.</td></tr>}
              </tbody>
            </table>
          </div>
        </>
      )}

      {tab === "Campaigns" && (
        <>
          <div className={`${card} flex flex-wrap gap-3 p-4`}>
            <input className={`${ctl} flex-1`} placeholder="Campaign name" value={cForm.name} onChange={(e) => setCForm({ ...cForm, name: e.target.value })} />
            <select className={ctl} value={cForm.channel} onChange={(e) => setCForm({ ...cForm, channel: e.target.value })}>
              <option>SMS</option><option>Email</option><option>WhatsApp</option>
            </select>
            <select className={ctl} value={cForm.audience} onChange={(e) => setCForm({ ...cForm, audience: e.target.value })}>
              <option>All customers</option><option>Repeat customers</option><option>Inactive 30+ days</option>
            </select>
            <button onClick={addCampaign} className="rounded-xl bg-green-600 px-5 py-2.5 text-sm font-semibold text-white">Create</button>
          </div>
          <div className={card}>
            {campaigns.map((c) => (
              <div key={c.id} className="flex items-center justify-between border-b border-gray-100 px-5 py-4 last:border-0 dark:border-neutral-700">
                <div>
                  <p className="font-medium">{c.name}</p>
                  <p className="text-xs text-gray-500">{c.channel} · {c.audience}{c.sent ? ` · ${c.sent} delivered` : ""}</p>
                </div>
                {c.status === "Sent" ? (
                  <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">Sent</span>
                ) : (
                  <button onClick={() => sendCampaign(c.id)} className="text-sm font-semibold text-green-600">Send now →</button>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      {tab === "Loyalty & Coupons" && (
        <>
          <div className={`${card} flex flex-wrap items-center gap-3 p-4 text-sm`}>
            <span className="font-semibold">Loyalty points:</span>
            <span>Earn</span>
            <input type="number" min={1} value={points} onChange={(e) => setPoints(Number(e.target.value) || 1)} className={`${ctl} w-20`} />
            <span>point per ₹100 spent</span>
          </div>
          <div className={`${card} flex flex-wrap gap-3 p-4`}>
            <input className={ctl} placeholder="CODE" value={kForm.code} onChange={(e) => setKForm({ ...kForm, code: e.target.value })} />
            <input className={`${ctl} flex-1`} placeholder="Description e.g. 10% off" value={kForm.label} onChange={(e) => setKForm({ ...kForm, label: e.target.value })} />
            <button onClick={addCoupon} className="rounded-xl bg-green-600 px-5 py-2.5 text-sm font-semibold text-white">Add Coupon</button>
          </div>
          <div className={card}>
            {coupons.map((c) => (
              <div key={c.id} className={`flex items-center justify-between border-b border-gray-100 px-5 py-4 last:border-0 dark:border-neutral-700 ${c.active ? "" : "opacity-60"}`}>
                <div>
                  <p className="font-bold tracking-wide">{c.code}</p>
                  <p className="text-xs text-gray-500">{c.label} · {c.uses} redemptions</p>
                </div>
                <button onClick={() => toggleCoupon(c.id)} className="text-sm font-semibold text-green-600">{c.active ? "Deactivate" : "Activate"}</button>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
