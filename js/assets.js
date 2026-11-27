
/* ==========================================
   TOWN BUILDER V1.0
   CENTRAL ASSET MANAGER
   ========================================== */

(() => {

    'use strict';

    const groups = {

        buildings: [
            'agriculture',
            'agriculture-missing-01',
            'agriculture-missing-02',
            'civic',
            'civic-missing-01',
            'civic-missing-02',
            'commercial-missing-02',
            'commercial-missing-03',
            'education-missing-01',
            'food-missing-01',
            'funfair',
            'health-education-missing',
            'healthcare-missing-01',
            'housing',
            'housing-missing',
            'industry',
            'industry-missing-01',
            'industry-missing-02',
            'landmarks',
            'leisure-missing-02',
            'military',
            'seasonal',
            'shops',
            'shops-missing-01',
            'sports-funfair-wildlife-missing',
            'sports-missing-01',
            'tourism-leisure-missing-01',
            'tourism-missing-02',
            'town-buildings',
            'utilities'
        ],

        animals: [
            'wildlife'
        ],

        decorations: [
            'decoration'
        ],

        goods: [
            'goods'
        ],

        nature: [
            'nature'
        ],

        people: [
            'people',
            'workers'
        ],

        terrain: [
            'terrain'
        ],

        transport: [
            'aircraft',
            'boats',
            'bridges',
            'railways',
            'roads',
            'transport',
            'transport-missing-01',
            'vehicles'
        ]

    };

    const registry = {};

    for (const [folder, names] of Object.entries(groups)) {

        for (const name of names) {

            registry[name] =
                './assets/' +
                folder + '/' +
                name + '-atlas.webp';

        }

    }

    function url(name) {

        const key = String(name)
            .replace(/-atlas\.webp$/i, '');

        if (!Object.hasOwn(registry, key)) {

            console.warn(
                'Unregistered artwork:',
                key
            );

            return './assets/buildings/' +
                key + '-atlas.webp';

        }

        return registry[key];

    }

    window.TownAssets = Object.freeze({

        version: '1.0.0',

        registry: Object.freeze(registry),

        url,

        has(name) {
            return Object.hasOwn(registry, name);
        },

        count() {
            return Object.keys(registry).length;
        }

    });

    console.info(
        'Town Builder Asset Manager:',
        window.TownAssets.count(),
        'sprite sheets registered'
    );

})();
