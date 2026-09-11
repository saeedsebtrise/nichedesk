import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

/** Home-screen icon for iOS; iOS applies its own corner mask. */
export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #ff8a3d 0%, #f4671f 60%, #e2560f 100%)",
          color: "white",
          fontSize: 118,
          fontWeight: 900,
        }}
      >
        N
      </div>
    ),
    size,
  );
}
