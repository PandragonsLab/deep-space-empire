export const ARCHETYPES = {
  warrior: {
    id: 'warrior',
    name: 'Warrior',
    description: 'Iron-willed fighter who excels in close combat and endurance.',
    flavor: 'Your muscles are hardened from years of labor and battle. People give you a wide berth.',
    stats: { str: 8, int: 3, agi: 5 },
    maxHp: 120,
    resourceName: 'Stamina',
    maxResource: 80,
    color: '#e67e22',
    startingSkill: {
      id: 'iron_stance',
      name: 'Iron Stance',
      desc: 'Passive: Reduce incoming physical damage by 5%',
    },
  },
  mage: {
    id: 'mage',
    name: 'Mage',
    description: 'Scholar of the arcane arts, wielding devastating magical power.',
    flavor: 'Your eyes carry a faint luminescence. Some call it wisdom, others call it a curse.',
    stats: { str: 3, int: 9, agi: 4 },
    maxHp: 80,
    resourceName: 'Mana',
    maxResource: 120,
    color: '#8e44ad',
    startingSkill: {
      id: 'arcane_bolt',
      name: 'Arcane Bolt',
      desc: 'Active: Deal INT-scaled magic damage to one target',
    },
  },
  rogue: {
    id: 'rogue',
    name: 'Rogue',
    description: 'Swift and cunning, striking from shadows when least expected.',
    flavor: 'You move quietly by instinct. People talk more freely when they think no one is listening.',
    stats: { str: 5, int: 5, agi: 8 },
    maxHp: 100,
    resourceName: 'Stamina',
    maxResource: 100,
    color: '#27ae60',
    startingSkill: {
      id: 'shadow_step',
      name: 'Shadow Step',
      desc: 'Active: Instantly teleport behind a target within 15 meters',
    },
  },
};

export const SKILL_POOL = {
  warrior: [
    { id: 'battle_cry', name: 'Battle Cry', desc: 'Active: Boost STR by 25% for 3 turns; nearby allies gain morale' },
    { id: 'shield_wall', name: 'Shield Wall', desc: 'Passive: +15% physical damage reduction while HP above 50%' },
    { id: 'whirlwind', name: 'Whirlwind', desc: 'Active: Strike all adjacent enemies in a sweeping arc' },
    { id: 'berserker_rage', name: 'Berserker Rage', desc: 'Active: Double damage output; disable dodge for 5 turns' },
    { id: 'intimidate', name: 'Intimidate', desc: 'Active: Frighten enemies, weakening their attacks by 25%' },
    { id: 'war_stomp', name: 'War Stomp', desc: 'Active: Slam the ground, staggering all nearby enemies' },
    { id: 'endurance_training', name: 'Endurance Training', desc: 'Passive: +20 max HP; regenerate 2 HP per turn out of combat' },
    { id: 'weapon_mastery', name: 'Weapon Mastery', desc: 'Passive: +15% damage with all equipped weapons' },
  ],
  mage: [
    { id: 'frost_nova', name: 'Frost Nova', desc: 'Active: Burst of frost freezes all nearby enemies for 2 turns' },
    { id: 'mana_shield', name: 'Mana Shield', desc: 'Passive: Damage draws from Mana before HP at 1.5:1 ratio' },
    { id: 'spell_echo', name: 'Spell Echo', desc: 'Passive: 20% chance any active spell fires twice for free' },
    { id: 'time_distortion', name: 'Time Distortion', desc: 'Active: Slow a target 60% for 3 turns' },
    { id: 'arcane_surge', name: 'Arcane Surge', desc: 'Passive: Each consecutive spell cast increases magic damage by 5% (max 50%)' },
    { id: 'blink', name: 'Blink', desc: 'Active: Instantly teleport up to 20 meters in any direction' },
    { id: 'ley_channeling', name: 'Ley Channeling', desc: 'Passive: Regenerate 8 Mana per turn passively' },
    { id: 'mind_blast', name: 'Mind Blast', desc: 'Active: Psychic strike that ignores armor and causes confusion' },
  ],
  rogue: [
    { id: 'poison_blade', name: 'Poison Blade', desc: 'Active: Apply toxin — deals damage over 3 turns on hit' },
    { id: 'smoke_bomb', name: 'Smoke Bomb', desc: 'Active: Deploy concealing smoke, entering stealth for ambush' },
    { id: 'pickpocket', name: 'Pickpocket', desc: 'Active: Steal items or gold without detection (AGI check)' },
    { id: 'execute', name: 'Execute', desc: 'Active: Triple damage on targets below 25% HP' },
    { id: 'evasion', name: 'Evasion', desc: 'Passive: 18% chance to completely dodge incoming attacks' },
    { id: 'master_lockpick', name: 'Master Lockpick', desc: 'Passive: Open any non-magical lock; bonus loot from containers' },
    { id: 'blade_flurry', name: 'Blade Flurry', desc: 'Active: 5 rapid strikes each dealing 60% weapon damage' },
    { id: 'marked_target', name: 'Marked Target', desc: 'Active: Mark a foe — you and allies deal +20% damage to them' },
  ],
  universal: [
    { id: 'toughness', name: 'Toughness', desc: 'Passive: +15 max HP and resistance to knockback' },
    { id: 'quick_learner', name: 'Quick Learner', desc: 'Passive: Gain 15% bonus XP from all sources' },
    { id: 'danger_sense', name: 'Danger Sense', desc: 'Passive: Sense ambushes and traps before triggering them' },
    { id: 'silver_tongue', name: 'Silver Tongue', desc: 'Active: Improved dialogue checks; unlock hidden NPC options' },
    { id: 'meditate', name: 'Meditate', desc: 'Active: Out-of-combat — restore 30% max resource over 1 minute' },
    { id: 'field_craft', name: 'Field Craft', desc: 'Passive: Craft basic potions and tools from found ingredients' },
  ],
};

