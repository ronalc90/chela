/** @type {import('next').NextConfig} */
const nextConfig = {
  // El paquete de marca es ESM sin compilar; Next lo transpila al vuelo.
  transpilePackages: ['@chela/brand'],
  reactStrictMode: true,
  outputFileTracingRoot: new URL('../../', import.meta.url).pathname,
};

export default nextConfig;
