import useShows from "./hooks/useShows";

function parseTags(value) {
  try {
    const parsed = JSON.parse(value || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export default function ShowManager() {
  const shows = useShows();

  return (
    <div dir="rtl">
      <div className="mb-8">
        <h2 className="text-3xl font-bold">مدیریت نمایش‌ها</h2>
        <p className="text-white/50 mt-2">اطلاعات اصلی آثار نمایشی ثبت‌شده</p>
      </div>

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
                      {show.status === "published" ? "منتشر شده" : show.status}
                    </span>
                  </div>

                  {show.subtitle && (
                    <p className="text-white/70 mt-3">{show.subtitle}</p>
                  )}

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

                <div className="min-w-40 rounded-2xl bg-black/20 border border-white/10 p-4">
                  <div className="text-white/40 text-sm">تعداد اجرا</div>
                  <div className="text-[#d4af37] text-3xl font-bold mt-2">
                    {show.performances?.length ?? 0}
                  </div>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
