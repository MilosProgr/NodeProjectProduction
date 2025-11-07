import express from 'express';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';

import authRoutes from './routes/authRoutes.js';
import todoRoutes from './routes/todoRoutes.js';
import authMiddleware from './middleware/authMiddleware.js';

// const express = require('express');
const app = express();
const PORT = process.env.PORT || 5000;

//Get the file path from the URL of the current module
const __filename = fileURLToPath(import.meta.url);
//get tyhe directory name of the file path
const __dirname = dirname(__filename);

//middleware
app.use(express.json());
//Serve the html file from the /public directory
//Tells express to serve all files in the 'public' directory as static assets /file
//any request to the for the css files will be resolved to the public directory,gde da trazi public directory
app.use(express.static(path.join(__dirname, '../public')));

//serving up the html frile from the /public directory
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});
//ROUTES
app.use('/auth', authRoutes);
app.use('/todos', authMiddleware, todoRoutes);
console.log('Hello world');
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
//CHECK