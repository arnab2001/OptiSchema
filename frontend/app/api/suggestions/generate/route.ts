import { NextResponse } from 'next/server'

export async function POST() {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/suggestions/generate`, {
      method: 'POST'
    })
    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Suggestions generation error:', error)
    return NextResponse.json({ 
      error: 'Failed to generate suggestions',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 