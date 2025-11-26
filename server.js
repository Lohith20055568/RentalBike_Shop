// server.js - JSON-backed Bike Rental API
const express = require('express');
const fs = require('fs').promises;
const path = require('path');

const DATA_FILE = path.join(__dirname, 'data.json');
const app = express();
app.use(express.json());
const PORT = process.env.PORT || 3000;

// ----------------------------------------------------
// 1) Serve the client folder (static UI)
// ----------------------------------------------------
app.use('/client', express.static(path.join(__dirname, 'client')));

// ----------------------------------------------------
// 2) Make "/" load the frontend automatically
//    This fixes: "Cannot GET /"
// ----------------------------------------------------
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'client', 'index.html'));
});

/**
 * Simple write queue to avoid concurrent writes corrupting file
 */
let writeLock = Promise.resolve();

async function readData() {
  try {
    const raw = await fs.readFile(DATA_FILE, 'utf8');
    return JSON.parse(raw);
  } catch (e) {
    if (e.code === 'ENOENT') {
      const init = { bikes: [], customers: [], rentals: [], nextIds: { bikes: 1, customers: 1, rentals: 1 } };
      await writeData(init);
      return init;
    }
    throw e;
  }
}
