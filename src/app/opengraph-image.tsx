import { readFile } from "node:fs/promises";
import { join } from "node:path";

import { ImageResponse } from "next/og";

export const alt =
  "NicheDesk — the Etsy keyword research organizer for eRank CSV exports, shown on a laptop";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const read = (...parts: string[]) => readFile(join(process.cwd(), ...parts));

/**
 * The share card, drawn at build time from the real product screenshot.
 *
 * Fonts are read from @fontsource's WOFF files: next/og's built-in font has no
 * bold weight, and Satori cannot read the WOFF2 files next/font serves.
 */
export default async function OpengraphImage() {
  const [shot, display, body] = await Promise.all([
    read("src", "assets", "screenshots", "work.png"),
    read(
      "node_modules",
      "@fontsource",
      "bricolage-grotesque",
      "files",
      "bricolage-grotesque-latin-800-normal.woff",
    ),
    read(
      "node_modules",
      "@fontsource",
      "plus-jakarta-sans",
      "files",
      "plus-jakarta-sans-latin-600-normal.woff",
    ),
  ]);

  const screenshot = `data:image/png;base64,${shot.toString("base64")}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          position: "relative",
          overflow: "hidden",
          background: "linear-gradient(135deg, #fffaf5 0%, #ffe9d6 100%)",
          fontFamily: "Jakarta",
          color: "#24170f",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: -220,
            right: -160,
            width: 760,
            height: 760,
            borderRadius: 9999,
            background: "radial-gradient(closest-side, rgba(244,103,31,0.35), rgba(244,103,31,0))",
          }}
        />

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            width: 560,
            padding: "64px 0 60px 68px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div
              style={{
                width: 60,
                height: 60,
                borderRadius: 16,
                background: "#f4671f",
                color: "white",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: "Bricolage",
                fontSize: 38,
              }}
            >
              N
            </div>
            <div style={{ display: "flex", fontFamily: "Bricolage", fontSize: 38 }}>
              Niche<span style={{ color: "#f4671f" }}>Desk</span>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
            <div
              style={{
                fontFamily: "Bricolage",
                fontSize: 58,
                lineHeight: 1.02,
                letterSpacing: -2,
              }}
            >
              Turn eRank exports into an Etsy niche plan.
            </div>
            <div style={{ display: "flex", gap: 10, fontSize: 22, color: "#5c4636" }}>
              <span>png</span>
              <span style={{ color: "#f4671f" }}>›</span>
              <span>christmas png</span>
              <span style={{ color: "#f4671f" }}>›</span>
              <span>christmas tree png</span>
            </div>
          </div>

          <div style={{ display: "flex", fontSize: 20, color: "#8a7263" }}>
            Etsy keyword research organizer · No signup
          </div>
        </div>

        <div
          style={{
            position: "absolute",
            top: 118,
            left: 640,
            width: 700,
            display: "flex",
            padding: 12,
            borderRadius: 26,
            background: "#141416",
            boxShadow: "0 40px 80px -20px rgba(36,23,15,0.5)",
          }}
        >
          {/* 16:10, matching the screenshot, so nothing is stretched. next/image
              cannot render inside ImageResponse, so a plain <img> is required. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={screenshot}
            width={676}
            height={422}
            alt=""
            style={{ borderRadius: 12, objectFit: "cover", objectPosition: "top left" }}
          />
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Bricolage", data: display, weight: 800, style: "normal" },
        { name: "Jakarta", data: body, weight: 600, style: "normal" },
      ],
    },
  );
}
