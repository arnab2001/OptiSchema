import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const backendUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/metrics/trends`
    
    const response = await fetch(backendUrl)
    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Trends fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch trends data' },
      { status: 500 }
    )
  }
} 