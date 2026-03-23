/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: [],
  },
  // Leaflet requires transpiling on SSR
  transpilePackages: ['leaflet'],
}

export default nextConfig
