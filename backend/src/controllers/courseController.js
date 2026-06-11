const Course = require("../models/Course");
const Enrollment = require("../models/Enrollment");
const { notifyAdmins, notifyUser } = require("../utils/notify");
const { resolveCourseImage } = require("../utils/courseImage");

const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";

const formatCourse = (course) => ({
  id: course._id,
  title: course.title,
  description: course.description,
  category: course.category,
  level: course.level,
  price: course.price,
  image: resolveCourseImage(course.image, course.category, course.title),
  mentor: course.instructorName,
  instructorName: course.instructorName,
  instructorAvatar: course.instructorAvatar,
  instructorId: course.instructor,
  rating: course.rating,
  reviewCount: course.reviewCount,
  status: course.status,
  tags: course.tags,
  lessons: course.modules?.reduce((sum, m) => sum + (m.lessons?.length || 0), 0) || 0,
  modules: course.modules,
  createdAt: course.createdAt,
});

const getCourses = async (req, res) => {
  try {
    const { search, category, level, sort, status, instructor } = req.query;
    const filter = {};

    if (status !== undefined) {
      // Management dashboard request
      if (req.user?.role === "instructor") {
        filter.instructor = req.user._id;
        if (status) filter.status = status;
      } else if (req.user?.role === "admin") {
        if (status) filter.status = status;
      }
    } else {
      // Public catalog request
      filter.status = "published";
    }

    if (instructor && req.user?.role === "admin") filter.instructor = instructor;
    if (category) filter.category = category;
    if (level) filter.level = level;
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { tags: { $regex: search, $options: "i" } },
      ];
    }

    let sortOpt = { createdAt: -1 };
    if (sort === "price-asc") sortOpt = { price: 1 };
    if (sort === "price-desc") sortOpt = { price: -1 };
    if (sort === "rating") sortOpt = { rating: -1 };
    if (sort === "title") sortOpt = { title: 1 };

    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 15));
    const skip = (page - 1) * limit;

    const [courses, total] = await Promise.all([
      Course.find(filter).sort(sortOpt).skip(skip).limit(limit),
      Course.countDocuments(filter),
    ]);

    let enrollments = [];
    if (req.user?.role === "instructor" && status !== undefined) {
      const courseIds = courses.map((c) => c._id);
      enrollments = await Enrollment.find({
        course: { $in: courseIds },
        status: { $ne: "wishlist" },
      });
    }

    res.json({
      courses: courses.map((c) => {
        const fc = formatCourse(c);
        if (req.user?.role === "instructor" && status !== undefined) {
          fc.enrollments = enrollments.filter((e) => String(e.course) === String(c._id)).length;
        }
        return fc;
      }),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getCourseById = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id).populate("instructor", "fullName email");
    if (!course) return res.status(404).json({ message: "Course not found" });

    const isOwner = req.user && String(course.instructor._id || course.instructor) === String(req.user._id);
    const isAdmin = req.user?.role === "admin";
    if (course.status !== "published" && !isOwner && !isAdmin) {
      return res.status(403).json({ message: "Course not available" });
    }

    let enrollment = null;
    if (req.user?.role === "student") {
      enrollment = await Enrollment.findOne({ student: req.user._id, course: course._id });
    }

    res.json({ course: formatCourse(course), enrollment });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createCourse = async (req, res) => {
  try {
    const course = await Course.create({
      ...req.body,
      instructor: req.user._id,
      instructorName: req.user.fullName,
      status: "draft",
    });

    await notifyAdmins(
      "New course created",
      `Instructor ${req.user.fullName} created "${course.title}".`,
      `${clientUrl}/admin/courses`
    );

    res.status(201).json({ course: formatCourse(course) });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const updateCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ message: "Course not found" });
    if (String(course.instructor) !== String(req.user._id) && req.user.role !== "admin") {
      return res.status(403).json({ message: "Not your course" });
    }

    Object.assign(course, req.body);
    if (req.user.role !== "admin") course.status = course.status === "published" ? "pending" : course.status;
    await course.save();
    res.json({ course: formatCourse(course) });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const deleteCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ message: "Course not found" });
    if (String(course.instructor) !== String(req.user._id) && req.user.role !== "admin") {
      return res.status(403).json({ message: "Not your course" });
    }
    await course.deleteOne();
    res.json({ message: "Course deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const submitCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ message: "Course not found" });
    if (String(course.instructor) !== String(req.user._id)) {
      return res.status(403).json({ message: "Not your course" });
    }
    course.status = "pending";
    await course.save();

    await notifyAdmins(
      "Course pending approval",
      `"${course.title}" by ${req.user.fullName} is awaiting approval.`,
      `${clientUrl}/admin/courses`
    );

    res.json({ course: formatCourse(course) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const approveCourse = async (req, res) => {
  try {
    const course = await Course.findByIdAndUpdate(
      req.params.id,
      { status: "published", rejectionReason: "" },
      { new: true }
    );
    if (!course) return res.status(404).json({ message: "Course not found" });

    await notifyUser(course.instructor, null, {
      type: "course_approved",
      title: "Course approved",
      message: `Your course "${course.title}" is now published on LISHA Academy.`,
      link: `${clientUrl}/instructor/courses`,
    });

    res.json({ course: formatCourse(course) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const rejectCourse = async (req, res) => {
  try {
    const course = await Course.findByIdAndUpdate(
      req.params.id,
      { status: "rejected", rejectionReason: req.body.reason || "Does not meet quality standards" },
      { new: true }
    );
    if (!course) return res.status(404).json({ message: "Course not found" });

    await notifyUser(course.instructor, null, {
      type: "course_rejected",
      title: "Course rejected",
      message: `Your course "${course.title}" was rejected. Reason: ${course.rejectionReason}`,
      link: `${clientUrl}/instructor/courses`,
    });

    res.json({ course: formatCourse(course) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getCategories = async (_req, res) => {
  const categories = await Course.distinct("category", { status: "published" });
  res.json({ categories });
};

module.exports = {
  getCourses,
  getCourseById,
  createCourse,
  updateCourse,
  deleteCourse,
  submitCourse,
  approveCourse,
  rejectCourse,
  getCategories,
};
