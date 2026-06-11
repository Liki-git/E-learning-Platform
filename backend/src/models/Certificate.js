const mongoose = require("mongoose");
const crypto = require("crypto");

const certificateSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    course: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true },
    certificateId: { type: String, unique: true },
    qrCodeData: { type: String, default: "" },
    issuedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

certificateSchema.pre("save", function preSave(next) {
  if (!this.certificateId) {
    this.certificateId = `LISHA-${crypto.randomBytes(6).toString("hex").toUpperCase()}`;
  }
  if (!this.qrCodeData) {
    const base = process.env.CLIENT_URL || "http://localhost:5173";
    this.qrCodeData = `${base}/verify/${this.certificateId}`;
  }
  next();
});

module.exports = mongoose.model("Certificate", certificateSchema);
