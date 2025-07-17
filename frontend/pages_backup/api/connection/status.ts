import { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/connection/status`)
    const data = await response.json()
    res.status(200).json(data)
  } catch (error) {
    res.status(500).json({ connected: false, details: 'Failed to check backend connection status' })
  }
} 