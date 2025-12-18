import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LanguageProvider } from "@/contexts/language-context";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { useEffect } from "react";

import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth";
import Dashboard from "@/pages/dashboard";
import UploadPage from "@/pages/upload";
import ProcessingPage from "@/pages/processing";
import ChapterPage from "@/pages/chapter";
import ReportPage from "@/pages/report";
import SubscriptionPage from "@/pages/subscription";
import AnalyticsPage from "@/pages/analytics";
import ChildWelcome from "@/pages/child-welcome";
import ChildLessons from "@/pages/child-lessons";
import LearnStage from "@/pages/learn-stage";
import PracticeStage from "@/pages/practice-stage";
import TestStage from "@/pages/test-stage";
import ResultsPage from "@/pages/results";
import BadgesPage from "@/pages/badges";
import LeaderboardPage from "@/pages/leaderboard";
import NotificationsPage from "@/pages/notifications";
import ContentLibrary from "@/pages/content-library";

function ProtectedRoute({ component: Component }: { component: () => JSX.Element }) {
  const [, setLocation] = useLocation();
  const userId = localStorage.getItem("userId");

  useEffect(() => {
    if (!userId) {
      setLocation("/auth");
    }
  }, [userId, setLocation]);

  if (!userId) return null;
  return <Component />;
}

function Router() {
  return (
    <Switch>
      <Route path="/auth" component={AuthPage} />
      <Route path="/">
        {() => <ProtectedRoute component={Dashboard} />}
      </Route>
      <Route path="/upload">
        {() => <ProtectedRoute component={UploadPage} />}
      </Route>
      <Route path="/chapter/:id/processing" component={ProcessingPage} />
      <Route path="/chapter/:id" component={ChapterPage} />
      <Route path="/report/:resultId" component={ReportPage} />
      <Route path="/subscription">
        {() => <ProtectedRoute component={SubscriptionPage} />}
      </Route>
      <Route path="/analytics">
        {() => <ProtectedRoute component={AnalyticsPage} />}
      </Route>
      
      <Route path="/child/:childId/welcome" component={ChildWelcome} />
      <Route path="/child/:childId/lessons" component={ChildLessons} />
      <Route path="/child/:childId/badges" component={BadgesPage} />
      <Route path="/child/chapter/:id/learn" component={LearnStage} />
      <Route path="/child/chapter/:id/practice" component={PracticeStage} />
      <Route path="/child/chapter/:id/test" component={TestStage} />
      <Route path="/child/chapter/:id/results" component={ResultsPage} />
      <Route path="/leaderboard">
        {() => <ProtectedRoute component={LeaderboardPage} />}
      </Route>
      <Route path="/notifications">
        {() => <ProtectedRoute component={NotificationsPage} />}
      </Route>
      <Route path="/content-library">
        {() => <ProtectedRoute component={ContentLibrary} />}
      </Route>
      
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <LanguageProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </LanguageProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
