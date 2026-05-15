import { useState, useCallback } from 'react';
import ApiKeyScreen from './screens/ApiKey';
import CharacterCreationScreen from './screens/CharacterCreation';
import GameScreen from './screens/GameScene';
import LevelUpScreen from './screens/LevelUp';
import {
  createInitialGameState,
  buildSystemPrompt,
  buildOpeningPrompt,
  getSkillOptions,
  xpForLevel,
} from './game';
import { callClaude } from './api';

export default function App() {
  const [screen, setScreen] = useState('api-key');
  const [apiKey, setApiKey] = useState('');
  const [gameState, setGameState] = useState(null);
  const [narrative, setNarrative] = useState('');
  const [choices, setChoices] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [skillOptions, setSkillOptions] = useState([]);

  const handleApiKey = useCallback((key) => {
    setApiKey(key);
    setScreen('character-creation');
  }, []);

  const handleCharacterCreated = useCallback(
    async (name, archetypeId) => {
      const gs = createInitialGameState(name, archetypeId);
      setGameState(gs);
      setIsLoading(true);
      setError(null);
      try {
        const result = await callClaude(
          apiKey,
          buildSystemPrompt(gs),
          buildOpeningPrompt(gs.player)
        );
        setNarrative(result.narrative);
        setChoices(result.choices);
        if (result.state_changes) {
          setGameState(applyStateChanges(gs, result.state_changes));
        }
        setScreen('playing');
      } catch (e) {
        setError(e.message);
      } finally {
        setIsLoading(false);
      }
    },
    [apiKey]
  );

  const handleChoice = useCallback(
    async (choice) => {
      if (!gameState || isLoading) return;
      setIsLoading(true);
      setError(null);

      const gsWithHistory = {
        ...gameState,
        scene_history: [
          ...gameState.scene_history,
          { choice_made: choice.text, narrative },
        ],
      };

      try {
        const result = await callClaude(
          apiKey,
          buildSystemPrompt(gsWithHistory),
          `The player chose: "${choice.text}"\n\nContinue the story from this choice.`
        );

        setNarrative(result.narrative);
        setChoices(result.choices);

        const newGs = applyStateChanges(gsWithHistory, result.state_changes);

        if (newGs.player.xp >= newGs.player.xp_to_next) {
          const leveledGs = applyLevelUp(newGs);
          const options = getSkillOptions(
            leveledGs.player.archetype,
            leveledGs.player.skills.map((s) => s.id)
          );
          setSkillOptions(options);
          setGameState(leveledGs);
          setScreen('level-up');
        } else {
          setGameState(newGs);
        }
      } catch (e) {
        setError(e.message);
      } finally {
        setIsLoading(false);
      }
    },
    [gameState, isLoading, narrative, apiKey]
  );

  const handleSkillSelected = useCallback((skill) => {
    setGameState((prev) => ({
      ...prev,
      player: { ...prev.player, skills: [...prev.player.skills, skill] },
    }));
    setScreen('playing');
  }, []);

  return (
    <div className="app">
      {screen === 'api-key' && <ApiKeyScreen onSubmit={handleApiKey} />}
      {screen === 'character-creation' && (
        <CharacterCreationScreen
          onCreate={handleCharacterCreated}
          isLoading={isLoading}
          error={error}
        />
      )}
      {screen === 'playing' && gameState && (
        <GameScreen
          gameState={gameState}
          narrative={narrative}
          choices={choices}
          isLoading={isLoading}
          error={error}
          onChoice={handleChoice}
        />
      )}
      {screen === 'level-up' && gameState && (
        <LevelUpScreen
          player={gameState.player}
          skillOptions={skillOptions}
          onSelectSkill={handleSkillSelected}
        />
      )}
    </div>
  );
}

function applyStateChanges(gs, changes) {
  if (!changes) return gs;
  const {
    xp_gained = 0,
    hp_change = 0,
    resource_change = 0,
    items_found = [],
    flags_set = {},
    location_change = null,
    faction_changes = {},
  } = changes;

  const player = { ...gs.player };
  player.xp = Math.max(0, player.xp + (xp_gained || 0));
  player.hp = Math.min(player.max_hp, Math.max(0, player.hp + (hp_change || 0)));
  player.resource = Math.min(
    player.max_resource,
    Math.max(0, player.resource + (resource_change || 0))
  );
  if (items_found?.length > 0) {
    player.inventory = [...player.inventory, ...items_found];
  }

  const world_state = { ...gs.world_state, flags: { ...gs.world_state.flags, ...flags_set } };
  if (location_change && location_change !== world_state.current_location) {
    world_state.current_location = location_change;
    if (!world_state.visited_locations.includes(location_change)) {
      world_state.visited_locations = [...world_state.visited_locations, location_change];
    }
  }
  if (faction_changes) {
    world_state.faction_standing = { ...world_state.faction_standing };
    Object.entries(faction_changes).forEach(([faction, delta]) => {
      world_state.faction_standing[faction] =
        (world_state.faction_standing[faction] || 0) + delta;
    });
  }

  return { ...gs, player, world_state };
}

function applyLevelUp(gs) {
  const player = { ...gs.player };
  player.level += 1;
  player.xp = Math.max(0, player.xp - player.xp_to_next);
  player.xp_to_next = xpForLevel(player.level);
  player.max_hp = Math.floor(player.max_hp * 1.1);
  player.hp = player.max_hp;
  player.max_resource = Math.floor(player.max_resource * 1.1);
  player.resource = player.max_resource;
  player.stats = {
    str: player.stats.str + (player.archetype === 'warrior' ? 2 : 1),
    int: player.stats.int + (player.archetype === 'mage' ? 2 : 1),
    agi: player.stats.agi + (player.archetype === 'rogue' ? 2 : 1),
  };
  return { ...gs, player };
}
