import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import DashboardLayout from "./components/DashboardLayout";
import Home from "./pages/Home";
import ListingDetail from "./pages/ListingDetail";
import NewListing from "./pages/NewListing";
import Listings from "./pages/Listings";
import ThemePreview from "./pages/ThemePreview";

function Router() {
  return (
    <Switch>
      <Route path="/themes" component={ThemePreview} />
      <Route>
        <DashboardLayout>
          <Switch>
            <Route path="/" component={Home} />
            <Route path="/listings" component={Listings} />
            <Route path="/listings/new" component={NewListing} />
            <Route path="/listings/:id">{(params) => <ListingDetail id={Number(params.id)} />}</Route>

            <Route path="/404" component={NotFound} />
            <Route component={NotFound} />
          </Switch>
        </DashboardLayout>
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
