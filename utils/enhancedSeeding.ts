import { DocxLoader } from '@langchain/community/document_loaders/fs/docx';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { MongoClient } from 'mongodb';
import fs from 'fs';
import path from 'path';
import 'dotenv/config';

import { vectorStore } from '../db/config.js';
import { identifyDocumentCategory } from './categoryUtils.js';

// Verbose logging for diagnostic purposes
console.log('Starting enhanced seeding script...');
console.log(`Environment variables loaded: MONGO_URI exists: ${!!process.env.MONGO_URI}, MONGO_DB: ${process.env.MONGO_DB}, MONGO_COLLECTION: ${process.env.MONGO_COLLECTION}`);

// MongoDB access for clearing operations
const { MONGO_URI, MONGO_DB, MONGO_COLLECTION } = process.env;

if (!MONGO_URI || !MONGO_DB || !MONGO_COLLECTION) {
  console.error('Missing required MongoDB environment variables. Check your .env file.');
  process.exit(1);
}

console.log('Initializing MongoDB connection...');
const client = new MongoClient(MONGO_URI);
const collection = client.db(MONGO_DB).collection(MONGO_COLLECTION);

// Clear the vector store before seeding
async function clearVectorStore() {
  console.log('Starting clearVectorStore function...');
  try {
    console.log('Attempting to connect to MongoDB...');
    await client.connect();
    console.log('MongoDB connection successful');
    
    console.log('Clearing existing documents from vector store...');
    const result = await collection.deleteMany({});
    console.log(`Cleared ${result.deletedCount} documents from the collection`);
    return result.deletedCount;
  } catch (error) {
    console.error(`Failed to clear vector store: ${error.message}`);
    console.error(error.stack);
    throw error;
  }
}

