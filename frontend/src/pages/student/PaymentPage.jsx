import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FiCreditCard, FiLock } from "react-icons/fi";
import DashboardLayout from "../../components/DashboardLayout";
import api from "../../api/client";

const PaymentPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [method, setMethod] = useState("card");
  const [cardName, setCardName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get(`/courses/${id}`).then(({ data }) => setCourse(data.course));
  }, [id]);

  const handlePay = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await api.post("/payments/checkout", { courseId: id, method });
      navigate(`/student/learn/${id}`);
    } catch (err) {
      setError(err.response?.data?.message || "Payment failed");
    } finally {
      setLoading(false);
    }
  };

  if (!course) {
    return (
      <DashboardLayout title="Payment">
        <p className="payment-center-wrap">Loading...</p>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Complete Payment">
      <div className="payment-center-wrap">
        <div className="payment-panel payment-panel--centered">
          <div className="payment-panel__icon"><FiLock size={28} aria-hidden="true" /></div>
          <h2>Secure Checkout</h2>
          <p className="payment-panel__course">{course.title}</p>
          <div className="payment-panel__amount-box">
            <span>Total amount</span>
            <strong>₹{course.price}</strong>
          </div>
          <form onSubmit={handlePay} className="payment-form payment-form--clean">
            <label>
              Cardholder name
              <input value={cardName} onChange={(e) => setCardName(e.target.value)} placeholder="Name on card" />
            </label>
            <label>
              Payment method
              <select value={method} onChange={(e) => setMethod(e.target.value)}>
                <option value="card">Credit / Debit Card</option>
                <option value="upi">UPI</option>
                <option value="netbanking">Net Banking</option>
              </select>
            </label>
            {error && <p className="error-msg">{error}</p>}
            <button type="submit" className="btn btn--primary btn--full" disabled={loading}>
              <FiCreditCard aria-hidden="true" /> {loading ? "Processing..." : `Pay ₹${course.price}`}
            </button>
          </form>
          <p className="payment-panel__note">Simulated payment — ready for Razorpay/Stripe integration.</p>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default PaymentPage;
