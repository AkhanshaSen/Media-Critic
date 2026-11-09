/** Sample a cover image URL and return CSS custom properties for accent glow. */

export type CoverAccent = {
  accent: string;
  glow: string;
};

const FALLBACK: CoverAccent = {
  accent: "oklch(0.78 0.16 70)",
  glow: "oklch(0.55 0.14 70 / 0.35)",
};

export async function extractCoverAccent(
  imageUrl: string | null | undefined,
): Promise<CoverAccent> {
  if (!imageUrl || typeof window === "undefined") return FALLBACK;

  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        const size = 32;
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        if (!ctx) {
          resolve(FALLBACK);
          return;
        }
        ctx.drawImage(img, 0, 0, size, size);
        const data = ctx.getImageData(0, 0, size, size).data;
        let r = 0;
        let g = 0;
        let b = 0;
        let count = 0;
        for (let i = 0; i < data.length; i += 4) {
          const a = data[i + 3];
          if (a < 128) continue;
          r += data[i];
          g += data[i + 1];
          b += data[i + 2];
          count += 1;
        }
        if (!count) {
          resolve(FALLBACK);
          return;
        }
        r = Math.round(r / count);
        g = Math.round(g / count);
        b = Math.round(b / count);
        resolve({
          accent: `rgb(${r} ${g} ${b})`,
          glow: `rgba(${r}, ${g}, ${b}, 0.35)`,
        });
      } catch {
        resolve(FALLBACK);
      }
    };
    img.onerror = () => resolve(FALLBACK);
    img.src = imageUrl;
  });
}
