"use client";

import { Globe } from "@/components/ui/cobe-globe";

/**
 * The China → Zambia corridor, on a globe.
 *
 * MODULE-LEVEL CONSTANTS, not inline arrays. The Globe rebuilds its WebGL
 * context whenever a prop's identity changes, so `markers={[...]}` written
 * inline would tear down and recreate the scene on every render and pin a CPU
 * core. Declared once here, they are referentially stable forever.
 *
 * The four points are the real route: two loading airports in China, the two
 * hubs cargo connects through, and Lusaka. Drawn on a navy globe with emerald
 * land so it belongs to the brand rather than looking like the demo.
 */
const MARKERS = [
  { id: "gz", location: [23.1291, 113.2644] as [number, number], label: "Guangzhou" },
  { id: "hk", location: [22.3193, 114.1694] as [number, number], label: "Hong Kong" },
  { id: "dxb", location: [25.2048, 55.2708] as [number, number], label: "Dubai" },
  { id: "add", location: [8.9806, 38.7578] as [number, number], label: "Addis Ababa" },
  { id: "lun", location: [-15.3875, 28.3228] as [number, number], label: "Lusaka" },
];

const ARCS = [
  {
    id: "gz-lun",
    from: [23.1291, 113.2644] as [number, number],
    to: [-15.3875, 28.3228] as [number, number],
    label: "Guangzhou → Lusaka",
  },
  {
    id: "hk-lun",
    from: [22.3193, 114.1694] as [number, number],
    to: [-15.3875, 28.3228] as [number, number],
  },
  {
    id: "gz-dxb",
    from: [23.1291, 113.2644] as [number, number],
    to: [25.2048, 55.2708] as [number, number],
  },
  {
    id: "dxb-lun",
    from: [25.2048, 55.2708] as [number, number],
    to: [-15.3875, 28.3228] as [number, number],
  },
];

/*
  Brand inks as cobe wants them: linear RGB, 0–1.

  The sphere is lifted well above the hero's navy rather than matched to it.
  Tuned to the brand value exactly, the globe disappeared into the photograph
  behind it — a dark sphere on a dark field with no edge. It has to read as an
  object sitting in front of the image, so the base is a lighter slate and the
  land dots are brightened until the continents are legible at 480px.
*/
const SPHERE: [number, number, number] = [0.13, 0.2, 0.32];
const EMERALD: [number, number, number] = [0.13, 0.72, 0.58];
const COPPER: [number, number, number] = [0.95, 0.58, 0.2];
const GLOW: [number, number, number] = [0.09, 0.18, 0.32];

export function RouteGlobe({ className }: { className?: string }) {
  return (
    <Globe
      className={className}
      markers={MARKERS}
      arcs={ARCS}
      baseColor={SPHERE}
      markerColor={COPPER}
      arcColor={EMERALD}
      glowColor={GLOW}
      dark={1}
      diffuse={1.35}
      mapBrightness={9}
      markerSize={0.038}
      markerElevation={0.012}
      arcWidth={0.7}
      arcHeight={0.4}
      speed={0.0022}
      theta={-0.05}
      labelBackground="#0A1B33"
      labelColor="#FAF8F4"
    />
  );
}
