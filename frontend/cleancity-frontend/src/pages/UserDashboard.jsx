import ProfileSection from "../components/ProfileSection";
import ComplaintsSection from "../components/ComplaintsSection";
import DailyPost from "../components/DailyPost";

export default function UserDashboard() {
  return (
    <div style={{ paddingBottom: "200px", height: "100vh", width: "39.7vh" }}>
      <ProfileSection />
      <ComplaintsSection />
      <DailyPost />
    </div>
  );
}
