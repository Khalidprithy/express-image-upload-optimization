const multer = require('multer');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const imagesFolderPath = path.join(__dirname, '../images');
const normalFolderPath = path.join(imagesFolderPath, 'normal');
const optimizedFolderPath = path.join(imagesFolderPath, 'tiny');

// Ensure the folders exist
fs.mkdirSync(imagesFolderPath, { recursive: true });
fs.mkdirSync(normalFolderPath, { recursive: true });
fs.mkdirSync(optimizedFolderPath, { recursive: true });

// Custom storage engine for handling both normal and optimized uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        if (req.body.optimize && req.body.optimize.toLowerCase() === 'true') {
            cb(null, optimizedFolderPath);
        } else {
            cb(null, imagesFolderPath);
        }
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + path.extname(file.originalname);
        cb(null, file.fieldname + '-' + uniqueSuffix);
    },
});

const upload = multer({ storage });

// Custom middleware for image upload and optimization
const uploadImage = (req, res, next) => {


    upload.single('image')(req, res, async (err) => {
        if (err instanceof multer.MulterError) {
            console.log("here")
            return res.status(400).json({ error: 'Error uploading image' });
        } else if (err) {
            return res.status(500).json({ error: 'Unexpected error occurred during image upload' });
        }

        // Check if an image file was uploaded
        if (req.file) {
            const filePath = path.join(imagesFolderPath, req.file.filename);
            const filePathNormal = path.join(normalFolderPath, req.file.filename);
            const optimizedFilePath = path.join(optimizedFolderPath, req.file.filename);
            const imageInfo = await sharp(filePath).metadata();
            try {
                if (req.body.optimize) {
                    // Resize and optimize the image using sharp if it's in the optimized folder
                    await sharp(filePath).resize({ width: 200 }).toFile(optimizedFilePath);
                } else {
                    // Resize the image to 800 pixels width if it's larger than 800
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

module.exports = uploadImage;
