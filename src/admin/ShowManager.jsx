import { useEffect, useState } from "react";
import {
  createShow,
  deleteShow,
  getShows,
  updateShow,
} from "./api/showApi";

const emptyForm = {
  title: "",
  slug: "",
  subtitle: "",
  short_description: "",
  description: "",
  director: "",
  poster: "",
  status: "published",
  tags: "",
};

function parseTags(value) {
  try {
    const parsed = JSON.parse(value || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function tagsToInput(value) {
  return parseTags(value).join(", ");
}

export default function ShowManager() {
  const [shows, setShows] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [formOpen, setFormOpen] = useState(false);

  async function load() {
    setLoading(true);
    setError("");
    try {
      setShows(await getShows());
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
    setForm(emptyForm);
    setError("");
    setFormOpen(true);
  }

  function startEdit(show) {
    setEditingId(show.id);
    setForm({
      title: show.title || "",
      slug: show.slug || "",
      subtitle: show.subtitle || "",
      short_description: show.short_description || "",
      description: show.description || "",
      director: show.director || "",
      poster: show.poster || "",
      status: show.status || "published",
      tags: tagsToInput(show.tags),
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
        tags: form.tags
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean),
      };

      if (editingId) {
        await updateShow(editingId, payload);
      } else {
        await createShow(payload);
      }

      setFormOpen(false);
      setEditingId(null);
      setForm(emptyForm);
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function remove(show) {
    if (!window.confirm(`نمایش «${show.title}» و تمام اجراها و رزروهای وابسته حذف شوند؟`)) {
      return;
    }

    setError("");
    try {
      await deleteShow(show.id);
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div dir="rtl">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-bold">مدیریت نمایش‌ها</h2>
          <p className="text-white/50 mt-2">اطلاعات اصلی آثار نمایشی و محتوای قابل انتشار</p>
        </div>

        <button
          type="button"
          onClick={startCreate}
          className="bg-[#d4af37] text-black font-bold px-5 py-3 rounded-xl"
        >
          + نمایش جدید
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
              {editingId ? "ویرایش نمایش" : "ثبت نمایش جدید"}
            </h3>
            <button
              type="button"
              onClick={() => setFormOpen(false)}
              className="text-white/50 hover:text-white"
            >
              بستن
            </button>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <Field label="عنوان">
              <input
                required
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="input"
                placeholder="بیرق ماندگار"
              />
            </Field>

            <Field label="نامک">
              <input
                required
                value={form.slug}
                onChange={(e) => setForm({ ...form, slug: e.target.value })}
                className="input"
                placeholder="beyragh-mandegar"
                dir="ltr"
              />
            </Field>

            <Field label="زیرعنوان">
              <input
                value={form.subtitle}
                onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
                className="input"
              />
            </Field>

            <Field label="کارگردان">
              <input
                value={form.director}
                onChange={(e) => setForm({ ...form, director: e.target.value })}
                className="input"
              />
            </Field>

            <Field label="تگ‌ها (با کاما جدا شوند)">
              <input
                value={form.tags}
                onChange={(e) => setForm({ ...form, tags: e.target.value })}
                className="input"
                placeholder="تئاتر، نمایش، آبان ۱۴۰۵"
              />
            </Field>

            <Field label="وضعیت">
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="input"
              >
                <option value="published">منتشر شده</option>
                <option value="draft">پیش‌نویس</option>
              </select>
            </Field>
          </div>

          <Field label="خلاصه کوتاه" className="mt-4">
            <textarea
              rows="2"
              value={form.short_description}
              onChange={(e) => setForm({ ...form, short_description: e.target.value })}
              className="input resize-y"
            />
          </Field>

          <Field label="توضیحات کامل" className="mt-4">
            <textarea
              rows="4"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="input resize-y"
            />
          </Field>

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
          {shows.length === 0 && (
            <div className="bg-[#171717] border border-white/10 rounded-2xl p-6 text-white/50">
              نمایشی ثبت نشده است.
            </div>
          )}

          {shows.map((show) => {
            const tags = parseTags(show.tags);

            return (
              <article
                key={show.id}
                className="bg-[#171717] border border-white/10 rounded-2xl p-6"
              >
                <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-6">
                  <div className="max-w-3xl">
                    <div className="flex items-center gap-3 flex-wrap">
                      <h3 className="text-2xl font-bold">{show.title}</h3>
                      <span className="text-xs px-3 py-1 rounded-full bg-[#d4af37]/10 text-[#d4af37] border border-[#d4af37]/20">
                        {show.status === "published" ? "منتشر شده" : "پیش‌نویس"}
                      </span>
                    </div>

                    {show.subtitle && <p className="text-white/70 mt-3">{show.subtitle}</p>}
                    {show.short_description && (
                      <p className="text-white/50 mt-3 leading-7">{show.short_description}</p>
                    )}

                    <div className="flex gap-2 flex-wrap mt-5">
                      {tags.map((tag) => (
                        <span
                          key={tag}
                          className="text-xs px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-white/60"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 min-w-44">
                    <div className="rounded-2xl bg-black/20 border border-white/10 p-4">
                      <div className="text-white/40 text-sm">تعداد اجرا</div>
                      <div className="text-[#d4af37] text-3xl font-bold mt-2">
                        {show.performances?.length ?? 0}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => startEdit(show)}
                      className="border border-white/10 rounded-xl px-4 py-2 text-white/80 hover:bg-white/5"
                    >
                      ویرایش
                    </button>
                    <button
                      type="button"
                      onClick={() => remove(show)}
                      className="border border-red-500/20 rounded-xl px-4 py-2 text-red-300 hover:bg-red-500/10"
                    >
                      حذف
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
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

function Field({ label, children, className = "" }) {
  return (
    <label className={`block ${className}`}>
      <span className="block text-sm text-white/50 mb-2">{label}</span>
      {children}
    </label>
  );
}
