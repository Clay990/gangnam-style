/** @type {import('next').Config} */
const config = {
  reactStrictMode: true,
  images: {
    // Add all the hostnames your app uses here
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
      },
      {
        protocol: 'https',
        hostname: 'source.boomplaymusic.com',
      },
      {
        // --- ADD THIS BLOCK ---
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      }
    ],
  },
};

export default config;

