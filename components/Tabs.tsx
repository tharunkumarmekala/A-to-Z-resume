import React from 'react';
import { Tab } from '../types';

interface TabsProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
}

export const Tabs: React.FC<TabsProps> = ({ activeTab, onTabChange }) => {
  const tabs = Object.values(Tab);

  return (
    <div className="flex border-b border-gray-200">
      {tabs.map((tab) => (
        <button
          key={tab}
          onClick={() => onTabChange(tab)}
          className={`px-4 py-2 text-sm font-medium transition-colors duration-200 ease-in-out focus:outline-none ${
            activeTab === tab
              ? 'border-b-2 border-indigo-500 text-indigo-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          {tab}
        </button>
      ))}
    </div>
  );
};
