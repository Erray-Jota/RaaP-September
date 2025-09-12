import { useState } from "react";
import { 
  FileText, 
  MapPin, 
  Box, 
  Leaf, 
  DollarSign, 
  Truck, 
  Clock 
} from "lucide-react";

interface Tab {
  id: string;
  label: string;
  icon: React.ReactNode;
}

const tabs: Tab[] = [
  { id: "summary", label: "Summary", icon: <FileText className="h-4 w-4" /> },
  { id: "zoning", label: "Zoning", icon: <MapPin className="h-4 w-4" /> },
  { id: "massing", label: "Massing", icon: <Box className="h-4 w-4" /> },
  { id: "sustainability", label: "Sustainability", icon: <Leaf className="h-4 w-4" /> },
  { id: "pricing", label: "Pricing", icon: <DollarSign className="h-4 w-4" /> },
  { id: "logistics", label: "Logistics", icon: <Truck className="h-4 w-4" /> },
  { id: "buildtime", label: "Build Time", icon: <Clock className="h-4 w-4" /> },
];

interface TabNavigationProps {
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

export default function TabNavigation({ activeTab, onTabChange }: TabNavigationProps) {
  return (
    <nav className="bg-white border-b border-border sticky top-16 z-40">
      <div className="overflow-x-auto no-scrollbar">
        <div className="flex space-x-1 px-4 py-2 min-w-max">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`px-4 py-2 text-sm font-medium whitespace-nowrap rounded-md transition-colors flex items-center space-x-2 ${
                activeTab === tab.id
                  ? "tab-active bg-primary/5"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              data-testid={`tab-${tab.id}`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>
    </nav>
  );
}
