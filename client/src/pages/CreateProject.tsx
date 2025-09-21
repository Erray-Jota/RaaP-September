import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { ArrowLeft, MapPin } from "lucide-react";
import { insertProjectSchema } from "@shared/schema";
import ProjectSiteMap from "@/components/ProjectSiteMap";

// Schema with proper numeric coercion
const numOpt = z.preprocess(v => v === '' || v == null ? undefined : Number(v), z.number().min(0)).optional();
const numRequired = z.preprocess(v => v === '' || v == null ? 0 : Number(v), z.number().min(1));
const adaPercent = z.preprocess(v => v === '' || v == null ? undefined : Number(v), z.number().min(0).max(100)).optional();

const createProjectSchema = insertProjectSchema.extend({
  name: z.string().min(1, "Project name is required"),
  address: z.string().min(1, "Site address is required"),
  projectType: z.string().min(1, "Project type is required"),
  targetFloors: numRequired,
  targetParkingSpaces: numOpt,
  // Hotel/Hostel specific fields
  queenUnits: numOpt,
  kingUnits: numOpt,
  oneBedUnits: numOpt,
  adaPercent: adaPercent,
  // Standard unit fields
  studioUnits: numOpt,
  twoBedUnits: numOpt,
  threeBedUnits: numOpt,
});

type CreateProjectForm = z.infer<typeof createProjectSchema>;

