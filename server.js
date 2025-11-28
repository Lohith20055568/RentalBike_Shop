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

function writeData(data) {
  writeLock = writeLock.then(async () => {
    const tmp = DATA_FILE + '.tmp';
    await fs.writeFile(tmp, JSON.stringify(data, null, 2), 'utf8');
    await fs.rename(tmp, DATA_FILE);
  }).catch(err => console.error('writeData error', err));
  return writeLock;
}

/* ---------- generic helpers ---------- */

async function createEntity(kind, payload, required = []) {
  if (required.some(f => payload[f] === undefined || payload[f] === '')) {
    const missing = required.filter(f => payload[f] === undefined || payload[f] === '');
    const e = new Error('Missing fields: ' + missing.join(', '));
    e.status = 400;
    throw e;
  }
  const data = await readData();
  const id = data.nextIds[kind]++;
  const entity = { id, ...payload };
  data[kind].push(entity);
  await writeData(data);
  return entity;
}

async function getAll(kind) {
  const data = await readData();
  return data[kind];
}

async function getById(kind, id) {
  const data = await readData();
  return data[kind].find(x => x.id === Number(id));
}

async function updateById(kind, id, patch) {
  const data = await readData();
  const idx = data[kind].findIndex(x => x.id === Number(id));
  if (idx === -1) {
    const e = new Error('Not found');
    e.status = 404;
    throw e;
  }
  data[kind][idx] = { ...data[kind][idx], ...patch };
  await writeData(data);
  return data[kind][idx];
}

async function deleteById(kind, id) {
  const data = await readData();
  const idx = data[kind].findIndex(x => x.id === Number(id));
  if (idx === -1) {
    const e = new Error('Not found');
    e.status = 404;
    throw e;
  }
  const removed = data[kind].splice(idx, 1)[0];
  await writeData(data);
  return removed;
}

/* ---------- Bikes API ---------- */
app.get('/api/bikes', async (req, res) => {
  const q = req.query.q;
  const available = req.query.available;
  const sort = req.query.sort;
  let bikes = await getAll('bikes');

  if (q) bikes = bikes.filter(b =>
    (b.model || '').toLowerCase().includes(q.toLowerCase()) ||
    (b.sku || '').toLowerCase().includes(q.toLowerCase())
  );

  if (available === 'true') bikes = bikes.filter(b => b.status === 'available');
  if (sort === 'hourly_rate') bikes = bikes.sort((a, b) => a.hourly_rate - b.hourly_rate);

  res.json(bikes);
});

app.get('/api/bikes/:id', async (req, res) => {
  const bike = await getById('bikes', req.params.id);
  if (!bike) return res.status(404).json({ error: 'Not found' });
  res.json(bike);
});
