/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
  },
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client'],
  },
  // Evitar pré-renderização de rotas de API
  output: 'standalone',
}

module.exports = nextConfig
