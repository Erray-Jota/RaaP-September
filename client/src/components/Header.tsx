import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import raapLogoPath from "@assets/raap-logo-new.png";

export default function Header() {
  const [location, navigate] = useLocation();

  const isActive = (path: string) => {
    return location === path;
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3">
              <img src={raapLogoPath} alt="RaaP Logo" className="h-12 w-auto" />
              <div className="text-gray-400">|</div>
              <h1 
                className="text-sm sm:text-lg font-medium text-raap-dark cursor-pointer hover:text-raap-green transition-colors"
                onClick={() => navigate("/")}
              >
                <span className="sm:hidden">RaaP Workflow</span>
                <span className="hidden sm:inline">Rooms as a Product Workflow</span>
              </h1>
            </div>
          </div>
          
          <nav className="hidden md:flex space-x-8">
            <button 
              className={`${
                isActive("/") 
                  ? "text-raap-green border-b-2 border-raap-green font-medium" 
                  : "text-gray-600 hover:text-raap-green"
              } transition-colors`}
              onClick={() => navigate("/")}
            >
              Dashboard
            </button>
            <button 
              className={`${
                isActive("/create-project") 
                  ? "text-raap-green border-b-2 border-raap-green font-medium" 
                  : "text-gray-600 hover:text-raap-green"
              } transition-colors`}
              onClick={() => navigate("/create-project")}
            >
              New Project
            </button>
          </nav>
          
          <div className="flex items-center space-x-4">
            <Button 
              onClick={() => navigate('/landing')}
              variant="outline"
              size="sm"
            >
              About
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
