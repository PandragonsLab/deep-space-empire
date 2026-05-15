import { useEffect, useRef } from 'react';
import CharacterSheet from '../components/CharacterSheet';

export default function GameScreen({ gameState, narrative, choices, isLoading, error, onChoice }) {
  const narrativeRef = useRef(null);

  useEffect(() => {
    if (narrativeRef.current) narrativeRef.current.scrollTop = 0;
  }, [narrative]);

  const { world_state } = gameState;

  return (
    <div className="game-screen">
      <div className="game-layout">
        <div className="narrative-panel">
          <div className="location-banner">{world_state.current_location}</div>

          <div className="narrative-scroll" ref={narrativeRef}>
            {isLoading && !narrative ? (
              <p className="loading-text">The shadows stir...</p>
            ) : (
              <div className="narrative-text">
                {narrative
                  .split('\n')
                  .filter((p) => p.trim())
                  .map((para, i) => (
                    <p key={i}>{para}</p>
                  ))}
              </div>
            )}
          </div>

          <div className="choices-panel">
            {error && <p className="error-text">Error: {error}</p>}
            {isLoading ? (
              <div className="loading-choices">
                <div className="spinner" />
                <span>The story unfolds...</span>
              </div>
            ) : (
              choices.map((choice) => (
                <button
                  key={choice.id}
                  className="choice-btn"
                  onClick={() => onChoice(choice)}
                  disabled={isLoading}
                >
                  <span className="choice-text">{choice.text}</span>
                  {choice.hint && <span className="choice-hint">{choice.hint}</span>}
                </button>
              ))
            )}
          </div>
        </div>

        <CharacterSheet player={gameState.player} worldState={world_state} />
      </div>
    </div>
  );
}
