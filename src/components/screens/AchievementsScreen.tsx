import { Terminal, Box } from '../tui';
import { useGameStore } from '../../store/gameStore';
import type { Achievement, AchievementCategory } from '../../types';
import { RARITY_COLORS } from '../../types/achievements';
import './AchievementsScreen.css';

// Achievement Card Component
function AchievementCard({ achievement }: { achievement: Achievement }) {
  const isLocked = !achievement.unlocked && achievement.secret;
  const rarityColor = RARITY_COLORS[achievement.rarity];
  
  return (
    <div 
      className={`achievement-card ${achievement.unlocked ? 'unlocked' : 'locked'} ${achievement.rarity}`}
      style={{ '--rarity-color': rarityColor } as React.CSSProperties}
    >
      <div className="achievement-icon">
        {isLocked ? '🔒' : achievement.icon}
      </div>
      <div className="achievement-content">
        <div className="achievement-name">
          {isLocked ? '???' : achievement.name}
        </div>
        <div className="achievement-desc">
          {isLocked ? 'Secret achievement' : achievement.description}
        </div>
        {achievement.target && !achievement.unlocked && (
          <div className="achievement-progress">
            <div 
              className="progress-fill"
              style={{ width: `${((achievement.progress || 0) / achievement.target) * 100}%` }}
            />
            <span className="progress-text">
              {achievement.progress || 0}/{achievement.target}
            </span>
          </div>
        )}
      </div>
      <div className="achievement-rarity" style={{ color: rarityColor }}>
        {achievement.rarity}
      </div>
      {achievement.unlocked && (
        <div className="achievement-check">✓</div>
      )}
    </div>
  );
}

// Category Section
function CategorySection({ 
  category, 
  achievements,
}: { 
  category: AchievementCategory;
  achievements: Achievement[];
}) {
  const categoryInfo: Record<AchievementCategory, { name: string; icon: string }> = {
    founder: { name: 'Founder', icon: '🚀' },
    team: { name: 'Team Building', icon: '👥' },
    shipping: { name: 'Shipping', icon: '📦' },
    money: { name: 'Money', icon: '💰' },
    speed: { name: 'Speed', icon: '⚡' },
    secret: { name: 'Secret', icon: '🔮' },
  };

  const info = categoryInfo[category];
  const categoryAchievements = achievements.filter(a => a.category === category);
  const unlockedCount = categoryAchievements.filter(a => a.unlocked).length;

  return (
    <div className="achievement-category">
      <div className="category-header">
        <span className="category-icon">{info.icon}</span>
        <span className="category-name">{info.name}</span>
        <span className="category-count">{unlockedCount}/{categoryAchievements.length}</span>
      </div>
      <div className="category-achievements">
        {categoryAchievements.map(achievement => (
          <AchievementCard key={achievement.id} achievement={achievement} />
        ))}
      </div>
    </div>
  );
}

export function AchievementsScreen() {
  const { achievements, setScreen, checkAchievements } = useGameStore();

  // Check achievements when screen loads
  checkAchievements();

  const totalAchievements = achievements.length;
  const unlockedAchievements = achievements.filter(a => a.unlocked).length;
  const percentage = Math.round((unlockedAchievements / totalAchievements) * 100);
  
  const categories: AchievementCategory[] = ['founder', 'team', 'shipping', 'money', 'speed', 'secret'];

  // Calculate rarity breakdown
  const rarityStats = {
    common: achievements.filter(a => a.rarity === 'common' && a.unlocked).length,
    uncommon: achievements.filter(a => a.rarity === 'uncommon' && a.unlocked).length,
    rare: achievements.filter(a => a.rarity === 'rare' && a.unlocked).length,
    epic: achievements.filter(a => a.rarity === 'epic' && a.unlocked).length,
    legendary: achievements.filter(a => a.rarity === 'legendary' && a.unlocked).length,
  };

  return (
    <Terminal title="ACHIEVEMENTS - TROPHY ROOM" showControls>
      <div className="achievements-screen">
        <div className="achievements-header">
          <button className="back-btn" onClick={() => setScreen('dashboard')}>
            ← Back
          </button>
          
          <div className="achievements-stats">
            <div className="stat-item">
              <span className="stat-icon">🏆</span>
              <span className="stat-value">{unlockedAchievements}/{totalAchievements}</span>
              <span className="stat-label">Unlocked</span>
            </div>
            <div className="stat-item">
              <span className="stat-icon">📊</span>
              <span className="stat-value">{percentage}%</span>
              <span className="stat-label">Complete</span>
            </div>
          </div>
          
          <div className="rarity-badges">
            {Object.entries(rarityStats).map(([rarity, count]) => (
              <span 
                key={rarity} 
                className="rarity-badge"
                style={{ 
                  color: RARITY_COLORS[rarity as keyof typeof RARITY_COLORS],
                  opacity: count > 0 ? 1 : 0.3,
                }}
              >
                {count}× {rarity}
              </span>
            ))}
          </div>
        </div>

        <Box title="🏆 YOUR ACHIEVEMENTS" className="achievements-content">
          <div className="overall-progress">
            <div className="progress-bar">
              <div 
                className="progress-fill"
                style={{ width: `${percentage}%` }}
              />
            </div>
            <span className="progress-label">{percentage}% Complete</span>
          </div>
          
          <div className="categories-list">
            {categories.map(category => (
              <CategorySection
                key={category}
                category={category}
                achievements={achievements}
              />
            ))}
          </div>
        </Box>
      </div>
    </Terminal>
  );
}

export default AchievementsScreen;
