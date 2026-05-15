# Depths of Ashveil — AI LitRPG Engine

A browser-based LitRPG progression fantasy game powered by Claude AI. The AI acts as narrator and game master, generating a living narrative that reacts to every choice you make.

## Features

- **Dynamic Narrative** — Claude generates unique story content for every scene and playthrough
- **Three Archetypes** — Warrior, Mage, Rogue each with distinct stats, resources, and starting skills
- **Power Progression** — Gain XP from choices, level up, and select new skills that shape future narrative options
- **World State Memory** — Past choices set flags that Claude references in all future scenes
- **Faction System** — Build relationships (or enmities) with the Miners Guild, Town Watch, and Merchant Consortium
- **Dark Fantasy Aesthetic** — Cinzel/Crimson Pro typography, deep dark palette, narrative drop-caps

## Quick Start

```bash
cd litrpg
npm install
npm run dev
```

Open `http://localhost:5173`. Enter your Anthropic API key on the start screen.

## Requirements

- Node.js 18+
- [Anthropic API key](https://console.anthropic.com/) — stored in browser memory only, never persisted

## How It Works

On each player choice:
1. Full game state (level, skills, inventory, world flags, faction standing, 8-scene history) is injected into Claude's system prompt
2. Claude writes narrative prose in second-person present tense
3. The response is parsed for a JSON block containing 4 choices + state changes
4. State changes (XP, HP, items, flags, faction deltas) are applied to React state
5. On level-up: stat increases + skill selection screen with 3 random archetype/universal options

## Architecture

```
litrpg/
  src/
    App.jsx              # State machine & API orchestration
    game.js              # Constants, archetypes, skill pools, prompt builders
    api.js               # Claude API call + response parser
    screens/
      ApiKey.jsx          # API key entry
      CharacterCreation.jsx
      GameScene.jsx       # Main game view: narrative + choices
      LevelUp.jsx         # Skill selection on level-up
    components/
      CharacterSheet.jsx  # Stats sidebar
    App.css              # Dark fantasy styles
```

## Extending

- **Expand skill system**: add more skills to `SKILL_POOL` in `game.js`
- **Add faction tracking**: extend `faction_standing` in `createInitialGameState` and update the system prompt
- **New locations**: Claude will invent them naturally — add them to `visited_locations` via `location_change` in state_changes
- **Combat mechanics**: extend `state_changes` parsing in `App.jsx` to handle combat rounds

## Build

```bash
npm run build    # Outputs to dist/
npm run preview  # Preview production build
```
