import { useState } from 'react';
import { ARCHETYPES } from '../game';

export default function CharacterCreationScreen({ onCreate, isLoading, error }) {
  const [name, setName] = useState('');
  const [selectedArchetype, setSelectedArchetype] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim() || !selectedArchetype) return;
    onCreate(name.trim(), selectedArchetype);
  };

  const canSubmit = name.trim().length > 0 && selectedArchetype && !isLoading;

  return (
    <div className="screen">
      <div className="center-box creation-box">
        <h2 className="section-title">Create Your Character</h2>
        <form onSubmit={handleSubmit}>
          <div className="field-group">
            <label className="field-label">Your Name</label>
            <input
              type="text"
              placeholder="Enter your name..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="text-input"
              maxLength={30}
            />
          </div>

          <div className="field-group">
            <label className="field-label">Choose Your Path</label>
            <div className="archetype-grid">
              {Object.values(ARCHETYPES).map((arch) => (
                <div
                  key={arch.id}
                  className={`archetype-card ${selectedArchetype === arch.id ? 'selected' : ''}`}
                  onClick={() => setSelectedArchetype(arch.id)}
                  style={{ '--arch-color': arch.color }}
                >
                  <div className="arch-name">{arch.name}</div>
                  <div className="arch-desc">{arch.description}</div>
                  <div className="arch-stats">
                    <span>STR {arch.stats.str}</span>
                    <span>INT {arch.stats.int}</span>
                    <span>AGI {arch.stats.agi}</span>
                  </div>
                  <div className="arch-meta">
                    HP {arch.maxHp} &nbsp;|&nbsp; {arch.resourceName} {arch.maxResource}
                  </div>
                  <div className="arch-skill">Starts with: {arch.startingSkill.name}</div>
                </div>
              ))}
            </div>
          </div>

          {error && <p className="error-text">{error}</p>}

          <button type="submit" className="btn-primary" disabled={!canSubmit}>
            {isLoading ? 'Descending into Ashveil...' : 'Begin Your Journey'}
          </button>
        </form>
      </div>
    </div>
  );
}
