import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  MapPin,
  Plus,
  Pencil,
  Trash2,
  Save,
  X,
  Search,
  Navigation,
  ExternalLink,
  Building2,
  DoorOpen,
  Map,
} from "lucide-react";


const EMPTY_FORM = {
  name: "",
  slug: "",
  hall_name: "",
  address: "",
  entrance_note: "",
  access_note: "",
  latitude: "",
  longitude: "",
  google_maps_url: "",
  neshan_url: "",
  balad_url: "",
  waze_url: "",
  status: "active",
};


async function api(
  url,
  options = {}
) {
  const response =
    await fetch(
      `/api/admin${url}`,
      {
        credentials: "include",

        ...options,

        headers: {
          "Content-Type":
            "application/json",

          ...(options.headers || {}),
        },
      }
    );


  const data =
    await response
      .json()
      .catch(() => ({}));


  if (!response.ok) {
    throw new Error(
      data.message ||
        "خطا در ارتباط با سرور"
    );
  }


  return data;
}


export default function VenueManager() {
  const [items, setItems] =
    useState([]);

  const [form, setForm] =
    useState(EMPTY_FORM);

  const [editingId, setEditingId] =
    useState(null);

  const [formOpen, setFormOpen] =
    useState(false);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  const [search, setSearch] =
    useState("");


  async function load() {
    try {
      setLoading(true);
      setError("");

      const data =
        await api("/venues");

      setItems(
        Array.isArray(data)
          ? data
          : []
      );

    } catch (err) {
      setError(err.message);

    } finally {
      setLoading(false);
    }
  }


  useEffect(() => {
    load();
  }, []);


  const filtered =
    useMemo(() => {
      const q =
        search
          .trim()
          .toLowerCase();

      if (!q) {
        return items;
      }

      return items.filter(
        (item) =>
          [
            item.name,
            item.hall_name,
            item.address,
            item.slug,
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase()
            .includes(q)
      );
    }, [
      items,
      search,
    ]);


  function change(
    field,
    value
  ) {
    setForm(
      (current) => ({
        ...current,
        [field]: value,
      })
    );
  }


  function startCreate() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setError("");
    setFormOpen(true);
  }


  function startEdit(item) {
    setEditingId(item.id);

    setForm({
      name:
        item.name || "",

      slug:
        item.slug || "",

      hall_name:
        item.hall_name || "",

      address:
        item.address || "",

      entrance_note:
        item.entrance_note || "",

      access_note:
        item.access_note || "",

      latitude:
        item.latitude ?? "",

      longitude:
        item.longitude ?? "",

      google_maps_url:
        item.google_maps_url || "",

      neshan_url:
        item.neshan_url || "",

      balad_url:
        item.balad_url || "",

      waze_url:
        item.waze_url || "",

      status:
        item.status || "active",
    });

    setError("");
    setFormOpen(true);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }


  function closeForm() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setError("");
    setFormOpen(false);
  }


  async function submit(event) {
    event.preventDefault();

    try {
      setSaving(true);
      setError("");


      const payload = {
        ...form,

        latitude:
          form.latitude === ""
            ? null
            : Number(
                form.latitude
              ),

        longitude:
          form.longitude === ""
            ? null
            : Number(
                form.longitude
              ),
      };


      if (editingId) {
        await api(
          `/venues/${editingId}`,
          {
            method: "PUT",
            body:
              JSON.stringify(
                payload
              ),
          }
        );

      } else {
        await api(
          "/venues",
          {
            method: "POST",
            body:
              JSON.stringify(
                payload
              ),
          }
        );
      }


      closeForm();
      await load();

    } catch (err) {
      setError(err.message);

    } finally {
      setSaving(false);
    }
  }


  async function remove(item) {
    const ok =
      window.confirm(
        `محل «${item.name}» حذف شود؟\n\nاگر به یک اجرا متصل باشد حذف نخواهد شد.`
      );

    if (!ok) {
      return;
    }


    try {
      setError("");

      await api(
        `/venues/${item.id}`,
        {
          method: "DELETE",
        }
      );

      await load();

    } catch (err) {
      setError(err.message);
    }
  }


  return (
    <div dir="rtl" className="venue-manager">
      <header
        className="
          mb-8
          flex flex-col gap-5
          border-b
          border-white/[0.055]
          pb-7
          xl:flex-row
          xl:items-end
          xl:justify-between
        "
      >
        <div>
          <div
            className="
              mb-2
              flex items-center gap-2
              text-[12px]
              font-black
              text-[#a45b50]
            "
          >
            <MapPin size={17} />

            سالن و مسیریابی
          </div>

          <h2
            className="
              text-[31px]
              font-black
              text-[#efe4dc]
              sm:text-[36px]
            "
          >
            محل‌های اجرا
          </h2>

          <p
            className="
              mt-2
              max-w-3xl
              text-[14px]
              leading-7
              text-[#827871]
            "
          >
            مدیریت سالن، آدرس،
            ورودی، مختصات و لینک
            مسیریاب‌های هر محل اجرا
          </p>
        </div>


        <button
          type="button"
          onClick={startCreate}
          className="ds-button ds-button--primary"
        >
          <Plus size={18} />

          محل جدید
        </button>
      </header>


      {error && (
        <div
          className="
            mb-5
            rounded-[16px]
            border border-[#713c36]
            bg-[#28110f]
            px-4 py-3
            text-[13px]
            font-bold
            text-[#e58d82]
          "
        >
          {error}
        </div>
      )}


      {formOpen && (
        <form
          onSubmit={submit}
          className="
            mb-7
            rounded-[26px]
            border border-[#594039]
            bg-[#0d0a09]
            p-5
            sm:p-7
          "
        >
          <div
            className="
              flex
              items-center
              justify-between
              gap-4
            "
          >
            <h3
              className="
                text-[20px]
                font-black
                text-[#e7dbd3]
              "
            >
              {editingId
                ? "ویرایش محل اجرا"
                : "ثبت محل اجرا"}
            </h3>


            <button
              type="button"
              onClick={closeForm}
              className="
                flex h-9 w-9
                items-center
                justify-center
                rounded-full
                border
                border-white/[0.07]
                text-[#8d8179]
              "
            >
              <X size={18} />
            </button>
          </div>


          <div
            className="
              mt-6
              grid gap-5
              md:grid-cols-2
            "
          >
            <Field label="نام محل">
              <input
                required
                value={form.name}
                onChange={(e) =>
                  change(
                    "name",
                    e.target.value
                  )
                }
                placeholder="فرهنگسرای خاوران"
                className={inputClass}
              />
            </Field>


            <Field label="نام سالن">
              <input
                value={
                  form.hall_name
                }
                onChange={(e) =>
                  change(
                    "hall_name",
                    e.target.value
                  )
                }
                placeholder="سالن شهید مطهری"
                className={inputClass}
              />
            </Field>


            <Field label="نامک">
              <input
                dir="ltr"
                value={form.slug}
                onChange={(e) =>
                  change(
                    "slug",
                    e.target.value
                  )
                }
                placeholder="farhangsara-khavaran"
                className={inputClass}
              />
            </Field>


            <Field label="وضعیت">
              <select
                value={form.status}
                onChange={(e) =>
                  change(
                    "status",
                    e.target.value
                  )
                }
                className={inputClass}
              >
                <option value="active">
                  فعال
                </option>

                <option value="inactive">
                  غیرفعال
                </option>
              </select>
            </Field>
          </div>


          <Field
            label="آدرس کامل"
            className="mt-5"
          >
            <textarea
              rows={3}
              value={form.address}
              onChange={(e) =>
                change(
                  "address",
                  e.target.value
                )
              }
              className={`${inputClass} resize-y leading-7`}
            />
          </Field>


          <div
            className="
              mt-5
              grid gap-5
              md:grid-cols-2
            "
          >
            <Field label="توضیح ورودی">
              <textarea
                rows={3}
                value={
                  form.entrance_note
                }
                onChange={(e) =>
                  change(
                    "entrance_note",
                    e.target.value
                  )
                }
                placeholder="ورود از درب شمالی..."
                className={`${inputClass} resize-y leading-7`}
              />
            </Field>


            <Field label="توضیحات دسترسی">
              <textarea
                rows={3}
                value={
                  form.access_note
                }
                onChange={(e) =>
                  change(
                    "access_note",
                    e.target.value
                  )
                }
                className={`${inputClass} resize-y leading-7`}
              />
            </Field>


            <Field label="Latitude">
              <input
                type="number"
                step="any"
                dir="ltr"
                value={
                  form.latitude
                }
                onChange={(e) =>
                  change(
                    "latitude",
                    e.target.value
                  )
                }
                className={inputClass}
              />
            </Field>


            <Field label="Longitude">
              <input
                type="number"
                step="any"
                dir="ltr"
                value={
                  form.longitude
                }
                onChange={(e) =>
                  change(
                    "longitude",
                    e.target.value
                  )
                }
                className={inputClass}
              />
            </Field>
          </div>


          <div
            className="
              mt-6
              border-t
              border-white/[0.055]
              pt-6
            "
          >
            <div
              className="
                mb-4
                flex items-center gap-2
                text-[13px]
                font-black
                text-[#b7aaa1]
              "
            >
              <Navigation size={17} />

              لینک‌های مسیریابی
            </div>


            <div
              className="
                grid gap-5
                md:grid-cols-2
              "
            >
              <UrlField
                label="Google Maps"
                value={
                  form.google_maps_url
                }
                onChange={(value) =>
                  change(
                    "google_maps_url",
                    value
                  )
                }
              />

              <UrlField
                label="نشان"
                value={
                  form.neshan_url
                }
                onChange={(value) =>
                  change(
                    "neshan_url",
                    value
                  )
                }
              />

              <UrlField
                label="بلد"
                value={
                  form.balad_url
                }
                onChange={(value) =>
                  change(
                    "balad_url",
                    value
                  )
                }
              />

              <UrlField
                label="Waze"
                value={
                  form.waze_url
                }
                onChange={(value) =>
                  change(
                    "waze_url",
                    value
                  )
                }
              />
            </div>
          </div>


          <div
            className="
              mt-7
              flex flex-wrap gap-3
            "
          >
            <button
              disabled={saving}
              className="
                inline-flex
                items-center gap-2
                rounded-full
                border border-[#98574c]
                bg-[#64241f]
                px-6 py-3
                text-[13px]
                font-black
                text-[#f0e2da]
                disabled:opacity-50
              "
            >
              <Save size={17} />

              {saving
                ? "در حال ذخیره..."
                : "ذخیره محل"}
            </button>


            <button
              type="button"
              onClick={closeForm}
              className="
                rounded-full
                border border-white/[0.07]
                px-5 py-3
                text-[13px]
                font-black
                text-[#958981]
              "
            >
              انصراف
            </button>
          </div>
        </form>
      )}


      <div
        className="
          mb-5
          flex items-center gap-3
          rounded-[18px]
          border border-[#3f302b]
          bg-[#0d0b0a]
          px-4
        "
      >
        <Search
          size={18}
          className="text-[#855147]"
        />

        <input
          value={search}
          onChange={(e) =>
            setSearch(
              e.target.value
            )
          }
          placeholder="جستجو در محل‌های اجرا..."
          className="
            w-full
            bg-transparent
            py-4
            text-[14px]
            text-[#e6dad2]
            outline-none
            placeholder:text-[#5e5753]
          "
        />
      </div>


      {loading ? (
        <div
          className="
            py-16
            text-[#776e68]
          "
        >
          در حال دریافت محل‌ها...
        </div>

      ) : filtered.length === 0 ? (
        <div
          className="
            rounded-[24px]
            border border-[#3f302b]
            bg-[#0d0b0a]
            p-10
            text-center
            text-[#776e68]
          "
        >
          محلی ثبت نشده است.
        </div>

      ) : (
        <div className="grid gap-4">
          {filtered.map(
            (item) => (
              <article
                key={item.id}
                className="
                  rounded-[24px]
                  border
                  border-[#3f302b]
                  bg-[#0d0b0a]
                  p-5
                  sm:p-6
                "
              >
                <div
                  className="
                    flex flex-col gap-6
                    xl:flex-row
                    xl:items-center
                    xl:justify-between
                  "
                >
                  <div
                    className="
                      min-w-0
                      flex-1
                    "
                  >
                    <div
                      className="
                        flex
                        flex-wrap
                        items-center gap-3
                      "
                    >
                      <div
                        className="
                          flex h-10 w-10
                          items-center
                          justify-center
                          rounded-full
                          border
                          border-[#72483f]
                          bg-[#241310]
                          text-[#b9685b]
                        "
                      >
                        <Building2
                          size={18}
                        />
                      </div>


                      <div>
                        <h3
                          className="
                            text-[19px]
                            font-black
                            text-[#e7dbd3]
                          "
                        >
                          {item.name}
                        </h3>

                        {item.hall_name && (
                          <div
                            className="
                              mt-1
                              text-[12px]
                              font-bold
                              text-[#968a82]
                            "
                          >
                            {item.hall_name}
                          </div>
                        )}
                      </div>


                      <span
                        className={`
                          rounded-full
                          border
                          px-3 py-1
                          text-[12px]
                          font-black

                          ${
                            item.status ===
                            "active"
                              ? "border-[#386146] bg-[#102318] text-[#77bc8c]"
                              : "border-[#5d5145] bg-[#181511] text-[#aa9a88]"
                          }
                        `}
                      >
                        {item.status ===
                        "active"
                          ? "فعال"
                          : "غیرفعال"}
                      </span>
                    </div>


                    {item.address && (
                      <div
                        className="
                          mt-4
                          flex gap-2
                          text-[12px]
                          leading-7
                          text-[#7f756f]
                        "
                      >
                        <MapPin
                          size={15}
                          className="
                            mt-1
                            shrink-0
                            text-[#98554a]
                          "
                        />

                        {item.address}
                      </div>
                    )}


                    {item.entrance_note && (
                      <div
                        className="
                          mt-2
                          flex gap-2
                          text-[12px]
                          leading-6
                          text-[#776d67]
                        "
                      >
                        <DoorOpen
                          size={14}
                          className="
                            mt-1
                            shrink-0
                          "
                        />

                        {item.entrance_note}
                      </div>
                    )}


                    <div
                      className="
                        mt-4
                        flex flex-wrap gap-2
                      "
                    >
                      {[
                        [
                          "Google Maps",
                          item.google_maps_url,
                        ],
                        [
                          "نشان",
                          item.neshan_url,
                        ],
                        [
                          "بلد",
                          item.balad_url,
                        ],
                        [
                          "Waze",
                          item.waze_url,
                        ],
                      ]
                        .filter(
                          ([, url]) =>
                            url
                        )
                        .map(
                          ([
                            label,
                            url,
                          ]) => (
                            <a
                              key={label}
                              href={url}
                              target="_blank"
                              rel="noreferrer"
                              className="
                                inline-flex
                                items-center gap-1.5
                                rounded-full
                                border
                                border-white/[0.07]
                                px-3 py-1.5
                                text-[12px]
                                font-black
                                text-[#92857e]
                              "
                            >
                              <Map
                                size={12}
                              />

                              {label}

                              <ExternalLink
                                size={11}
                              />
                            </a>
                          )
                        )}
                    </div>
                  </div>


                  <div
                    className="
                      flex
                      shrink-0
                      flex-wrap gap-2
                    "
                  >
                    <button
                      type="button"
                      onClick={() =>
                        startEdit(
                          item
                        )
                      }
                      className={
                        actionButton
                      }
                    >
                      <Pencil
                        size={16}
                      />

                      ویرایش
                    </button>


                    <button
                      type="button"
                      onClick={() =>
                        remove(item)
                      }
                      className={
                        dangerButton
                      }
                    >
                      <Trash2
                        size={16}
                      />

                      حذف
                    </button>
                  </div>
                </div>
              </article>
            )
          )}
        </div>
      )}
    </div>
  );
}


function Field({
  label,
  children,
  className = "",
}) {
  return (
    <label
      className={`block ${className}`}
    >
      <span
        className="
          mb-2
          block
          text-[12px]
          font-black
          text-[#998d86]
        "
      >
        {label}
      </span>

      {children}
    </label>
  );
}


function UrlField({
  label,
  value,
  onChange,
}) {
  return (
    <Field label={label}>
      <input
        type="url"
        dir="ltr"
        value={value}
        onChange={(e) =>
          onChange(
            e.target.value
          )
        }
        placeholder="https://..."
        className={inputClass}
      />
    </Field>
  );
}


const inputClass = `
  w-full
  rounded-[15px]
  border
  border-[#43312c]
  bg-[#080706]
  px-4
  py-3.5
  text-[14px]
  text-[#e7dcd4]
  outline-none
  transition
  focus:border-[#925449]
`;


const actionButton = `
  inline-flex
  items-center gap-2
  rounded-full
  border border-[#594039]
  bg-[#17100e]
  px-4 py-2.5
  text-[12px]
  font-black
  text-[#bfaea4]
`;


const dangerButton = `
  inline-flex
  items-center gap-2
  rounded-full
  border border-[#58312e]
  bg-[#160c0b]
  px-4 py-2.5
  text-[12px]
  font-black
  text-[#c36e68]
`;
