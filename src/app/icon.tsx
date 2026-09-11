import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

/** Browser-tab icon: the orange "N" tile from the wordmark. */
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 8,
          background: "#f4671f",
          color: "white",
          fontSize: 22,
          fontWeight: 900,
        }}
      >
        N
      </div>
    ),
    size,
  );
}
