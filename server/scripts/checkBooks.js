// Quick script to check book data structure
const mongoose = require('mongoose');
const Book = require('../models/Book');
require('dotenv').config();

const checkBooks = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to database');

        const books = await Book.find().limit(3).select('title coverImage');
        console.log('\nSample books from database:');
        books.forEach(book => {
            console.log(`Title: ${book.title}`);
            console.log(`Cover Image: ${book.coverImage}`);
            console.log(`Full URL would be: http://localhost:5000/uploads/${book.coverImage}`);
            console.log('---');
        });

        await mongoose.connection.close();
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

checkBooks();
