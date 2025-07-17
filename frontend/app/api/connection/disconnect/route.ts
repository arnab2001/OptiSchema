import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
    
    const response = await fetch(`${apiUrl}/api/connection/disconnect`, {
      method: 'POST',
    })
    
    if (!response.ok) {
      throw new Error(`Backend responded with status: ${response.status}`)
    }
    
    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error disconnecting:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to disconnect'
      },
      { status: 500 }
    )
  }
} 