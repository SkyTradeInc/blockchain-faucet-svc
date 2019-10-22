const express = require('express');
const app = express();
const router = express.Router();
const cors = require('cors');

app.use(express.json());
app.use(cors());
app.use('/api', require('./routes/api'))

module.exports = app