// Process all documents in the data directory
async function seedDocumentsWithMetadata() {
  console.log('Starting seedDocumentsWithMetadata function...');
  try {
    console.log('Ensuring MongoDB connection...');
    try {
      // Check if we need to connect
      await client.db(MONGO_DB).command({ ping: 1 });
      console.log('MongoDB connection is already active');
    } catch (connErr) {
      console.log('MongoDB not connected, connecting now...');
      await client.connect();
      console.log('MongoDB connection successful');
    }

    const DATA_DIR = './src/db/data';
    console.log(`Looking for documents in directory: ${DATA_DIR}`);
    
    // Check if directory exists
    if (!fs.existsSync(DATA_DIR)) {
      console.error(`Directory not found: ${DATA_DIR}`);
      throw new Error(`Data directory not found: ${DATA_DIR}`);
    }
    
    // Read all files from the data directory
    console.log('Reading files from directory...');
    const allFiles = fs.readdirSync(DATA_DIR);
    console.log(`Total files found in directory: ${allFiles.length}`);
    
    const files = allFiles
      .filter(file => file.toLowerCase().endsWith('.docx'))
      .map(file => path.join(DATA_DIR, file));
    
    console.log(`Found ${files.length} DOCX documents to process`);
    
    if (files.length === 0) {
      console.warn('No DOCX files found in the data directory!');
      return {
        totalFiles: 0,
        successfulFiles: 0,
        failedFiles: 0,
        totalDocuments: 0,
        totalChunks: 0
      };
    }
    
    let processedDocs = [];
    let failedFiles = [];
    
    // Process each file with metadata
    for (const filePath of files) {
      try {
        const filename = path.basename(filePath);
        console.log(`Processing: ${filename}`);
        
        // Verify file exists
        if (!fs.existsSync(filePath)) {
          console.error(`File not found: ${filePath}`);
          failedFiles.push(filePath);
          continue;
        }
        
        // Load the document
        console.log(`  - Loading document: ${filename}`);
        const loader = new DocxLoader(filePath);
        const loadedDocs = await loader.load();
        console.log(`  - Successfully loaded document with ${loadedDocs.length} segments`);
        
        // Add metadata to each document
        const category = identifyDocumentCategory(filename);
        console.log(`  - Identified category: ${category}`);
        
        loadedDocs.forEach(doc => {
          doc.metadata = {
            ...doc.metadata,
            source: filename,
            category: category.toString(),
            created_at: new Date().toISOString(),
            filePath: filePath
          };
        });
        
        processedDocs = processedDocs.concat(loadedDocs);
        console.log(`  - Added metadata: Category=${category}, Source=${filename}`);
      } catch (error) {
        console.error(`Error processing ${filePath}: ${error.message}`);
        console.error(error.stack);
        failedFiles.push(filePath);
      }
    }
    
    console.log(`Successfully processed ${processedDocs.length} documents from ${files.length - failedFiles.length} files`);
    if (failedFiles.length > 0) {
      console.warn(`Failed to process ${failedFiles.length} files:`);
      failedFiles.forEach(file => console.warn(`  - ${file}`));
    }
    
    if (processedDocs.length === 0) {
      console.warn('No documents were successfully processed. Check file formats and permissions.');
      return {
        totalFiles: files.length,
        successfulFiles: 0,
        failedFiles: failedFiles.length,
        totalDocuments: 0,
        totalChunks: 0
      };
    }
    
    // Split documents with appropriate chunk size
    console.log('Splitting documents into chunks...');
    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 800,  // Slightly smaller chunks for better precision
      chunkOverlap: 150,
    });
    
    console.log('Starting document splitting process...');
    const splitDocs = await splitter.splitDocuments(processedDocs);
    console.log(`Created ${splitDocs.length} chunks from ${processedDocs.length} documents`);
    
    // Add documents to vector store
    console.log('Adding documents to vector store...');
    console.log(`First few chunks (${Math.min(3, splitDocs.length)}):`);
    for (let i = 0; i < Math.min(3, splitDocs.length); i++) {
      console.log(`  - Chunk ${i + 1}: ${splitDocs[i].pageContent.substring(0, 50)}...`);
      console.log(`    Metadata: ${JSON.stringify(splitDocs[i].metadata)}`);
    }
    
    console.log('Starting vectorStore.addDocuments call...');
    await vectorStore.addDocuments(splitDocs);
    console.log('Documents successfully added to vector store');
    
    return {
      totalFiles: files.length,
      successfulFiles: files.length - failedFiles.length,
      failedFiles: failedFiles.length,
      totalDocuments: processedDocs.length,
      totalChunks: splitDocs.length
    };
  } catch (error) {
    console.error(`Seeding error: ${error.message}`);
    console.error(error.stack);
    throw error;
  }
}

// Main execution function
async function main() {
  console.log('Starting main execution function...');
  try {
    // Parse command line arguments
    const shouldClear = process.argv.includes('--clear');
    console.log(`Clear flag enabled: ${shouldClear}`);
    
    if (shouldClear) {
      console.log('Clearing vector store before seeding...');
      const deletedCount = await clearVectorStore();
      console.log(`Cleared ${deletedCount} documents from the vector store.`);
    }
    
    console.log('Starting seeding process with metadata...');
    const results = await seedDocumentsWithMetadata();
    
    console.log('\nSeeding Summary:');
    console.log(`- Files processed: ${results.successfulFiles}/${results.totalFiles}`);
    console.log(`- Documents extracted: ${results.totalDocuments}`);
    console.log(`- Chunks created: ${results.totalChunks}`);
    console.log(`- Failed files: ${results.failedFiles}`);
    
    // Close MongoDB connection
    console.log('Closing MongoDB connection...');
    await client.close();
    console.log('\nSeeding completed successfully');
  } catch (error) {
    console.error('Seeding process failed:');
    console.error(error);
    
    try {
      console.log('Attempting to close MongoDB connection...');
      await client.close();
      console.log('MongoDB connection closed');
    } catch (closeError) {
      console.error('Failed to close MongoDB connection:', closeError);
    }
    
    process.exit(1);
  }
}

// In ESM modules, directly run the main function
// This is simpler and more reliable than trying to detect if it's the main module
console.log('Starting script execution...');
main().catch(error => {
  console.error('Unhandled error in main function:', error);
  process.exit(1);
});

// Export for potential programmatic use
export { seedDocumentsWithMetadata, clearVectorStore }; 