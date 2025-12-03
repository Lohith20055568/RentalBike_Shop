// tests/api.test.js
const request = require('supertest');
const fs = require('fs').promises;
const path = require('path');

const DATA_FILE = path.join(__dirname, '..', 'data.json');
const BACKUP_FILE = DATA_FILE + '.bak';

const app = require('../server');

beforeEach(async () => {
  const raw = await fs.readFile(DATA_FILE, 'utf8');
  await fs.writeFile(BACKUP_FILE, raw, 'utf8');
});

afterEach(async () => {
  const raw = await fs.readFile(BACKUP_FILE, 'utf8');
  await fs.writeFile(DATA_FILE, raw, 'utf8');
  await fs.unlink(BACKUP_FILE);
});
