import { useState } from "react";
import SidebarLayout from "@/components/layout/SidebarLayout";
import MechanicOverview from "./MechanicOverview";
import MechanicJobs from "./MechanicJobs";
import ProfileSettings from "@/pages/shared/ProfileSettings";
import { LayoutDashboard, Wrench, User } from "lucide-react";

const NAV = [
  { key: "overview", label: "Overview", icon: <LayoutDashboard size={16} /> },
  { key: "jobs",     label: "My jobs",  icon: <Wrench size={16} /> },
  { key: "profile",  label: "Profile",  icon: <User size={16} /> },
];

export default function MechanicDashboard() {
  const [tab, setTab] = useState("overview");
  const content: Record<string, React.ReactNode> = {
    overview: <MechanicOverview onNavigate={setTab} />,
    jobs:     <MechanicJobs />,
    profile:  <ProfileSettings />,
  };
  return (
    <SidebarLayout navItems={NAV} activeTab={tab} onTabChange={setTab} roleLabel="Mechanic" roleColor="bg-orange-100 text-orange-700">
      {content[tab]}
    </SidebarLayout>
  );
}
