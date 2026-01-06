import { Terminal, Box } from '../tui';
import { useGameStore } from '../../store/gameStore';
import type { Upgrade, UpgradeCategory } from '../../types';
import './TechTreeScreen.css';

// Upgrade Card Component
function UpgradeCard({ 
  upgrade, 
  onPurchase,
  canAfford,
}: { 
  upgrade: Upgrade;
  onPurchase: () => void;
  canAfford: boolean;
}) {
  const statusClass = upgrade.purchased 
    ? 'purchased' 
    : !upgrade.unlocked 
    ? 'locked' 
    : canAfford 
    ? 'available' 
    : 'expensive';

  return (
    <div className={`upgrade-card ${statusClass}`}>
      <div className="upgrade-icon">{upgrade.icon}</div>
      <div className="upgrade-content">
        <div className="upgrade-name">{upgrade.name}</div>
        <div className="upgrade-desc">{upgrade.description}</div>
        <div className="upgrade-effects">
          {upgrade.effects.map((effect, i) => (
            <span key={i} className={`effect ${effect.value > 0 ? 'positive' : 'negative'}`}>
              {effect.value > 0 ? '+' : ''}{effect.value}% {effect.type}
              {effect.target && effect.target !== 'all' && ` (${effect.target})`}
            </span>
          ))}
        </div>
      </div>
      <div className="upgrade-action">
        {upgrade.purchased ? (
          <span className="status-badge purchased">✓ Owned</span>
        ) : !upgrade.unlocked ? (
          <span className="status-badge locked">🔒 Locked</span>
        ) : (
          <button 
            className={`buy-btn ${canAfford ? '' : 'disabled'}`}
            onClick={onPurchase}
            disabled={!canAfford}
          >
            ${upgrade.cost.toLocaleString()}
          </button>
        )}
      </div>
    </div>
  );
}

// Category Section
function CategorySection({ 
  category, 
  upgrades,
  money,
  onPurchase,
}: { 
  category: UpgradeCategory;
  upgrades: Upgrade[];
  money: number;
  onPurchase: (id: string) => void;
}) {
  const categoryInfo: Record<UpgradeCategory, { name: string; icon: string; color: string }> = {
    engineering: { name: 'Engineering', icon: '💻', color: '#60a5fa' },
    culture: { name: 'Culture', icon: '🎉', color: '#f472b6' },
    tools: { name: 'Tools', icon: '🛠️', color: '#fbbf24' },
    processes: { name: 'Processes', icon: '📋', color: '#4ade80' },
  };

  const info = categoryInfo[category];
  const categoryUpgrades = upgrades.filter(u => u.category === category);
  const purchasedCount = categoryUpgrades.filter(u => u.purchased).length;

  return (
    <div className="category-section">
      <div className="category-header" style={{ borderLeftColor: info.color }}>
        <span className="category-icon">{info.icon}</span>
        <span className="category-name">{info.name}</span>
        <span className="category-progress">{purchasedCount}/{categoryUpgrades.length}</span>
      </div>
      <div className="category-upgrades">
        {categoryUpgrades.map(upgrade => (
          <UpgradeCard
            key={upgrade.id}
            upgrade={upgrade}
            canAfford={money >= upgrade.cost}
            onPurchase={() => onPurchase(upgrade.id)}
          />
        ))}
      </div>
    </div>
  );
}

export function TechTreeScreen() {
  const { 
    money, 
    upgrades, 
    setScreen,
    purchaseUpgrade,
  } = useGameStore();

  const categories: UpgradeCategory[] = ['engineering', 'culture', 'tools', 'processes'];
  const totalUpgrades = upgrades.length;
  const purchasedUpgrades = upgrades.filter(u => u.purchased).length;
  const totalBonus = upgrades
    .filter(u => u.purchased)
    .flatMap(u => u.effects)
    .filter(e => e.type === 'productivity')
    .reduce((sum, e) => sum + e.value, 0);

  return (
    <Terminal title="TECH TREE - COMPANY UPGRADES" showControls>
      <div className="tech-tree-screen">
        <div className="tech-header">
          <button className="back-btn" onClick={() => setScreen('dashboard')}>
            ← Back
          </button>
          
          <div className="tech-stats">
            <div className="tech-stat">
              <span className="stat-icon">🔬</span>
              <span className="stat-value">{purchasedUpgrades}/{totalUpgrades}</span>
              <span className="stat-label">Researched</span>
            </div>
            <div className="tech-stat">
              <span className="stat-icon">📈</span>
              <span className="stat-value">+{totalBonus}%</span>
              <span className="stat-label">Productivity</span>
            </div>
            <div className="tech-stat">
              <span className="stat-icon">💰</span>
              <span className="stat-value">${money.toLocaleString()}</span>
              <span className="stat-label">Available</span>
            </div>
          </div>
        </div>

        <Box title="🌳 UPGRADE YOUR COMPANY" className="tech-content">
          <p className="tech-intro">
            Invest in upgrades to boost your team's productivity, morale, and efficiency.
            Some upgrades unlock others in the tech tree.
          </p>
          
          <div className="categories-grid">
            {categories.map(category => (
              <CategorySection
                key={category}
                category={category}
                upgrades={upgrades}
                money={money}
                onPurchase={purchaseUpgrade}
              />
            ))}
          </div>
        </Box>
      </div>
    </Terminal>
  );
}

export default TechTreeScreen;
