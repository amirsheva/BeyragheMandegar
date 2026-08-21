import Countdown from "../common/Countdown";
import GoldButton from "../common/GoldButton";
import heroImage from "../../assets/images/hero-beyragh-fatemeh-azra.webp";

export default function HeroSection() {
  return (
    <section
      className="
        relative
        min-h-screen
        overflow-hidden
        bg-[#050505]
        flex
        items-center
      "
    >

      {/* Poster Image */}
      <div
        className="
          absolute
          inset-y-0
          right-0
          w-full
          md:w-[72%]
        "
      >
        <img
          src={heroImage}
          alt="بیرق ماندگار"
          className="
            w-full
            h-full
            object-cover
            object-[45%_center]
          "
        />
      </div>


      {/* Main Gradient Overlay */}
      <div
        className="
          absolute
          inset-0
          bg-gradient-to-r
          from-black/60
          via-black/20
          to-transparent
          z-10
        "
      />


      {/* Bottom Fade */}
      <div
        className="
          absolute
          inset-x-0
          bottom-0
          h-48
          bg-gradient-to-t
          from-black
          to-transparent
          z-20
        "
      />


      {/* Content */}
      <div
        className="
          relative
          z-30
          w-full
          max-w-7xl
          mx-auto
          px-16
          py-40
          flex
          justify-end
        "
      >

        <div
          className="
            max-w-xl
            text-right
            space-y-8
          "
        >

          {/* Brand */}
          <div
            className="
              flex
              justify-end
              items-center
              gap-4
              text-[#d4af37]
            "
          >
            <span className="text-lg">
              بیرق ماندگار
            </span>

            <span
              className="
                h-px
                w-12
                bg-[#d4af37]
              "
            />
          </div>


          {/* Title */}
          <h1
            className="
              text-white
              text-5xl
              md:text-7xl
              font-bold
              leading-[1.4]
            "
          >
            روایتی که
            <br />
            ماندگار می‌شود
          </h1>


          {/* Description */}
          <p
            className="
              text-white/70
              text-lg
              leading-10
            "
          >
            تجربه‌ای متفاوت از هنر نمایش،
            روایت و احساس در صحنه‌ای ماندگار
          </p>


          {/* Countdown */}
          <div
            className="
              inline-flex
              backdrop-blur-xl
              bg-black/40
              border
              border-white/10
              rounded-3xl
              px-8
              py-5
            "
          >
            <Countdown />
          </div>


          {/* CTA */}
          <div>
            <GoldButton>
              🎟 رزرو بلیت
            </GoldButton>
          </div>


        </div>

      </div>

    </section>
  );
}