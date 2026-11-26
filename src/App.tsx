import React, { useState } from "react";
import { MainLayout } from "./components/layout/MainLayout";
import { NavTab } from "./components/layout/Sidebar";
import { DashboardPage } from "./pages/DashboardPage";
import { TasksPage } from "./pages/TasksPage";
import { DiscoverPage } from "./pages/DiscoverPage";
import { MoviesPage } from "./pages/MoviesPage";
import { SeriesPage } from "./pages/SeriesPage";
import { ArchivePage } from "./pages/ArchivePage";
import { PlanPage } from "./pages/PlanPage";
import { ActivityPage } from "./pages/ActivityPage";
import { StatisticsPage } from "./pages/StatisticsPage";
import { SettingsPage } from "./pages/SettingsPage";
import { ErrorBoundary } from "./components/common/ErrorBoundary";

export const App: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<NavTab>("dashboard");
  const [discoverPreset, setDiscoverPreset] = useState<{
    mediaType?: "movie" | "series";
    language?: string;
    key: number;
  }>({ key: 0 });

  const renderContent = () => {
    switch (currentTab) {
      case "dashboard":
        return (
          <DashboardPage
            onNavigateToTasks={() => setCurrentTab("tasks")}
            onNavigateToMovies={() => setCurrentTab("movies")}
            onNavigateToSeries={() => setCurrentTab("series")}
          />
        );
      case "tasks":
        return <TasksPage />;
      case "discover":
        return <DiscoverPage externalFilter={discoverPreset} />;
      case "movies":
        return <MoviesPage />;
      case "series":
        return <SeriesPage />;
      case "archive":
        return <ArchivePage />;
      case "plan":
        return <PlanPage />;
      case "activity":
        return <ActivityPage />;
      case "statistics":
        return <StatisticsPage />;
      case "settings":
        return <SettingsPage />;
      default:
        return (
          <DashboardPage
            onNavigateToTasks={() => setCurrentTab("tasks")}
            onNavigateToMovies={() => setCurrentTab("movies")}
            onNavigateToSeries={() => setCurrentTab("series")}
          />
        );
    }
  };

  return (
    <MainLayout
      currentTab={currentTab}
      onSelectTab={setCurrentTab}
      onSelectDiscoverFilter={(filter) => {
        setDiscoverPreset({
          ...filter,
          key: Date.now(),
        });
        setCurrentTab("discover");
      }}
    >
      <ErrorBoundary onReset={() => setCurrentTab("dashboard")}>
        {renderContent()}
      </ErrorBoundary>
    </MainLayout>
  );
};

export default App;
