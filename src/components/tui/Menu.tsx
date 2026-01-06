import { useState, useEffect, useCallback } from 'react';
import './Menu.css';

export interface MenuItem {
  id: string;
  label: string;
  shortcut?: string;
  disabled?: boolean;
  icon?: string;
}

interface MenuProps {
  items: MenuItem[];
  onSelect: (item: MenuItem) => void;
  selectedIndex?: number;
  horizontal?: boolean;
  showShortcuts?: boolean;
}

export function Menu({
  items,
  onSelect,
  selectedIndex: controlledIndex,
  horizontal = false,
  showShortcuts = true
}: MenuProps) {
  const [internalIndex, setInternalIndex] = useState(0);
  const selectedIndex = controlledIndex ?? internalIndex;

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    const enabledItems = items.filter(item => !item.disabled);
    const currentEnabledIndex = enabledItems.findIndex(
      item => item.id === items[selectedIndex]?.id
    );

    if (horizontal) {
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        const newIndex = currentEnabledIndex > 0 ? currentEnabledIndex - 1 : enabledItems.length - 1;
        const newItem = enabledItems[newIndex];
        setInternalIndex(items.findIndex(item => item.id === newItem.id));
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        const newIndex = currentEnabledIndex < enabledItems.length - 1 ? currentEnabledIndex + 1 : 0;
        const newItem = enabledItems[newIndex];
        setInternalIndex(items.findIndex(item => item.id === newItem.id));
      }
    } else {
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        const newIndex = currentEnabledIndex > 0 ? currentEnabledIndex - 1 : enabledItems.length - 1;
        const newItem = enabledItems[newIndex];
        setInternalIndex(items.findIndex(item => item.id === newItem.id));
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        const newIndex = currentEnabledIndex < enabledItems.length - 1 ? currentEnabledIndex + 1 : 0;
        const newItem = enabledItems[newIndex];
        setInternalIndex(items.findIndex(item => item.id === newItem.id));
      }
    }

    if (e.key === 'Enter') {
      e.preventDefault();
      const item = items[selectedIndex];
      if (item && !item.disabled) {
        onSelect(item);
      }
    }

    // Check for shortcut keys
    const pressedKey = e.key.toLowerCase();
    const matchingItem = items.find(
      item => item.shortcut?.toLowerCase() === pressedKey && !item.disabled
    );
    if (matchingItem) {
      e.preventDefault();
      onSelect(matchingItem);
    }
  }, [items, selectedIndex, horizontal, onSelect]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return (
    <div className={`tui-menu ${horizontal ? 'horizontal' : 'vertical'}`}>
      {items.map((item, index) => (
        <div
          key={item.id}
          className={`menu-item ${index === selectedIndex ? 'selected' : ''} ${item.disabled ? 'disabled' : ''}`}
          onClick={() => !item.disabled && onSelect(item)}
        >
          {item.icon && <span className="menu-icon">{item.icon}</span>}
          <span className="menu-label">{item.label}</span>
          {showShortcuts && item.shortcut && (
            <span className="menu-shortcut">[{item.shortcut.toUpperCase()}]</span>
          )}
        </div>
      ))}
    </div>
  );
}

export default Menu;
