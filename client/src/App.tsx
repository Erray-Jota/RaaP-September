import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import Landing from "@/pages/Landing";
import Dashboard from "@/pages/Dashboard";
import ProjectDetail from "@/pages/ProjectDetail";
import CreateProject from "@/pages/CreateProject";
import WorkflowOverview from "@/pages/WorkflowOverview";
import ModularFeasibility from "@/pages/ModularFeasibility";
import SmartStart from "@/pages/SmartStart";
import FabAssure from "@/pages/FabAssure";
import EasyDesign from "@/pages/EasyDesign";
import NotFound from "@/pages/not-found";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <Switch>
      {isLoading || !isAuthenticated ? (
        <>
          <Route path="/" component={Landing} />
          <Route path="/create-project" component={CreateProject} />
        </>
      ) : (
        <>
          <Route path="/" component={Dashboard} />
          <Route path="/projects/:id/workflow" component={WorkflowOverview} />
          <Route path="/projects/:id/modular-feasibility" component={ModularFeasibility} />
          <Route path="/projects/:id/smart-start" component={SmartStart} />
          <Route path="/projects/:id/fab-assure" component={FabAssure} />
          <Route path="/projects/:id/easy-design" component={EasyDesign} />
          <Route path="/projects/:id" component={ProjectDetail} />
          <Route path="/create-project" component={CreateProject} />
        </>
      )}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
