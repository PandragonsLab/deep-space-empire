import { ARCHETYPES } from '../game';

export default function CharacterSheet({ player, worldState }) {
  const arch = ARCHETYPES[player.archetype];
  const xpPct = Math.floor((player.xp / player.xp_to_next) * 100);
  const hpPct = Math.floor((player.hp / player.max_hp) * 100);
  const resPct = Math.floor((player.resource / player.max_resource) * 100);

  const standingLabel = (v) => {
    if (v >= 30) return { label: 'Allied', cls: 'positive' };
    if (v >= 10) return { label: 'Friendly', cls: 'positive' };
    if (v <= -30) return { label: 'Hostile', cls: 'negative' };
    if (v <= -10) return { label: 'Unfriendly', cls: 'negative' };
    return { label: 'Neutral', cls: 'neutral' };
  };

  return (
    <aside className="character-sheet">
      <div className="sheet-header">
        <div className="char-name">{player.name}</div>
        <div className="char-class" style={{ color: arch.color }}>
          Level {player.level} {arch.name}
        </div>
      </div>

      <div className="stat-bars">
        <BarRow label="HP" current={player.hp} max={player.max_hp} pct={hpPct} color="#c0392b" />
        <BarRow
          label={player.resource_name}
          current={player.resource}
          max={player.max_resource}
          pct={resPct}
          color={arch.color}
        />
        <BarRow label="XP" current={player.xp} max={player.xp_to_next} pct={xpPct} color="#c9a84c" />
      </div>

      <div className="stats-grid">
        {[['STR', player.stats.str], ['INT', player.stats.int], ['AGI', player.stats.agi]].map(
          ([k, v]) => (
            <div key={k} className="stat-box">
              <span className="stat-label">{k}</span>
              <span className="stat-value">{v}</span>
            </div>
          )
        )}
      </div>

      <div className="sheet-section">
        <h4 className="sheet-section-title">Skills</h4>
        <ul className="skills-list">
          {player.skills.map((skill) => (
            <li key={skill.id} className="skill-item">
              <span className="skill-name">{skill.name}</span>
              <span className="skill-desc">{skill.desc}</span>
            </li>
          ))}
        </ul>
      </div>

      {player.inventory.length > 0 && (
        <div className="sheet-section">
          <h4 className="sheet-section-title">Inventory</h4>
          <ul className="inv-list">
            {player.inventory.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="sheet-section">
        <h4 className="sheet-section-title">Factions</h4>
        {Object.entries(worldState.faction_standing).map(([faction, val]) => {
          const { label, cls } = standingLabel(val);
          return (
            <div key={faction} className="faction-row">
              <span className="faction-name">{faction.replace(/_/g, ' ')}</span>
              <span className={`faction-standing ${cls}`}>{label}</span>
            </div>
          );
        })}
      </div>
    </aside>
  );
}

function BarRow({ label, current, max, pct, color }) {
  return (
    <div className="bar-group">
      <div className="bar-label">
        <span>{label}</span>
        <span>
          {current}/{max}
        </span>
      </div>
      <div className="bar-track">
        <div
          className="bar-fill"
          style={{ width: `${Math.max(0, Math.min(100, pct))}%`, background: color }}
        />
      </div>
    </div>
  );
}
