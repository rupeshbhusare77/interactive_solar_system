/**
 * 3D Solar System Simulator — Main Application Container
 */

import React, { useState } from 'react';
import { SimulationProvider } from './state/simulationContext';
import { SolarSystemScene } from './components/canvas/SolarSystemScene';
import { Header } from './components/ui/Header';
import { TimelineControls } from './components/ui/TimelineControls';
import { InfoPanel } from './components/ui/InfoPanel';
import { MeasurementTool } from './components/ui/MeasurementTool';
import { MiniMap } from './components/ui/MiniMap';
import { PlanetQuickDock } from './components/ui/PlanetQuickDock';
import { HelpModal } from './components/ui/HelpModal';

const AppContent: React.FC = () => {
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isMeasurementOpen, setIsMeasurementOpen] = useState(false);

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
        backgroundColor: '#020408',
      }}
      className="relative text-white font-sans select-none"
    >
      {/* 3D WebGL Solar System Canvas */}
      <SolarSystemScene />

      {/* Top Navigation HUD */}
      <Header
        onOpenHelp={() => setIsHelpOpen(true)}
        onToggleMeasurement={() => setIsMeasurementOpen((prev) => !prev)}
        isMeasurementOpen={isMeasurementOpen}
      />

      {/* Left Quick-Access Fleet Dock */}
      <PlanetQuickDock />

      {/* Mission Control Timeline Scrubber & Simulation Clock */}
      <TimelineControls />

      {/* Right Drawer: Live Telemetry & Physical Data */}
      <InfoPanel />

      {/* Real-time Distance Measurement Tool */}
      <MeasurementTool
        isOpen={isMeasurementOpen}
        onClose={() => setIsMeasurementOpen(false)}
      />

      {/* Bottom-left Radar MiniMap */}
      <MiniMap />

      {/* Interactive Field Manual & Guide */}
      <HelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
    </div>
  );
};

export function App() {
  return (
    <SimulationProvider>
      <AppContent />
    </SimulationProvider>
  );
}

export default App;
