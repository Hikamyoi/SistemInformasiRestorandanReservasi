export default function LogoElevenicious({
  ukuran = "md",
  denganTeks = true,
}: {
  ukuran?: "sm" | "md" | "lg";
  denganTeks?: boolean;
}) {
  const ukuranIcon =
    ukuran === "sm" ? "h-7 w-7" : ukuran === "lg" ? "h-11 w-11" : "h-9 w-9";
  const ukuranTeks =
    ukuran === "sm" ? "text-lg" : ukuran === "lg" ? "text-2xl" : "text-xl";

  return (
    <div className="flex items-center gap-2.5">
      {/* Icon Vektor Angka 11 + Garpu & Pisau */}
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`${ukuranIcon} shrink-0`}
      >
        {/* Lingkaran / Kotak Rounded Oranye Hangat */}
        <rect width="100" height="100" rx="28" fill="#F59E0B" />

        {/* Angka 1 Pertama: Siluet Garpu dengan Sirip Angka 1 */}
        <g fill="#FFFFFF">
          {/* Gerigi garpu & batang */}
          <path d="M35 24V40C35 43.5 37.5 46 41 46.8V74H45V46.8C48.5 46 51 43.5 51 40V24H48V36H46V24H44V36H42V24H39V36H37V24H35Z" />
          {/* Sirip miring khas angka 1 */}
          <path d="M36 41L27 47V53L36 47V41Z" />
        </g>

        {/* Angka 1 Kedua: Siluet Pisau dengan Sirip Angka 1 */}
        <g fill="#FFFFFF">
          {/* Gagang & bilah pisau */}
          <path d="M57 24H62V43L68 56C68 66 63 74 57 74V24Z" />
          {/* Sirip miring khas angka 1 */}
          <path d="M57 41L49 47V53L57 47V41Z" />
        </g>
      </svg>

      {/* Tipografi Elevenicious */}
      {denganTeks && (
        <span
          className={`font-[family-name:var(--font-baloo)] ${ukuranTeks} font-extrabold tracking-tight text-neutral-900 leading-none`}
        >
          Eleven<span className="text-amber-500">icious</span>
        </span>
      )}
    </div>
  );
}
