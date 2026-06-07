import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "next-themes";
import NotFound from "@/pages/not-found";

import { Sidebar } from "@/components/layout/sidebar";
import Overview from "@/pages/overview";
import Churn from "@/pages/churn";
import Revenue from "@/pages/revenue";
import Customers from "@/pages/customers";
import Regional from "@/pages/regional";
import Ml from "@/pages/ml";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
    },
  },
});

function Router() {
  return (
    <Switch>
      <Route path="/" component={Overview} />
      <Route path="/churn" component={Churn} />
      <Route path="/revenue" component={Revenue} />
      <Route path="/customers" component={Customers} />
      <Route path="/regional" component={Regional} />
      <Route path="/ml" component={Ml} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <div className="flex min-h-screen w-full bg-background font-sans">
              <Sidebar />
              <div className="flex-1 flex flex-col min-w-0">
                <Router />
              </div>
            </div>
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
