import React, { useMemo, useState } from "react";

const RESTAURANTS = ["testrestaurent", "Spice Garden", "Urban Tadka"];

const SEED = [
  { id: 1, restaurant: "testrestaurent", customer: "Anonymous", bill: "Bill 70", overall: 4, service: 4, ambiance: 4, food: 5, date: "2026-09-28", comment: "Great food, service was prompt." },
  { id: 2, restaurant: "testrestaurent", customer: "Rohit Sharma", bill: "Bill 74", overall: 5, service: 5, ambiance: 4, food: 5, date: "2026-10-02", comment: "Butter chicken was outstanding!" },
  { id: 3, restaurant: "testrestaurent", customer: "Priya Das", bill: "Bill 81", overall: 3, service: 3, ambiance: 4, food: 3, date: "2026-10-05", comment: "Tables took a while to clean." },
  { id: 4, restaurant: "Spice Garden", customer: "Neha Gupta", bill: "Bill 12", overall: 5, service: 5, ambiance: 5, food: 4, date: "2026-10-03", comment: "Lovely ambience for family dinner." },
  { id: 5, restaurant: "Urban Tadka", customer: "Amit Verma", bill: "Bill 33", overall: 2, service: 2, ambiance: 3, food: 2, date: "2026-10-01", comment: "Biryani was cold when served." },
];

const RANGES = { "All Time": null, "Last 7 Days": 7, "Last 30 Days": 30 };
const FORM_FIELDS = ["Overall", "Service", "Ambiance", "Food Quality", "Comments"];

const card = "rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-neutral-700 dark:bg-neutral-800";
const ctl = "rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium shadow-sm dark:border-neutral-600 dark:bg-neutral-800";

const Stars = ({ n }) => (
  <span className="whitespace-nowrap text-yellow-400">
    {"★".repeat(n)}
    <span className="text-gray-300 dark:text-neutral-600">{"★".repeat(5 - n)}</span>
  </span>
);

const fmt = (d) => new Date(d).toLocaleDateString("en-GB");
const avg = (rows, k) => (rows.length ? Math.round((rows.reduce((s, r) => s + r[k], 0) / rows.length) * 10) / 10 : 0);

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className={`${card} w-full max-w-md p-6`} onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold">{title}</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800">✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

export default function AdminFeedback() {
  const [restaurant, setRestaurant] = useState(RESTAURANTS[0]);
  const [range, setRange] = useState("All Time");
  const [view, setView] = useState(null);
  const [customize, setCustomize] = useState(false);
  const [enabled, setEnabled] = useState(new Set(FORM_FIELDS));

  const rows = useMemo(() => {
    const days = RANGES[range];
    const cutoff = days ? Date.now() - days * 864e5 : 0;
    return SEED.filter((r) => r.restaurant === restaurant && (!days || new Date(r.date).getTime() >= cutoff));
  }, [restaurant, range]);

  const stats = [
    ["Total Feedback", rows.length, false],
    ["Overall", avg(rows, "overall"), true],
    ["Service", avg(rows, "service"), true],
    ["Ambiance", avg(rows, "ambiance"), true],
  ];

  const toggle = (f) =>
    setEnabled((prev) => {
      const next = new Set(prev);
      next.has(f) ? next.delete(f) : next.add(f);
      return next;
    });

  return (
    <div className="space-y-5 text-gray-800 dark:text-gray-100">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <select value={restaurant} onChange={(e) => setRestaurant(e.target.value)} className={`${ctl} min-w-[240px] border-2 border-green-500`}>
          {RESTAURANTS.map((r) => <option key={r}>{r}</option>)}
        </select>
        <div className="flex gap-3">
          <select value={range} onChange={(e) => setRange(e.target.value)} className={ctl}>
            {Object.keys(RANGES).map((r) => <option key={r}>{r}</option>)}
          </select>
          <button onClick={() => setCustomize(true)} className={ctl}>Customize Form</button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map(([label, value, star]) => (
          <div key={label} className={`${card} p-5`}>
            <p className="text-xs font-semibold uppercase text-gray-500">{label}</p>
            <p className="mt-3 text-3xl font-bold">
              {value}
              {star && <span className="ml-1 text-xl text-yellow-400">★</span>}
            </p>
          </div>
        ))}
      </div>

      <div className={`${card} overflow-x-auto`}>
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-3 text-xs font-semibold uppercase text-gray-500 dark:border-neutral-700">
          <span>Customer</span>
          <span className="flex gap-6"><span>Rating</span><span className="mr-14">Date</span></span>
        </div>
        {rows.length === 0 && <p className="p-6 text-sm text-gray-500">No feedback for this period.</p>}
        {rows.map((r) => (
          <div key={r.id} className="flex items-center justify-between border-b border-gray-100 px-5 py-4 last:border-0 dark:border-neutral-700">
            <div>
              <p className="font-medium">{r.customer}</p>
              <p className="text-xs text-gray-500">{r.bill}</p>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <Stars n={r.overall} />
              <span className="text-gray-500">{fmt(r.date)}</span>
              <button onClick={() => setView(r)} className="font-semibold text-green-600">View →</button>
            </div>
          </div>
        ))}
      </div>

      {view && (
        <Modal title={`${view.customer} · ${view.bill}`} onClose={() => setView(null)}>
          <div className="space-y-2 text-sm">
            {[["Overall", view.overall], ["Service", view.service], ["Ambiance", view.ambiance], ["Food Quality", view.food]]
              .filter(([l]) => enabled.has(l))
              .map(([l, n]) => (
                <div key={l} className="flex justify-between"><span>{l}</span><Stars n={n} /></div>
              ))}
            {enabled.has("Comments") && <p className="mt-3 rounded-lg bg-gray-50 p-3 dark:bg-neutral-900">{view.comment}</p>}
            <p className="pt-2 text-xs text-gray-500">{fmt(view.date)}</p>
          </div>
        </Modal>
      )}

      {customize && (
        <Modal title="Customize Feedback Form" onClose={() => setCustomize(false)}>
          <p className="mb-3 text-sm text-gray-500">Choose which questions customers see.</p>
          <div className="space-y-2">
            {FORM_FIELDS.map((f) => (
              <label key={f} className="flex items-center gap-3 text-sm">
                <input type="checkbox" checked={enabled.has(f)} onChange={() => toggle(f)} className="accent-green-600" />
                {f}
              </label>
            ))}
          </div>
          <button onClick={() => setCustomize(false)} className="mt-5 w-full rounded-xl bg-green-600 py-2.5 text-sm font-semibold text-white">Save</button>
        </Modal>
      )}
    </div>
  );
}
