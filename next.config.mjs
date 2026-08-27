/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    // Cargo photo uploads and bulk batch actions travel through server actions.
    serverActions: {
      // Vercel refuses a serverless request body over 4.5 MB and no setting
      // raises it, so anything above this was a promise the platform breaks —
      // the request dies at the edge and the action never runs, which is why
      // the failure surfaced as "Something went wrong" with nothing saved.
      // Photos are shrunk in the browser before they get here; see PhotoCapture.
      bodySizeLimit: "4mb",
    },
  },
  images: {
    /*
      No 2048 or 3840.

      Next's optimizer aborts an upstream fetch at seven seconds, and asking a
      remote CDN for a source big enough to fill a 3840-wide variant regularly
      took longer than that — the request 500s and the page renders with an
      empty space where the photograph should be. Nothing here is art-directed
      for a 4K display; 1920 covers a 1440 layout at 2x DPR for the widths we
      actually serve, and every generated variant is one more re-encode on a
      cold cache.
    */
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        // Cargo photos and proof-of-delivery images live in Vercel Blob.
        protocol: "https",
        hostname: "**.public.blob.vercel-storage.com",
      },
    ],
  },
};

export default nextConfig;
