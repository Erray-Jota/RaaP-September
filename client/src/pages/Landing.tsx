import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Building, Calculator, FileText, MapPin } from "lucide-react";
import raapLogoPath from "@assets/RaaP-grene@3x_1754729327740.jpg";

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
              <img src={raapLogoPath} alt="RaaP Logo" className="h-6 w-auto bg-white" />
              <div className="text-gray-400">|</div>
              <h1 className="text-lg font-medium text-raap-dark">ModularFeasibility</h1>
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
            Assess Modular Construction Feasibility
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            Professional assessment platform for multifamily developers to evaluate modular construction 
            suitability with detailed 6-criteria scoring, cost analysis, and comprehensive reporting.
          </p>
          <Button 
            onClick={handleLogin}
            size="lg" 
            className="bg-raap-green hover:bg-green-700 text-lg px-8 py-3"
          >
            Get Started - Sign In
          </Button>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          <Card className="text-center">
            <CardHeader>
              <div className="mx-auto w-12 h-12 bg-raap-green/10 rounded-lg flex items-center justify-center mb-4">
                <Calculator className="h-6 w-6 text-raap-green" />
              </div>
              <CardTitle className="text-raap-dark">6-Criteria Scoring</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 text-sm">
                Comprehensive assessment across Zoning, Massing, Cost, Sustainability, Logistics, and Build Time
              </p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <div className="mx-auto w-12 h-12 bg-raap-green/10 rounded-lg flex items-center justify-center mb-4">
                <Building className="h-6 w-6 text-raap-green" />
              </div>
              <CardTitle className="text-raap-dark">MasterFormat Costing</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 text-sm">
                Detailed cost breakdown with modular vs site-built comparison using industry-standard categories
              </p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <div className="mx-auto w-12 h-12 bg-raap-green/10 rounded-lg flex items-center justify-center mb-4">
                <MapPin className="h-6 w-6 text-raap-green" />
              </div>
              <CardTitle className="text-raap-dark">Logistics Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 text-sm">
                Transportation routes, factory proximity, and site staging assessment with visual mapping
              </p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <div className="mx-auto w-12 h-12 bg-raap-green/10 rounded-lg flex items-center justify-center mb-4">
                <FileText className="h-6 w-6 text-raap-green" />
              </div>
              <CardTitle className="text-raap-dark">Professional Reports</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 text-sm">
                Downloadable PDF reports with detailed analysis, architectural plans, and recommendations
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Sample Project Showcase */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-16">
          <h2 className="text-2xl font-bold text-raap-dark mb-6 text-center">
            Sample Assessment: Serenity Village
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
                <div className="text-4xl font-bold text-raap-green mb-2">4.4</div>
                <div className="text-sm text-gray-600">Overall Feasibility Score</div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <div className="text-lg font-bold text-green-600">1.2%</div>
                  <div className="text-xs text-gray-600">Cost Savings</div>
                </div>
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <div className="text-lg font-bold text-blue-600">4 months</div>
                  <div className="text-xs text-gray-600">Time Saved</div>
                </div>
              </div>

              <div className="text-sm text-gray-600">
                <strong>Good fit for modular construction</strong> with high feasibility score based on 
                zoning compatibility, massing efficiency, cost advantages, sustainability goals, 
                logistics accessibility, and construction timeline benefits.
              </div>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="text-center">
          <h2 className="text-2xl font-bold text-raap-dark mb-4">
            Ready to Assess Your Project?
          </h2>
          <p className="text-gray-600 mb-8">
            Join construction professionals using ModularFeasibility to make data-driven decisions
          </p>
          <Button 
            onClick={handleLogin}
            size="lg" 
            className="bg-raap-green hover:bg-green-700 text-lg px-8 py-3"
          >
            Start Your Assessment
          </Button>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-50 border-t border-gray-200 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <img src={raapLogoPath} alt="RaaP Logo" className="h-5 w-auto bg-white" />
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
