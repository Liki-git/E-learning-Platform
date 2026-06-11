import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { FiChevronLeft, FiChevronRight, FiSearch } from "react-icons/fi";
import PageShell from "../components/PageShell";
import AppNavbar from "../components/AppNavbar";
import api from "../api/client";
import { useAuth } from "../context/AuthContext";
import { courseImageUrl, resolveMediaUrl } from "../utils/mediaUrl";

const PER_PAGE = 15;

const AllCoursesPage = () => {
  const [courses, setCourses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [level, setLevel] = useState("");
  const [sort, setSort] = useState("newest");
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();

  const currentPage = Math.max(1, parseInt(searchParams.get("page") || "1", 10));

  const courseDetailPath = (id) => {
    if (user?.role === "student") return `/student/courses/${id}`;
    return "/login";
  };

  const loadCourses = async () => {
    setLoading(true);
    try {
      const sortMap = { newest: "", "price-asc": "price-asc", "price-desc": "price-desc", rating: "rating", title: "title" };
      const { data } = await api.get("/courses", {
        params: {
          search,
          category,
          level,
          sort: sortMap[sort],
          page: currentPage,
          limit: PER_PAGE,
        },
      });
      setCourses(data.courses || []);
      setPagination(data.pagination || { page: 1, totalPages: 1, total: 0 });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    api.get("/courses/categories").then(({ data }) => setCategories(data.categories || []));
  }, []);

  useEffect(() => {
    const t = setTimeout(loadCourses, 300);
    return () => clearTimeout(t);
  }, [search, category, level, sort, currentPage]);

  const goToPage = (page) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set("page", String(page));
      return next;
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const pageNumbers = () => {
    const { totalPages } = pagination;
    const pages = [];
    for (let i = 1; i <= totalPages; i += 1) pages.push(i);
    return pages;
  };

  return (
    <PageShell className="page-shell--home">
      <div className="home">
        <AppNavbar active="/courses" />

        <section className="section courses-catalog-page">
          <h1 className="section__title">All Courses</h1>
          <p className="section__sub">Search, filter, and find your perfect match</p>

          <div className="catalog-toolbar catalog-toolbar--page">
            <div className="catalog-search">
              <FiSearch aria-hidden="true" />
              <input
                type="search"
                placeholder="Search courses, topics, skills..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); goToPage(1); }}
              />
            </div>
            <select value={category} onChange={(e) => { setCategory(e.target.value); goToPage(1); }}>
              <option value="">All categories</option>
              {categories.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <select value={level} onChange={(e) => { setLevel(e.target.value); goToPage(1); }}>
              <option value="">All levels</option>
              <option value="Beginner">Beginner</option>
              <option value="Intermediate">Intermediate</option>
              <option value="Advanced">Advanced</option>
            </select>
            <select value={sort} onChange={(e) => { setSort(e.target.value); goToPage(1); }}>
              <option value="newest">Newest</option>
              <option value="rating">Highest rated</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="title">Title A-Z</option>
            </select>
          </div>

          {loading ? (
            <p className="dash-empty">Loading courses...</p>
          ) : courses.length === 0 ? (
            <p className="dash-empty">No courses match your filters.</p>
          ) : (
            <div className="courses-grid courses-grid--catalog">
              {courses.map((course) => (
                <article key={course.id} className="course-card">
                  <div className="course-card__image">
                    <img src={courseImageUrl(course.image)} alt={course.title} />
                  </div>
                  <div className="course-card__body">
                    <h3>{course.title}</h3>
                    <div className="course-card__mentor">
                      <img
                        src={resolveMediaUrl(course.instructorAvatar) || `https://ui-avatars.com/api/?name=${encodeURIComponent(course.mentor || course.instructorName || "I")}&background=2e7d32&color=fff&size=64`}
                        alt=""
                        className="course-card__avatar-img"
                      />
                      <span>{course.mentor || course.instructorName}</span>
                      <span className="course-card__rating">★ {course.rating}</span>
                    </div>
                    <div className="course-card__meta">
                      <span>{course.lessons} lessons</span>
                      <span className="course-card__level">{course.level}</span>
                    </div>
                    <strong className="course-card__price">{course.price === 0 ? "Free" : `₹${course.price}`}</strong>
                    <Link to={courseDetailPath(course.id)} className="btn btn--primary btn--full">View course</Link>
                  </div>
                </article>
              ))}
            </div>
          )}

          {pagination.totalPages > 1 && (
            <nav className="pagination" aria-label="Course pages">
              <button
                type="button"
                className="pagination__arrow"
                disabled={currentPage <= 1}
                onClick={() => goToPage(currentPage - 1)}
                aria-label="Previous page"
              >
                <FiChevronLeft size={20} />
              </button>
              <div className="pagination__numbers">
                {pageNumbers().map((num) => (
                  <button
                    key={num}
                    type="button"
                    className={`pagination__num${num === currentPage ? " active" : ""}`}
                    onClick={() => goToPage(num)}
                  >
                    {num}
                  </button>
                ))}
              </div>
              <button
                type="button"
                className="pagination__arrow"
                disabled={currentPage >= pagination.totalPages}
                onClick={() => goToPage(currentPage + 1)}
                aria-label="Next page"
              >
                <FiChevronRight size={20} />
              </button>
            </nav>
          )}
        </section>
      </div>
    </PageShell>
  );
};

export default AllCoursesPage;
