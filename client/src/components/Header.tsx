import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import raapLogoPath from "@assets/RaaP-grene@3x_1754729327740.jpg";

export default function Header() {
  const [location, navigate] = useLocation();
  const { user } = useAuth();

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  const isActive = (path: string) => {
    return location === path;
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3">
              <img src={raapLogoPath} alt="RaaP Logo" className="h-6 w-auto" style={{backgroundColor: 'white', padding: '2px'}} />
              <div className="text-gray-400">|</div>
              <h1 
                className="text-lg font-medium text-raap-dark cursor-pointer hover:text-raap-green transition-colors"
                onClick={() => navigate("/")}
              >
                Rooms as a Product Workflow
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
            {user ? (
              <div className="hidden md:flex items-center space-x-2">
                {(user as any)?.profileImageUrl && (
                  <img 
                    src={(user as any).profileImageUrl} 
                    alt="Profile" 
                    className="h-8 w-8 rounded-full object-cover"
                  />
                )}
                <span className="text-sm text-gray-600">
                  {(user as any)?.firstName || (user as any)?.email || 'User'}
                </span>
              </div>
            ) : null}
            <Button 
              onClick={handleLogout}
              variant="outline"
              size="sm"
            >
              Sign Out
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
