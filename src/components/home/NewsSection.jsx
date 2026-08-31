import {
  useEffect,
  useState,
} from "react";

import {
  Link,
} from "react-router-dom";

import {
  ArrowLeft,
  CalendarDays,
  Newspaper,
} from "lucide-react";


const ARCHIVE_PREFIX =
  "از آرشیو بیرق ماندگار —";


function splitExcerpt(
  excerpt
) {
  const value =
    String(
      excerpt || ""
    ).trim();

  if (
    value.startsWith(
      ARCHIVE_PREFIX
    )
  ) {
    return {
      archived:
        true,

      text:
        value
          .slice(
            ARCHIVE_PREFIX.length
          )
          .trim(),
    };
  }

  return {
    archived:
      false,

    text:
      value,
  };
}


function formatDate(value) {
  if (!value) {
    return "";
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "";
  }

  return new Intl.DateTimeFormat(
    "fa-IR",
    {
      year:
        "numeric",
      month:
        "long",
      day:
        "numeric",
    }
  ).format(date);
}


export default function NewsSection() {
  const [
    items,
    setItems,
  ] = useState([]);

  const [
    loading,
    setLoading,
  ] = useState(true);


  useEffect(() => {
    const controller =
      new AbortController();

    fetch(
      "/api/news?limit=3",
      {
        signal:
          controller.signal,
      }
    )
      .then((response) => {
        if (!response.ok) {
          throw new Error();
        }

        return response.json();
      })
      .then((data) => {
        setItems(
          Array.isArray(data)
            ? data
            : []
        );
      })
      .catch((error) => {
        if (
          error?.name !==
          "AbortError"
        ) {
          setItems([]);
        }
      })
      .finally(() => {
        if (
          !controller
            .signal
            .aborted
        ) {
          setLoading(false);
        }
      });


    return () =>
      controller.abort();
  }, []);


  return (
    <section
      id="news"
      dir="rtl"
      className="home-section home-news"
    >
      <div className="home-container">

        <div className="home-section-heading home-section-heading--split">
          <div>
            <div className="home-section-kicker">
              تازه‌های بیرق ماندگار
            </div>

            <h2>
              اخبار و روایت‌ها
            </h2>

            <p>
              خبرها، مستندات اجراها و روایت‌هایی
              از مسیر بیرق ماندگار.
            </p>
          </div>

          <Link
            to="/news"
            className="home-text-link"
          >
            همه اخبار

            <ArrowLeft size={17} />
          </Link>
        </div>


        {loading ? (
          <div className="home-state-card">
            در حال دریافت اخبار...
          </div>
        ) : items.length ===
          0 ? (
          <div className="home-state-card">
            هنوز خبری برای نمایش منتشر نشده است.
          </div>
        ) : (
          <div className="home-news__grid">
            {items.map(
              (item) => {
                const excerpt =
                  splitExcerpt(
                    item.excerpt
                  );

                return (
                  <article
                    key={item.id}
                    className="home-news-card"
                  >
                    {item.cover && (
                      <Link
                        to={`/news/${item.slug}`}
                        className="home-news-card__cover"
                      >
                        <img
                          src={
                            item.cover
                          }
                          alt={
                            item.title
                          }
                          loading="lazy"
                        />
                      </Link>
                    )}


                    <div className="home-news-card__body">
                      <div className="home-news-card__meta">
                        <span>
                          <CalendarDays
                            size={15}
                          />

                          {formatDate(
                            item.published_at ||
                            item.createdAt
                          )}
                        </span>

                        {excerpt.archived && (
                          <span className="home-news-card__archive">
                            از آرشیو بیرق ماندگار
                          </span>
                        )}
                      </div>


                      <h3>
                        {item.title}
                      </h3>

                      {excerpt.text && (
                        <p>
                          {
                            excerpt.text
                          }
                        </p>
                      )}


                      <Link
                        to={`/news/${item.slug}`}
                        className="home-news-card__link"
                      >
                        <Newspaper
                          size={16}
                        />

                        ادامه مطلب

                        <ArrowLeft
                          size={16}
                        />
                      </Link>
                    </div>
                  </article>
                );
              }
            )}
          </div>
        )}

      </div>
    </section>
  );
}
