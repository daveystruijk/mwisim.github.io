import CombatUtilities from "./combatUtilities";
import AutoAttackEvent from "./events/autoAttackEvent";
import CheckBuffExpirationEvent from "./events/checkBuffExpirationEvent";
import CombatStartEvent from "./events/combatStartEvent";
import ConsumableTickEvent from "./events/consumableTickEvent";
import EnemyRespawnEvent from "./events/enemyRespawnEvent";
import EventQueue from "./events/eventQueue";
import PlayerRespawnEvent from "./events/playerRespawnEvent";
import UseConsumableEvent from "./events/useConsumableEvent";

class CombatSimulator {
    constructor(player, zone) {
        this.players = [player];
        this.zone = zone;

        this.eventQueue = new EventQueue();
    }

    simulate(simulationTimeLimit) {
        this.reset();

        let combatStartEvent = new CombatStartEvent(0);
        this.eventQueue.addEvent(combatStartEvent);

        while (this.simulationTime < simulationTimeLimit) {
            let nextEvent = this.eventQueue.getNextEvent();
            this.processEvent(nextEvent);
        }
    }

    reset() {
        this.simulationTime = 0;
        this.eventQueue.clear();
    }

    processEvent(event) {
        this.simulationTime = event.time;

        switch (event.type) {
            case CombatStartEvent.type:
                this.processCombatStartEvent(event);
                break;
            case PlayerRespawnEvent.type:
                this.processPlayerRespawnEvent(event);
                break;
            case EnemyRespawnEvent.type:
                this.processEnemyRespawnEvent(event);
                break;
            case AutoAttackEvent.type:
                this.processAutoAttackEvent(event);
                break;
            case UseConsumableEvent.type:
                this.processUseConsumableEvent(event);
                break;
            case ConsumableTickEvent.type:
                this.processConsumableTickEvent(event);
                break;
            case CheckBuffExpirationEvent.type:
                this.processCheckBuffExpirationEvent(event);
                break;
        }

        this.checkTriggers();
    }

    processCombatStartEvent(event) {
        console.log(this.simulationTime / 1e9, event.type, event);

        this.players[0].reset();

        this.startNewEncounter();
    }

    processPlayerRespawnEvent(event) {
        console.log(this.simulationTime / 1e9, event.type, event);

        this.players[0].combatStats.currentHitpoints = this.players[0].combatStats.maxHitpoints / 2;
        this.players[0].combatStats.currentManapoints = this.players[0].combatStats.maxManapoints / 2;

        this.startNewEncounter();
    }

    processEnemyRespawnEvent(event) {
        console.log(this.simulationTime / 1e9, event.type, event);

        this.startNewEncounter();
    }

    startNewEncounter() {
        this.enemies = this.zone.getRandomEncounter();
        this.enemies.forEach((enemy) => {
            enemy.reset();
        });

        this.addNextAutoAttackEvent(this.players[0]);

        this.enemies.forEach((enemy) => this.addNextAutoAttackEvent(enemy));
    }

    processAutoAttackEvent(event) {
        console.log(this.simulationTime / 1e9, event.type, event);
        console.log("source:", event.source.hrid, "target:", event.target.hrid);

        let combatStyle = event.source.combatStats.combatStyleHrid;
        let maxDamage = event.source.combatStats[combatStyle + "MaxDamage"];
        let damageRoll = CombatUtilities.randomInt(1, maxDamage);
        let premitigatedDamage = Math.min(damageRoll, event.target.combatStats.currentHitpoints);

        let damage = 0;
        let hitChance = CombatUtilities.calculateHitChance(event.source, event.target, combatStyle);

        if (Math.random() < hitChance) {
            let damageTakenRatio = 100 / (100 + event.target.combatStats.armor);
            let mitigatedDamage = damageTakenRatio * premitigatedDamage;
            damage = CombatUtilities.randomInt(mitigatedDamage, mitigatedDamage);
            event.target.combatStats.currentHitpoints -= damage;

            if (event.target.combatStats.currentHitpoints == 0) {
                this.eventQueue.clearEventsForUnit(event.target);
            }

            console.log("Hit for", damage);
        }

        let damagePrevented = premitigatedDamage - damage;

        if (event.source.isPlayer && !this.enemies.find((enemy) => enemy.combatStats.currentHitpoints > 0)) {
            let enemyRespawnEvent = new EnemyRespawnEvent(this.simulationTime + 3 * 1e9);
            this.eventQueue.addEvent(enemyRespawnEvent);
            this.enemies = null;
        } else if (!event.source.isPlayer && !this.players.find((player) => player.combatStats.currentHitpoints > 0)) {
            let playerRespawnEvent = new PlayerRespawnEvent(this.simulationTime + 180 * 1e9);
            this.eventQueue.addEvent(playerRespawnEvent);
        } else {
            this.addNextAutoAttackEvent(event.source);
        }
    }

    addNextAutoAttackEvent(source) {
        let target;
        if (source.isPlayer) {
            target = CombatUtilities.getTarget(this.enemies);
        } else {
            target = CombatUtilities.getTarget(this.players);
        }

        let autoAttackEvent = new AutoAttackEvent(
            this.simulationTime + source.combatStats.attackInterval,
            source,
            target
        );
        this.eventQueue.addEvent(autoAttackEvent);
    }

