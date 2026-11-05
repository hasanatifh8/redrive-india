/** @type {import('next').NextConfig} */
module.exports = {
  experimental: {
    serverComponentsExternalPackages: ['@libsql/client', 'libsql'],
    // Sell-your-car enquiries carry up to 8 compressed photos. Vercel's own cap is 4.5 MB.
    serverActions: { bodySizeLimit: '4mb' },
  },
  images: { unoptimized: true },
};
