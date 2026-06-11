const path = require("path");
const fs = require("fs");

let cloudinary;
try {
  cloudinary = require("cloudinary").v2;
  if (process.env.CLOUDINARY_CLOUD_NAME) {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
  }
} catch {
  cloudinary = null;
}

const uploadFile = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });

    if (cloudinary && process.env.CLOUDINARY_CLOUD_NAME) {
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: "lisha-academy",
        resource_type: "auto",
      });
      fs.unlinkSync(req.file.path);
      return res.json({
        url: result.secure_url,
        publicId: result.public_id,
        type: result.resource_type,
      });
    }

    const base = process.env.API_URL || `http://localhost:${process.env.PORT || 5000}`;
    const url = `${base}/uploads/${req.file.filename}`;
    res.json({ url, filename: req.file.filename, type: req.file.mimetype });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { uploadFile };
