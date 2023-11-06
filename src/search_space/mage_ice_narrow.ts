import { expand } from "../data_structures";

export const space = expand({
    food: [
        { a: "/items/spaceberry_cake", b: "/items/spaceberry_donut", c: "/items/star_fruit_yogurt" },
        { a: "/items/spaceberry_cake", b: "/items/star_fruit_gummy", c: "/items/star_fruit_yogurt" },
    ],
    drinks: [
        ...expand({
            a: [
                "/items/super_magic_coffee",
            ],
            b: [
                "/items/super_intelligence_coffee",
                "/items/super_stamina_coffee",
                "/items/channeling_coffee",
                "/items/super_defense_coffee",
            ],
            c: ["/items/wisdom_coffee"],
        }),
    ],
    head: ["/items/radiant_hat", "/items/fluffy_red_hat"],
    set: [
        ...expand({
            body: ["/items/marine_tunic", "/items/radiant_robe_top", "/items/icy_robe_top"],
            legs: ["/items/marine_chaps", "/items/radiant_robe_bottoms", "/items/icy_robe_bottoms"],
            main_hand: ["/items/frost_staff"],
            abilities: [
                ...expand({
                    a: ["/abilities/heal", "/abilities/minor_heal", "/abilities/elemental_affinity"],
                    b: ["/abilities/ice_spear", "/abilities/firestorm"],
                    c: ["/abilities/frost_surge"],
                    d: ["/abilities/water_strike"],
                }),
            ],
        }),
    ],
    feet: ["/items/sorcerer_boots"],
    hands: ["/items/chrono_gloves"],
    off_hand: ["/items/tome_of_the_elements", "/items/watchful_relic"],
    pouch: ["/items/giant_pouch"],
    neck: ["/items/wizard_necklace"],
    earrings: ["/items/earrings_of_regeneration"],
    ring: ["/items/ring_of_regeneration"],
});
