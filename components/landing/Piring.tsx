/** Foto menu dalam piring bundar. Jika foto kosong, tampil piring placeholder. */
export default function Piring({
  foto,
  nama,
  className = "",
}: {
  foto?: string | null;
  nama: string;
  className?: string;
}) {
  return (
    <div
      className={`relative aspect-square rounded-full bg-white p-[6%] shadow-[0_18px_40px_-12px_rgba(180,110,0,0.35)] ring-1 ring-amber-100 ${className}`}
    >
      {foto ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={foto} alt={nama} className="h-full w-full rounded-full object-cover" />
      ) : (
        <div
          role="img"
          aria-label={nama}
          className="flex h-full w-full items-center justify-center rounded-full bg-gradient-to-br from-amber-100 to-amber-200 text-5xl"
        >
          🍽️
        </div>
      )}
    </div>
  );
}
