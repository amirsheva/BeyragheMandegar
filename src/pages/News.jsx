import {
  useEffect,
  useState,
} from "react";

import {
  Link,
} from "react-router-dom";

import {
  Newspaper,
  CalendarDays,
  ArrowLeft,
} from "lucide-react";



function formatDate(value) {
  if (!value) {
    return "—";
  }

  return new Intl.DateTimeFormat(
    "fa-IR",
    {
      year: "numeric",
      month: "long",
      day: "numeric",
    }
  ).format(
    new Date(value)
  );
}


export default function News() {
  const [
    items,
    setItems,
  ] = useState([]);

  const [
    loading,
    setLoading,
  ] = useState(true);


  useEffect(() => {
    fetch("/api/news")
      .then(
        (response) =>
          response.json()
      )
      .then(
        (data) =>
          setItems(
            Array.isArray(data)
              ? data
              : []
          )
      )
      .catch(() =>
        setItems([])
      )
      .finally(() =>
        setLoading(false)
      );
  }, []);


  return (
    <main
      dir="rtl"
      className="
        min-h-screen
        bg-[#070707]
        px-4 py-14
        text-[#eee4dc]
        sm:px-6
        lg:px-10
      "
    >
      <div
        className="
          mx-auto
          max-w-[1240px]
        "
      >
        <div
          className="
            flex
            items-center
            gap-2
            text-[#a75a4e]
          "
        >
          <Newspaper
            size={19}
          />

          تازه‌های بیرق ماندگار
        </div>

        <h1
          className="
            mt-3
            text-[40px]
            font-black
            md:text-[54px]
          "
        >
          اخبار و رویدادها
        </h1>


        {loading ? (
          <div
            className="
              py-20
              text-[#81766f]
            "
          >
            در حال دریافت اخبار...
          </div>
        ) : (
          <div
            className="
              mt-10
              grid
              gap-5
              md:grid-cols-2
              lg:grid-cols-3
            "
          >
            {items.map(
              (item) => (
                <article
                  key={
                    item.id
                  }
                  className="
                    group
                    overflow-hidden
                    rounded-[25px]
                    border
                    border-[#4e3731]
                    bg-[#0d0b0a]
                  "
                >
                  {item.cover && (
                    <Link
                      to={`/news/${item.slug}`}
                      className="
                        block
                        aspect-[16/9]
                        overflow-hidden
                        bg-[#080707]
                      "
                    >
                      <img
                        src={item.cover}
                        alt={item.title}
                        loading="lazy"
                        className="
                          h-full
                          w-full
                          object-cover
                          transition-transform
                          duration-500
                          group-hover:scale-[1.025]
                        "
                      />
                    </Link>
                  )}

                  <div
                    className="
                      p-6
                    "
                  >
                    <div
                      className="
                        flex
                        items-center
                        gap-2
                        text-[12px]
                        text-[#9e6654]
                      "
                    >
                      <CalendarDays
                        size={15}
                      />

                      {formatDate(
                        item.published_at ||
                          item.createdAt
                      )}
                    </div>

                    <h2
                      className="
                        mt-4
                        text-[20px]
                        font-black
                        leading-8
                      "
                    >
                      {item.title}
                    </h2>

                    <p
                      className="
                        mt-3
                        line-clamp-3
                        text-[14px]
                        leading-7
                        text-[#91867f]
                      "
                    >
                      {item.excerpt ||
                        item.content}
                    </p>

                    <Link
                      to={`/news/${item.slug}`}
                      className="
                        mt-5
                        inline-flex
                        items-center
                        gap-2
                        text-[13px]
                        font-black
                        text-[#bb6256]
                      "
                    >
                      ادامه مطلب

                      <ArrowLeft
                        size={16}
                      />
                    </Link>
                  </div>
                </article>
              )
            )}
          </div>
        )}
      </div>
    </main>
  );
}
