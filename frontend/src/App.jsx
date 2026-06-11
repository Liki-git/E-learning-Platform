import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import LoginPage from "./pages/LoginPage.jsx";
import SignupPage from "./pages/SignupPage.jsx";
import ForgotPasswordPage from "./pages/ForgotPasswordPage.jsx";
import OtpPage from "./pages/OtpPage.jsx";
import ResetPasswordPage from "./pages/ResetPasswordPage.jsx";
import HomePage from "./pages/HomePage.jsx";
import AllCoursesPage from "./pages/AllCoursesPage.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import RoleRoute from "./components/RoleRoute.jsx";
import ChatbotWidget from "./components/ChatbotWidget.jsx";

// Student pages
import StudentDashboard from "./pages/student/StudentDashboard.jsx";
import CourseDetail from "./pages/student/CourseDetail.jsx";
import PaymentPage from "./pages/student/PaymentPage.jsx";
import LearnPage from "./pages/student/LearnPage.jsx";
import MyCourses from "./pages/student/MyCourses.jsx";
import MyLearningPage from "./pages/student/MyLearningPage.jsx";
import SettingsPage from "./pages/student/SettingsPage.jsx";
import ProfilePage from "./pages/student/ProfilePage.jsx";
import WishlistPage from "./pages/student/WishlistPage.jsx";
import PurchasesPage from "./pages/student/PurchasesPage";
import NotificationsPage from "./pages/NotificationsPage.jsx";
import StudentAssignments from "./pages/student/StudentAssignments.jsx";
import StudentQuizzes from "./pages/student/StudentQuizzes.jsx";
import StudentLiveClasses from "./pages/student/StudentLiveClasses.jsx";
import StudentMessages from "./pages/student/StudentMessages.jsx";
import StudentReviews from "./pages/student/StudentReviews.jsx";
import StudentQA from "./pages/student/StudentQA.jsx";
import StudentAnnouncements from "./pages/student/StudentAnnouncements.jsx";

// Instructor pages
import InstructorDashboard from "./pages/instructor/InstructorDashboard.jsx";
import InstructorCourses from "./pages/instructor/InstructorCourses.jsx";
import CreateCourse from "./pages/instructor/CreateCourse.jsx";
import InstructorAssignments from "./pages/instructor/InstructorAssignments.jsx";
import InstructorQuizzes from "./pages/instructor/InstructorQuizzes.jsx";
import InstructorLiveClasses from "./pages/instructor/InstructorLiveClasses.jsx";
import InstructorMessages from "./pages/instructor/InstructorMessages.jsx";
import InstructorReviews from "./pages/instructor/InstructorReviews.jsx";
import InstructorQA from "./pages/instructor/InstructorQA.jsx";
import InstructorAnnouncements from "./pages/instructor/InstructorAnnouncements.jsx";

// Admin pages
import AdminDashboard from "./pages/admin/AdminDashboard.jsx";
import AdminUsers from "./pages/admin/AdminUsers.jsx";
import AdminCourses from "./pages/admin/AdminCourses.jsx";
import AdminMessages from "./pages/admin/AdminMessages.jsx";
import AdminAnnouncements from "./pages/admin/AdminAnnouncements.jsx";
import AdminEnrollments from "./pages/admin/AdminEnrollments.jsx";

