import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import DashboardLayout from "../../components/DashboardLayout";
import api from "../../api/client";
import { courseImageUrl } from "../../utils/mediaUrl";

const WishlistPage = () => {
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [sort, setSort] = useState("newest");

  useEffect(() => {
    api.get("/enrollments/my", { params: { status: "wishlist" } }).then(({ data }) => {
      setItems(data.enrollments || []);
    });
  }, []);

  const remove = async (courseId) => {
    await api.delete(`/enrollments/${courseId}/wishlist`);
    setItems((prev) => prev.filter((e) => e.course?.id !== courseId));
  };

  const filtered = useMemo(() => {
    let list = [...items];
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((e) => e.course?.title?.toLowerCase().includes(q));
    }
    if (category) {
      list = list.filter((e) => e.course?.category === category);
    }
    list.sort((a, b) => {
      if (sort === "title") return (a.course?.title || "").localeCompare(b.course?.title || "");
      if (sort === "price-asc") return (a.course?.price || 0) - (b.course?.price || 0);
      if (sort === "price-desc") return (b.course?.price || 0) - (a.course?.price || 0);
      return new Date(b.enrolledAt) - new Date(a.enrolledAt);
    });
    return list;
  }, [items, search, category, sort]);

  const categories = [...new Set(items.map((e) => e.course?.category).filter(Boolean))];

  return (
    <DashboardLayout title="Wishlist" subtitle="Courses you saved for later">
      <div className="purchases-toolbar">
        <input
          type="search"
          placeholder="Search wishlist..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="purchases-search"
        />
        <select value={category} onChange={(e) => setCategory(e.target.value)} className="purchases-sort">
          <option value="">All categories</option>
          {categories.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={sort} onChange={(e) => setSort(e.target.value)} className="purchases-sort">
          <option value="newest">Recently added</option>
          <option value="title">Title A-Z</option>
          <option value="price-asc">Price: low to high</option>
          <option value="price-desc">Price: high to low</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <p className="dash-empty">Your wishlist is empty. <Link to="/courses">Explore courses</Link></p>
      ) : (
        <div className="purchases-grid">
          {filtered.map((e) => (
            <article key={e.id} className="purchase-card">
              <img src={courseImageUrl(e.course?.image)} alt="" />
              <div>
                <h3>{e.course?.title}</h3>
                <p className="purchase-card__amount">{e.course?.price === 0 ? "Free" : `₹${e.course?.price}`}</p>
                <p className="purchase-card__meta">{e.course?.level} · {e.course?.category}</p>
                <div className="wishlist-card__actions">
                  <Link to={`/student/courses/${e.course?.id}`} className="btn btn--primary btn--sm">View course</Link>
                  <button type="button" className="btn btn--outline btn--sm" onClick={() => remove(e.course?.id)}>Remove</button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
};

export default WishlistPage;
