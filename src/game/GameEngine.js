class GameEngine {
    constructor(playerId) {
        this.playerId = playerId;
        this.lastUpdate = Date.now();
        this.isRunning = true;

        // Core game state
        this.resources = {
            energy: 100,
            matter: 50,
            knowledge: 10
        };

        this.resourceRates = {
            energy: 1,
            matter: 0.5,
            knowledge: 0.1
        };

        this.exploration = {
            currentLocation: 'Reality Nexus',
            locationsDiscovered: 1,
            explorationProgress: 0,
            explorationSpeed: 1,
            explorationTarget: 100
        };

        this.collectors = {
            energyHarvesters: 1,
            matterCondensers: 0,
            knowledgeProbes: 0
        };

        this.upgrades = {
            collectorEfficiency: 1,
            explorationBoost: 1,
            resourceMultiplier: 1
        };

        this.achievements = [];
        this.totalPlayTime = 0;

        this.locations = [
            'Reality Nexus',
            'Quantum Foam',
            'Probability Wells',
            'Temporal Echoes',
            'Consciousness Streams',
            'Information Lattice',
            'Energy Vortex',
            'Matter Fields',
            'Dimensional Rift',
            'Void Fragments'
        ];
    }

    update() {
        if (!this.isRunning) return;

        const now = Date.now();
        const deltaTime = (now - this.lastUpdate) / 1000; // Convert to seconds
        this.lastUpdate = now;

        this.totalPlayTime += deltaTime;

        // Resource generation
        this.generateResources(deltaTime);

        // Exploration progress
        this.updateExploration(deltaTime);

        // Check achievements
        this.checkAchievements();
    }

    generateResources(deltaTime) {
        const efficiency = this.upgrades.collectorEfficiency;
        const multiplier = this.upgrades.resourceMultiplier;

        this.resources.energy += this.resourceRates.energy * this.collectors.energyHarvesters * efficiency * multiplier * deltaTime;
        this.resources.matter += this.resourceRates.matter * this.collectors.matterCondensers * efficiency * multiplier * deltaTime;
        this.resources.knowledge += this.resourceRates.knowledge * this.collectors.knowledgeProbes * efficiency * multiplier * deltaTime;

        // Round to avoid floating point precision issues
        this.resources.energy = Math.round(this.resources.energy * 100) / 100;
        this.resources.matter = Math.round(this.resources.matter * 100) / 100;
        this.resources.knowledge = Math.round(this.resources.knowledge * 100) / 100;
    }

    updateExploration(deltaTime) {
        if (this.exploration.locationsDiscovered < this.locations.length) {
            this.exploration.explorationProgress += this.exploration.explorationSpeed * this.upgrades.explorationBoost * deltaTime;

            if (this.exploration.explorationProgress >= this.exploration.explorationTarget) {
                this.discoverNewLocation();
            }
        }
    }

    discoverNewLocation() {
        if (this.exploration.locationsDiscovered < this.locations.length) {
            this.exploration.locationsDiscovered++;
            this.exploration.currentLocation = this.locations[this.exploration.locationsDiscovered - 1];
            this.exploration.explorationProgress = 0;
            this.exploration.explorationTarget *= 1.5; // Increase difficulty

            // Bonus resources for discovery
            this.resources.knowledge += 50 * this.exploration.locationsDiscovered;

            return {
                type: 'discovery',
                location: this.exploration.currentLocation,
                message: `Discovered new location: ${this.exploration.currentLocation}!`
            };
        }
    }

    handleAction(action) {
        switch (action.type) {
            case 'buyCollector':
                return this.buyCollector(action.collectorType);
            case 'buyUpgrade':
                return this.buyUpgrade(action.upgradeType);
            case 'explore':
                return this.manualExplore();
            case 'prestige':
                return this.prestige();
            default:
                return { success: false, message: 'Unknown action' };
        }
    }

    buyCollector(type) {
        const costs = {
            energyHarvesters: { energy: 100, matter: 0, knowledge: 0 },
            matterCondensers: { energy: 200, matter: 100, knowledge: 25 },
            knowledgeProbes: { energy: 500, matter: 300, knowledge: 100 }
        };

        const cost = costs[type];
        if (!cost) return { success: false, message: 'Invalid collector type' };

        // Calculate actual cost (increases with each purchase)
        const currentCount = this.collectors[type];
        const actualCost = {
            energy: cost.energy * Math.pow(1.15, currentCount),
            matter: cost.matter * Math.pow(1.15, currentCount),
            knowledge: cost.knowledge * Math.pow(1.15, currentCount)
        };

        if (this.canAfford(actualCost)) {
            this.spendResources(actualCost);
            this.collectors[type]++;
            return {
                success: true,
                message: `Purchased ${type.replace(/([A-Z])/g, ' $1').toLowerCase()}!`,
                cost: actualCost
            };
        }

        return { success: false, message: 'Insufficient resources' };
    }

    buyUpgrade(type) {
        const upgradeCosts = {
            collectorEfficiency: { energy: 500, matter: 200, knowledge: 100 },
            explorationBoost: { energy: 300, matter: 400, knowledge: 200 },
            resourceMultiplier: { energy: 1000, matter: 800, knowledge: 500 }
        };

        const baseCost = upgradeCosts[type];
        if (!baseCost) return { success: false, message: 'Invalid upgrade type' };

        const currentLevel = this.upgrades[type];
        const actualCost = {
            energy: baseCost.energy * Math.pow(1.5, currentLevel - 1),
            matter: baseCost.matter * Math.pow(1.5, currentLevel - 1),
            knowledge: baseCost.knowledge * Math.pow(1.5, currentLevel - 1)
        };

        if (this.canAfford(actualCost)) {
            this.spendResources(actualCost);
            this.upgrades[type] += 0.2; // 20% improvement per upgrade
            return {
                success: true,
                message: `Upgraded ${type.replace(/([A-Z])/g, ' $1').toLowerCase()}!`,
                cost: actualCost
            };
        }

        return { success: false, message: 'Insufficient resources' };
    }

    manualExplore() {
        if (this.resources.energy >= 10) {
            this.resources.energy -= 10;
            this.exploration.explorationProgress += 10;
            return {
                success: true,
                message: 'Manually explored! Progress increased.',
                progressGained: 10
            };
        }
        return { success: false, message: 'Need 10 energy to explore' };
    }

    canAfford(cost) {
        return this.resources.energy >= cost.energy &&
               this.resources.matter >= cost.matter &&
               this.resources.knowledge >= cost.knowledge;
    }

    spendResources(cost) {
        this.resources.energy -= cost.energy;
        this.resources.matter -= cost.matter;
        this.resources.knowledge -= cost.knowledge;
    }

    checkAchievements() {
        const achievements = [
            { id: 'first_discovery', name: 'First Discovery', condition: () => this.exploration.locationsDiscovered >= 2 },
            { id: 'energy_collector', name: 'Energy Baron', condition: () => this.collectors.energyHarvesters >= 10 },
            { id: 'knowledge_seeker', name: 'Knowledge Seeker', condition: () => this.resources.knowledge >= 1000 },
            { id: 'explorer', name: 'Dimensional Explorer', condition: () => this.exploration.locationsDiscovered >= 5 }
        ];

        achievements.forEach(achievement => {
            if (!this.achievements.includes(achievement.id) && achievement.condition()) {
                this.achievements.push(achievement.id);
            }
        });
    }

    getState() {
        return {
            resources: this.resources,
            resourceRates: this.getActualResourceRates(),
            exploration: this.exploration,
            collectors: this.collectors,
            upgrades: this.upgrades,
            achievements: this.achievements,
            totalPlayTime: this.totalPlayTime,
            locations: this.locations
        };
    }

    getActualResourceRates() {
        const efficiency = this.upgrades.collectorEfficiency;
        const multiplier = this.upgrades.resourceMultiplier;

        return {
            energy: this.resourceRates.energy * this.collectors.energyHarvesters * efficiency * multiplier,
            matter: this.resourceRates.matter * this.collectors.matterCondensers * efficiency * multiplier,
            knowledge: this.resourceRates.knowledge * this.collectors.knowledgeProbes * efficiency * multiplier
        };
    }

    save() {
        return {
            playerId: this.playerId,
            resources: this.resources,
            exploration: this.exploration,
            collectors: this.collectors,
            upgrades: this.upgrades,
            achievements: this.achievements,
            totalPlayTime: this.totalPlayTime,
            timestamp: Date.now()
        };
    }

    load(saveData) {
        if (saveData.playerId !== this.playerId) return false;

        // Calculate offline progress
        const offlineTime = (Date.now() - saveData.timestamp) / 1000;

        this.resources = saveData.resources;
        this.exploration = saveData.exploration;
        this.collectors = saveData.collectors;
        this.upgrades = saveData.upgrades;
        this.achievements = saveData.achievements;
        this.totalPlayTime = saveData.totalPlayTime;

        // Apply offline progress
        if (offlineTime > 0) {
            this.generateResources(Math.min(offlineTime, 86400)); // Cap at 24 hours
            this.updateExploration(Math.min(offlineTime, 86400));
        }

        return true;
    }

    stop() {
        this.isRunning = false;
    }
}

module.exports = GameEngine;