const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");
const upload = require("../middleware/uploadMiddleware");
const { uploadFile } = require("../controllers/uploadController");

const router = express.Router();
router.use(protect, authorize("instructor", "admin", "student"));
router.post("/", upload.single("file"), uploadFile);

module.exports = router;
