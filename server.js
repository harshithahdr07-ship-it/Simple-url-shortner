import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import path from 'path';
import crypto from 'crypto';
import { dbRun, dbGet, dbAll, initDb } from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Initialize Database Table
async function init() {
  await initDb();
  console.log('Database initialized successfully.');
}
init().catch(console.error);

// Helper function to generate a secure random 6-character alphanumeric code
function generateShortCode() {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  const bytes = crypto.randomBytes(6);
  for (let i = 0; i < 6; i++) {
    code += chars[bytes[i] % chars.length];
  }
  return code;
}

// API: Shorten a long URL
app.post('/api/shorten', async (req, res) => {
  const { longUrl } = req.body;

  if (!longUrl) {
    return res.status(400).json({ error: 'URL is required' });
  }

  // Basic URL Validation & Normalization
  let parsedUrl;
  try {
    parsedUrl = new URL(longUrl);
  } catch (err) {
    return res.status(400).json({ error: 'Please enter a valid absolute URL (e.g., https://example.com)' });
  }

  if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
    return res.status(400).json({ error: 'Only HTTP and HTTPS protocols are supported' });
  }

  try {
    // Check if this URL is already shortened to avoid duplicates (optional but saves space)
    const existing = await dbGet('SELECT * FROM urls WHERE long_url = ?', [longUrl]);
    if (existing) {
      return res.json({
        shortCode: existing.short_code,
        longUrl: existing.long_url,
        clicks: existing.clicks,
        createdAt: existing.created_at,
        shortUrl: `${req.protocol}://${req.get('host')}/${existing.short_code}`
      });
    }

    // Generate unique short code
    let shortCode = generateShortCode();
    let collision = await dbGet('SELECT 1 FROM urls WHERE short_code = ?', [shortCode]);
    
    // Collision loop (rare, but good practice)
    let retries = 5;
    while (collision && retries > 0) {
      shortCode = generateShortCode();
      collision = await dbGet('SELECT 1 FROM urls WHERE short_code = ?', [shortCode]);
      retries--;
    }

    // Save to Database
    await dbRun(
      'INSERT INTO urls (short_code, long_url) VALUES (?, ?)',
      [shortCode, longUrl]
    );

    const dbRecord = await dbGet('SELECT * FROM urls WHERE short_code = ?', [shortCode]);

    return res.status(201).json({
      shortCode: dbRecord.short_code,
      longUrl: dbRecord.long_url,
      clicks: dbRecord.clicks,
      createdAt: dbRecord.created_at,
      shortUrl: `${req.protocol}://${req.get('host')}/${dbRecord.short_code}`
    });
  } catch (error) {
    console.error('Error shortening URL:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// API: Get recent links
app.get('/api/links', async (req, res) => {
  try {
    const rows = await dbAll('SELECT * FROM urls ORDER BY created_at DESC LIMIT 50');
    // Map backend snake_case keys to camelCase for the frontend
    const links = rows.map(row => ({
      id: row.id,
      shortCode: row.short_code,
      longUrl: row.long_url,
      clicks: row.clicks,
      createdAt: row.created_at,
      shortUrl: `${req.protocol}://${req.get('host')}/${row.short_code}`
    }));
    return res.json(links);
  } catch (error) {
    console.error('Error retrieving links:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Route: Redirect from short code to original URL
app.get('/:code', async (req, res) => {
  const { code } = req.params;

  // Ignore static assets or favicon request
  if (code === 'favicon.ico' || code.startsWith('api') || code.includes('.')) {
    return res.status(404).send('Not Found');
  }

  try {
    const record = await dbGet('SELECT * FROM urls WHERE short_code = ?', [code]);

    if (!record) {
      // Return a premium styled 404 page
      return res.status(404).send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Link Not Found | SnipURL</title>
          <link rel="preconnect" href="https://fonts.googleapis.com">
          <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
          <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;800&display=swap" rel="stylesheet">
          <style>
            :root {
              --bg-gradient: linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #311042 100%);
              --text-main: #f8fafc;
              --text-muted: #94a3b8;
              --primary: #8b5cf6;
              --secondary: #d946ef;
            }
            body {
              font-family: 'Outfit', sans-serif;
              background: var(--bg-gradient);
              color: var(--text-main);
              min-height: 100vh;
              display: flex;
              align-items: center;
              justify-content: center;
              margin: 0;
              padding: 20px;
              box-sizing: border-box;
              text-align: center;
            }
            .card {
              background: rgba(255, 255, 255, 0.03);
              backdrop-filter: blur(20px);
              border: 1px solid rgba(255, 255, 255, 0.08);
              border-radius: 24px;
              padding: 48px 32px;
              max-width: 480px;
              width: 100%;
              box-shadow: 0 20px 50px rgba(0, 0, 0, 0.3);
            }
            h1 {
              font-size: 5rem;
              font-weight: 800;
              margin: 0;
              background: linear-gradient(to right, var(--primary), var(--secondary));
              -webkit-background-clip: text;
              -webkit-text-fill-color: transparent;
              line-height: 1;
            }
            h2 {
              font-size: 1.75rem;
              margin: 16px 0 8px 0;
              font-weight: 600;
            }
            p {
              color: var(--text-muted);
              font-size: 1rem;
              margin-bottom: 32px;
              line-height: 1.5;
            }
            .btn {
              display: inline-block;
              background: linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%);
              color: white;
              text-decoration: none;
              padding: 14px 32px;
              border-radius: 12px;
              font-weight: 600;
              transition: all 0.3s ease;
              box-shadow: 0 8px 20px rgba(139, 92, 246, 0.3);
            }
            .btn:hover {
              transform: translateY(-2px);
              box-shadow: 0 12px 28px rgba(139, 92, 246, 0.5);
            }
          </style>
        </head>
        <body>
          <div class="card">
            <h1>404</h1>
            <h2>Link Not Found</h2>
            <p>The shortened link you are trying to access does not exist or has expired.</p>
            <a href="/" class="btn">Back to Shortener</a>
          </div>
        </body>
        </html>
      `);
    }

    // Increment click count asynchronously
    dbRun('UPDATE urls SET clicks = clicks + 1 WHERE id = ?', [record.id]).catch(err => {
      console.error('Failed to increment click count:', err.message);
    });

    // Redirect to long URL
    return res.redirect(record.long_url);
  } catch (error) {
    console.error('Error handling redirect:', error);
    return res.status(500).send('Internal server error');
  }
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
