const mongoose = require("mongoose");

const lessonSchema = new mongoose.Schema({
  title: { type: String, required: true },
  type: { type: String, enum: ["video", "pdf", "quiz", "assignment"], default: "video" },
  contentUrl: { type: String, default: "" },
  duration: { type: Number, default: 0 },
  order: { type: Number, default: 0 },
});

const moduleSchema = new mongoose.Schema({
  title: { type: String, required: true },
  order: { type: Number, default: 0 },
  lessons: [lessonSchema],
});

const courseSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    category: { type: String, default: "Technology" },
    level: { type: String, enum: ["Beginner", "Intermediate", "Advanced"], default: "Beginner" },
    price: { type: Number, default: 0 },
    image: { type: String, default: "" },
    instructor: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    instructorName: { type: String, default: "" },
    instructorAvatar: { type: String, default: "" },
    status: {
      type: String,
      enum: ["draft", "pending", "published", "rejected"],
      default: "draft",
    },
    rating: { type: Number, default: 0 },
    reviewCount: { type: Number, default: 0 },
    tags: [{ type: String }],
    modules: [moduleSchema],
    rejectionReason: { type: String, default: "" },
    // Track edit history for admins
    editHistory: [
      {
        editedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        editedByName: { type: String },
        editedAt: { type: Date, default: Date.now },
        changes: { type: String }, // Description of what changed
      },
    ],
    canBeEditedAfterPublish: { type: Boolean, default: true }, // Admin/Instructor can edit even after publish
  },
  { timestamps: true }
);

courseSchema.virtual("lessonCount").get(function lessonCount() {
  if (!this.modules) return 0;
  return this.modules.reduce((sum, mod) => sum + (mod.lessons?.length || 0), 0);
});

courseSchema.set("toJSON", { virtuals: true });
courseSchema.set("toObject", { virtuals: true });

module.exports = mongoose.model("Course", courseSchema);
