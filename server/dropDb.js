import { MongoClient } from 'mongodb';

const uri = 'mongodb+srv://marketdays462:BD0SOkseHIcnreDC@cluster0.waphz.mongodb.net/4market?retryWrites=true&w=majority';
const dbName = '4market';
const collectionName = 'orders';

const client = new MongoClient(uri);

async function run() {
  try {
    await client.connect();
    const db = client.db(dbName);

    // Step 1: Check if collection exists before dropping
    const collectionsBefore = await db.listCollections({}, { nameOnly: true }).toArray();
    const existsBefore = collectionsBefore.some(col => col.name === collectionName);

    if (!existsBefore) {
      console.log(`Collection "${collectionName}" does not exist.`);
      return;
    }

    // Step 2: Drop the collection
    await db.collection(collectionName).drop();
    console.log(`Collection "${collectionName}" dropped successfully.`);

    // Step 3: Confirm it's gone
    const collectionsAfter = await db.listCollections({}, { nameOnly: true }).toArray();
    const existsAfter = collectionsAfter.some(col => col.name === collectionName);

    if (!existsAfter) {
      console.log(`✅ Confirmation: Collection "${collectionName}" no longer exists.`);
    } else {
      console.log(`❌ Collection "${collectionName}" still exists.`);
    }

  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await client.close();
  }
}

run();
