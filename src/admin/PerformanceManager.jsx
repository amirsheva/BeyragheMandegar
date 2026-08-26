import { useEffect, useState } from "react";
import {
  createPerformance,
  deletePerformance,
  getPerformances,
  updatePerformance,
} from "./api/performanceApi";
import { getShows } from "./api/showApi";

const emptyForm = {
  production_id: "",
  date: "1405/08/01",
  time: "20:00",
  capacity: 300,
  status: "active",
  booking_enabled: true,
  label: "",
};

export default function PerformanceManager() {
  const [items, setItems] = useState([]);
  const [productions, setProductions] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const [performancesData, productionsData] = await Promise.all([
        getPerformances(),
        getShows(),
      ]);
      setItems(performancesData);
      setProductions(productionsData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function startCreate() {
    setEditingId(null);
    setForm({
      ...emptyForm,
      production_id: productions[0]?.id ? String(productions[0].id) : "",
    });
    setError("");
    setFormOpen(true);
  }

  function startEdit(item) {
    setEditingId(item.id);
    setForm({
      production_id: String(item.production_id || ""),
      date: item.date || "",
      time: item.time || "20:00",
      capacity: Number(item.capacity || 300),
      status: item.status || "active",
      booking_enabled: Boolean(item.booking_enabled),
      label: item.label || "",
    });
    setError("");
    setFormOpen(true);
  }

  async function submit(e) {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      const payload = {
        ...form,
        production_id: Number(form.production_id),
        capacity: Number(form.capacity),
      };

      if (editingId) {
        await updatePerformance(editingId, payload);
      } else {
        await createPerformance(payload);
      }

      setFormOpen(false);
      setEditingId(null);
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function remove(item) {
    if (!window.confirm(`اجرای ${item.label || item.date} حذف شود؟ رزروهای وابسته هم حذف می‌شوند.`)) {
      return;
    }

    setError("");
    try {
      await deletePerformance(item.id);
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function toggleBooking(item) {
    setError("");
    try {
      await updatePerformance(item.id, {
        booking_enabled: !item.booking_enabled,
      });
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div dir="rtl">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-bold">مدیریت اجراها</h2>
          <p className="text-white/50 mt-2">تاریخ، ساعت، ظرفیت و وضعیت رزرو هر اجرا</p>
        </div>

        <button
          type="button"
          onClick={startCreate}
          disabled={productions.length === 0}
          className="bg-[#d4af37] disabled:opacity-40 text-black font-bold px-5 py-3 rounded-xl"
        >
          + اجرای جدید
        </button>
      </div>

      {error && (
        <div className="mb-5 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-red-200">
          {error}
        </div>
      )}

      {formOpen && (
        <form
          onSubmit={submit}
          className="mb-8 bg-[#111] border border-[#d4af37]/20 rounded-2xl p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold">
              {editingId ? "ویرایش اجرا" : "ثبت اجرای جدید"}
            </h3>
            <button
              type="button"
              onClick={() => setFormOpen(false)}
              className="text-white/50 hover:text-white"
            >
              بستن
            </button>
          </div>

          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
            <Field label="نمایش">
              <select
                required
                value={form.production_id}
                onChange={(e) => setForm({ ...form, production_id: e.target.value })}
                className="input"
              >
                <option value="">انتخاب نمایش</option>
                {productions.map((production) => (
                  <option key={production.id} value={production.id}>
                    {production.title}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="تاریخ">
              <input
                required
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                className="input"
                placeholder="1405/08/01"
                dir="ltr"
              />
            </Field>

            <Field label="ساعت">
              <input
                required
                type="time"
                value={form.time}
                onChange={(e) => setForm({ ...form, time: e.target.value })}
                className="input"
                dir="ltr"
              />
            </Field>

            <Field label="ظرفیت کل">
              <input
                required
                min="1"
                type="number"
                value={form.capacity}
                onChange={(e) => setForm({ ...form, capacity: e.target.value })}
                className="input"
                dir="ltr"
              />
            </Field>

            <Field label="عنوان شب">
              <input
                value={form.label}
                onChange={(e) => setForm({ ...form, label: e.target.value })}
                className="input"
                placeholder="شب اول"
              />
            </Field>

            <Field label="وضعیت اجرا">
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="input"
              >
                <option value="active">فعال</option>
                <option value="closed">بسته</option>
              </select>
            </Field>
          </div>

          <label className="flex items-center gap-3 mt-5 text-white/70">
            <input
              type="checkbox"
              checked={form.booking_enabled}
              onChange={(e) => setForm({ ...form, booking_enabled: e.target.checked })}
            />
            رزرو برای این اجرا باز باشد
          </label>

          <div className="mt-5 flex gap-3">
            <button
              disabled={saving}
              className="bg-[#d4af37] disabled:opacity-50 text-black font-bold px-5 py-3 rounded-xl"
            >
              {saving ? "در حال ذخیره..." : "ذخیره"}
            </button>
            <button
              type="button"
              onClick={() => setFormOpen(false)}
              className="border border-white/10 px-5 py-3 rounded-xl text-white/70"
            >
              انصراف
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="text-white/50">در حال دریافت اطلاعات...</div>
      ) : (
        <div className="space-y-4">
          {items.length === 0 && (
            <div className="bg-[#171717] border border-white/10 rounded-2xl p-6 text-white/50">
              اجرایی ثبت نشده است.
            </div>
          )}

          {items.map((item) => (
            <article
              key={item.id}
              className="bg-[#171717] rounded-2xl border border-white/10 p-6"
            >
              <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-5">
                <div>
                  <div className="flex items-center gap-3 flex-wrap">
                    <h3 className="font-bold text-xl">
                      {item.production?.title || "بیرق ماندگار"}
                    </h3>
                    {item.label && (
                      <span className="text-xs px-3 py-1 rounded-full bg-white/5 border border-white/10 text-white/60">
                        {item.label}
                      </span>
                    )}
                  </div>

                  <div className="flex gap-5 mt-3 text-white/60">
                    <span>{item.date}</span>
                    <span>ساعت {item.time}</span>
                  </div>
                </div>

                <div className="flex gap-3 flex-wrap items-stretch">
                  <Info title="ظرفیت کل" value={item.capacity} />
                  <Info title="باقی‌مانده" value={item.remaining_capacity} accent />
                  <Info title="رزرو" value={item.booking_enabled ? "باز" : "بسته"} />

                  <button
                    type="button"
                    onClick={() => toggleBooking(item)}
                    className="border border-white/10 rounded-xl px-4 py-3 text-sm text-white/70 hover:bg-white/5"
                  >
                    {item.booking_enabled ? "بستن رزرو" : "باز کردن رزرو"}
                  </button>

                  <button
                    type="button"
                    onClick={() => startEdit(item)}
                    className="border border-[#d4af37]/30 rounded-xl px-4 py-3 text-sm text-[#d4af37] hover:bg-[#d4af37]/10"
                  >
                    ویرایش
                  </button>

                  <button
                    type="button"
                    onClick={() => remove(item)}
                    className="border border-red-500/20 rounded-xl px-4 py-3 text-sm text-red-300 hover:bg-red-500/10"
                  >
                    حذف
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      <style>{`
        .input {
          width: 100%;
          border: 1px solid rgba(255,255,255,.10);
          background: rgba(255,255,255,.04);
          border-radius: 12px;
          padding: 12px 14px;
          color: white;
          outline: none;
        }
        .input:focus { border-color: rgba(212,175,55,.55); }
      `}</style>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="block text-sm text-white/50 mb-2">{label}</span>
      {children}
    </label>
  );
}

function Info({ title, value, accent = false }) {
  return (
    <div className="min-w-28 rounded-xl bg-black/20 border border-white/10 px-4 py-3">
      <div className="text-xs text-white/40">{title}</div>
      <div className={`mt-1 font-bold ${accent ? "text-[#d4af37]" : "text-white"}`}>
        {value}
      </div>
    </div>
  );
}