    processUseConsumableEvent(event) {
        console.log(this.simulationTime / 1e9, event.type, event);

        console.assert(event.source.combatStats.currentHitpoints > 0, "Dead unit is trying to use a consumable");

        let source = event.source;
        let consumable = event.consumable;

        let triggerActive;
        if (source.isPlayer) {
            triggerActive = consumable.shouldTrigger(
                this.simulationTime,
                source,
                CombatUtilities.getTarget(this.enemies),
                this.players,
                this.enemies
            );
        } else {
            triggerActive = consumable.shouldTrigger(
                this.simulationTime,
                source,
                CombatUtilities.getTarget(this.players),
                this.enemies,
                this.players
            );
        }

        if (!triggerActive) {
            return;
        }

        consumable.lastUsed = this.simulationTime;

        if (consumable.recoveryDuration == 0) {
            if (consumable.hitpointRestore > 0) {
                let hitpointsAdded = source.addHitpoints(consumable.hitpointRestore);
                console.log("Added hitpoints:", hitpointsAdded);
            }

            if (consumable.manapointRestore > 0) {
                let manapointsAdded = source.addManapoints(consumable.manapointRestore);
                console.log("Added manapoints:", manapointsAdded);
            }
        } else {
            let consumableTickEvent = new ConsumableTickEvent(
                this.simulationTime + 2 * 1e9,
                source,
                consumable,
                consumable.recoveryDuration / (2 * 1e9),
                1
            );
            this.eventQueue.addEvent(consumableTickEvent);
        }

        for (const buff of consumable.buffs) {
            source.addBuff(buff, this.simulationTime);
            console.log("Added buff:", buff);
            let checkBuffExpirationEvent = new CheckBuffExpirationEvent(
                this.simulationTime + buff.duration,
                event.source
            );
            this.eventQueue.addEvent(checkBuffExpirationEvent);
        }
    }

    processConsumableTickEvent(event) {
        console.log(this.simulationTime / 1e9, event.type, event);

        if (event.consumable.hitpointRestore > 0) {
            let tickValue = CombatUtilities.calculateTickValue(
                event.consumable.hitpointRestore,
                event.totalTicks,
                event.currentTick
            );
            let hitpointsAdded = event.source.addHitpoints(tickValue);
            console.log("Added hitpoints:", hitpointsAdded);
        }

        if (event.consumable.manapointRestore > 0) {
            let tickValue = CombatUtilities.calculateTickValue(
                event.consumable.manapointRestore,
                event.totalTicks,
                event.currentTick
            );
            let manapointsAdded = event.source.addManapoints(tickValue);
            console.log("Added manapoints:", manapointsAdded);
        }

        if (event.currentTick < event.totalTicks) {
            let consumableTickEvent = new ConsumableTickEvent(
                this.simulationTime + 2 * 1e9,
                event.source,
                event.consumable,
                event.totalTicks,
                event.currentTick + 1
            );
            this.eventQueue.addEvent(consumableTickEvent);
        }
    }

    processCheckBuffExpirationEvent(event) {
        console.log(this.simulationTime / 1e9, event.type, event);

        event.source.removeExpiredBuffs(this.simulationTime);
    }

    checkTriggers() {
        this.players
            .filter((player) => player.combatStats.currentHitpoints > 0)
            .forEach((player) => this.checkTriggersForUnit(player, this.players, this.enemies));

        if (this.enemies) {
            this.enemies
                .filter((enemy) => enemy.combatStats.currentHitpoints > 0)
                .forEach((enemy) => this.checkTriggersForUnit(enemy, this.enemies, this.players));
        }
    }

    checkTriggersForUnit(unit, friendlies, enemies) {
        console.assert(unit.combatStats.currentHitpoints > 0, "Checking triggers for a dead unit");

        let target = CombatUtilities.getTarget(enemies);

        for (const food of unit.food) {
            if (food && food.shouldTrigger(this.simulationTime, unit, target, friendlies, enemies)) {
                let useConsumableEvent = new UseConsumableEvent(this.simulationTime, unit, food);
                if (!this.eventQueue.containsEvent(useConsumableEvent)) {
                    this.eventQueue.addEvent(useConsumableEvent);
                    console.log("adding food event:", useConsumableEvent);
                }
            }
        }

        for (const drink of unit.drinks) {
            if (drink && drink.shouldTrigger(this.simulationTime, unit, target, friendlies, enemies)) {
                let useConsumableEvent = new UseConsumableEvent(this.simulationTime, unit, drink);
                if (!this.eventQueue.containsEvent(useConsumableEvent)) {
                    this.eventQueue.addEvent(useConsumableEvent);
                    console.log("adding drink event:", useConsumableEvent);
                }
            }
        }

        for (const ability of unit.abilities) {
            if (ability && ability.shouldTrigger(this.simulationTime, unit, target, friendlies, enemies)) {
                // Add event
            }
        }
    }
}

export default CombatSimulator;
