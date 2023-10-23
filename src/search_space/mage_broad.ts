import { expand } from "../data_structures";

export const space = expand({
    food: [
        { a: "/items/spaceberry_cake", b: "/items/spaceberry_donut", c: "/items/star_fruit_yogurt" },
        { a: "/items/spaceberry_cake", b: "/items/star_fruit_gummy", c: "/items/star_fruit_yogurt" },
    ],
    drinks: [
        ...expand({
            a: [
                "/items/super_intelligence_coffee",
                "/items/super_magic_coffee",
                "/items/super_stamina_coffee",
                "/items/channeling_coffee",
                "/items/super_defense_coffee",
            ],
            b: [
                "/items/super_intelligence_coffee",
                "/items/super_magic_coffee",
                "/items/super_stamina_coffee",
                "/items/channeling_coffee",
                "/items/super_defense_coffee",
            ],
            c: ["/items/wisdom_coffee"],
        }),
    ],
    head: ["/items/radiant_hat"],
    set: [
        ...expand({
            body: ["/items/flaming_robe_top"],
            legs: ["/items/flaming_robe_bottoms"],
            main_hand: ["/items/infernal_battlestaff"],
            abilities: [
                ...expand({
                    a: ["/abilities/heal", "/abilities/minor_heal", "/abilities/elemental_affinity"],
                    b: ["/abilities/toxic_pollen", "/abilities/firestorm"],
                    c: ["/abilities/flame_blast"],
                    d: ["/abilities/fireball"],
                }),
            ],
        }),
        ...expand({
            body: ["/items/icy_robe_top", "/items/marine_tunic"],
            legs: ["/items/icy_robe_bottoms", "/items/marine_chaps"],
            main_hand: ["/items/frost_staff"],
            abilities: [
                ...expand({
                    a: ["/abilities/heal", "/abilities/minor_heal", "/abilities/elemental_affinity"],
                    b: ["/abilities/frost_surge"],
                    c: ["/abilities/ice_spear"],
                    d: ["/abilities/water_strike"],
                }),
            ],
        }),
        ...expand({
            body: ["/items/luna_robe_top"],
            legs: ["/items/luna_robe_bottoms"],
            main_hand: ["/items/arcane_nature_staff"],
            abilities: [
                ...expand({
                    a: ["/abilities/heal", "/abilities/minor_heal", "/abilities/elemental_affinity"],
                    b: ["/abilities/toxic_pollen"],
                    c: ["/abilities/natures_veil"],
                    d: ["/abilities/entangle"],
                }),
            ],
        }),
    ],
    feet: ["/items/sorcerer_boots"],
    hands: ["/items/chrono_gloves"],
    off_hand: ["/items/tome_of_healing", "/items/tome_of_the_elements", "/items/watchful_relic"],
    pouch: ["/items/giant_pouch"],
    neck: ["/items/wizard_necklace"],
    earrings: ["/items/earrings_of_armor", "/items/earrings_of_regeneration", "/items/earrings_of_resistance"],
    ring: ["/items/ring_of_armor", "/items/ring_of_regeneration", "/items/ring_of_resistance"],
});
