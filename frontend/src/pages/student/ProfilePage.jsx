import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import DashboardLayout from "../../components/DashboardLayout";
import api from "../../api/client";
import { useAuth } from "../../context/AuthContext";
import { resolveMediaUrl } from "../../utils/mediaUrl";

const ProfilePage = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    api.get("/profile").then(({ data }) => setProfile(data.user));
  }, []);

  if (!profile) return <DashboardLayout title="Profile"><p>Loading...</p></DashboardLayout>;

  const avatar = resolveMediaUrl(profile.profilePic) || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.fullName)}&background=2e7d32&color=fff`;

  return (
    <DashboardLayout title="Profile">
      <div className="profile-page">
        <img src={avatar} alt={profile.fullName} className="profile-page__avatar" />
        <h2>{profile.fullName}</h2>
        <p className="profile-page__role">{profile.role}</p>
        <p>{profile.bio || "No bio added yet."}</p>
        <ul className="profile-page__details">
          <li><strong>Email:</strong> {profile.email}</li>
          <li><strong>Username:</strong> @{profile.username}</li>
          <li><strong>Learning streak:</strong> {profile.learningStreak || 0} days</li>
        </ul>
        <Link to="/student/settings" className="btn btn--primary">Edit profile</Link>
      </div>
    </DashboardLayout>
  );
};

export default ProfilePage;
