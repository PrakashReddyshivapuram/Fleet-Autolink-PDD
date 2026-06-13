import { useState } from "react";
import SidebarLayout from "@/components/layout/SidebarLayout";
import DriverHome from "./DriverHome";
import DriverTrips from "./DriverTrips";
import DriverServiceReminders from "./DriverServiceReminders";
import DriverNearbyMechanics from "./DriverNearbyMechanics";
import DriverEmergency from "./DriverEmergency";
import ProfileSettings from "@/pages/shared/ProfileSettings";
import { Home, Navigation, Bell, MapPin, Siren, User } from "lucide-react";

const NAV = [
  { key: "home",      label: "My vehicle",  icon: <Home size={16} /> },
  { key: "trips",     label: "Trips",       icon: <Navigation size={16} /> },
  { key: "reminders", label: "Reminders",   icon: <Bell size={16} /> },
  { key: "nearby",    label: "Mechanics",   icon: <MapPin size={16} /> },
  { key: "emergency", label: "Emergency",   icon: <Siren size={16} /> },
  { key: "profile",   label: "Profile",     icon: <User size={16} /> },
];

export default function DriverDashboard() {
  const [tab, setTab] = useState("home");
  const content: Record<string, React.ReactNode> = {
    home:      <DriverHome />,
    trips:     <DriverTrips />,
    reminders: <DriverServiceReminders />,
    nearby:    <DriverNearbyMechanics />,
    emergency: <DriverEmergency />,
    profile:   <ProfileSettings />,
  };
  return (
    <SidebarLayout navItems={NAV} activeTab={tab} onTabChange={setTab} roleLabel="Driver" roleColor="bg-green-100 text-green-700">
      {content[tab]}
    </SidebarLayout>
  );
}
