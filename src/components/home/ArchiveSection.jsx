import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Archive as ArchiveIcon,
  ArrowRight,
  Building2,
  CalendarDays,
  ChevronLeft,
  Clock3,
} from "lucide-react";

import {
  toFaDigits,
} from "../../theme/persianDigits";


function yearOf(
  date
) {
  const match =
    String(
      date || ""
    ).match(
      /^(\d{4})/
    );

  return match
    ? match[1]
    : "";
}


function sortPerformances(
  a,
  b
) {
  return `${a.date || ""} ${a.time || ""}`
    .localeCompare(
      `${b.date || ""} ${b.time || ""}`
    );
}


export default function ArchiveSection() {
  const [
    items,
    setItems,
  ] = useState([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState("");

  const [
    selectedYear,
    setSelectedYear,
  ] = useState("");

  const [
    selectedVenue,
    setSelectedVenue,
  ] = useState("");


  useEffect(() => {
    const controller =
      new AbortController();


    async function load() {
      try {
        const response =
          await fetch(
            "/api/performances",
            {
              signal:
                controller.signal,
            }
          );

        if (!response.ok) {
          throw new Error(
            "دریافت آرشیو با مشکل مواجه شد."
          );
        }

        const data =
          await response.json();

        const archived =
          (
            Array.isArray(data)
              ? data
              : []
          ).filter(
            (item) =>
              item?.status ===
              "archived"
          );


        const details =
          await Promise.all(
            archived.map(
              async (item) => {
                try {
                  const detailResponse =
                    await fetch(
                      `/api/performances/${item.id}/details`,
                      {
                        signal:
                          controller.signal,
                      }
                    );

                  if (
                    !detailResponse.ok
                  ) {
                    throw new Error();
                  }

                  const detailData =
                    await detailResponse.json();

                  return (
                    detailData
                      ?.performance ||
                    item
                  );

                } catch (
                  detailError
                ) {
                  if (
                    detailError
                      ?.name ===
                    "AbortError"
                  ) {
                    throw detailError;
                  }

                  return item;
                }
              }
            )
          );


        setItems(
          details
            .filter(
              (item) =>
                yearOf(
                  item.date
                )
            )
            .sort(
              sortPerformances
            )
        );

      } catch (err) {
        if (
          err?.name ===
          "AbortError"
        ) {
          return;
        }

        setError(
          err?.message ||
          "دریافت آرشیو با مشکل مواجه شد."
        );

      } finally {
        if (
          !controller
            .signal
            .aborted
        ) {
          setLoading(false);
        }
      }
    }


    load();


    return () =>
      controller.abort();
  }, []);


  const years =
    useMemo(() => {
      const map =
        new Map();

      for (
        const item of
        items
      ) {
        const year =
          yearOf(
            item.date
          );

        if (!year) {
          continue;
        }

        if (
          !map.has(year)
        ) {
          map.set(
            year,
            []
          );
        }

        map
          .get(year)
          .push(item);
      }

      return [
        ...map.entries(),
      ]
        .map(
          (
            [
              year,
              performances,
            ]
          ) => {
            const venues =
              new Set(
                performances.map(
                  (item) =>
                    item?.venue
                      ?.name ||
                    "محل اجرا ثبت نشده"
                )
              );

            return {
              year,
              performances:
                performances.sort(
                  sortPerformances
                ),
              venueCount:
                venues.size,
            };
          }
        )
        .sort(
          (a, b) =>
            b.year.localeCompare(
              a.year
            )
        );
    }, [
      items,
    ]);


  const activeYear =
    years.find(
      (item) =>
        item.year ===
        selectedYear
    );


  const venues =
    useMemo(() => {
      if (!activeYear) {
        return [];
      }

      const map =
        new Map();

      for (
        const performance of
        activeYear.performances
      ) {
        const name =
          performance?.venue
            ?.name ||
          "محل اجرا ثبت نشده";

        if (
          !map.has(name)
        ) {
          map.set(
            name,
            []
          );
        }

        map
          .get(name)
          .push(
            performance
          );
      }

      return [
        ...map.entries(),
      ].map(
        (
          [
            name,
            performances,
          ]
        ) => ({
          name,
          performances:
            performances.sort(
              sortPerformances
            ),
        })
      );
    }, [
      activeYear,
    ]);


  const activeVenue =
    venues.find(
      (item) =>
        item.name ===
        selectedVenue
    );


  function reset() {
    setSelectedYear("");
    setSelectedVenue("");
  }


  return (
    <section
      id="archive"
      dir="rtl"
      className="home-section home-archive"
    >
      <div className="home-container">

        <div className="home-section-heading">
          <div>
            <div className="home-section-kicker">
              آرشیو بیرق ماندگار
            </div>

            <h2>
              اجراهای سال‌های گذشته
            </h2>

            <p>
              آرشیو بر اساس اطلاعات ثبت‌شده در سامانه،
              از سال اجرا به محل و سپس شب‌های اجرا
              دسته‌بندی شده است.
            </p>
          </div>
        </div>


        {loading ? (
          <div className="home-state-card">
            در حال آماده‌سازی آرشیو...
          </div>
        ) : error ? (
          <div className="home-state-card is-error">
            {error}
          </div>
        ) : years.length ===
          0 ? (
          <div className="home-state-card">
            هنوز اجرای آرشیوی ثبت نشده است.
          </div>
        ) : !selectedYear ? (
          <div className="home-archive-years">
            {years.map(
              (year) => (
                <button
                  key={
                    year.year
                  }
                  type="button"
                  className="home-archive-year"
                  onClick={() => {
                    setSelectedYear(
                      year.year
                    );

                    setSelectedVenue(
                      ""
                    );
                  }}
                >
                  <div className="home-archive-year__icon">
                    <ArchiveIcon
                      size={23}
                    />
                  </div>

                  <div>
                    <div className="home-archive-year__label">
                      سال
                    </div>

                    <strong>
                      {toFaDigits(
                        year.year
                      )}
                    </strong>

                    <p>
                      {toFaDigits(
                        year.performances
                          .length
                      )}{" "}
                      شب اجرا در{" "}
                      {toFaDigits(
                        year.venueCount
                      )}{" "}
                      محل
                    </p>
                  </div>

                  <ChevronLeft
                    size={21}
                  />
                </button>
              )
            )}
          </div>
        ) : !selectedVenue ? (
          <>
            <button
              type="button"
              className="home-archive-back"
              onClick={reset}
            >
              <ArrowRight size={17} />
              همه سال‌ها
            </button>

            <div className="home-archive-stage-title">
              اجراهای سال{" "}
              {toFaDigits(
                selectedYear
              )}
            </div>

            <div className="home-archive-venues">
              {venues.map(
                (venue) => (
                  <button
                    key={
                      venue.name
                    }
                    type="button"
                    className="home-archive-venue"
                    onClick={() =>
                      setSelectedVenue(
                        venue.name
                      )
                    }
                  >
                    <Building2
                      size={22}
                    />

                    <div>
                      <strong>
                        {
                          venue.name
                        }
                      </strong>

                      <p>
                        {toFaDigits(
                          venue
                            .performances
                            .length
                        )}{" "}
                        شب اجرا
                      </p>
                    </div>

                    <ChevronLeft
                      size={20}
                    />
                  </button>
                )
              )}
            </div>
          </>
        ) : (
          <>
            <button
              type="button"
              className="home-archive-back"
              onClick={() =>
                setSelectedVenue(
                  ""
                )
              }
            >
              <ArrowRight size={17} />
              محل‌های اجرا
            </button>

            <div className="home-archive-stage-title">
              {activeVenue?.name}
            </div>

            <div className="home-archive-nights">
              {(
                activeVenue
                  ?.performances ||
                []
              ).map(
                (
                  performance
                ) => (
                  <article
                    key={
                      performance.id
                    }
                    className="home-archive-night"
                  >
                    <div className="home-archive-night__top">
                      <strong>
                        {performance.label ||
                          "شب اجرا"}
                      </strong>

                      <span>
                        فروش بلیت پایان یافته
                      </span>
                    </div>

                    <div className="home-archive-night__meta">
                      <span>
                        <CalendarDays
                          size={15}
                        />

                        {toFaDigits(
                          performance.date
                        )}
                      </span>

                      <span>
                        <Clock3
                          size={15}
                        />

                        ساعت{" "}
                        {toFaDigits(
                          performance.time
                        )}
                      </span>
                    </div>
                  </article>
                )
              )}
            </div>
          </>
        )}

      </div>
    </section>
  );
}