export default function CreateProject() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [mapTrigger, setMapTrigger] = useState(0); // Used to trigger map lookup

  const form = useForm<CreateProjectForm>({
    resolver: zodResolver(createProjectSchema),
    shouldUnregister: false,
    defaultValues: {
      name: "",
      address: "",
      projectType: "",
      targetFloors: 3,
      studioUnits: undefined,
      oneBedUnits: undefined,
      twoBedUnits: undefined,
      threeBedUnits: undefined,
      queenUnits: undefined,
      kingUnits: undefined,
      adaPercent: undefined,
      targetParkingSpaces: undefined,
    },
  });

  const projectType = form.watch("projectType");

  const createProject = useMutation({
    mutationFn: async (data: CreateProjectForm) => {
      const response = await apiRequest("POST", "/api/projects", data);
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      toast({
        title: "Project Created",
        description: "Your project has been created and assessed for modular feasibility.",
      });
      navigate(`/projects/${data.project.id}/workflow`);
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
        return;
      }
      toast({
        title: "Error",
        description: "Failed to create project. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: CreateProjectForm) => {
    createProject.mutate(data);
  };

  const handleMapLookup = () => {
    const address = form.getValues("address");
    if (address && address.trim()) {
      setMapTrigger(prev => prev + 1); // Increment to trigger map update
    } else {
      toast({
        title: "Address Required",
        description: "Please enter an address before looking up the location.",
        variant: "destructive",
      });
    }
  };

  const handleAddressKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleMapLookup();
    }
  };

  const projectTypes = [
    { value: "affordable", label: "Affordable Multifamily" },
    { value: "senior", label: "Senior Living" },
    { value: "workforce", label: "Workforce Housing" },
    { value: "student", label: "Student Housing" },
    { value: "hostel", label: "Hostel" },
    { value: "hotel", label: "Hotel" },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate("/")}
            className="text-raap-green hover:text-green-700 mb-4 p-0"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          <h2 className="text-2xl font-bold text-raap-dark mb-2">Create New Project</h2>
          <p className="text-gray-600">Enter project details to assess modular construction feasibility</p>
        </div>

        <Card className="max-w-4xl">
          <CardHeader>
            <CardTitle className="text-raap-dark">Project Information</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                {/* Basic Information */}
                <div>
                  <h3 className="text-lg font-semibold text-raap-dark mb-4">Basic Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Project Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter project name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="address"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Site Address</FormLabel>
                          <FormControl>
                            <div className="flex gap-2">
                              <Input 
                                placeholder="Enter full address" 
                                {...field} 
                                onKeyDown={handleAddressKeyDown}
                                data-testid="input-address"
                              />
                              <Button
                                type="button"
                                variant="outline"
                                onClick={handleMapLookup}
                                className="flex items-center gap-2 whitespace-nowrap"
                                data-testid="button-map-lookup"
                              >
                                <MapPin className="h-4 w-4" />
                                Locate
                              </Button>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  {/* Site Preview Map */}
                  <div className="mt-6">
                    <h4 className="text-sm font-semibold text-gray-700 mb-3">Site Preview</h4>
                    <ProjectSiteMap 
                      address={form.watch("address") || ""}
                      projectName={form.watch("name") || "Project Site"}
                      height="300px"
                      className="border rounded-lg"
                      trigger={mapTrigger}
                    />
                  </div>
                </div>

                {/* Project Type */}
                <div>
                  <h3 className="text-lg font-semibold text-raap-dark mb-4">Project Type</h3>
                  <FormField
                    control={form.control}
                    name="projectType"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <RadioGroup 
                            value={field.value} 
                            onValueChange={field.onChange}
                            className="grid grid-cols-2 md:grid-cols-3 gap-4"
                          >
                            {projectTypes.map((type) => (
                              <div key={type.value}>
                                <RadioGroupItem
                                  value={type.value}
                                  id={type.value}
                                  className="peer sr-only"
                                />
                                <Label
                                  htmlFor={type.value}
                                  className="flex items-center p-4 border border-gray-300 rounded-lg cursor-pointer hover:border-raap-green transition-colors peer-data-[state=checked]:border-raap-green peer-data-[state=checked]:bg-raap-green peer-data-[state=checked]:text-white"
                                >
                                  <span className="text-sm font-medium">{type.label}</span>
                                </Label>
                              </div>
                            ))}
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Building Details */}
                <div>
                  <h3 className="text-lg font-semibold text-raap-dark mb-4">Building Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="targetFloors"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Target # of Floors</FormLabel>
                          <FormControl>
                            <Select
                              value={field.value?.toString()}
                              onValueChange={(value) => field.onChange(parseInt(value))}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select floors" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="1">1 Floor</SelectItem>
                                <SelectItem value="2">2 Floors</SelectItem>
                                <SelectItem value="3">3 Floors</SelectItem>
                                <SelectItem value="4">4 Floors</SelectItem>
                                <SelectItem value="5">5 Floors</SelectItem>
                                <SelectItem value="6">6 Floors</SelectItem>
                              </SelectContent>
                            </Select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="targetParkingSpaces"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Target Parking Spaces</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="Number of parking spaces"
                              value={field.value ?? ""}
                              onChange={(e) => field.onChange(e.target.value)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Unit Mix */}
                <div>
                  <h3 className="text-lg font-semibold text-raap-dark mb-4">
                    {projectType === "hostel" || projectType === "hotel" ? "Target Room Mix" : "Target Unit Mix"}
                  </h3>
                  {projectType === "hostel" || projectType === "hotel" ? (
                    // Hotel/Hostel Unit Mix
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                      <FormField
                        control={form.control}
                        name="queenUnits"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Queen Rooms</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min="0"
                                placeholder="Number of Queen rooms"
                                value={field.value ?? ""}
                                onChange={(e) => field.onChange(e.target.value)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="kingUnits"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>King Rooms</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min="0"
                                placeholder="Number of King rooms"
                                value={field.value ?? ""}
                                onChange={(e) => field.onChange(e.target.value)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="oneBedUnits"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>One Bedroom</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min="0"
                                placeholder="Number of One Bedroom suites"
                                value={field.value ?? ""}
                                onChange={(e) => field.onChange(e.target.value)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="adaPercent"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>% ADA</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min="0"
                                max="100"
                                step="0.1"
                                placeholder="ADA percentage"
                                value={field.value ?? ""}
                                onChange={(e) => field.onChange(e.target.value)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  ) : (
                    // Traditional Multifamily Unit Mix
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                      <FormField
                        control={form.control}
                        name="studioUnits"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Studio Units</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min="0"
                                placeholder="Number of studio units"
                                value={field.value ?? ""}
                                onChange={(e) => field.onChange(e.target.value)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="oneBedUnits"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>1 Bedroom Units</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min="0"
                                placeholder="Number of studio units"
                                value={field.value ?? ""}
                                onChange={(e) => field.onChange(e.target.value)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="twoBedUnits"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>2 Bedroom Units</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min="0"
                                placeholder="Number of studio units"
                                value={field.value ?? ""}
                                onChange={(e) => field.onChange(e.target.value)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="threeBedUnits"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>3 Bedroom Units</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min="0"
                                placeholder="Number of studio units"
                                value={field.value ?? ""}
                                onChange={(e) => field.onChange(e.target.value)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  )}
                </div>

                <div className="flex justify-end space-x-4 pt-6">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate("/")}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="bg-raap-green hover:bg-green-700"
                    disabled={createProject.isPending}
                  >
                    {createProject.isPending ? "Creating..." : "Create Project & Assess Feasibility"}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
