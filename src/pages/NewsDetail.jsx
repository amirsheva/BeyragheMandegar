import {
  useEffect,
  useState,
} from "react";

import {
  Link,
  useParams,
} from "react-router-dom";

import {
  ArrowRight,
  CalendarDays,
  Newspaper,
} from "lucide-react";

import NewsCover from "../components/common/NewsCover";


function formatDate(value) {
  if (!value) {
    return "";
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


export default function NewsDetail() {
  const {
    slug,
  } = useParams();

  const [
    item,
    setItem,
  ] = useState(null);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState("");


  useEffect(() => {
    setLoading(true);
    setError("");

    fetch(
      `/api/news/${encodeURIComponent(slug)}`
    )
      .then(async (response) => {
        const data =
          await response.json();

        if (!response.ok) {
          throw new Error(
            data.message ||
              "خبر یافت نشد."
          );
        }

        return data;
      })
      .then(
        setItem
      )
      .catch((err) =>
        setError(
          err.message
        )
      )
      .finally(() =>
        setLoading(false)
      );
  }, [
    slug,
  ]);


  if (loading) {
    return (
      <main
        className="
          min-h-[70vh]
          bg-[#070707]
          px-6 py-24
          text-center
          text-[#837871]
        "
      >
        در حال دریافت خبر...
      </main>
    );
  }


  if (
    error ||
    !item
  ) {
    return (
      <main
        dir="rtl"
        className="
          min-h-[70vh]
          bg-[#070707]
          px-6 py-24
        "
      >
        <div
          className="
            mx-auto
            max-w-xl
            text-center
          "
        >
          <h1
            className="
              text-2xl
              font-black
              text-[#eee2da]
            "
          >
            خبر یافت نشد
          </h1>

          <p
            className="
              mt-3
              text-[#8a7f78]
            "
          >
            {error}
          </p>

          <Link
            to="/news"
            className="
              mt-6
              inline-flex
              items-center
              gap-2
              text-[#bc675a]
            "
          >
            <ArrowRight
              size={17}
            />

            بازگشت به اخبار
          </Link>
        </div>
      </main>
    );
  }


  return (
    <main
      dir="rtl"
      className="
        min-h-screen
        bg-[#070707]
        px-4 py-12
        text-[#eee4dc]
        sm:px-6
      "
    >
      <article
        className="
          mx-auto
          max-w-[900px]
        "
      >
        <Link
          to="/news"
          className="
            inline-flex
            items-center
            gap-2
            text-[13px]
            font-black
            text-[#8f837c]
          "
        >
          <ArrowRight
            size={17}
          />

          بازگشت به اخبار
        </Link>


        <div
          className="
            mt-10
            flex
            items-center
            gap-2
            text-[#a65d51]
          "
        >
          <Newspaper
            size={18}
          />

          اخبار بیرق ماندگار
        </div>


        <h1
          className="
            mt-4
            text-[38px]
            font-black
            leading-[1.55]
            md:text-[52px]
          "
        >
          {item.title}
        </h1>


        <div
          className="
            mt-5
            flex
            items-center
            gap-2
            text-[13px]
            text-[#877b74]
          "
        >
          <CalendarDays
            size={16}
          />

          {formatDate(
            item.published_at ||
              item.createdAt
          )}
        </div>


        {item.cover && (
          <NewsCover
            src={item.cover}
            alt={item.title}
            className="
              mt-9
              min-h-[320px]
              max-h-[720px]
              rounded-[28px]
              border
              border-[#513830]
              sm:min-h-[480px]
            "
          />
        )}


        {item.excerpt && (
          <p
            className="
              mt-9
              border-r-2
              border-[#925044]
              pr-5
              text-[18px]
              font-bold
              leading-9
              text-[#b5a79e]
            "
          >
            {item.excerpt}
          </p>
        )}


        <div
          className="
            mt-8
            whitespace-pre-line
            text-[16px]
            font-medium
            leading-[2.15]
            text-[#c4b8b0]
          "
        >
          {item.body}
        </div>
      </article>
    </main>
  );
}
