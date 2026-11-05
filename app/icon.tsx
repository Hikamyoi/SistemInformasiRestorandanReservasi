import { ImageResponse } from "next/og";

// Pengaturan ukuran favicon
export const size = {
  width: 32,
  height: 32,
};
export const contentType = "image/png";

// Komponen favicon logo Elevenicious (Angka 11 + Garpu & Pisau)
export default function Icon() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#F59E0B",
        borderRadius: 8,
      }}
    >
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ width: 22, height: 22 }}
      >
        {/* Angka 1: Garpu */}
        <g fill="#FFFFFF">
          <path d="M35 18V38C35 41.5 37.5 44 41 45V80H45V45C48.5 44 51 41.5 51 38V18H48V34H46V18H44V34H42V18H39V34H37V18H35Z" />
          <path d="M36 40L26 47V53L36 46V40Z" />
        </g>
        {/* Angka 1: Pisau */}
        <g fill="#FFFFFF">
          <path d="M57 18H62V42L68 56C68 68 63 80 57 80V18Z" />
          <path d="M57 40L48 47V53L57 46V40Z" />
        </g>
      </svg>
    </div>,
    { ...size },
  );
}
