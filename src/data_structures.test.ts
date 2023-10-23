import { expect, test } from "vitest";
import { expand } from "./data_structures";

test("works (shallow)", () => {
    const input = {
        head: ["/items/fluffy_red_hat", "/items/radiant_hat"],
        feet: ["/items/holy_boots", "/items/sorcerer_boots"],
    };

    const result = expand(input);

    expect(result).toEqual(expect.arrayContaining([
        { head: "/items/fluffy_red_hat", feet: "/items/holy_boots" },
        { head: "/items/fluffy_red_hat", feet: "/items/sorcerer_boots" },
        { head: "/items/radiant_hat", feet: "/items/holy_boots" },
        { head: "/items/radiant_hat", feet: "/items/sorcerer_boots" },
    ]));
});

test("works (deep)", () => {
    const input = {
        set: [
            ...expand({
                body: ["/items/flaming_robe_top"],
                main_hand: ["/items/arcane_fire_staff", "/items/infernal_battlestaff"],
            }),
            ...expand({
                body: ["/items/luna_robe_top"],
                main_hand: ["/items/arcane_nature_staff"],
            }),
        ],
    };
    const result = expand(input);

    expect(result).toEqual(expect.arrayContaining([
        {
            set: {
                body: "/items/flaming_robe_top",
                main_hand: "/items/arcane_fire_staff",
            },
        },
        {
            set: {
                body: "/items/flaming_robe_top",
                main_hand: "/items/infernal_battlestaff",
            },
        },
        {
            set: {
                body: "/items/luna_robe_top",
                main_hand: "/items/arcane_nature_staff",
            },
        },
    ]));
});