export function getSkillOptions(archetype, existingSkillIds, count = 3) {
  const pool = [...(SKILL_POOL[archetype] || []), ...SKILL_POOL.universal];
  const available = pool.filter(s => !existingSkillIds.includes(s.id));
  return available.sort(() => Math.random() - 0.5).slice(0, count);
}

export function xpForLevel(level) {
  return Math.floor(100 * Math.pow(1.5, level - 1));
}

export function createInitialGameState(name, archetypeId) {
  const arch = ARCHETYPES[archetypeId];
  return {
    player: {
      name,
      archetype: archetypeId,
      level: 1,
      xp: 0,
      xp_to_next: xpForLevel(1),
      hp: arch.maxHp,
      max_hp: arch.maxHp,
      resource: arch.maxResource,
      max_resource: arch.maxResource,
      resource_name: arch.resourceName,
      stats: { ...arch.stats },
      skills: [arch.startingSkill],
      inventory: [],
    },
    world_state: {
      current_location: 'Ashveil Mining Town',
      visited_locations: ['Ashveil Mining Town'],
      faction_standing: {
        miners_guild: 0,
        town_watch: 0,
        merchant_consortium: 0,
      },
      flags: {},
    },
    scene_history: [],
  };
}

export function buildSystemPrompt(gameState) {
  const { player, world_state, scene_history } = gameState;
  const recentHistory = scene_history.slice(-8).map((h, i) => ({
    scene: i + 1,
    choice: h.choice_made || '(opening)',
    summary: h.narrative ? h.narrative.slice(0, 100) + '...' : '',
  }));

  return `You are the narrator and game master for "Depths of Ashveil," a LitRPG progression fantasy.

## WRITING RULES
- Write in **second-person present tense** ("You step forward...", "The woman's eyes narrow...")
- 3-4 vivid paragraphs totaling 150-250 words
- First sentence must acknowledge/follow from the player's choice naturally
- Reference the player's skills and stats when narratively meaningful
- The world MUST react to flags in world_state — past choices have consequences
- Atmosphere: Ashveil is a desperate mining town. Lantern smoke, mud, iron, fear.

## PLAYER STATE
Name: ${player.name} | Class: ${player.archetype} | Level: ${player.level}
HP: ${player.hp}/${player.max_hp} | ${player.resource_name}: ${player.resource}/${player.max_resource}
STR: ${player.stats.str} | INT: ${player.stats.int} | AGI: ${player.stats.agi}
Skills: ${player.skills.map(s => s.name).join(', ') || 'None'}
Inventory: ${player.inventory.length > 0 ? player.inventory.join(', ') : 'Empty'}

## WORLD STATE
Location: ${world_state.current_location}
Visited: ${world_state.visited_locations.join(', ')}
Faction Standing: Miners Guild (${world_state.faction_standing.miners_guild ?? 0}), Town Watch (${world_state.faction_standing.town_watch ?? 0}), Merchants (${world_state.faction_standing.merchant_consortium ?? 0})
Active Flags: ${Object.entries(world_state.flags || {}).filter(([, v]) => v).map(([k]) => k).join(', ') || 'None'}

## RECENT HISTORY
${recentHistory.length > 0 ? JSON.stringify(recentHistory, null, 2) : 'This is the opening scene.'}

## LITRPG RULES
- Skills the player has MUST influence available choices (e.g. Shadow Step unlocks a stealth option)
- XP rewards: 15-25 minor scenes, 30-50 significant events, 60-100 boss encounters
- Stat checks in narrative ("Your high Agility lets you...")
- Power fantasy matters — let the player feel their character growing

## RESPONSE FORMAT
Write the narrative prose first, then end with exactly this JSON block:

\`\`\`json
{
  "choices": [
    {"id": 1, "text": "Short action (5-10 words)", "hint": "consequence hint in 6-8 words"},
    {"id": 2, "text": "Short action (5-10 words)", "hint": "consequence hint in 6-8 words"},
    {"id": 3, "text": "Short action (5-10 words)", "hint": "consequence hint in 6-8 words"},
    {"id": 4, "text": "Short action (5-10 words)", "hint": "consequence hint in 6-8 words"}
  ],
  "state_changes": {
    "xp_gained": 20,
    "hp_change": 0,
    "resource_change": 0,
    "items_found": [],
    "flags_set": {},
    "location_change": null,
    "faction_changes": {}
  }
}
\`\`\`

Always exactly 4 choices. flag names use_snake_case. faction_changes example: {"miners_guild": 5, "town_watch": -3}.`;
}

export function buildOpeningPrompt(player) {
  return `Begin the campaign. Player: ${player.name}, Level 1 ${player.archetype}.

Setting: Ashveil — a mining town in the foothills of the Ironspine Mountains. Its lifeblood is the Deepvein Mine, source of shadowstone ore used in enchanting. Three days ago, a team of eight miners failed to return from Shaft Seven. Yesterday, two more went to investigate. They haven't been seen since.

Open with this specific moment: ${player.name} arrives at the town's main gate as dusk falls. Near the mine office, the foreman is arguing with a cluster of miners' families. A young boy is tugging at a watchman's sleeve, being ignored. The air smells of coal smoke and something else — something older.

The ${player.archetype}'s background subtly colors how NPCs react to their arrival. Make the opening visceral and immediate. The first choices should set the player's character tone: bold, cautious, mercenary, or compassionate. The foreman seems to be hiding something. The families are desperate. This is the hook.`;
}
