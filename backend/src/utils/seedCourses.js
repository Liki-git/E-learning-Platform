const User = require("../models/User");
const Course = require("../models/Course");
const bcrypt = require("bcryptjs");
const catalog = require("../data/courseCatalog");
const avatarUrl = require("./avatarUrl");
const { resolveCourseImage } = require("./courseImage");

const ensureUsers = async () => {
  let instructor = await User.findOne({ role: "instructor" });
  if (!instructor) {
    const hashed = await bcrypt.hash("instructor123", 10);
    instructor = await User.create({
      fullName: "Dev Sharma",
      email: "instructor@lishaacademy.com",
      username: "devsharma",
      password: hashed,
      role: "instructor",
    });
  }

  let admin = await User.findOne({ role: "admin" });
  if (!admin) {
    const hashed = await bcrypt.hash("admin123", 10);
    admin = await User.create({
      fullName: "Platform Admin",
      email: "admin@lishaacademy.com",
      username: "admin",
      password: hashed,
      role: "admin",
    });
  }

  return instructor;
};

const seedIfEmpty = async () => {
  const instructor = await ensureUsers();

  for (const item of catalog) {
    await Course.findOneAndUpdate(
      { title: item.title },
      {
        $set: {
          title: item.title,
          description: item.description,
          category: item.category,
          level: item.level,
          price: item.price,
          image: resolveCourseImage(item.image, item.category, item.title),
          rating: item.rating,
          reviewCount: item.reviewCount,
          tags: item.tags,
          modules: item.modules,
          instructor: instructor._id,
          instructorName: item.instructorName,
          instructorAvatar: item.instructorAvatar || avatarUrl(item.instructorName),
          status: "published",
        },
      },
      { upsert: true }
    );
  }

  const total = await Course.countDocuments();
  console.log(`Course catalog synced: ${total} courses`);
};

module.exports = seedIfEmpty;
