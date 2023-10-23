import { zipObject, sample, shuffle, keyBy } from "lodash";

export function cartesianProduct(arr) {
    return arr.reduce(
        function (a, b) {
            return a
                .map(function (x) {
                    return b.map(function (y) {
                        return x.concat([y]);
                    });
                })
                .reduce(function (a, b) {
                    return a.concat(b);
                }, []);
        },
        [[]]
    );
}

export function expand(obj: any) {
    const possibilities = shuffle(cartesianProduct(Object.values(obj)));
    return possibilities.map((values) => zipObject(Object.keys(obj), values));
}

