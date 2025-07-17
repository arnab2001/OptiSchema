import Head from 'next/head'
import './globals.css'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <Head>
        <title>OptiSchema - AI-Powered PostgreSQL Optimization</title>
        <meta name="description" content="Monitor PostgreSQL workloads, identify performance bottlenecks, and get actionable optimization recommendations." />
      </Head>
      <body className="font-sans antialiased">{children}</body>
    </html>
  )
} 