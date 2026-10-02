import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import Navbar from './components/Navbar';
import LandingPage from './pages/LandingPage';
import ProfilePage from './pages/ProfilePage';
import MapPage from './pages/MapPage';
import AnalysisPage from './pages/AnalysisPage';
import SheltersPage from './pages/SheltersPage';
import ReportPage from './pages/ReportPage';
import DashboardPage from './pages/DashboardPage';
import DemoPage from './pages/DemoPage';

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Navbar />
        <Routes>
          <Route path="/"          element={<LandingPage />} />
          <Route path="/profile"   element={<ProfilePage />} />
          <Route path="/map"       element={<MapPage />} />
          <Route path="/analysis"  element={<AnalysisPage />} />
          <Route path="/shelters"  element={<SheltersPage />} />
          <Route path="/report"    element={<ReportPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/demo"      element={<DemoPage />} />
        </Routes>
      </BrowserRouter>
    </AppProvider>
  );
}
