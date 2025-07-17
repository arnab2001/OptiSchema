/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://optischema-api:8000/:path*',
      },
    ]
  },
}

module.exports = nextConfig 