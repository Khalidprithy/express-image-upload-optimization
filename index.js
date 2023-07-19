const express = require('express');
const app = express();
// ... (other imports)

// Import the uploadImage middleware from the imageUpload.js file
const uploadImageMiddleware = require('./middleware/imageUpload');

// ... (other middleware and routes)

// Route to handle file upload and image URL with the uploadImageMiddleware
app.post('/upload', uploadImageMiddleware, (req, res) => {
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


app.listen(7000, () => {
    console.log('Server started on http://localhost:7000');
});
