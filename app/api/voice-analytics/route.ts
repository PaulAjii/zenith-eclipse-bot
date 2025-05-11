import { NextRequest, NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';
import { ensureAnalyticsInitialized } from '@/app/api/init';

const { MONGO_URI, MONGO_DB } = process.env;
let client: MongoClient | null = null;
let voiceAnalyticsCollection: any = null;

async function getVoiceAnalyticsCollection() {
  if (!voiceAnalyticsCollection) {
    if (!client) {
      client = new MongoClient(MONGO_URI!);
      await client.connect();
    }
    voiceAnalyticsCollection = client.db(MONGO_DB).collection('voice_analytics');
    await voiceAnalyticsCollection.createIndex({ sessionId: 1 });
    await voiceAnalyticsCollection.createIndex({ timestamp: 1 });
  }
  return voiceAnalyticsCollection;
}

// POST: Log a voice interaction
export async function POST(req: NextRequest) {
  const initError = await ensureAnalyticsInitialized();
  if (initError) return initError;
  try {
    const body = await req.json();
    const { sessionId, userInfo, prompt, response, timestamp, metadata } = body;
    if (!sessionId || !userInfo || !prompt || !response) {
      return NextResponse.json({ status: 'Error', message: 'Missing required fields' }, { status: 400 });
    }
    const collection = await getVoiceAnalyticsCollection();
    const doc = {
      sessionId,
      userInfo,
      prompt,
      response,
      timestamp: timestamp ? new Date(timestamp) : new Date(),
      metadata: metadata || {},
    };
    await collection.insertOne(doc);
    return NextResponse.json({ status: 'Success', message: 'Voice interaction logged' }, { status: 201 });
  } catch (error) {
    console.error('Voice analytics log error:', error);
    return NextResponse.json({ status: 'Error', message: 'Failed to log voice interaction' }, { status: 500 });
  }
}

// GET: Fetch all voice analytics (for admin/testing)
export async function GET() {
  const initError = await ensureAnalyticsInitialized();
  if (initError) return initError;
  try {
    const collection = await getVoiceAnalyticsCollection();
    const all = await collection.find({}).sort({ timestamp: 1 }).toArray();
    return NextResponse.json({ status: 'Success', data: all }, { status: 200 });
  } catch (error) {
    console.error('Voice analytics fetch error:', error);
    return NextResponse.json({ status: 'Error', message: 'Failed to fetch voice analytics' }, { status: 500 });
  }
} 