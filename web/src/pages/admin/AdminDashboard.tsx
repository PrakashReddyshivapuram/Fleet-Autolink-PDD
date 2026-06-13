import { useState } from "react";
import SidebarLayout from "@/components/layout/SidebarLayout";
import AdminVehicles from "./AdminVehicles";
import AdminJobs from "./AdminJobs";
import AdminUsers from "./AdminUsers";
import AdminMap from "./AdminMap";
import AdminOverview from "./AdminOverview";
import AdminServiceHistory from "./AdminServiceHistory";
import AdminTripHistory from "./AdminTripHistory";
import ProfileSettings from "@/pages/shared/ProfileSettings";
import { LayoutDashboard, Car, Wrench, Users, Map, BookOpen, Navigation, User } from "lucide-react";

const NAV = [
  { key: "overview",        label: "Overview",         icon: <LayoutDashboard size={16} /> },
  { key: "vehicles",        label: "Vehicles",         icon: <Car size={16} /> },
  { key: "jobs",            label: "Maintenance",      icon: <Wrench size={16} /> },
  { key: "users",           label: "Users",            icon: <Users size={16} /> },
  { key: "map",             label: "Live Tracking",    icon: <Map size={16} /> },
  { key: "trips",           label: "Trip History",     icon: <Navigation size={16} /> },
  { key: "service-history", label: "Service History",  icon: <BookOpen size={16} /> },
  { key: "profile",         label: "Profile",          icon: <User size={16} /> },
];

export default function AdminDashboard() {
  const [tab, setTab] = useState("overview");

  const content: Record<string, React.ReactNode> = {
    overview:        <AdminOverview onNavigate={setTab} />,
    vehicles:        <AdminVehicles />,
    jobs:            <AdminJobs />,
    users:           <AdminUsers />,
    map:             <AdminMap />,
    trips:           <AdminTripHistory />,
    "service-history": <AdminServiceHistory />,
    profile:         <ProfileSettings />,
  };

  return (
    <SidebarLayout navItems={NAV} activeTab={tab} onTabChange={setTab}
      roleLabel="Admin" roleColor="bg-purple-100 text-purple-700">
      {content[tab]}
    </SidebarLayout>
  );
}
