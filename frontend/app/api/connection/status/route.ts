import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
    const response = await fetch(`${apiUrl}/api/connection/status`)
    
    if (!response.ok) {
      throw new Error(`Backend responded with status: ${response.status}`)
    }
    
    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error fetching connection status:', error)
    return NextResponse.json(
      { 
        connected: false, 
        current_config: null, 
        connection_history: [],
        error: 'Failed to fetch connection status' 
      },
      { status: 500 }
    )
  }
} 