import { DocxLoader } from '@langchain/community/document_loaders/fs/docx';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { MongoClient } from 'mongodb';
import 'dotenv/config';

import { vectorStore } from './dbconfig';

// Access MongoDB directly for clearing operations
const { MONGO_URI, MONGO_DB, MONGO_COLLECTION } = process.env;
const client = new MongoClient(MONGO_URI);
const collection = client.db(MONGO_DB).collection(MONGO_COLLECTION);

// Function to clear existing documents from the vector store
async function clearVectorStore() {
	try {
		console.log('Clearing existing documents from vector store...');
		const result = await collection.deleteMany({});
		console.log(`Cleared ${result.deletedCount} documents from the collection`);
	} catch (error) {
		console.error(`Failed to clear vector store: ${error.message}`);
		throw error;
	}
}

const files = [
	'./src/db/data/Air Cargo Rates .docx',
	'./src/db/data/Air Cargo.docx',
	'./src/db/data/Barley.docx',
	'./src/db/data/Chickpeas.docx',
	'./src/db/data/Coriander_Seeds.docx',
	'./src/db/data/Elevate Your Operations with Us.docx',
	'./src/db/data/End-to-End Transportation Services.docx',
	'./src/db/data/Ethylene.docx',
	'./src/db/data/Financial Management Services.docx',
	'./src/db/data/Flaxseed.docx',
	'./src/db/data/Flaxseed_Meal.docx',
	'./src/db/data/Flaxseed_Oil.docx',
	'./src/db/data/Flour.docx',
	'./src/db/data/Green_Lentils.docx',
	'./src/db/data/Millet.docx',
	'./src/db/data/Multimodal_and_Intermodal_Transport.docx',
	'./src/db/data/Oats.docx',
	'./src/db/data/Ocean Freight.docx',
	'./src/db/data/OOG Cargo Transport Services.docx',
	'./src/db/data/Peas.docx',
	'./src/db/data/Polyethylene.docx',
	'./src/db/data/Project_Cargo.docx',
	'./src/db/data/Propylene.docx',
	'./src/db/data/rail Cargo.docx',
	'./src/db/data/Rail Logistics Services.docx',
	'./src/db/data/Rapeseeds.docx',
	'./src/db/data/Rapeseed_Meal.docx',
	'./src/db/data/Rapeseed_oil.docx',
	'./src/db/data/Red_Lentils.docx',
	'./src/db/data/Soybean_Meal.docx',
	'./src/db/data/Sunflower Seeds.docx',
	'./src/db/data/Sunflower_Meal.docx',
	'./src/db/data/Sunflower_Oil.docx',
	'./src/db/data/Supply Chain Solutions.docx',
	'./src/db/data/Temperature Controlled Logistics.docx',
	'./src/db/data/Truck Transport rate.docx',
	'./src/db/data/Truck Transport.docx',
	'./src/db/data/Wheat.docx'
];

async function seedDocuments() {
	try {
		// Load the DOCX file and extract text from it
		const loader = files.map((file) => new DocxLoader(file));

		let docs = [];

		console.log(`Processing ${files.length} documents...`);
		for (const doc of loader) {
			const loadedDocs = await doc.load();
			docs = docs.concat(loadedDocs);
		}
		console.log(`Loaded ${docs.length} documents successfully`);

		// Split the loaded documents into smaller chunks
		const splitter = new RecursiveCharacterTextSplitter({
			chunkSize: 1000,
			chunkOverlap: 200,
		});

		const splitDocs = await splitter.splitDocuments(docs);
		console.log(`Created ${splitDocs.length} chunks from ${docs.length} documents`);

		// Add the split documents into the vector store
		await vectorStore.addDocuments(splitDocs);
		console.log('Documents added to the vector store successfully');
	} catch (error) {
		console.error(`Error during seeding: ${error.message}`);
		throw error;
	}
}

// Main execution function
async function main() {
	try {
		// Check if --clear flag is provided
		const shouldClear = process.argv.includes('--clear');
		
		if (shouldClear) {
			await clearVectorStore();
		}
		
		await seedDocuments();
		
		// Close the MongoDB connection
		await client.close();
		console.log('Seeding completed successfully');
		process.exit(0);
	} catch (error) {
		console.error('Seeding process failed:', error);
		await client.close();
		process.exit(1);
	}
}

// Execute the main function
main();
