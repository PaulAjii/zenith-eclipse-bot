/**
 * Script to create a proper MongoDB Atlas Vector Search index
 * Run with: pnpm create-index
 */
import { MongoClient } from 'mongodb';
import 'dotenv/config';

const { MONGO_URI, MONGO_DB, MONGO_COLLECTION } = process.env;

async function createVectorSearchIndex() {
  if (!MONGO_URI || !MONGO_DB || !MONGO_COLLECTION) {
    console.error('Missing environment variables. Please check your .env file.');
    process.exit(1);
  }

  const client = new MongoClient(MONGO_URI);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB Atlas');
    
    // First, check MongoDB version and compatibility
    const adminDb = client.db('admin');
    const serverInfo = await adminDb.command({ buildInfo: 1 });
    console.log(`MongoDB Server Version: ${serverInfo.version}`);
    
    // Check if using Atlas by checking for "atlas" in server info
    const isAtlas = serverInfo.modules?.includes('enterprise') || 
                   JSON.stringify(serverInfo).toLowerCase().includes('atlas');
    
    if (!isAtlas) {
      console.log('\n========================================');
      console.log('WARNING: You do not appear to be using MongoDB Atlas.');
      console.log('Vector search is only available on MongoDB Atlas clusters.');
      console.log('========================================\n');
      console.log('Your options are:');
      console.log('1. Continue using the in-memory filtering approach (already implemented)');
      console.log('2. Migrate to MongoDB Atlas with Vector Search enabled');
      console.log('\nContinuing to use in-memory filtering for category-based filtering...');
      return;
    }
    
    // Continue with vector search index creation...
    const db = client.db(MONGO_DB);
    
    try {
      // Try to list search indexes to check if vector search is enabled
      const existingIndexes = await db.command({ listSearchIndexes: MONGO_COLLECTION });
      console.log('Vector search is enabled on this cluster.');
      
      // If we get here, we can try to modify the index
      const vectorIndex = existingIndexes.cursor.firstBatch.find(idx => idx.name === 'vector_index');
      
      if (vectorIndex) {
        console.log('Dropping existing vector index...');
        await db.command({
          dropSearchIndex: MONGO_COLLECTION,
          name: 'vector_index'
        });
        console.log('Existing index dropped successfully');
      }
      
      // Create a new vector search index with proper token field for category
      console.log('Creating new vector search index...');
      const indexDefinition = {
        name: 'vector_index',
        definition: {
          mappings: {
            dynamic: true,
            fields: {
              embedding: {
                type: 'knnVector',
                dimensions: 3072, // For text-embedding-3-large
                similarity: 'cosine'
              },
              // Add token search for category field
              category: {
                type: 'token'
              },
              // Add text search for content
              text: {
                type: 'string'
              }
            }
          }
        }
      };
      
      await db.command({
        createSearchIndex: MONGO_COLLECTION,
        ...indexDefinition
      });
      
      console.log('Vector search index created successfully!');
      console.log('You can now filter by category in vector searches.');
      
    } catch (cmdError) {
      if (cmdError.codeName === 'CommandNotFound') {
        console.log('\n========================================');
        console.log('ERROR: Vector search commands not available.');
        console.log('This could be because:');
        console.log('1. Your Atlas cluster tier doesn\'t support vector search');
        console.log('2. Vector search isn\'t enabled on your Atlas cluster');
        console.log('========================================\n');
        console.log('To enable vector search:');
        console.log('1. Log in to your MongoDB Atlas account');
        console.log('2. Go to your cluster settings');
        console.log('3. Enable vector search under "Additional Settings"');
        console.log('4. Make sure you\'re using M10 tier or higher');
        console.log('\nContinuing to use in-memory filtering for category-based filtering...');
      } else {
        throw cmdError;
      }
    }
    
  } catch (error) {
    console.error('Error creating vector search index:', error);
  } finally {
    await client.close();
    console.log('MongoDB connection closed');
  }
}

// Run the function
createVectorSearchIndex().catch(console.error); 