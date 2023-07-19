const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const sharp = require('sharp'); // Require the sharp library

const app = express();
const imagesFolderPath = path.join(__dirname, 'images'); // Replace 'images' with the actual folder name
const normalFolderPath = path.join(imagesFolderPath, 'normal'); // Folder to store normal-sized images
const tinyFolderPath = path.join(imagesFolderPath, 'tiny'); // Folder to store tiny-sized images

// Ensure the folders exist
fs.mkdirSync(normalFolderPath, { recursive: true });
fs.mkdirSync(tinyFolderPath, { recursive: true });

// Custom storage engine for handling both normal and optimized uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const isOptimize = req.body.optimize && req.body.optimize.toLowerCase() === 'true';
        const uploadFolder = isOptimize ? tinyFolderPath : imagesFolderPath;
        cb(null, uploadFolder);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + path.extname(file.originalname);
        cb(null, file.fieldname + '-' + uniqueSuffix);
    },
});

// Create the multer instance and specify the storage configuration
const upload = multer({ storage });

// Middleware to serve static files from the "images" folder
app.use('/images', express.static(imagesFolderPath));
app.use('/normal', express.static(normalFolderPath));
app.use('/tiny', express.static(tinyFolderPath));

// Custom middleware for image upload and optimization
const uploadImage = (req, res, next) => {
    upload.single('image')(req, res, async (err) => {
        if (err instanceof multer.MulterError) {
            return res.status(400).json({ error: 'Error uploading image' });
        } else if (err) {
            return res.status(500).json({ error: 'Unexpected error occurred during image upload' });
        }

        // Check if an image file was uploaded
        if (req.file) {
            const filePath = path.join(imagesFolderPath, req.file.filename);
            const filePathNormal = path.join(normalFolderPath, req.file.filename);
            const optimizedFilePath = path.join(tinyFolderPath, req.file.filename);
            try {
                if (req.body.optimize && req.body.optimize.toLowerCase() === 'true') {
                    // Resize and optimize the image using sharp if it's in the tiny folder
                    await sharp(filePath).resize({ width: 200 }).toFile(optimizedFilePath);
                } else {
                    // Resize the image to 800 pixels width if it's larger than 800 and in the normal folder
                    const imageInfo = await sharp(filePath).metadata();
                    if (imageInfo.width && imageInfo.width > 800) {
                        await sharp(filePath).resize({ width: 800 }).toFile(filePathNormal);
                    }
                }

                // Continue to the next middleware or route handler
                next();
            } catch (error) {
                console.error('Image optimization error:', error);
                return res.status(500).json({ error: 'Failed to optimize image' });
            }
        } else {
            // No image file uploaded, continue to the next middleware or route handler
            next();
        }
    });
};

// Route to handle file upload and image URL
app.post('/upload', uploadImage, (req, res) => {
    const uploadedImage = req.file;
    const { title, image_url } = req.body;

    // Check if the image file was uploaded
    if (uploadedImage) {
        // Handle image file upload here
        // For example, you can save the image filename and other product data to a database
        res.json({ message: 'Image uploaded successfully', imageUrl: uploadedImage.filename, title });
    } else if (image_url) {
        // Handle image URL and other product data here
        // For example, you can save the image URL and other product data to a database
        res.json({ message: 'Image URL received', imageUrl: image_url, title });
    } else {
        res.status(400).json({ error: 'No image or image URL provided' });
    }
});

// Route to handle file deletion
app.delete('/delete-image/:filename', (req, res) => {
    // ... (same as before)
});

// Add other routes and middleware as needed

app.listen(7000, () => {
    console.log('Server started on http://localhost:7000');
});
