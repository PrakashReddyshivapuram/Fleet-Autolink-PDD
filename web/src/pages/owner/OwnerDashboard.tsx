import { useState } from "react";
import SidebarLayout from "@/components/layout/SidebarLayout";
import OwnerOverview from "./OwnerOverview";
import OwnerVehicles from "./OwnerVehicles";
import ProfileSettings from "@/pages/shared/ProfileSettings";
import { LayoutDashboard, Car, User } from "lucide-react";

const NAV = [
  { key: "overview",  label: "Overview",     icon: <LayoutDashboard size={16} /> },
  { key: "vehicles",  label: "My vehicles",  icon: <Car size={16} /> },
  { key: "profile",   label: "Profile",      icon: <User size={16} /> },
];

export default function OwnerDashboard() {
  const [tab, setTab] = useState("overview");
  const content: Record<string, React.ReactNode> = {
    overview: <OwnerOverview onNavigate={setTab} />,
    vehicles: <OwnerVehicles />,
    profile:  <ProfileSettings />,
  };
  return (
    <SidebarLayout navItems={NAV} activeTab={tab} onTabChange={setTab} roleLabel="Owner" roleColor="bg-blue-100 text-blue-700">
      {content[tab]}
    </SidebarLayout>
  );
}
