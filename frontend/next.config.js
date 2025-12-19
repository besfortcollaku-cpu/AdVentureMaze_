/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          // Allow Pi sandbox to iframe your app
          {
            key: "Content-Security-Policy",
            value:
              "frame-ancestors 'self' https://sandbox.minepi.com https://minepi.com https://*.minepi.com;",
          },
          // Some environments block if this is present as SAMEORIGIN, so we override
          { key: "X-Frame-Options", value: "ALLOWALL" },
        ],
      },
    ];
  },
};

module.exports = nextConfig;