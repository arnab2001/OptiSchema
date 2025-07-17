/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/metrics/raw',
        destination: 'http://optischema-api:8000/metrics/raw',
      },
      {
        source: '/api/suggestions/latest',
        destination: 'http://optischema-api:8000/suggestions/latest',
      },
      {
        source: '/api/connection/:path*',
        destination: 'http://optischema-api:8000/api/connection/:path*',
      },
      {
        source: '/api/analysis/:path*',
        destination: 'http://optischema-api:8000/analysis/:path*',
      },
    ]
  },
}

module.exports = nextConfig 