import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "../pages/Login";
import UserDashboard from "../pages/UserDashboard";
import WorkerDashboard from "../pages/WorkerDashboard";
import MunicipalDashboard from "../pages/MunicipalDashboard";
import LeaderboardPage from "../pages/LeaderboardPage";
import Register from "../pages/Register";
import ComplaintForm from "../pages/ComplaintForm";
import MunicipalLogin from "../pages/MunicipalLogin";
import RegisterWorker from "../pages/RegisterWorker";

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/user" element={<UserDashboard />} />
        <Route path="/worker" element={<WorkerDashboard />} />
        <Route path="/municipal" element={<MunicipalDashboard />} />
        <Route path="/leaderboard" element={<LeaderboardPage />} />
        <Route path="/register" element={<Register />} />
        <Route path="/complaint/new" element={<ComplaintForm />} />
        <Route path="/municipal-login" element={<MunicipalLogin />} />
        <Route path="/register-worker" element={<RegisterWorker />} />
      </Routes>
    </BrowserRouter>
  );
}
