import { NextRequest, NextResponse } from 'next/server'

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000'

export async function POST(request: NextRequest) {
  try {
    const response = await fetch(`${BACKEND_URL}/api/connection/enable-pg-stat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    const data = await response.json()
    
    return NextResponse.json(data, {
      status: response.status,
    })
  } catch (error) {
    console.error('Failed to enable pg_stat_statements:', error)
    return NextResponse.json(
      { error: 'Failed to enable pg_stat_statements' },
      { status: 500 }
    )
  }
} 