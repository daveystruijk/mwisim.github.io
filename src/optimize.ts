import CombatSimulator from "./combatsimulator/combatSimulator";
import Player from "./combatsimulator/player";
import Zone from "./combatsimulator/zone";
import Ability from "./combatsimulator/ability";
import Consumable from "./combatsimulator/consumable";
import Equipment from "./combatsimulator/equipment";
import { writeFileSync } from "fs";
import { orderBy, flatten } from "lodash";
import cliProgress from "cli-progress";

const ONE_SECOND = 1e9;
const ONE_HOUR = 60 * 60 * ONE_SECOND;
const SIM_SHORT_HOURS = 1;
const SIM_LONG_HOURS = 100;

const levels = {
  "/abilities/heal": 40,
  "/abilities/minor_heal": 40,
  "/abilities/toxic_pollen": 40,
  "/abilities/natures_veil": 40,
  "/abilities/entangle": 40,

  "/abilities/firestorm": 40,
  "/abilities/flame_blast": 40,
  "/abilities/fireball": 40,

  "/abilities/frost_surge": 40,
  "/abilities/ice_spear": 40,
  "/abilities/water_strike": 40,

  "/abilities/elemental_affinity": 40,
};

const makePlayer = (values: any) => {
    if (values.drinks.a === values.drinks.b) {
      return null;
    }

    const player: any = new Player();

    player.staminaLevel = 110;
    player.intelligenceLevel = 110;
    player.attackLevel = 1;
    player.powerLevel = 1;
    player.defenseLevel = 110;
    player.rangedLevel = 60;
    player.magicLevel = 110;

    player.abilities = [
        new Ability(values.set.abilities.a, levels[values.set.abilities.a] || 40),
        new Ability(values.set.abilities.b, levels[values.set.abilities.b] || 40),
        new Ability(values.set.abilities.c, levels[values.set.abilities.c] || 40),
        new Ability(values.set.abilities.d, levels[values.set.abilities.d] || 40),
    ];

    player.food = [new Consumable(values.food.a), new Consumable(values.food.b), new Consumable(values.food.c)];

    player.drinks = [new Consumable(values.drinks.a), new Consumable(values.drinks.b), new Consumable(values.drinks.c)];

    player.equipment = {
        "/equipment_types/head": new Equipment(values.head, levels[values.head] || 10),
        "/equipment_types/body": new Equipment(values.set.body, levels[values.set.body]|| 10),
        "/equipment_types/legs": new Equipment(values.set.legs, levels[values.set.legs] || 10),
        "/equipment_types/feet": new Equipment(values.feet, levels[values.feet] || 10),
        "/equipment_types/hands": new Equipment(values.hands, levels[values.hands] || 10),
        "/equipment_types/main_hand": new Equipment(values.set.main_hand, levels[values.set.main_hand] || 10),
        "/equipment_types/two_hand": null,
        "/equipment_types/off_hand": new Equipment(values.off_hand, levels[values.off_hand] || 10),
        "/equipment_types/pouch": new Equipment(values.pouch, levels[values.pouch] || 5),
        "/equipment_types/neck": new Equipment(values.neck, levels[values.neck] || 5),
        "/equipment_types/earrings": new Equipment(values.earrings, levels[values.earrings] || 5),
        "/equipment_types/ring": new Equipment(values.ring, levels[values.ring] || 5),
    };

    return player;
};

const trial = async (player, zone, timeLimit: number) => {
    const simulationTimeLimit = Number(timeLimit) * ONE_HOUR;

    const combatSimulator = new CombatSimulator(player, zone);
    const simResult = await combatSimulator.simulate(simulationTimeLimit);

    const results = {
        player: player,
        eph: simResult.encounters / timeLimit,
    };
    return results;
};

// Runs the combat sim in a loop for all possible combinations in ./src/search_space/{spaceName},
// then saves the top results in ./{spaceName}__{zoneName}.json
(async () => {
    const zoneName = "infernal_abyss";
    const spaceName = "mage_ice_narrow";

    const zone = new Zone(`/actions/combat/${zoneName}`);
    const space = require(`./search_space/${spaceName}`).space;

    const objectiveFn = async (values: any, timeLimit: number) => {
        const player = makePlayer(values);
        if (!player) { // invalid, e.g. same drink twice
          return 0;
        }
        const results = await trial(player, zone, timeLimit);
        return results.eph;
    };

    let highscores: { values: Record<string, unknown>; score: number }[] = [{ values: {}, score: 0 }];

    const progress = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);

    const total = space.length;
    progress.start(total, 0);

    while (space.length > 0) {
        const values = space.pop();
        const score = await objectiveFn(values, SIM_SHORT_HOURS);

        // Compare and add if better
        for (const highscore of highscores) {
            if (score > highscore.score) {
                const accurateScore = await objectiveFn(values, SIM_LONG_HOURS);
                highscores.push({ values, score: accurateScore });
                highscores = orderBy(highscores, "score", "desc").slice(0, 20);
                writeFileSync(`${spaceName}__${zoneName}.json`, JSON.stringify(highscores));
                break;
            }
        }
        progress.update(total - space.length);
    }
    progress.stop();
})().catch((e) => {
    console.error(e);
    process.exit();
});
