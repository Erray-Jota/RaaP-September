import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Header() {
  return (
    <header className="bg-white border-b border-border sticky top-0 z-50">
      <div className="px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-lg">R</span>
            </div>
            <div>
              <h1 className="text-lg font-semibold text-primary">RaaP</h1>
              <p className="text-xs text-muted-foreground">Rooms as a Product</p>
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            className="p-2 text-muted-foreground"
            data-testid="button-menu"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </header>
  );
}
