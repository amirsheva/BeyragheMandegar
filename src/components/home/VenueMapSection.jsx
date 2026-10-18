import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  MapComponent,
  MapTypes,
} from "@neshan-maps-platform/mapbox-gl-react";

import nmp_mapboxgl from "@neshan-maps-platform/mapbox-gl";

import "@neshan-maps-platform/mapbox-gl-react/dist/style.css";
import "@neshan-maps-platform/mapbox-gl/dist/NeshanMapboxGl.css";

import {
  MapPin,
  Navigation,
} from "lucide-react";


const NESHAN_MAP_KEY =
  import.meta.env.VITE_NESHAN_MAP_KEY;


function remainingOf(show) {
  return Number(
    show?.remainingCapacity ??
    show?.remaining_capacity ??
    show?.capacity ??
    0
  );
}


function isBookable(show) {
  return (
    show?.status === "active" &&
    show?.bookingEnabled !== false &&
    show?.booking_enabled !== false &&
    remainingOf(show) > 0
  );
}


export default function VenueMapSection() {
  const [
    shows,
    setShows,
  ] = useState([]);


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
          throw new Error();
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
      .catch((error) => {
        if (
          error?.name !==
          "AbortError"
        ) {
          setShows([]);
        }
      });

    return () =>
      controller.abort();
  }, []);


  const next =
    useMemo(
      () =>
        shows
          .filter(isBookable)
          .sort(
            (a, b) =>
              `${a.date || ""} ${a.time || ""}`
                .localeCompare(
                  `${b.date || ""} ${b.time || ""}`
                )
          )[0] ||
        null,
      [shows]
    );


  const venue =
    next?.venue ||
    null;

  const latitude =
    venue?.latitude !=
      null
      ? Number(
          venue.latitude
        )
      : null;

  const longitude =
    venue?.longitude !=
      null
      ? Number(
          venue.longitude
        )
      : null;

  const hasCoordinates =
    Number.isFinite(
      latitude
    ) &&
    Number.isFinite(
      longitude
    );

  const directionsUrl =
    hasCoordinates
      ? `https://nshn.ir/?destination=${latitude},${longitude}`
      : null;


  if (
    !NESHAN_MAP_KEY ||
    !hasCoordinates
  ) {
    return null;
  }


  function handleNavigateClick(
    event
  ) {
    const isIOS =
      /iPad|iPhone|iPod/.test(
        navigator.userAgent
      ) &&
      !window.MSStream;

    if (!isIOS) {
      return;
    }

    event.preventDefault();

    const schemeUrl = `neshan://?destination=${latitude},${longitude}`;

    let fellBack =
      false;

    const fallbackToWeb =
      () => {
        if (fellBack) {
          return;
        }

        fellBack = true;

        window.location.href =
          directionsUrl;
      };

    const timer =
      setTimeout(
        fallbackToWeb,
        1500
      );

    document.addEventListener(
      "visibilitychange",
      function onVisibilityChange() {
        if (document.hidden) {
          clearTimeout(
            timer
          );
        }

        document.removeEventListener(
          "visibilitychange",
          onVisibilityChange
        );
      }
    );

    window.location.href =
      schemeUrl;
  }


  return (
    <section
      dir="rtl"
      className="home-section home-venue-map"
    >
      <div className="home-container">

        <div className="home-section-heading">
          <div>
            <div className="home-section-kicker">
              نشانی اجرا
            </div>

            <h2>
              محل برگزاری نزدیک‌ترین اجرا
            </h2>

            <p>
              {venue.hallName ||
                venue.name}{" "}
              را روی نقشه ببینید و مسیر خود را
              از قبل برنامه‌ریزی کنید.
            </p>

            {venue.address && (
              <p className="home-venue-map__address">
                <MapPin
                  size={16}
                />

                {venue.address}
              </p>
            )}
          </div>
        </div>


        <div className="home-venue-map__frame">
          <MapComponent
            key={
              venue.id
            }
            options={{
              mapKey:
                NESHAN_MAP_KEY,

              mapType:
                MapTypes.neshanRasterNight,

              center: [
                longitude,
                latitude,
              ],

              zoom: 15,

              poiControllerOptions: {
                show: false,
              },

              trafficControllerOptions: {
                show: false,
              },

              mapTypeControllerOptions: {
                show: false,
              },
            }}
            mapSetter={(
              map
            ) => {
              new nmp_mapboxgl.Marker()
                .setLngLat([
                  longitude,
                  latitude,
                ])
                .addTo(
                  map
                );
            }}
            style={{
              width:
                "100%",
              height:
                "100%",
            }}
          />

          <div className="home-venue-map__badge">
            <MapPin
              size={16}
            />

            {venue.name}
          </div>

          <a
            href={directionsUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={
              handleNavigateClick
            }
            className="home-venue-map__navigate"
            aria-label="مسیریابی در نشان"
            title="مسیریابی در نشان"
          >
            <Navigation
              size={16}
            />

            <span>
              مسیریابی در نشان
            </span>
          </a>
        </div>

      </div>
    </section>
  );
}
