
/* ==========================================
   TOWN BUILDER V1.0
   CORE GAME ENGINE
   ========================================== */

(() => {

    'use strict';

    const SURFACES = new Set([
        'grass',
        'sand',
        'soil',
        'gravel',
        'paving',
        'water'
    ]);

    class TownEngine {

        constructor({
            width = 64,
            height = 64,
            cash = 10000
        } = {}) {

            if (![width, height].every(n =>
                Number.isInteger(n) && n > 0 && n <= 256
            )) {
                throw new Error('Invalid map size');
            }

            if (!Number.isSafeInteger(cash) || cash < 0) {
                throw new Error('Invalid starting cash');
            }

            this.width = width;
            this.height = height;
            this.cash = cash;

            this.terrain = new Array(
                width * height
            ).fill('grass');

            this.catalogue = new Map();
            this.buildings = new Map();
            this.occupied = new Map();

            this.nextId = 1;

        }

        // ==========================================
        // MAP COORDINATES
        // ==========================================

        inside(x, y) {

            return Number.isInteger(x) &&
                Number.isInteger(y) &&
                x >= 0 &&
                y >= 0 &&
                x < this.width &&
                y < this.height;

        }

        key(x, y) {

            return y * this.width + x;

        }

        // ==========================================
        // TERRAIN
        // ==========================================

        getTerrain(x, y) {

            return this.inside(x, y)
                ? this.terrain[this.key(x, y)]
                : null;

        }

        setTerrain(x, y, surface) {

            if (
                !this.inside(x, y) ||
                !SURFACES.has(surface) ||
                this.occupied.has(this.key(x, y))
            ) return false;

            this.terrain[this.key(x, y)] = surface;

            return true;

        }

        // ==========================================
        // BUILDING REGISTRATION
        // ==========================================

        register(id, options = {}) {

            const {
                name = id,
                width = 1,
                height = 1,
                cost = 0,
                surfaces = [
                    'grass',
                    'soil',
                    'paving'
                ]
            } = options;

            if (
                typeof id !== 'string' ||
                !id ||
                this.catalogue.has(id) ||
                ![width, height].every(n =>
                    Number.isInteger(n) &&
                    n > 0 &&
                    n <= 256
                ) ||
                !Number.isSafeInteger(cost) ||
                cost < 0 ||
                !Array.isArray(surfaces) ||
                !surfaces.length ||
                !surfaces.every(s => SURFACES.has(s))
            ) {
                throw new Error(
                    'Invalid catalogue entry: ' + id
                );
            }

            this.catalogue.set(id, Object.freeze({
                id,
                name,
                width,
                height,
                cost,
                surfaces: Object.freeze([...surfaces])
            }));

        }

        // ==========================================
        // PLACEMENT PREVIEW
        // NO PURCHASE OR PERMANENT CHANGES
        // ==========================================

        preview(
            type,
            x,
            y,
            rotation = 0,
            movingId = null
        ) {

            const item = this.catalogue.get(type);

            const fail = reason => ({
                ok: false,
                reason
            });

            if (!item) {
                return fail('Unknown building');
            }

            if (!Number.isInteger(rotation)) {
                return fail('Invalid rotation');
            }

            if (
                movingId !== null &&
                this.buildings.get(movingId)?.type !== type
            ) {
                return fail('Unknown building to move');
            }

            rotation = ((rotation % 4) + 4) % 4;

            const width = rotation % 2
                ? item.height
                : item.width;

            const height = rotation % 2
                ? item.width
                : item.height;

            if (
                !this.inside(x, y) ||
                !this.inside(
                    x + width - 1,
                    y + height - 1
                )
            ) {
                return fail('Outside map');
            }

            const cells = [];

            for (let dy = 0; dy < height; dy++) {

                for (let dx = 0; dx < width; dx++) {

                    const key = this.key(
                        x + dx,
                        y + dy
                    );

                    if (
                        this.occupied.has(key) &&
                        this.occupied.get(key) !== movingId
                    ) {
                        return fail('Location occupied');
                    }

                    if (
                        !item.surfaces.includes(
                            this.terrain[key]
                        )
                    ) {
                        return fail('Unsuitable terrain');
                    }

                    cells.push(key);

                }

            }

            const cost = movingId === null
                ? item.cost
                : 0;

            if (this.cash < cost) {
                return fail('Insufficient funds');
            }

            return {
                ok: true,
                type,
                x,
                y,
                width,
                height,
                rotation,
                cost,
                cells
            };

        }

        // ==========================================
        // CONFIRMED CONSTRUCTION
        // ==========================================

        place(type, x, y, rotation = 0) {

            const p = this.preview(
                type,
                x,
                y,
                rotation
            );

            if (!p.ok) return p;

            const id = this.nextId++;

            const building = Object.freeze({
                id,
                ...p,
                cells: Object.freeze(p.cells)
            });

            this.cash -= p.cost;

            this.buildings.set(id, building);

            for (const key of p.cells) {

                this.occupied.set(key, id);

            }

            return {
                ok: true,
                building
            };

        }

        // ==========================================
        // RELOCATION AND ROTATION
        // ==========================================

        move(id, x, y, rotation) {

            const old = this.buildings.get(id);

            if (!old) {
                return {
                    ok: false,
                    reason: 'Unknown building'
                };
            }

            const p = this.preview(
                old.type,
                x,
                y,
                rotation ?? old.rotation,
                id
            );

            if (!p.ok) return p;

            const building = Object.freeze({
                id,
                ...p,
                cost: old.cost,
                cells: Object.freeze(p.cells)
            });

            for (const key of old.cells) {

                this.occupied.delete(key);

            }

            for (const key of p.cells) {

                this.occupied.set(key, id);

            }

            this.buildings.set(id, building);

            return {
                ok: true,
                building
            };

        }

        // ==========================================
        // CONFIRMED DEMOLITION
        // ==========================================

        remove(id) {

            const building = this.buildings.get(id);

            if (!building) return false;

            for (const key of building.cells) {

                this.occupied.delete(key);

            }

            return this.buildings.delete(id);

        }

    }

    window.TownEngine = TownEngine;

})();