function App() {
  const { user } = useAuth();

  return (
    <>
      <Routes>
        <Route path="/" element={<Navigate to="/home" replace />} />
        <Route path="/home" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/verify-otp" element={<OtpPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/courses" element={<AllCoursesPage />} />

        {/* ── Student ── */}
        <Route path="/student/dashboard" element={<RoleRoute roles={["student"]}><StudentDashboard /></RoleRoute>} />
        <Route path="/student/courses" element={<Navigate to="/courses" replace />} />
        <Route path="/student/courses/:id" element={<RoleRoute roles={["student"]}><CourseDetail /></RoleRoute>} />
        <Route path="/student/my-courses" element={<Navigate to="/student/my-learning" replace />} />
        <Route path="/student/my-learning" element={<RoleRoute roles={["student"]}><MyLearningPage /></RoleRoute>} />
        <Route path="/student/settings" element={<RoleRoute roles={["student", "instructor", "admin"]}><SettingsPage /></RoleRoute>} />
        <Route path="/student/profile" element={<RoleRoute roles={["student"]}><ProfilePage /></RoleRoute>} />
        <Route path="/student/purchases" element={<RoleRoute roles={["student"]}><PurchasesPage /></RoleRoute>} />
        <Route path="/student/wishlist" element={<RoleRoute roles={["student"]}><WishlistPage /></RoleRoute>} />
        <Route path="/student/pay/:id" element={<RoleRoute roles={["student"]}><PaymentPage /></RoleRoute>} />
        <Route path="/student/learn/:id" element={<RoleRoute roles={["student"]}><LearnPage /></RoleRoute>} />
        <Route path="/student/assignments" element={<RoleRoute roles={["student"]}><StudentAssignments /></RoleRoute>} />
        <Route path="/student/quizzes" element={<RoleRoute roles={["student"]}><StudentQuizzes /></RoleRoute>} />
        <Route path="/student/live-classes" element={<RoleRoute roles={["student"]}><StudentLiveClasses /></RoleRoute>} />
        <Route path="/student/messages" element={<RoleRoute roles={["student"]}><StudentMessages /></RoleRoute>} />
        <Route path="/student/reviews" element={<RoleRoute roles={["student"]}><StudentReviews /></RoleRoute>} />
        <Route path="/student/qa" element={<RoleRoute roles={["student"]}><StudentQA /></RoleRoute>} />
        <Route path="/student/announcements" element={<RoleRoute roles={["student"]}><StudentAnnouncements /></RoleRoute>} />
        <Route path="/notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />

        {/* ── Instructor ── */}
        <Route path="/instructor/dashboard" element={<RoleRoute roles={["instructor"]}><InstructorDashboard /></RoleRoute>} />
        <Route path="/instructor/courses" element={<RoleRoute roles={["instructor"]}><InstructorCourses /></RoleRoute>} />
        <Route path="/instructor/courses/new" element={<RoleRoute roles={["instructor"]}><CreateCourse /></RoleRoute>} />
        <Route path="/instructor/courses/:id/edit" element={<RoleRoute roles={["instructor"]}><CreateCourse /></RoleRoute>} />
        <Route path="/instructor/assignments" element={<RoleRoute roles={["instructor"]}><InstructorAssignments /></RoleRoute>} />
        <Route path="/instructor/quizzes" element={<RoleRoute roles={["instructor"]}><InstructorQuizzes /></RoleRoute>} />
        <Route path="/instructor/live-classes" element={<RoleRoute roles={["instructor"]}><InstructorLiveClasses /></RoleRoute>} />
        <Route path="/instructor/messages" element={<RoleRoute roles={["instructor"]}><InstructorMessages /></RoleRoute>} />
        <Route path="/instructor/reviews" element={<RoleRoute roles={["instructor"]}><InstructorReviews /></RoleRoute>} />
        <Route path="/instructor/qa" element={<RoleRoute roles={["instructor"]}><InstructorQA /></RoleRoute>} />
        <Route path="/instructor/announcements" element={<RoleRoute roles={["instructor"]}><InstructorAnnouncements /></RoleRoute>} />

        {/* ── Admin ── */}
        <Route path="/admin/dashboard" element={<RoleRoute roles={["admin"]}><AdminDashboard /></RoleRoute>} />
        <Route path="/admin/users" element={<RoleRoute roles={["admin"]}><AdminUsers /></RoleRoute>} />
        <Route path="/admin/courses" element={<RoleRoute roles={["admin"]}><AdminCourses /></RoleRoute>} />
        <Route path="/admin/messages" element={<RoleRoute roles={["admin"]}><AdminMessages /></RoleRoute>} />
        <Route path="/admin/announcements" element={<RoleRoute roles={["admin"]}><AdminAnnouncements /></RoleRoute>} />
        <Route path="/admin/enrollments" element={<RoleRoute roles={["admin"]}><AdminEnrollments /></RoleRoute>} />
      </Routes>

      {/* Global chatbot — shown only to logged-in users */}
      {user && <ChatbotWidget />}
    </>
  );
}

export default App;
