import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FiSearch } from "react-icons/fi";
import DashboardLayout from "../../components/DashboardLayout";
import api from "../../api/client";

const CourseCatalog = () => {
  const [courses, setCourses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [level, setLevel] = useState("");
  const [sort, setSort] = useState("newest");
  const [loading, setLoading] = useState(true);

  const loadCourses = async () => {
    setLoading(true);
    try {
      const sortMap = { newest: "", "price-asc": "price-asc", "price-desc": "price-desc", rating: "rating", title: "title" };
      const { data } = await api.get("/courses", {
        params: { search, category, level, sort: sortMap[sort] },
      });
      setCourses(data.courses);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    api.get("/courses/categories").then(({ data }) => setCategories(data.categories));
  }, []);

  useEffect(() => {
    const t = setTimeout(loadCourses, 300);
    return () => clearTimeout(t);
  }, [search, category, level, sort]);

  return (
    <DashboardLayout title="Browse Courses">
      <div className="catalog-toolbar">
        <div className="catalog-search">
          <FiSearch aria-hidden="true" />
          <input
            type="search"
            placeholder="Search courses, topics, skills..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="">All categories</option>
          {categories.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={level} onChange={(e) => setLevel(e.target.value)}>
          <option value="">All levels</option>
          <option value="Beginner">Beginner</option>
          <option value="Intermediate">Intermediate</option>
          <option value="Advanced">Advanced</option>
        </select>
        <select value={sort} onChange={(e) => setSort(e.target.value)}>
          <option value="newest">Newest</option>
          <option value="rating">Highest rated</option>
          <option value="price-asc">Price: Low to High</option>
          <option value="price-desc">Price: High to Low</option>
          <option value="title">Title A-Z</option>
        </select>
      </div>

      {loading ? (
        <p>Loading courses...</p>
      ) : courses.length === 0 ? (
        <p className="dash-empty">No courses match your filters.</p>
      ) : (
        <div className="catalog-grid">
          {courses.map((course) => (
            <article key={course.id} className="catalog-card">
              <img src={course.image} alt={course.title} />
              <div className="catalog-card__body">
                <span className="catalog-card__cat">{course.category}</span>
                <h3>{course.title}</h3>
                <p>{course.mentor} · ★ {course.rating}</p>
                <div className="catalog-card__meta">
                  <span className="course-card__level">{course.level}</span>
                  <strong>{course.price === 0 ? "Free" : `₹${course.price}`}</strong>
                </div>
                <Link to={`/student/courses/${course.id}`} className="btn btn--primary btn--full">View course</Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
};

export default CourseCatalog;
