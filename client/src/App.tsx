import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Screens from "./pages/Screens";
import Company from "./pages/Company";
import ScreenDetail from "./pages/ScreenDetail";
import Sector from "./pages/Sector";
import Watchlist from "./pages/Watchlist";
import Compare from "./pages/Compare";
import QueryBuilder from "./pages/QueryBuilder";

function Router() {
  // make sure to consider if you need authentication for certain routes
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/screens"} component={Screens} />
      <Route path={"/screen/:id"} component={ScreenDetail} />
      <Route path={"/company/:symbol"} component={Company} />
      <Route path={"/sector/:name"} component={Sector} />
      <Route path={"/watchlist"} component={Watchlist} />
      <Route path={"/compare"} component={Compare} />
      <Route path={"/query"} component={QueryBuilder} />
      <Route path={"/404"} component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="light"
        switchable
      >
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
