const VIDEO_URL =
  'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260306_074215_04640ca7-042c-45d6-bb56-58b1e8a42489.mp4'

const NAV_LINKS = ['Work', 'Services', 'Pricing', 'About', 'Blog']

/* ── corner accent square ── */
function Corner({ pos }) {
  const posMap = {
    tl: 'top-0 left-0',
    tr: 'top-0 right-0',
    bl: 'bottom-0 left-0',
    br: 'bottom-0 right-0',
  }
  return (
    <span
      className={`absolute ${posMap[pos]} w-[7px] h-[7px] bg-white`}
    />
  )
}

export default function Hero() {
  return (
    <section className="relative w-full h-screen overflow-hidden font-[Barlow,sans-serif]">

      {/* ── Background Video ── */}
      <video
        className="absolute inset-0 w-full h-full object-cover"
        src={VIDEO_URL}
        autoPlay
        loop
        muted
        playsInline
      />

      {/* ── Floating Navbar ── */}
      <nav className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-10 py-7">
        {/* Brand */}
        <span
          className="text-white text-xl font-semibold tracking-widest uppercase"
          style={{ fontFamily: 'Barlow, sans-serif' }}
        >
          Royal Boutique
        </span>

        {/* Links */}
        <ul className="hidden md:flex items-center gap-1">
          {NAV_LINKS.map((link) => (
            <li key={link}>
              <a
                href="#"
                className="text-white text-sm font-medium px-4 py-2 rounded-md
                           transition-colors duration-200 hover:bg-white/10"
                style={{ fontFamily: 'Barlow, sans-serif' }}
              >
                {link}
              </a>
            </li>
          ))}
        </ul>

        {/* CTA */}
        <button
          className="hidden md:block text-[#171717] text-sm font-medium
                     bg-[#f8f8f8] hover:bg-white transition-colors duration-200
                     px-5 py-2.5 cursor-pointer"
          style={{ borderRadius: '2px', fontFamily: 'Barlow, sans-serif' }}
        >
          Get Started
        </button>
      </nav>

      {/* ── Hero Content ── */}
      <div className="relative z-10 flex flex-col items-center justify-end h-full pb-[250px]">

        {/* Featured Badge — liquid glass */}
        <div
          className="mb-10 flex items-center justify-center rounded-full
                     bg-white/10 backdrop-blur-sm p-[3px]
                     transition-colors duration-200 hover:bg-white/15 cursor-default"
        >
          <div
            className="flex items-center gap-2 bg-white/90 backdrop-blur-md
                       rounded-full px-4 py-1.5"
          >
            {/* Fortune star icon */}
            <svg
              width="14" height="14" viewBox="0 0 24 24" fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="text-[#171717]"
            >
              <path
                d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
                fill="currentColor"
              />
            </svg>
            <span
              className="text-[#171717] text-xs font-semibold tracking-wider uppercase"
              style={{ fontFamily: 'Barlow, sans-serif' }}
            >
              Featured in Fortune
            </span>
          </div>
        </div>

        {/* Headline container with corner accents */}
        <div className="relative inline-block px-8 py-6 mb-6">
          <Corner pos="tl" />
          <Corner pos="tr" />
          <Corner pos="bl" />
          <Corner pos="br" />

          <h1 className="text-center leading-tight">
            <span
              className="block text-white font-light"
              style={{ fontSize: '64px', fontFamily: 'Barlow, sans-serif' }}
            >
              Agency that makes your
            </span>
            <span
              className="block text-white italic"
              style={{
                fontSize: '64px',
                fontFamily: "'Instrument Serif', serif",
                fontStyle: 'italic',
              }}
            >
              videos &amp; reels viral
            </span>
          </h1>
        </div>

        {/* Sub-headline */}
        <p
          className="max-w-[560px] text-center text-white/75 text-base font-light leading-relaxed mb-8"
          style={{ fontFamily: 'Barlow, sans-serif' }}
        >
          We craft scroll-stopping content that turns brands into movements.
          From concept to cut, our creative team drives real reach, real engagement,
          and real growth — every single reel.
        </p>

        {/* CTA Buttons */}
        <div className="flex items-center gap-4">
          <button
            className="text-[#171717] text-sm font-medium
                       bg-[#f8f8f8] hover:bg-white transition-colors duration-200
                       px-8 py-3.5 cursor-pointer"
            style={{ borderRadius: '2px', fontFamily: 'Barlow, sans-serif' }}
          >
            Start a Project
          </button>

          <button
            className="text-white text-sm font-medium
                       bg-transparent border border-white/40 hover:bg-white/10
                       transition-colors duration-200 px-8 py-3.5 cursor-pointer"
            style={{ borderRadius: '2px', fontFamily: 'Barlow, sans-serif' }}
          >
            View Our Work
          </button>
        </div>
      </div>
    </section>
  )
}
