import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Building, Calculator, FileText, MapPin, Users, Wrench, Palette, ArrowRight } from "lucide-react";
import raapLogoPath from "@assets/raap-logo-new.png";

export default function Landing() {
  const handleLogin = () => {
    window.location.href = "/api/login";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <img src={raapLogoPath} alt="RaaP Logo" className="h-12 w-auto" />
              <div className="text-gray-400">|</div>
              <h1 className="text-lg font-medium text-raap-dark">Rooms as a Product Workflow</h1>
            </div>
            
            <Button onClick={handleLogin} size="sm" className="bg-raap-green hover:bg-green-700 text-sm px-4 py-2">
              Sign In
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-raap-dark mb-6">
            Rooms as a Product Workflow
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            Complete 4-application workflow guiding multifamily developers from initial feasibility through final design. 
            Navigate seamlessly through ModularFeasibility → SmartStart → FabAssure → EasyDesign with integrated project data flow.
          </p>
          <Button 
            onClick={handleLogin}
            size="lg" 
            className="bg-raap-green hover:bg-green-700 text-lg px-8 py-3"
          >
            Get Started - Sign In
          </Button>
        </div>

        {/* 4-Application Workflow */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-raap-dark mb-8 text-center">
            Complete Development Workflow
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* ModularFeasibility */}
            <Card className="relative">
              <CardHeader className="text-center">
                <div className="mx-auto w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <Calculator className="h-6 w-6 text-blue-600" />
                </div>
                <CardTitle className="text-raap-dark text-lg">ModularFeasibility</CardTitle>
                <div className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full">Step 1</div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 text-sm mb-3">
                  6-criteria assessment covering zoning, massing, cost analysis, sustainability, logistics, and build time
                </p>
                <ul className="text-xs text-gray-500 space-y-1">
                  <li>• Feasibility scoring</li>
                  <li>• Cost comparison</li>
                  <li>• Professional reports</li>
                </ul>
              </CardContent>
              <div className="absolute -right-2 top-1/2 transform -translate-y-1/2 hidden lg:block">
                <ArrowRight className="h-5 w-5 text-gray-400" />
              </div>
            </Card>

            {/* SmartStart */}
            <Card className="relative">
              <CardHeader className="text-center">
                <div className="mx-auto w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                  <FileText className="h-6 w-6 text-green-600" />
                </div>
                <CardTitle className="text-raap-dark text-lg">SmartStart</CardTitle>
                <div className="text-xs bg-green-50 text-green-700 px-2 py-1 rounded-full">Step 2</div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 text-sm mb-3">
                  Entitlement and permitting coordination with regulatory compliance and AHJ engagement
                </p>
                <ul className="text-xs text-gray-500 space-y-1">
                  <li>• Permit coordination</li>
                  <li>• Regulatory compliance</li>
                  <li>• AHJ engagement</li>
                </ul>
              </CardContent>
              <div className="absolute -right-2 top-1/2 transform -translate-y-1/2 hidden lg:block">
                <ArrowRight className="h-5 w-5 text-gray-400" />
              </div>
            </Card>

            {/* FabAssure */}
            <Card className="relative">
              <CardHeader className="text-center">
                <div className="mx-auto w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center mb-4">
                  <Wrench className="h-6 w-6 text-amber-600" />
                </div>
                <CardTitle className="text-raap-dark text-lg">FabAssure</CardTitle>
                <div className="text-xs bg-amber-50 text-amber-700 px-2 py-1 rounded-full">Step 3</div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 text-sm mb-3">
                  Factory coordination with partner selection, quality standards, and production timeline management
                </p>
                <ul className="text-xs text-gray-500 space-y-1">
                  <li>• Partner selection</li>
                  <li>• Quality standards</li>
                  <li>• Timeline coordination</li>
                </ul>
              </CardContent>
              <div className="absolute -right-2 top-1/2 transform -translate-y-1/2 hidden lg:block">
                <ArrowRight className="h-5 w-5 text-gray-400" />
              </div>
            </Card>

            {/* EasyDesign */}
            <Card className="relative">
              <CardHeader className="text-center">
                <div className="mx-auto w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                  <Palette className="h-6 w-6 text-purple-600" />
                </div>
                <CardTitle className="text-raap-dark text-lg">EasyDesign</CardTitle>
                <div className="text-xs bg-purple-50 text-purple-700 px-2 py-1 rounded-full">Step 4</div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 text-sm mb-3">
                  Design finalization with AOR workflows, fabricator coordination, and GC/trades documentation
                </p>
                <ul className="text-xs text-gray-500 space-y-1">
                  <li>• Design prototypes</li>
                  <li>• Stakeholder workflows</li>
                  <li>• File coordination</li>
                </ul>
              </CardContent>
            </Card>
          </div>
          
          <div className="text-center mt-8">
            <p className="text-gray-600 text-sm">
              Each application builds on the previous step, with project data flowing seamlessly through the entire workflow
            </p>
          </div>
        </div>

        {/* Sample Project Showcase */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-16">
          <h2 className="text-2xl font-bold text-raap-dark mb-6 text-center">
            Sample Project: Serenity Village Complete Workflow
          </h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div>
              <img 
                src="https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=300" 
                alt="Serenity Village development site" 
                className="w-full h-48 rounded-lg object-cover mb-4"
              />
              <div className="space-y-2">
                <h3 className="font-semibold text-raap-dark">5224 Chestnut Road, Olivehurst CA</h3>
                <p className="text-sm text-gray-600">Affordable Housing • 24 Units • 3 Stories</p>
                <p className="text-sm text-gray-600">146' × 66' • Type V-A Construction</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="text-center">
                <div className="text-4xl font-bold text-raap-green mb-2">Complete</div>
                <div className="text-sm text-gray-600">Full Workflow Status</div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <div className="text-lg font-bold text-green-600">1%</div>
                  <div className="text-xs text-gray-600">Cost Savings</div>
                </div>
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <div className="text-lg font-bold text-blue-600">4 months</div>
                  <div className="text-xs text-gray-600">Time Saved</div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>ModularFeasibility</span>
                  <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs">Complete</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>SmartStart</span>
                  <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs">Complete</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>FabAssure</span>
                  <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs">Complete</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>EasyDesign</span>
                  <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs">Complete</span>
                </div>
              </div>

              <div className="text-sm text-gray-600">
                <strong>Successful modular construction project</strong> navigated through the complete 
                4-application workflow from initial feasibility assessment to final design coordination.
              </div>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="text-center">
          <h2 className="text-2xl font-bold text-raap-dark mb-4">
            Ready to Start Your Development Workflow?
          </h2>
          <p className="text-gray-600 mb-8">
            Join multifamily developers using our complete 4-application workflow system to navigate modular construction from feasibility through design
          </p>
          <Button 
            onClick={handleLogin}
            size="lg" 
            className="bg-raap-green hover:bg-green-700 text-lg px-8 py-3"
          >
            Begin Workflow - Sign In
          </Button>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-50 border-t border-gray-200 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <img src={raapLogoPath} alt="RaaP Logo" className="h-10 w-auto" />
              <div className="text-sm text-gray-500">
                © 2025 RaaP. Professional modular construction assessment platform.
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
