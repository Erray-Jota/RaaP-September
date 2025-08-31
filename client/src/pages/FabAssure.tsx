import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  ArrowLeft, 
  ArrowRight,
  MapPin, 
  Search,
  Building,
  Users,
  Truck,
  Shield,
  CheckCircle,
  Star,
  Phone,
  Mail,
  Globe,
  Calendar,
  AlertCircle,
  Factory,
  FileText,
  DollarSign,
  TrendingUp,
  Award,
  Settings
} from "lucide-react";
import GoogleMaps from "@/components/GoogleMaps";
import type { Project, Partner } from "@shared/schema";

export default function FabAssure() {
  const [, params] = useRoute("/projects/:id/fab-assure");
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const projectId = params?.id;
  const [activeTab, setActiveTab] = useState("identify");
  const [selectedPartnerTab, setSelectedPartnerTab] = useState("fabricator");
  const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null);

  const { data: project, isLoading, error } = useQuery<Project>({
    queryKey: ["/api/projects", projectId],
    enabled: !!projectId,
  });

  const { data: allPartners = [] } = useQuery<Partner[]>({
    queryKey: ["/api/partners"],
    enabled: !!projectId,
  });

  // Get partners by type for the selected tab
  const getPartnersByType = (type: string) => {
    return allPartners.filter(partner => partner.partnerType === type);
  };

  const currentTabPartners = getPartnersByType(selectedPartnerTab);

  // Handle authentication errors
  if (error && isUnauthorizedError(error)) {
    toast({
      title: "Unauthorized",
      description: "You are logged out. Logging in again...",
      variant: "destructive",
    });
    setTimeout(() => {
      window.location.href = "/api/login";
    }, 500);
  }

  const markAsComplete = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("PATCH", `/api/projects/${projectId}`, {
        fabAssureComplete: true
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId] });
      toast({
        title: "FabAssure Complete",
        description: "Your partner identification, evaluation, and contracting process is complete. You can now proceed to EasyDesign.",
      });
      navigate(`/projects/${projectId}/workflow`);
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
      }
    },
  });

  const seedPartners = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/seed-partners", {});
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/partners"] });
      toast({
        title: "Partners Seeded",
        description: "Sample partners have been added to the marketplace.",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse space-y-8">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="h-64 bg-gray-200 rounded-lg"></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-48 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900">Project not found</h2>
            <Button onClick={() => navigate("/")} className="mt-4">
              Back to Dashboard
            </Button>
          </div>
        </main>
      </div>
    );
  }

  // Check if user can access this application
  if (!project.smartStartComplete) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 text-orange-500" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Complete SmartStart First</h2>
            <p className="text-gray-600 mb-4">
              You need to complete the SmartStart application before accessing FabAssure.
            </p>
            <Button onClick={() => navigate(`/projects/${projectId}/workflow`)} className="mr-2">
              Back to Workflow
            </Button>
            <Button 
              onClick={() => navigate(`/projects/${projectId}/smart-start`)}
              className="bg-raap-green hover:bg-green-700"
            >
              Complete SmartStart
            </Button>
          </div>
        </main>
      </div>
    );
  }

  const partnerTypes = [
    { value: "fabricator", label: "Fabricators", icon: Factory },
    { value: "gc", label: "General Contractors", icon: Building },
    { value: "aor", label: "Architects of Record", icon: FileText },
    { value: "consultant", label: "Consultants", icon: Users },
    { value: "transportation", label: "Transportation", icon: Truck },
    { value: "engineering", label: "Engineering", icon: Settings },
  ];

  const getPartnerTypeIcon = (type: string) => {
    const partnerType = partnerTypes.find(pt => pt.value === type);
    return partnerType ? partnerType.icon : Building;
  };

  const getPartnerTypeLabel = (type: string) => {
    const partnerType = partnerTypes.find(pt => pt.value === type);
    return partnerType ? partnerType.label : type;
  };

  // Generate map locations for Google Maps
  const getMapLocations = () => {
    const locations = [];
    
    // Add project location (Serenity Village)
    locations.push({
      lat: 39.0825,
      lng: -121.5644,
      title: project?.name || 'Serenity Village',
      type: 'project' as const,
      info: project?.address || '5224 Chestnut Road, Olivehurst CA'
    });

    // Add all partner locations to map regardless of selected tab
    allPartners.forEach(partner => {
      if (partner.latitude && partner.longitude) {
        locations.push({
          lat: parseFloat(partner.latitude),
          lng: parseFloat(partner.longitude),
          title: partner.name,
          type: partner.partnerType as any,
          info: `${partner.location} • ${partner.totalProjects} projects • ${partner.rating}★`
        });
      }
    });

    return locations;
  };


  const renderPartnerCard = (partner: Partner) => {
    const Icon = getPartnerTypeIcon(partner.partnerType);
    return (
      <Card 
        key={partner.id} 
        className="cursor-pointer hover:shadow-lg transition-shadow"
        onClick={() => setSelectedPartner(partner)}
        data-testid={`card-partner-${partner.id}`}
      >
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-lg">{partner.name}</CardTitle>
              <div className="flex items-center text-sm text-gray-600 mt-1">
                <MapPin className="h-4 w-4 mr-1" />
                {partner.location}
              </div>
            </div>
            <Icon className="h-6 w-6 text-blue-600" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Established</span>
              <span className="font-medium">{partner.yearEstablished}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Focus</span>
              <Badge variant="secondary">{partner.buildingTypeFocus}</Badge>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Rating</span>
              <div className="flex items-center">
                <Star className="h-4 w-4 text-yellow-500 mr-1" />
                <span className="font-medium">{partner.rating}</span>
              </div>
            </div>
            <div className="text-sm text-gray-700 line-clamp-2">
              {partner.description}
            </div>
            <div className="text-xs text-blue-600 font-medium">
              {partner.totalProjects} completed projects
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 flex justify-between items-start">
          <div>
            <Button
              variant="ghost"
              onClick={() => navigate(`/projects/${projectId}/workflow`)}
              className="text-raap-green hover:text-green-700 mb-4 p-0"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Workflow
            </Button>
            <h1 className="text-3xl font-bold text-raap-dark mb-2">FabAssure Application</h1>
            <h2 className="text-xl text-gray-700 mb-2">{project.name}</h2>
            <div className="flex items-center text-gray-600 mb-2">
              <MapPin className="h-4 w-4 mr-1" />
              {project.address}
            </div>
            <p className="text-gray-600">
              Identify, evaluate, contract, and manage key fabrication partners and service providers
            </p>
          </div>
          <div className="text-right">
            {allPartners.length === 0 && (
              <Button
                onClick={() => seedPartners.mutate()}
                disabled={seedPartners.isPending}
                className="bg-blue-600 hover:bg-blue-700 mb-4"
                data-testid="button-seed-partners"
              >
                {seedPartners.isPending ? "Seeding..." : "Seed Sample Partners"}
              </Button>
            )}
            {project.fabAssureComplete && (
              <Badge className="bg-green-500 text-white">
                <CheckCircle className="h-4 w-4 mr-1" />
                Complete
              </Badge>
            )}
          </div>
        </div>

        {/* Tab Interface */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-4 w-full mb-8">
            <TabsTrigger value="identify" className="flex items-center space-x-1">
              <Search className="h-4 w-4" />
              <span className="hidden sm:inline">Identify</span>
            </TabsTrigger>
            <TabsTrigger value="evaluate" className="flex items-center space-x-1">
              <TrendingUp className="h-4 w-4" />
              <span className="hidden sm:inline">Evaluate</span>
            </TabsTrigger>
            <TabsTrigger value="contract" className="flex items-center space-x-1">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Contract</span>
            </TabsTrigger>
            <TabsTrigger value="management" className="flex items-center space-x-1">
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">Management</span>
            </TabsTrigger>
          </TabsList>

          {/* Identify Tab - Marketplace */}
          <TabsContent value="identify">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Search className="h-5 w-5" />
                    <span>Partner Marketplace</span>
                  </CardTitle>
                  <p className="text-gray-600">
                    Discover and identify qualified partners for your modular construction project based on location, capacity, and specialties.
                  </p>
                </CardHeader>
                <CardContent>
                  {/* Google Maps with Project and Partner Locations */}
                  <div className="mb-6">
                    <h4 className="text-sm font-medium text-gray-700 mb-3">Project & Partner Locations</h4>
                    <GoogleMaps 
                      locations={getMapLocations()}
                      center={{ lat: 39.0825, lng: -121.5644 }}
                      zoom={9}
                      height="300px"
                      className="w-full"
                    />
                    <div className="mt-3 flex flex-wrap gap-4 text-xs">
                      <div className="flex items-center gap-1">
                        <div className="w-4 h-4 bg-red-600 rounded-full flex items-center justify-center">
                          <div className="w-2 h-2 bg-white rounded-full"></div>
                        </div>
                        <span>Project Location</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Factory className="w-4 h-4 text-amber-500" />
                        <span>Fabricators</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Building className="w-4 h-4 text-emerald-600" />
                        <span>General Contractors</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <FileText className="w-4 h-4 text-blue-600" />
                        <span>Architects of Record</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4 text-violet-600" />
                        <span>Consultants</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Truck className="w-4 h-4 text-yellow-600" />
                        <span>Transportation</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Settings className="w-4 h-4 text-gray-600" />
                        <span>Engineering</span>
                      </div>
                    </div>
                  </div>

                  {/* Partner Type Tabs */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Partners by Type</h3>
                    <Tabs value={selectedPartnerTab} onValueChange={setSelectedPartnerTab} className="w-full">
                      <TabsList className="grid grid-cols-3 lg:grid-cols-6 w-full mb-6">
                        {partnerTypes.map((type) => {
                          const Icon = type.icon;
                          const count = getPartnersByType(type.value).length;
                          return (
                            <TabsTrigger key={type.value} value={type.value} className="flex items-center space-x-1">
                              <Icon className="h-4 w-4" />
                              <span className="hidden sm:inline">{type.label.split(' ')[0]}</span>
                              <Badge variant="secondary" className="ml-1 text-xs">{count}</Badge>
                            </TabsTrigger>
                          );
                        })}
                      </TabsList>
                      
                      {partnerTypes.map((type) => {
                        const typePartners = getPartnersByType(type.value);
                        return (
                          <TabsContent key={type.value} value={type.value}>
                            <div className="space-y-4">
                              <h4 className="text-md font-medium text-gray-700">
                                {type.label} ({typePartners.length})
                              </h4>
                              {typePartners.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                  {typePartners.map(renderPartnerCard)}
                                </div>
                              ) : (
                                <div className="text-center py-8 text-gray-500">
                                  No {type.label.toLowerCase()} found. 
                                  {allPartners.length === 0 && (
                                    <span> Click "Seed Sample Partners" to add demo data.</span>
                                  )}
                                </div>
                              )}
                            </div>
                          </TabsContent>
                        );
                      })}
                    </Tabs>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Evaluate Tab */}
          <TabsContent value="evaluate">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <TrendingUp className="h-5 w-5" />
                    <span>Partner Evaluation</span>
                  </CardTitle>
                  <p className="text-gray-600">
                    Evaluate fabricators and partners based on cost, design capabilities, quality, and commercial reliability.
                  </p>
                </CardHeader>
                <CardContent>
                  {/* Fabricator Selection */}
                  <div className="mb-6">
                    <Label>Select Fabricators to Evaluate</Label>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-3">
                      {allPartners.filter(p => p.partnerType === 'fabricator').map((fabricator) => (
                        <Card key={fabricator.id} className="cursor-pointer hover:bg-blue-50 border-2 hover:border-blue-200">
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-medium">{fabricator.name}</h4>
                              <Badge variant="outline">{fabricator.location}</Badge>
                            </div>
                            <div className="flex items-center justify-between text-sm text-gray-600">
                              <span>Est. {fabricator.yearEstablished}</span>
                              <div className="flex items-center">
                                <Star className="h-4 w-4 text-yellow-500 mr-1" />
                                <span>{fabricator.rating}</span>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>

                  {/* Evaluation Criteria */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Cost Evaluation */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center space-x-2">
                          <DollarSign className="h-5 w-5" />
                          <span>Cost Evaluation</span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-3">
                          <div>
                            <Label className="text-sm font-medium">Overall Cost Competitiveness</Label>
                            <div className="flex items-center space-x-4 mt-2">
                              <span className="text-sm">Low</span>
                              <div className="flex-1 flex space-x-1">
                                {[1,2,3,4,5,6,7,8,9,10].map(score => (
                                  <div key={score} className="flex-1 h-6 bg-gray-200 rounded cursor-pointer hover:bg-blue-300"></div>
                                ))}
                              </div>
                              <span className="text-sm">High</span>
                            </div>
                          </div>
                          <div>
                            <Label className="text-sm font-medium">Price Transparency</Label>
                            <div className="flex items-center space-x-4 mt-2">
                              <span className="text-sm">Poor</span>
                              <div className="flex-1 flex space-x-1">
                                {[1,2,3,4,5,6,7,8,9,10].map(score => (
                                  <div key={score} className="flex-1 h-6 bg-gray-200 rounded cursor-pointer hover:bg-blue-300"></div>
                                ))}
                              </div>
                              <span className="text-sm">Excellent</span>
                            </div>
                          </div>
                          <div>
                            <Label className="text-sm font-medium">Payment Terms Flexibility</Label>
                            <div className="flex items-center space-x-4 mt-2">
                              <span className="text-sm">Rigid</span>
                              <div className="flex-1 flex space-x-1">
                                {[1,2,3,4,5,6,7,8,9,10].map(score => (
                                  <div key={score} className="flex-1 h-6 bg-gray-200 rounded cursor-pointer hover:bg-blue-300"></div>
                                ))}
                              </div>
                              <span className="text-sm">Flexible</span>
                            </div>
                          </div>
                        </div>
                        <div className="bg-blue-50 p-3 rounded-lg">
                          <div className="text-lg font-bold text-blue-700">Cost Score: --/10</div>
                          <div className="text-sm text-blue-600">Based on pricing competitiveness and terms</div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Design Capabilities */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center space-x-2">
                          <Building className="h-5 w-5" />
                          <span>Design Capabilities</span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-3">
                          <div>
                            <Label className="text-sm font-medium">Design Flexibility</Label>
                            <div className="flex items-center space-x-4 mt-2">
                              <span className="text-sm">Limited</span>
                              <div className="flex-1 flex space-x-1">
                                {[1,2,3,4,5,6,7,8,9,10].map(score => (
                                  <div key={score} className="flex-1 h-6 bg-gray-200 rounded cursor-pointer hover:bg-green-300"></div>
                                ))}
                              </div>
                              <span className="text-sm">Highly Flexible</span>
                            </div>
                          </div>
                          <div>
                            <Label className="text-sm font-medium">Technical Innovation</Label>
                            <div className="flex items-center space-x-4 mt-2">
                              <span className="text-sm">Basic</span>
                              <div className="flex-1 flex space-x-1">
                                {[1,2,3,4,5,6,7,8,9,10].map(score => (
                                  <div key={score} className="flex-1 h-6 bg-gray-200 rounded cursor-pointer hover:bg-green-300"></div>
                                ))}
                              </div>
                              <span className="text-sm">Cutting Edge</span>
                            </div>
                          </div>
                          <div>
                            <Label className="text-sm font-medium">Sustainability Features</Label>
                            <div className="flex items-center space-x-4 mt-2">
                              <span className="text-sm">None</span>
                              <div className="flex-1 flex space-x-1">
                                {[1,2,3,4,5,6,7,8,9,10].map(score => (
                                  <div key={score} className="flex-1 h-6 bg-gray-200 rounded cursor-pointer hover:bg-green-300"></div>
                                ))}
                              </div>
                              <span className="text-sm">Comprehensive</span>
                            </div>
                          </div>
                        </div>
                        <div className="bg-green-50 p-3 rounded-lg">
                          <div className="text-lg font-bold text-green-700">Design Score: --/10</div>
                          <div className="text-sm text-green-600">Based on flexibility and innovation</div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Quality Assessment */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center space-x-2">
                          <Shield className="h-5 w-5" />
                          <span>Quality Assessment</span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-3">
                          <div>
                            <Label className="text-sm font-medium">Quality Control Processes</Label>
                            <div className="flex items-center space-x-4 mt-2">
                              <span className="text-sm">Basic</span>
                              <div className="flex-1 flex space-x-1">
                                {[1,2,3,4,5,6,7,8,9,10].map(score => (
                                  <div key={score} className="flex-1 h-6 bg-gray-200 rounded cursor-pointer hover:bg-yellow-300"></div>
                                ))}
                              </div>
                              <span className="text-sm">Rigorous</span>
                            </div>
                          </div>
                          <div>
                            <Label className="text-sm font-medium">Certifications & Standards</Label>
                            <div className="flex items-center space-x-4 mt-2">
                              <span className="text-sm">Minimal</span>
                              <div className="flex-1 flex space-x-1">
                                {[1,2,3,4,5,6,7,8,9,10].map(score => (
                                  <div key={score} className="flex-1 h-6 bg-gray-200 rounded cursor-pointer hover:bg-yellow-300"></div>
                                ))}
                              </div>
                              <span className="text-sm">Comprehensive</span>
                            </div>
                          </div>
                          <div>
                            <Label className="text-sm font-medium">Defect Rate History</Label>
                            <div className="flex items-center space-x-4 mt-2">
                              <span className="text-sm">High</span>
                              <div className="flex-1 flex space-x-1">
                                {[1,2,3,4,5,6,7,8,9,10].map(score => (
                                  <div key={score} className="flex-1 h-6 bg-gray-200 rounded cursor-pointer hover:bg-yellow-300"></div>
                                ))}
                              </div>
                              <span className="text-sm">Very Low</span>
                            </div>
                          </div>
                        </div>
                        <div className="bg-yellow-50 p-3 rounded-lg">
                          <div className="text-lg font-bold text-yellow-700">Quality Score: --/10</div>
                          <div className="text-sm text-yellow-600">Based on processes and track record</div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Commercial Reliability */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center space-x-2">
                          <Award className="h-5 w-5" />
                          <span>Commercial Reliability</span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-3">
                          <div>
                            <Label className="text-sm font-medium">On-Time Delivery</Label>
                            <div className="flex items-center space-x-4 mt-2">
                              <span className="text-sm">Poor</span>
                              <div className="flex-1 flex space-x-1">
                                {[1,2,3,4,5,6,7,8,9,10].map(score => (
                                  <div key={score} className="flex-1 h-6 bg-gray-200 rounded cursor-pointer hover:bg-purple-300"></div>
                                ))}
                              </div>
                              <span className="text-sm">Excellent</span>
                            </div>
                          </div>
                          <div>
                            <Label className="text-sm font-medium">Communication & Responsiveness</Label>
                            <div className="flex items-center space-x-4 mt-2">
                              <span className="text-sm">Poor</span>
                              <div className="flex-1 flex space-x-1">
                                {[1,2,3,4,5,6,7,8,9,10].map(score => (
                                  <div key={score} className="flex-1 h-6 bg-gray-200 rounded cursor-pointer hover:bg-purple-300"></div>
                                ))}
                              </div>
                              <span className="text-sm">Excellent</span>
                            </div>
                          </div>
                          <div>
                            <Label className="text-sm font-medium">Financial Stability</Label>
                            <div className="flex items-center space-x-4 mt-2">
                              <span className="text-sm">Weak</span>
                              <div className="flex-1 flex space-x-1">
                                {[1,2,3,4,5,6,7,8,9,10].map(score => (
                                  <div key={score} className="flex-1 h-6 bg-gray-200 rounded cursor-pointer hover:bg-purple-300"></div>
                                ))}
                              </div>
                              <span className="text-sm">Strong</span>
                            </div>
                          </div>
                        </div>
                        <div className="bg-purple-50 p-3 rounded-lg">
                          <div className="text-lg font-bold text-purple-700">Reliability Score: --/10</div>
                          <div className="text-sm text-purple-600">Based on delivery and communication</div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Overall Evaluation Summary */}
                  <Card className="mt-6">
                    <CardHeader>
                      <CardTitle className="text-lg">Overall Evaluation Summary</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                        <div className="text-center p-4 bg-blue-50 rounded-lg">
                          <div className="text-2xl font-bold text-blue-600">--</div>
                          <div className="text-sm text-blue-600">Cost Score</div>
                        </div>
                        <div className="text-center p-4 bg-green-50 rounded-lg">
                          <div className="text-2xl font-bold text-green-600">--</div>
                          <div className="text-sm text-green-600">Design Score</div>
                        </div>
                        <div className="text-center p-4 bg-yellow-50 rounded-lg">
                          <div className="text-2xl font-bold text-yellow-600">--</div>
                          <div className="text-sm text-yellow-600">Quality Score</div>
                        </div>
                        <div className="text-center p-4 bg-purple-50 rounded-lg">
                          <div className="text-2xl font-bold text-purple-600">--</div>
                          <div className="text-sm text-purple-600">Reliability Score</div>
                        </div>
                      </div>
                      <div className="text-center p-6 bg-gray-100 rounded-lg">
                        <div className="text-3xl font-bold text-raap-dark">Overall Score: --/10</div>
                        <div className="text-gray-600 mt-2">Weighted average of all evaluation criteria</div>
                      </div>
                      
                      <div className="mt-6">
                        <Label htmlFor="evaluationNotes">Evaluation Notes</Label>
                        <Textarea
                          id="evaluationNotes"
                          placeholder="Add detailed notes about this fabricator's strengths, weaknesses, and overall suitability for your project..."
                          rows={4}
                        />
                      </div>
                    </CardContent>
                  </Card>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Contract Tab */}
          <TabsContent value="contract">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <FileText className="h-5 w-5" />
                    <span>Contract Terms Management</span>
                  </CardTitle>
                  <p className="text-gray-600">
                    Define and manage key contractual terms for selected partners based on evaluation results and project requirements.
                  </p>
                </CardHeader>
                <CardContent>
                  {/* Selected Partners from SmartStart */}
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold mb-4">Selected Partners from SmartStart</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {project.finalSelectedFabricator && (
                        <Card className="bg-blue-50 border-blue-200">
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-medium">Fabricator</h4>
                              <Factory className="h-5 w-5 text-blue-600" />
                            </div>
                            <p className="font-semibold">{project.finalSelectedFabricator}</p>
                            <p className="text-sm text-gray-600">Final Cost: ${project.finalFabricatorCost ? Number(project.finalFabricatorCost).toLocaleString() : 'TBD'}</p>
                          </CardContent>
                        </Card>
                      )}
                      {project.finalSelectedGc && (
                        <Card className="bg-green-50 border-green-200">
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-medium">General Contractor</h4>
                              <Building className="h-5 w-5 text-green-600" />
                            </div>
                            <p className="font-semibold">{project.finalSelectedGc}</p>
                            <p className="text-sm text-gray-600">Final Cost: ${project.finalGcCost ? Number(project.finalGcCost).toLocaleString() : 'TBD'}</p>
                          </CardContent>
                        </Card>
                      )}
                    </div>
                  </div>

                  {/* Contract Forms */}
                  <div className="space-y-6">
                    {/* Fabrication Contract */}
                    {project.finalSelectedFabricator && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg">Fabrication Contract Terms</CardTitle>
                          <p className="text-sm text-gray-600">Define key terms for the fabrication agreement</p>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="fabContractValue">Contract Value</Label>
                              <Input
                                id="fabContractValue"
                                type="number"
                                step="0.01"
                                placeholder="Enter total contract value"
                                defaultValue={project.finalFabricatorCost || ""}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="fabContractStatus">Contract Status</Label>
                              <Select defaultValue="draft">
                                <SelectTrigger>
                                  <SelectValue placeholder="Select status" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="draft">Draft</SelectItem>
                                  <SelectItem value="negotiating">Negotiating</SelectItem>
                                  <SelectItem value="signed">Signed</SelectItem>
                                  <SelectItem value="completed">Completed</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="fabPaymentTerms">Payment Terms</Label>
                            <Textarea
                              id="fabPaymentTerms"
                              placeholder="Define payment schedule, milestones, and terms (e.g., 30% upon signing, 40% at 50% completion, 30% upon delivery)"
                              rows={3}
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="fabDeliverySchedule">Delivery Schedule</Label>
                            <Textarea
                              id="fabDeliverySchedule"
                              placeholder="Specify delivery timeline, key milestones, and coordination requirements"
                              rows={3}
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="fabQualityRequirements">Quality Requirements & Standards</Label>
                            <Textarea
                              id="fabQualityRequirements"
                              placeholder="Define quality standards, inspection requirements, acceptance criteria, and compliance standards"
                              rows={3}
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="fabWarrantyTerms">Warranty Terms</Label>
                            <Textarea
                              id="fabWarrantyTerms"
                              placeholder="Specify warranty period, coverage, and remediation procedures"
                              rows={2}
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="fabPenaltyClauses">Penalty & Performance Clauses</Label>
                            <Textarea
                              id="fabPenaltyClauses"
                              placeholder="Define penalties for delays, quality issues, and performance incentives"
                              rows={3}
                            />
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* GC Contract */}
                    {project.finalSelectedGc && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg">General Contractor Agreement</CardTitle>
                          <p className="text-sm text-gray-600">Define key terms for the general contracting agreement</p>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="gcContractValue">Contract Value</Label>
                              <Input
                                id="gcContractValue"
                                type="number"
                                step="0.01"
                                placeholder="Enter total contract value"
                                defaultValue={project.finalGcCost || ""}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="gcContractStatus">Contract Status</Label>
                              <Select defaultValue="draft">
                                <SelectTrigger>
                                  <SelectValue placeholder="Select status" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="draft">Draft</SelectItem>
                                  <SelectItem value="negotiating">Negotiating</SelectItem>
                                  <SelectItem value="signed">Signed</SelectItem>
                                  <SelectItem value="completed">Completed</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="gcPaymentTerms">Payment Terms</Label>
                            <Textarea
                              id="gcPaymentTerms"
                              placeholder="Define payment schedule for site preparation, assembly, and completion phases"
                              rows={3}
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="gcDeliverySchedule">Project Schedule</Label>
                            <Textarea
                              id="gcDeliverySchedule"
                              placeholder="Specify site preparation timeline, module delivery coordination, and completion schedule"
                              rows={3}
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="gcQualityRequirements">Quality Requirements & Standards</Label>
                            <Textarea
                              id="gcQualityRequirements"
                              placeholder="Define construction standards, inspection protocols, and final acceptance criteria"
                              rows={3}
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="gcWarrantyTerms">Warranty Terms</Label>
                            <Textarea
                              id="gcWarrantyTerms"
                              placeholder="Specify warranty period for construction work and system installations"
                              rows={2}
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="gcPenaltyClauses">Penalty & Performance Clauses</Label>
                            <Textarea
                              id="gcPenaltyClauses"
                              placeholder="Define penalties for delays, coordination issues, and performance bonuses"
                              rows={3}
                            />
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Additional Partner Contracts */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Additional Partner Contracts</CardTitle>
                        <p className="text-sm text-gray-600">Manage contracts for transportation, engineering, and consulting partners</p>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                            <div>
                              <h4 className="font-medium">Transportation & Setting</h4>
                              <p className="text-sm text-gray-600">Modular transport and crane services</p>
                            </div>
                            <Button variant="outline" size="sm">
                              <FileText className="h-4 w-4 mr-2" />
                              Add Contract
                            </Button>
                          </div>
                          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                            <div>
                              <h4 className="font-medium">Engineering Services</h4>
                              <p className="text-sm text-gray-600">Structural and MEP engineering support</p>
                            </div>
                            <Button variant="outline" size="sm">
                              <FileText className="h-4 w-4 mr-2" />
                              Add Contract
                            </Button>
                          </div>
                          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                            <div>
                              <h4 className="font-medium">Implementation Partners</h4>
                              <p className="text-sm text-gray-600">Specialized installation and coordination services</p>
                            </div>
                            <Button variant="outline" size="sm">
                              <FileText className="h-4 w-4 mr-2" />
                              Add Contract
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Contract Summary */}
                    <Card className="bg-blue-50 border-blue-200">
                      <CardHeader>
                        <CardTitle className="text-lg">Contract Portfolio Summary</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="text-center">
                            <div className="text-2xl font-bold text-blue-600">
                              ${((Number(project.finalFabricatorCost) || 0) + (Number(project.finalGcCost) || 0)).toLocaleString()}
                            </div>
                            <div className="text-sm text-blue-600">Total Contract Value</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-green-600">2</div>
                            <div className="text-sm text-green-600">Active Contracts</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-orange-600">0</div>
                            <div className="text-sm text-orange-600">Pending Signatures</div>
                          </div>
                        </div>
                        
                        <div className="mt-4 p-3 bg-white rounded-lg">
                          <h4 className="font-medium mb-2">Next Steps</h4>
                          <ul className="text-sm text-gray-700 space-y-1">
                            <li>• Finalize payment terms with fabricator</li>
                            <li>• Review quality requirements with GC</li>
                            <li>• Schedule contract signing meetings</li>
                            <li>• Establish project communication protocols</li>
                          </ul>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Management Tab */}
          <TabsContent value="management">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Settings className="h-5 w-5" />
                    <span>Partner Management & Workflows</span>
                  </CardTitle>
                  <p className="text-gray-600">
                    Coordinate ongoing workflows, track progress, and manage communication with all project partners.
                  </p>
                </CardHeader>
                <CardContent>
                  {/* Project Timeline */}
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold mb-4">Project Timeline & Milestones</h3>
                    <div className="space-y-4">
                      <div className="flex items-center p-4 bg-green-50 border border-green-200 rounded-lg">
                        <CheckCircle className="h-5 w-5 text-green-600 mr-3" />
                        <div className="flex-1">
                          <h4 className="font-medium">Design Package Complete</h4>
                          <p className="text-sm text-gray-600">Conceptual designs and entitlement package finalized</p>
                        </div>
                        <Badge className="bg-green-500 text-white">Complete</Badge>
                      </div>
                      
                      <div className="flex items-center p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <Calendar className="h-5 w-5 text-blue-600 mr-3" />
                        <div className="flex-1">
                          <h4 className="font-medium">Fabrication Start</h4>
                          <p className="text-sm text-gray-600">Module production begins at selected fabricator</p>
                        </div>
                        <Badge className="bg-blue-500 text-white">In Progress</Badge>
                      </div>
                      
                      <div className="flex items-center p-4 bg-gray-50 border border-gray-200 rounded-lg">
                        <Calendar className="h-5 w-5 text-gray-600 mr-3" />
                        <div className="flex-1">
                          <h4 className="font-medium">Site Preparation</h4>
                          <p className="text-sm text-gray-600">Foundation and utility installation by GC</p>
                        </div>
                        <Badge variant="secondary">Upcoming</Badge>
                      </div>
                      
                      <div className="flex items-center p-4 bg-gray-50 border border-gray-200 rounded-lg">
                        <Calendar className="h-5 w-5 text-gray-600 mr-3" />
                        <div className="flex-1">
                          <h4 className="font-medium">Module Delivery & Assembly</h4>
                          <p className="text-sm text-gray-600">Transportation and on-site assembly coordination</p>
                        </div>
                        <Badge variant="secondary">Upcoming</Badge>
                      </div>
                    </div>
                  </div>

                  {/* Active Partners Dashboard */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center space-x-2">
                          <Factory className="h-5 w-5" />
                          <span>Fabricator Coordination</span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">Current Status</span>
                            <Badge className="bg-green-500 text-white">Production Active</Badge>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">Progress</span>
                            <span className="text-sm">35% Complete</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div className="bg-green-600 h-2 rounded-full" style={{width: '35%'}}></div>
                          </div>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                              <span>Last Update</span>
                              <span className="text-gray-600">2 hours ago</span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                              <span>Next Milestone</span>
                              <span className="text-gray-600">First Quality Check</span>
                            </div>
                          </div>
                          <Button size="sm" className="w-full">
                            <Phone className="h-4 w-4 mr-2" />
                            Contact Fabricator
                          </Button>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center space-x-2">
                          <Building className="h-5 w-5" />
                          <span>GC Coordination</span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">Current Status</span>
                            <Badge className="bg-blue-500 text-white">Site Prep Planning</Badge>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">Progress</span>
                            <span className="text-sm">15% Complete</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div className="bg-blue-600 h-2 rounded-full" style={{width: '15%'}}></div>
                          </div>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                              <span>Last Update</span>
                              <span className="text-gray-600">1 day ago</span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                              <span>Next Milestone</span>
                              <span className="text-gray-600">Permit Approval</span>
                            </div>
                          </div>
                          <Button size="sm" className="w-full">
                            <Phone className="h-4 w-4 mr-2" />
                            Contact GC
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Quality Checkpoints */}
                  <Card className="mb-6">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center space-x-2">
                        <Shield className="h-5 w-5" />
                        <span>Quality Checkpoints</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                          <div className="flex items-center">
                            <CheckCircle className="h-5 w-5 text-green-600 mr-3" />
                            <div>
                              <h4 className="font-medium">Pre-Production Review</h4>
                              <p className="text-sm text-gray-600">Design approval and material verification</p>
                            </div>
                          </div>
                          <Badge className="bg-green-500 text-white">Passed</Badge>
                        </div>
                        
                        <div className="flex items-center justify-between p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                          <div className="flex items-center">
                            <AlertCircle className="h-5 w-5 text-yellow-600 mr-3" />
                            <div>
                              <h4 className="font-medium">Mid-Production Inspection</h4>
                              <p className="text-sm text-gray-600">Structural and MEP systems verification</p>
                            </div>
                          </div>
                          <Badge className="bg-yellow-500 text-white">Scheduled</Badge>
                        </div>
                        
                        <div className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg">
                          <div className="flex items-center">
                            <Calendar className="h-5 w-5 text-gray-600 mr-3" />
                            <div>
                              <h4 className="font-medium">Final Quality Inspection</h4>
                              <p className="text-sm text-gray-600">Complete module inspection before delivery</p>
                            </div>
                          </div>
                          <Badge variant="secondary">Pending</Badge>
                        </div>
                        
                        <div className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg">
                          <div className="flex items-center">
                            <Calendar className="h-5 w-5 text-gray-600 mr-3" />
                            <div>
                              <h4 className="font-medium">On-Site Assembly Review</h4>
                              <p className="text-sm text-gray-600">Installation and connection verification</p>
                            </div>
                          </div>
                          <Badge variant="secondary">Future</Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Communication Log */}
                  <Card className="mb-6">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center space-x-2">
                        <Mail className="h-5 w-5" />
                        <span>Communication Log</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="border-l-4 border-blue-400 pl-4 py-2">
                          <div className="flex items-center justify-between mb-1">
                            <h4 className="font-medium">Fabricator Weekly Update</h4>
                            <span className="text-sm text-gray-500">2 hours ago</span>
                          </div>
                          <p className="text-sm text-gray-600">Production progress on schedule, modules 1-4 completed structural phase</p>
                          <div className="flex items-center mt-2">
                            <Badge variant="outline" className="mr-2">Fabricator</Badge>
                            <Badge variant="outline" className="mr-2">Progress Update</Badge>
                          </div>
                        </div>
                        
                        <div className="border-l-4 border-green-400 pl-4 py-2">
                          <div className="flex items-center justify-between mb-1">
                            <h4 className="font-medium">GC Site Permit Approved</h4>
                            <span className="text-sm text-gray-500">1 day ago</span>
                          </div>
                          <p className="text-sm text-gray-600">Building permits approved, site preparation can begin next week</p>
                          <div className="flex items-center mt-2">
                            <Badge variant="outline" className="mr-2">General Contractor</Badge>
                            <Badge variant="outline" className="mr-2">Milestone</Badge>
                          </div>
                        </div>
                        
                        <div className="border-l-4 border-yellow-400 pl-4 py-2">
                          <div className="flex items-center justify-between mb-1">
                            <h4 className="font-medium">Transportation Scheduling</h4>
                            <span className="text-sm text-gray-500">3 days ago</span>
                          </div>
                          <p className="text-sm text-gray-600">Coordinating delivery schedule with fabricator timeline and site readiness</p>
                          <div className="flex items-center mt-2">
                            <Badge variant="outline" className="mr-2">Transportation</Badge>
                            <Badge variant="outline" className="mr-2">Planning</Badge>
                          </div>
                        </div>
                      </div>
                      
                      <div className="mt-4 flex space-x-2">
                        <Button size="sm" variant="outline">
                          <Mail className="h-4 w-4 mr-2" />
                          Send Update Request
                        </Button>
                        <Button size="sm" variant="outline">
                          <Calendar className="h-4 w-4 mr-2" />
                          Schedule Meeting
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Issues & Actions */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center space-x-2">
                          <AlertCircle className="h-5 w-5" />
                          <span>Active Issues</span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-medium text-red-800">Material Delivery Delay</h4>
                              <Badge className="bg-red-500 text-white">High</Badge>
                            </div>
                            <p className="text-sm text-red-700">Window supplier experiencing 2-week delay</p>
                            <div className="flex items-center justify-between mt-2 text-sm">
                              <span className="text-red-600">Assigned: Project Manager</span>
                              <span className="text-red-600">Due: Tomorrow</span>
                            </div>
                          </div>
                          
                          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-medium text-yellow-800">Design Clarification Needed</h4>
                              <Badge className="bg-yellow-500 text-white">Medium</Badge>
                            </div>
                            <p className="text-sm text-yellow-700">Bathroom layout confirmation for units 12-15</p>
                            <div className="flex items-center justify-between mt-2 text-sm">
                              <span className="text-yellow-600">Assigned: Architect</span>
                              <span className="text-yellow-600">Due: Friday</span>
                            </div>
                          </div>
                          
                          <Button size="sm" className="w-full">
                            Add New Issue
                          </Button>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center space-x-2">
                          <CheckCircle className="h-5 w-5" />
                          <span>Pending Actions</span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-medium">Quality Inspection Schedule</h4>
                              <Badge className="bg-blue-500 text-white">This Week</Badge>
                            </div>
                            <p className="text-sm text-gray-600">Schedule mid-production quality review</p>
                          </div>
                          
                          <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-medium">Site Access Coordination</h4>
                              <Badge className="bg-green-500 text-white">Next Week</Badge>
                            </div>
                            <p className="text-sm text-gray-600">Coordinate crane and delivery access with city</p>
                          </div>
                          
                          <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-medium">Insurance Documentation</h4>
                              <Badge className="bg-purple-500 text-white">Future</Badge>
                            </div>
                            <p className="text-sm text-gray-600">Review and update project insurance coverage</p>
                          </div>
                          
                          <Button size="sm" className="w-full">
                            Add New Action
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Selected Partner Details Modal/Sidebar could go here */}
        {selectedPartner && (
          <Card className="mt-8 bg-blue-50 border-blue-200">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Selected: {selectedPartner.name}</span>
                <Button variant="ghost" onClick={() => setSelectedPartner(null)}>
                  ×
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold mb-2">Contact Information</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex items-center">
                      <Mail className="h-4 w-4 mr-2" />
                      {selectedPartner.contactEmail}
                    </div>
                    <div className="flex items-center">
                      <Phone className="h-4 w-4 mr-2" />
                      {selectedPartner.contactPhone}
                    </div>
                    <div className="flex items-center">
                      <Globe className="h-4 w-4 mr-2" />
                      {selectedPartner.website}
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Capabilities</h4>
                  <p className="text-sm text-gray-700 mb-2">{selectedPartner.capacity}</p>
                  <p className="text-sm text-gray-700">{selectedPartner.specialties}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Complete Application Button */}
        {!project.fabAssureComplete && (
          <Card className="mt-8">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-raap-dark mb-1">Complete FabAssure Application</h3>
                  <p className="text-gray-600">
                    Once you've identified partners, completed evaluations, established contracts, and set up management workflows, 
                    mark this application as complete to proceed to EasyDesign.
                  </p>
                </div>
                <Button
                  className="bg-raap-green hover:bg-green-700"
                  onClick={() => markAsComplete.mutate()}
                  disabled={markAsComplete.isPending}
                  data-testid="button-complete-fabassure"
                >
                  {markAsComplete.isPending ? "Completing..." : "Complete FabAssure"}
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {project.fabAssureComplete && (
          <Card className="mt-8 bg-green-50 border-green-200">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                  <div>
                    <h3 className="font-semibold text-green-800">FabAssure Complete</h3>
                    <p className="text-green-700">
                      Your partner identification, evaluation, and management process is complete. You can now proceed to EasyDesign.
                    </p>
                  </div>
                </div>
                <Button
                  className="bg-raap-green hover:bg-green-700"
                  onClick={() => navigate(`/projects/${projectId}/workflow`)}
                  data-testid="button-continue-workflow"
                >
                  Continue to Workflow
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}