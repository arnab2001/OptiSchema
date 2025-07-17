import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/health`)
    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Health check error:', error)
    return NextResponse.json({ 
      status: 'unhealthy',
      error: 'Failed to check backend health',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 