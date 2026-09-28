// @ts-nocheck
import "./styles.css";
import { ContextDock } from "./dock";
import { initChrome } from "./chrome";
import { initHeroZoom } from "./hero-zoom";
import { initFeatureDemos } from "./feature-demos";
import { initClipboardDemo } from "./clipboard-demo";

declare global {
  interface Window {
    ContextDock: typeof ContextDock;
    Lenis: new (opts?: Record<string, unknown>) => {
      destroy?: () => void;
      raf?: (t: number) => void;
    };
  }
}

window.ContextDock = ContextDock;

async function loadLenis() {
  if (window.Lenis) return;
  await new Promise<void>((resolve, reject) => {
    const s = document.createElement("script");
    s.src = "/lenis.min.js";
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("lenis failed"));
    document.head.appendChild(s);
  });
}

await loadLenis().catch(() => {
  /* smooth scroll optional */
});

initChrome();
initHeroZoom();
initFeatureDemos();
initClipboardDemo();
