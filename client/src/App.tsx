import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { SignIn, UserButton, useUser } from '@clerk/clerk-react';
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
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
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/landing" component={Landing} />
      <Route path="/projects/:id/workflow" component={WorkflowOverview} />
      <Route path="/projects/:id/modular-feasibility" component={ModularFeasibility} />
      <Route path="/projects/:id/smart-start" component={SmartStart} />
      <Route path="/projects/:id/fab-assure" component={FabAssure} />
      <Route path="/projects/:id/easy-design" component={EasyDesign} />
      <Route path="/projects/:id" component={ProjectDetail} />
      <Route path="/create-project" component={CreateProject} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const { isSignedIn, user, isLoaded } = useUser();

  // Show loading state while Clerk is initializing
  if (!isLoaded) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh' 
      }}>
        <p>Loading...</p>
      </div>
    );
  }

  // Show sign-in page if user is not authenticated
  if (!isSignedIn) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh',
        backgroundColor: '#f5f5f5'
      }}>
        <SignIn 
          routing="hash"
          signUpUrl="#/sign-up"
        />
      </div>
    );
  }

  // User is authenticated - show the main app
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div>
          {/* Header with user info */}
          <nav style={{ 
            padding: '16px 24px', 
            borderBottom: '1px solid #e5e7eb',
            backgroundColor: 'white',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div>
              <h2 style={{ margin: 0, fontSize: '18px' }}>
                Welcome, {user.firstName || 'User'}! 👋
              </h2>
            </div>
            <UserButton afterSignOutUrl="/" />
          </nav>

          {/* Main app content */}
          <main>
            <Toaster />
            <Router />
          </main>
        </div>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;