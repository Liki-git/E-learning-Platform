import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import DashboardLayout from "../../components/DashboardLayout";
import api from "../../api/client";
import { courseImageUrl } from "../../utils/mediaUrl";

const PurchasesPage = () => {
  const [payments, setPayments] = useState([]);
  const [sort, setSort] = useState("date-desc");
  const [search, setSearch] = useState("");

  useEffect(() => {
    api.get("/payments/my").then(({ data }) => setPayments(data.payments || []));
  }, []);

  const filtered = useMemo(() => {
    let list = [...payments];
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((p) => p.course?.title?.toLowerCase().includes(q) || p.transactionId?.toLowerCase().includes(q));
    }
    list.sort((a, b) => {
      if (sort === "amount-asc") return a.amount - b.amount;
      if (sort === "amount-desc") return b.amount - a.amount;
      if (sort === "date-asc") return new Date(a.paidAt) - new Date(b.paidAt);
      return new Date(b.paidAt) - new Date(a.paidAt);
    });
    return list;
  }, [payments, sort, search]);

  return (
    <DashboardLayout title="My Purchases" subtitle="Courses you have purchased">
      <div className="purchases-toolbar">
        <input
          type="search"
          placeholder="Search by course or transaction ID..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="purchases-search"
        />
        <select value={sort} onChange={(e) => setSort(e.target.value)} className="purchases-sort">
          <option value="date-desc">Newest first</option>
          <option value="date-asc">Oldest first</option>
          <option value="amount-desc">Amount: high to low</option>
          <option value="amount-asc">Amount: low to high</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <p className="dash-empty">No purchases yet. <Link to="/courses">Browse courses</Link></p>
      ) : (
        <div className="purchases-grid">
          {filtered.map((p) => (
            <article key={p._id} className="purchase-card">
              <img src={courseImageUrl(p.course?.image)} alt="" />
              <div>
                <h3>{p.course?.title || "Course"}</h3>
                <p className="purchase-card__amount">₹{p.amount}</p>
                <p className="purchase-card__meta">Txn: {p.transactionId}</p>
                <p className="purchase-card__meta">{new Date(p.paidAt).toLocaleString()}</p>
                {(p.course?._id || p.course?.id) && (
                  <Link to={`/student/learn/${p.course._id || p.course.id}`} className="btn btn--primary btn--sm">Go to course</Link>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
};

export default PurchasesPage;
