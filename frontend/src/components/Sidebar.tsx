import React from 'react';
import {
  Home,
  LayoutDashboard,
  Database,
  Filter,
  Sliders,
  Cpu,
  Grid,
  Users,
  TrendingUp,
  Lightbulb,
  FileText,
  Activity,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

export type TabType =
  | 'landing'
  | 'overview'
  | 'dataset'
  | 'preprocess'
  | 'features'
  | 'som-config'
  | 'som-analysis'
  | 'segments'
  | 'insights'
  | 'recommendations'
  | 'reports'
  | 'evaluation';

interface SidebarProps {
  currentTab: TabType;
  onSelectTab: (tab: TabType) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  isTrained: boolean;
  hasDataset: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  collapsed,
  onToggleCollapse,
  isTrained,
  hasDataset
}) => {
  const menuItems = [
    { id: 'landing' as TabType, label: 'Landing Page', icon: Home, req: false },
    { id: 'overview' as TabType, label: 'Overview Dashboard', icon: LayoutDashboard, req: false },
    { id: 'dataset' as TabType, label: 'Dataset Upload', icon: Database, req: false },
    { id: 'preprocess' as TabType, label: 'Data Preprocessing', icon: Filter, req: hasDataset },
    { id: 'features' as TabType, label: 'Feature Selection', icon: Sliders, req: hasDataset },
    { id: 'som-config' as TabType, label: 'SOM Configuration', icon: Cpu, req: hasDataset },
    { id: 'som-analysis' as TabType, label: 'SOM Visualizer (U-Matrix)', icon: Grid, req: isTrained },
    { id: 'segments' as TabType, label: 'Customer Segments', icon: Users, req: isTrained },
    { id: 'insights' as TabType, label: 'Behaviour Insights', icon: TrendingUp, req: isTrained },
    { id: 'recommendations' as TabType, label: 'AI Recommendations', icon: Lightbulb, req: isTrained },
    { id: 'reports' as TabType, label: 'Reports & Export', icon: FileText, req: isTrained },
    { id: 'evaluation' as TabType, label: 'Model Evaluation', icon: Activity, req: isTrained }
  ];

  return (
    <aside
      className={`bg-black border-r border-neutral-900 transition-all duration-300 flex flex-col justify-between z-20 ${
        collapsed ? 'w-16' : 'w-64'
      }`}
    >
      <div className="p-3 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-red-600/15 text-red-400 border border-red-500/30 shadow-sm shadow-red-950/40'
                  : 'text-zinc-400 hover:text-zinc-100 hover:bg-neutral-900/60'
              }`}
            >
              <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-red-500' : 'text-zinc-500'}`} />
              {!collapsed && (
                <span className="truncate flex-1 text-left font-medium">
                  {item.label}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Collapse Toggle Button */}
      <div className="p-3 border-t border-neutral-900">
        <button
          onClick={onToggleCollapse}
          className="w-full flex items-center justify-center p-2 rounded-lg bg-neutral-950 text-zinc-400 hover:text-white hover:bg-neutral-900 border border-neutral-850 transition"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>
    </aside>
  );
};
