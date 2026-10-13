/*
Loads the Canvas Critters engine: plain scripts in public/doto-launcher/critters that share
globals, so they load in order, one after another, and only once per page.
*/

const ENGINE = ["world.js", "spider.js", "roomba.js", "stage.js"].map((f) => `/doto-launcher/critters/${f}`);

export type Critters = { wake(): void; toss(): void; stop(): void };

export type PageOptions = {
  canvas: HTMLCanvasElement;
  fabricCanvas: HTMLCanvasElement;
  input: HTMLElement;
  zoom: number;
  walls(): Element[];
  ledges(): Element[];
  nestOn: Element | null;
  /** World x, y and the way the dock faces (radians, default up). */
  dockAt(box: DOMRect, zoom: number): [number, number] | [number, number, number];
  still: boolean;
  isVisible(): boolean;
  signal: AbortSignal;
  fontDots?: string;
  fontMono?: string;
};

export type Engine = {
  mount(canvas: HTMLCanvasElement, opts: object): Critters;
  mountPage(opts: PageOptions): Critters;
};

declare global {
  interface Window {
    DotoCritters?: Engine;
  }
}

let loading: Promise<Engine> | null = null;

export function loadCritters(): Promise<Engine> {
  if (window.DotoCritters) return Promise.resolve(window.DotoCritters);
  loading ??= ENGINE.reduce<Promise<void>>(
    (ready, src) =>
      ready.then(
        () =>
          new Promise((resolve, reject) => {
            const script = document.createElement("script");
            script.src = src;
            script.onload = () => resolve();
            script.onerror = () => reject(new Error(`Could not load ${src}`));
            document.body.appendChild(script);
          }),
      ),
    Promise.resolve(),
  ).then(() => window.DotoCritters as Engine);
  return loading;
}
