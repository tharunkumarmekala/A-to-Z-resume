import React, { useState } from 'react';
import { Tab } from '../types';

interface HeaderProps {
  onGoHome: () => void;
  activeTab: Tab | null; // Allow null for home page
  onTabChange: (tab: Tab) => void;
}

const tools = Object.values(Tab).map(tab => ({ name: tab, tab: tab }));

export const Header: React.FC<HeaderProps> = ({ onGoHome, activeTab, onTabChange }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleTabClick = (tab: Tab) => {
    onTabChange(tab);
    setIsMenuOpen(false);
  };

  return (
    <header className="bg-white shadow-sm sticky top-0 z-40">
      <div className="container mx-auto px-6 py-4 flex justify-between items-center">
        <div className="flex items-center space-x-3 cursor-pointer" onClick={onGoHome}>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h1 className="text-2xl font-bold text-gray-800">Resume A to Z</h1>
        </div>
        
        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center space-x-8">
          {tools.map((tool) => (
            <button
              key={tool.name}
              onClick={() => onTabChange(tool.tab)}
              className={`text-base font-medium transition-colors duration-200 ${
                  activeTab === tool.tab
                  ? 'text-indigo-600'
                  : 'text-gray-600 hover:text-indigo-600'
              }`}
            >
              {tool.name}
            </button>
          ))}
        </nav>

        {/* Mobile Menu Button */}
        <div className="md:hidden">
          <button onClick={() => setIsMenuOpen(!isMenuOpen)} aria-label="Open menu">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16m-7 6h7"} />
            </svg>
          </button>
        </div>
      </div>
      
      {/* Mobile Nav */}
      {isMenuOpen && (
        <nav className="md:hidden bg-white shadow-lg">
          <div className="flex flex-col px-4 py-2">
            {tools.map((tool) => (
              <button
                key={tool.name}
                onClick={() => handleTabClick(tool.tab)}
                className={`text-left py-3 px-2 text-base font-medium transition-colors duration-200 rounded-md ${
                    activeTab === tool.tab
                    ? 'text-white bg-indigo-600'
                    : 'text-gray-600 hover:text-indigo-600 hover:bg-gray-100'
                }`}
              >
                {tool.name}
              </button>
            ))}
          </div>
        </nav>
      )}
    </header>
  );
};