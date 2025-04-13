// ... existing code ...
const multer = require('multer');

// Add Multer configuration
const storage = multer.memoryStorage(); // Store file in memory as Buffer
const upload = multer({ 
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // Limit file size to 5MB
    }
});

// ... rest of your code ...



DATABASE
    SCHEMA -> structure 
    DATABASE
    COLLECTION -> formed inside database on the basis of schema
    DOCUMENT -> single thing formed inside collection