const DEFAULT_COURSE_IMAGE =
  "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=800&q=80";

const CATEGORY_IMAGES = {
  "Cloud Computing": "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=800&q=80",
  "AI & ML": "https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=800&q=80",
  Design: "https://images.unsplash.com/photo-1561070791-2526d30994b5?auto=format&fit=crop&w=800&q=80",
  "Web Development": "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=800&q=80",
  "Data Science": "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=800&q=80",
  DevOps: "https://images.unsplash.com/photo-1667372393119-3d4c48d07fc9?auto=format&fit=crop&w=800&q=80",
  Security: "https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=800&q=80",
  Marketing: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80",
  Blockchain: "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?auto=format&fit=crop&w=800&q=80",
  "Mobile Development": "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?auto=format&fit=crop&w=800&q=80",
  Programming: "https://images.unsplash.com/photo-1516116216624-53e697fedbea?auto=format&fit=crop&w=800&q=80",
  Business: "https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=800&q=80",
};

const TITLE_IMAGES = {
  "Advanced UX Research & Design Systems":
    "/uploads/ux_research_design_systems.png",
  "Design Patterns & Clean Code in Practice":
    "/uploads/design_patterns_clean_code.png",
  "Content Writing & Copywriting":
    "/uploads/content_writing_copywriting.png",
  "Git & Version Control Mastery":
    "https://images.unsplash.com/photo-1618401471353-b98afee0b2eb?auto=format&fit=crop&w=800&q=80",
  "Python for Data Science & AI":
    "https://images.unsplash.com/photo-1526379095098-d400fd0bf935?auto=format&fit=crop&w=800&q=80",
};

const resolveCourseImage = (image, category, title) => {
  if (title && TITLE_IMAGES[title]) return TITLE_IMAGES[title];
  if (image && image.trim()) return image;
  return CATEGORY_IMAGES[category] || DEFAULT_COURSE_IMAGE;
};

module.exports = { DEFAULT_COURSE_IMAGE, CATEGORY_IMAGES, TITLE_IMAGES, resolveCourseImage };
