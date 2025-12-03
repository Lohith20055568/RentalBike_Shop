// tests/api.test.js
const request = require('supertest');
const fs = require('fs').promises;
const path = require('path');

const DATA_FILE = path.join(__dirname, '..', 'data.json');
const BACKUP_FILE = DATA_FILE + '.bak';

const app = require('../server');
