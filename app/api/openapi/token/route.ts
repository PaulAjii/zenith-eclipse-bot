import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const response = await fetch('https://api.openai.com/v1/realtime/sessions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o-realtime-preview',
        voice: 'verse'
      })
    })

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error: any) {
    console.error('[GET /api/session] error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}