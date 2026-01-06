/**
 * Mobile Navigation Component
 * 
 * Bottom navigation bar for mobile users with quick access to main screens.
 */

import { useGameStore } from '../store/gameStore';
import type { GameScreen } from '../types';
import './MobileNav.css';

interface NavItem {
  id: GameScreen;
  icon: string;
  label: string;
}

const navItems: NavItem[] = [
  { id: 'rts', icon: '🏰', label: 'Game' },
  { id: 'tasks', icon: '📋', label: 'Tasks' },
  { id: 'hire', icon: '👥', label: 'Hire' },
  { id: 'missions', icon: '🎯', label: 'Missions' },
  { id: 'settings', icon: '⚙️', label: 'Settings' },
];

export function MobileNav() {
  const { screen, setScreen, project, notifications } = useGameStore();
  
  // Don't show on start screen or auth
  if (!project || screen === 'start' || screen === 'auth') {
    return null;
  }
  
  const unreadCount = notifications.length;
  
  return (
    <nav className="mobile-nav" role="navigation" aria-label="Main navigation">
      {navItems.map((item) => (
        <button
          key={item.id}
          className={`mobile-nav-item ${screen === item.id ? 'active' : ''}`}
          onClick={() => setScreen(item.id)}
          aria-current={screen === item.id ? 'page' : undefined}
        >
          <span className="nav-icon">{item.icon}</span>
          <span className="nav-label">{item.label}</span>
          {item.id === 'settings' && unreadCount > 0 && (
            <span className="nav-badge">{unreadCount}</span>
          )}
        </button>
      ))}
    </nav>
  );
}

export default MobileNav;
