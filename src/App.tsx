import React, { useState } from "react";
import { MainLayout } from "./components/layout/MainLayout";
import { NavTab } from "./components/layout/Sidebar";
import { DashboardPage } from "./pages/DashboardPage";
import { TasksPage } from "./pages/TasksPage";
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

  const renderContent = () => {
    switch (currentTab) {
      case "dashboard":
        return <DashboardPage />;
      case "tasks":
        return <TasksPage />;
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
        return <DashboardPage />;
    }
  };

  return (
    <MainLayout currentTab={currentTab} onSelectTab={setCurrentTab}>
      <ErrorBoundary onReset={() => setCurrentTab("dashboard")}>
        {renderContent()}
      </ErrorBoundary>
    </MainLayout>
  );
};

export default App;
