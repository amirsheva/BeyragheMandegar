import {
  useEffect,
  useState,
} from "react";

import {
  Maximize2,
  X,
} from "lucide-react";


export default function NewsCover({
  src,
  alt = "",
  className = "",
}) {
  const [
    open,
    setOpen,
  ] = useState(false);


  useEffect(() => {
    if (!open) {
      return undefined;
    }

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener(
      "keydown",
      handleKeyDown
    );

    const previousOverflow =
      document.body.style.overflow;

    document.body.style.overflow =
      "hidden";


    return () => {
      document.removeEventListener(
        "keydown",
        handleKeyDown
      );

      document.body.style.overflow =
        previousOverflow;
    };
  }, [open]);


  if (!src) {
    return null;
  }


  return (
    <>
      <button
        type="button"
        onClick={() =>
          setOpen(true)
        }
        aria-label="مشاهده تصویر در اندازه بزرگ"
        className={`
          group/news-cover
          relative
          block
          w-full
          overflow-hidden
          bg-[#080706]
          text-right
          ${className}
        `}
      >
        {/* blurred background */}
        <img
          src={src}
          alt=""
          aria-hidden="true"
          className="
            absolute
            inset-0
            h-full
            w-full
            scale-110
            object-cover
            opacity-35
            blur-2xl
            saturate-75
          "
        />


        <div
          className="
            absolute
            inset-0
            bg-black/25
          "
        />


        {/* full image */}
        <img
          src={src}
          alt={alt}
          loading="lazy"
          className="
            relative
            z-[1]
            h-full
            w-full
            object-contain
            transition-transform
            duration-300
            group-hover/news-cover:scale-[1.015]
          "
        />


        <div
          className="
            absolute
            left-3
            top-3
            z-[2]
            flex
            h-9
            w-9
            items-center
            justify-center
            rounded-full
            border
            border-white/15
            bg-black/55
            text-white/80
            opacity-0
            backdrop-blur-md
            transition
            group-hover/news-cover:opacity-100
          "
        >
          <Maximize2
            size={16}
          />
        </div>
      </button>


      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="نمایش بزرگ تصویر"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              setOpen(false);
            }
          }}
          className="
            fixed
            inset-0
            z-[9999]
            flex
            items-center
            justify-center
            bg-black/90
            p-4
            backdrop-blur-md
            sm:p-8
          "
        >
          <button
            type="button"
            onClick={() =>
              setOpen(false)
            }
            aria-label="بستن تصویر"
            className="
              absolute
              left-4
              top-4
              z-10
              flex
              h-11
              w-11
              items-center
              justify-center
              rounded-full
              border
              border-white/15
              bg-black/60
              text-white/80
              transition
              hover:bg-white/10
              hover:text-white
              sm:left-7
              sm:top-7
            "
          >
            <X
              size={22}
            />
          </button>


          <img
            src={src}
            alt={alt}
            className="
              max-h-[90vh]
              max-w-[94vw]
              object-contain
              drop-shadow-[0_30px_80px_rgba(0,0,0,.65)]
            "
          />
        </div>
      )}
    </>
  );
}
