const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const sharp = require('sharp'); // Require the sharp library

const app = express();
const imagesFolderPath = path.join(__dirname, 'images'); // Replace 'images' with the actual folder name
const optimizedFolderPath = path.join(imagesFolderPath, 'optimized'); // Folder to store optimized images

// Create a multer storage configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, imagesFolderPath);
    },
    filename: (req, file, cb) => {
        // Generate a unique filename by appending the current timestamp to the original name
        const uniqueSuffix = Date.now() + '-' + path.extname(file.originalname);
        cb(null, file.fieldname + '-' + uniqueSuffix);
    },
});

// Create the multer instance and specify the storage configuration
const upload = multer({ storage });

// Middleware to serve static files from the "images" folder
app.use('/images', express.static(imagesFolderPath));

app.use('/optimized', express.static(optimizedFolderPath));

// Ensure the "optimized" folder exists
fs.mkdirSync(optimizedFolderPath, { recursive: true });

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
            try {
                const filePath = path.join(imagesFolderPath, req.file.filename);
                const optimizedFilePath = path.join(optimizedFolderPath, req.file.filename);

                // Resize and optimize the image using sharp
                await sharp(filePath).resize({ width: 200 }).toFile(optimizedFilePath);

                // Delete the original image file
                fs.unlinkSync(filePath);

                // Rename the optimized file to the original filename
                fs.renameSync(optimizedFilePath, filePath);

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
    const { filename } = req.params;
    const imagePath = path.join(imagesFolderPath, filename);

    // Check if the file exists before attempting to delete it
    fs.stat(imagePath, (err, stats) => {
        if (err) {
            return res.status(404).json({ error: 'Image not found' });
        }

        // Delete the file
        fs.unlink(imagePath, (err) => {
            if (err) {
                return res.status(500).json({ error: 'Failed to delete image' });
            }
            res.json({ message: 'Image deleted successfully' });
        });
    });
});

// Add other routes and middleware as needed

app.listen(7000, () => {
    console.log('Server started on http://localhost:7000');
});
