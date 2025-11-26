// server.js - JSON-backed Bike Rental API
const express = require('express');
const fs = require('fs').promises;
const path = require('path');

const DATA_FILE = path.join(__dirname, 'data.json');
const app = express();
app.use(express.json());
const PORT = process.env.PORT || 3000;