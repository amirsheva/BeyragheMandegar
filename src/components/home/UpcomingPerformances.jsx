import {
  useEffect,
  useMemo,
  useState,
} from "react";

import PerformanceCard from "./PerformanceCard";


export default function UpcomingPerformances() {
  const [
    shows,
    setShows,
  ] = useState([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState("");


  useEffect(() => {
    const controller =
      new AbortController();

    fetch(
      "/api/shows",
      {
        signal:
          controller.signal,
      }
    )
      .then((response) => {
        if (!response.ok) {
          throw new Error(
            "دریافت اجراها با مشکل مواجه شد."
          );
        }

        return response.json();
      })
      .then((data) => {
        setShows(
          Array.isArray(data)
            ? data
            : []
        );
      })
      .catch((err) => {
        if (
          err?.name !==
          "AbortError"
        ) {
          setError(
            err?.message ||
            "دریافت اجراها با مشکل مواجه شد."
          );
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


  const currentShows =
    useMemo(
      () =>
        shows
          .filter(
            (show) =>
              show?.status ===
              "active"
          )
          .sort(
            (a, b) =>
              `${a.date || ""} ${a.time || ""}`
                .localeCompare(
                  `${b.date || ""} ${b.time || ""}`
                )
          ),
      [shows]
    );


  return (
    <section
      id="performances"
      dir="rtl"
      className="home-section home-performances"
    >
      <div className="home-container">

        <div className="home-section-heading">
          <div>
            <div className="home-section-kicker">
              اجرای جاری
            </div>

            <h2>
              شب‌های پیش رو
            </h2>

            <p>
              وضعیت رزرو هر شب مستقیماً از اطلاعات
              ثبت‌شده در سامانه نمایش داده می‌شود.
            </p>
          </div>
        </div>


        {loading ? (
          <div className="home-state-card">
            در حال دریافت اجراها...
          </div>
        ) : error ? (
          <div className="home-state-card is-error">
            {error}
          </div>
        ) : currentShows.length ===
          0 ? (
          <div className="home-state-card">
            در حال حاضر اجرای فعالی برای نمایش وجود ندارد.
          </div>
        ) : (
          <div className="home-performances__grid">
            {currentShows.map(
              (show) => (
                <PerformanceCard
                  key={show.id}
                  show={show}
                />
              )
            )}
          </div>
        )}

      </div>
    </section>
  );
}
