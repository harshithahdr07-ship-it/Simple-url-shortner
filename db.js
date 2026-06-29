import { MongoClient } from 'mongodb';

// Config
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/url_shortener';

let client;
let db;
let urlsCollection;

// Initialize Database connection
export async function initDb() {
  try {
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    
    // Extract database name from connection string or default to 'url_shortener'
    const dbName = MONGODB_URI.split('/').pop()?.split('?')[0] || 'url_shortener';
    db = client.db(dbName);
    urlsCollection = db.collection('urls');
    
    // Create unique index on short_code to ensure high-performance lookups and prevent collisions
    await urlsCollection.createIndex({ short_code: 1 }, { unique: true });
    // Create index on long_url for fast duplication checks
    await urlsCollection.createIndex({ long_url: 1 });
    
    console.log(`Successfully connected to MongoDB database: "${dbName}"`);
  } catch (err) {
    console.error('Failed to connect to MongoDB database:', err.message);
    throw err;
  }
}

// Mock of db.get for MongoDB
export async function dbGet(query, params = []) {
  if (!urlsCollection) {
    throw new Error('Database not initialized. Call initDb() first.');
  }

  if (query.includes('FROM urls WHERE long_url = ?')) {
    const longUrl = params[0];
    return await urlsCollection.findOne({ long_url: longUrl });
  }
  
  if (query.includes('FROM urls WHERE short_code = ?') || query.includes('WHERE short_code = ?')) {
    const shortCode = params[0];
    return await urlsCollection.findOne({ short_code: shortCode });
  }

  return null;
}

// Mock of db.all for MongoDB
export async function dbAll(query, params = []) {
  if (!urlsCollection) {
    throw new Error('Database not initialized. Call initDb() first.');
  }

  if (query.includes('ORDER BY created_at DESC')) {
    let cursor = urlsCollection.find().sort({ created_at: -1 });
    
    if (query.includes('LIMIT 50')) {
      cursor = cursor.limit(50);
    }
    
    return await cursor.toArray();
  }
  
  return await urlsCollection.find().toArray();
}

// Mock of db.run for MongoDB
export async function dbRun(query, params = []) {
  if (!urlsCollection) {
    throw new Error('Database not initialized. Call initDb() first.');
  }
  
  if (query.includes('CREATE TABLE IF NOT EXISTS')) {
    // Already handled in initDb indexes
    return { changes: 0 };
  }
  
  if (query.includes('INSERT INTO urls')) {
    const [short_code, long_url] = params;
    const newDoc = {
      id: Date.now(), // Generate a unique numeric ID for compatibility
      short_code,
      long_url,
      clicks: 0,
      created_at: new Date().toISOString()
    };
    
    await urlsCollection.insertOne(newDoc);
    return { lastID: newDoc.id, changes: 1 };
  }
  
  if (query.includes('UPDATE urls SET clicks = clicks + 1')) {
    const identifier = params[0]; // could be numeric ID or shortCode
    // Update count using MongoDB increment operator
    const result = await urlsCollection.updateOne(
      { $or: [{ id: identifier }, { short_code: identifier }] },
      { $inc: { clicks: 1 } }
    );
    
    return { changes: result.modifiedCount };
  }
  
  return { changes: 0 };
}
