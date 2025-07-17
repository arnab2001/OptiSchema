import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { recommendation_id } = await request.json()
    
    if (!recommendation_id) {
      return NextResponse.json({ 
        error: 'Missing recommendation_id' 
      }, { status: 400 })
    }

    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/suggestions/apply`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ recommendation_id })
    })
    
    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Suggestion application error:', error)
    return NextResponse.json({ 
      error: 'Failed to apply suggestion',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 