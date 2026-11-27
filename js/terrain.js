
/* ==========================================
   TOWN BUILDER V1.0
   TERRAIN & WORLD GENERATION
   ========================================== */

(() => {

    'use strict';

    const surfaces = [
        'grass',
        'sand',
        'soil',
        'gravel',
        'paving',
        'water'
    ];

    const presets = [
        'coast',
        'island',
        'countryside',
        'flat'
    ];

    class TownTerrain {

        constructor(town) {

            this.town = town;
            this.history = [];
            this.stroke = null;

        }

        // ==========================================
        // WORLD GENERATION
        // ==========================================

        generate(preset = 'coast', seed = 42) {

            const t = this.town;

            if (
                !presets.includes(preset) ||
                !Number.isInteger(seed) ||
                t.buildings.size ||
                t.occupied.size
            ) return false;

            const w = t.width;
            const h = t.height;

            const phase =
                ((seed >>> 0) % 100000) * 0.137;

            const sourceX = Math.floor(w * 0.24);
            const sourceY = Math.floor(h * 0.48);

            const radius = Math.max(
                1,
                Math.min(w, h) * 0.025
            );

            for (let y = 0; y < h; y++) {

                for (let x = 0; x < w; x++) {

                    let s = 'grass';

                    const coast = w * (
                        0.78 +
                        0.045 * Math.sin(y * 0.19 + phase) +
                        0.025 * Math.sin(y * 0.43 - phase)
                    );

                    const island = Math.hypot(
                        (x - (w - 1) / 2) / (w * 0.43),
                        (y - (h - 1) / 2) / (h * 0.42)
                    );

                    // Coastal landscape

                    if (preset === 'coast') {

                        if (x >= coast) {

                            s = 'water';

                        } else if (
                            x >= coast -
                            Math.max(2, w * 0.045)
                        ) {

                            s = 'sand';

                        }

                    }

                    // Island landscape

                    else if (preset === 'island') {

                        const edge =
                            1 + 0.045 *
                            Math.sin(y * 0.31 + phase);

                        if (island >= edge) {

                            s = 'water';

                        } else if (
                            island >= edge - 0.12
                        ) {

                            s = 'sand';

                        }

                    }

                    // Natural lake / reservoir

                    if (preset !== 'flat') {

                        const lake = Math.hypot(

                            (x - sourceX) /
                            Math.max(2, w * 0.085),

                            (y - sourceY) /
                            Math.max(2, h * 0.12)

                        );

                        if (lake <= 1) {

                            s = 'water';

                        }

                    }

                    t.setTerrain(x, y, s);

                }

            }

            // ==========================================
            // CONNECTED RIVER GENERATION
            // ==========================================

            if (preset !== 'flat') {

                const end = w - 1;

                let previous = sourceY;

                for (let x = sourceX; x <= end; x++) {

                    const y = Math.max(

                        0,

                        Math.min(

                            h - 1,

                            Math.round(

                                sourceY +

                                h * 0.12 * (

                                    Math.sin(
                                        (x - sourceX) *
                                        0.16 + phase
                                    ) -

                                    Math.sin(phase)

                                )

                            )

                        )

                    );

                    for (
                        let cy = Math.min(previous, y);
                        cy <= Math.max(previous, y);
                        cy++
                    ) {

                        for (
                            let dy = -Math.floor(radius);
                            dy <= Math.floor(radius);
                            dy++
                        ) {

                            t.setTerrain(
                                x,
                                cy + dy,
                                'water'
                            );

                        }

                    }

                    previous = y;

                }

            }

            this.history = [];
            this.stroke = null;

            return true;

        }

        // ==========================================
        // BEGIN LANDSCAPING STROKE
        // ==========================================

        begin() {

            if (this.stroke) this.end();

            this.stroke = new Map();

        }

        // ==========================================
        // TERRAIN PAINTING
        // ==========================================

        paint(x, y, surface, size = 1) {

            if (
                !surfaces.includes(surface) ||
                !Number.isInteger(x) ||
                !Number.isInteger(y)
            ) return 0;

            const own = !this.stroke;

            if (own) this.begin();

            const r = Math.max(

                0,

                Math.min(

                    8,

                    Math.floor(
                        (Number(size) || 1) / 2
                    )

                )

            );

            const t = this.town;

            let changed = 0;

            for (let dy = -r; dy <= r; dy++) {

                for (let dx = -r; dx <= r; dx++) {

                    if (
                        dx * dx + dy * dy >
                        (r + 0.4) ** 2
                    ) continue;

                    const a = x + dx;
                    const b = y + dy;

                    const before =
                        t.getTerrain(a, b);

                    if (
                        before === null ||
                        before === surface
                    ) continue;

                    if (
                        t.setTerrain(a, b, surface)
                    ) {

                        const key = t.key(a, b);

                        if (!this.stroke.has(key)) {

                            this.stroke.set(
                                key,
                                before
                            );

                        }

                        changed++;

                    }

                }

            }

            if (own) this.end();

            return changed;

        }

        // ==========================================
        // CONTINUOUS TERRAIN PAINTING
        // ==========================================

        line(x0, y0, x1, y1, surface, size = 1) {

            if (
                ![x0, y0, x1, y1]
                    .every(Number.isInteger)
            ) return 0;

            const own = !this.stroke;

            if (own) this.begin();

            const steps = Math.max(

                Math.abs(x1 - x0),

                Math.abs(y1 - y0),

                1

            );

            let n = 0;

            for (let i = 0; i <= steps; i++) {

                n += this.paint(

                    Math.round(
                        x0 + (x1 - x0) * i / steps
                    ),

                    Math.round(
                        y0 + (y1 - y0) * i / steps
                    ),

                    surface,

                    size

                );

            }

            if (own) this.end();

            return n;

        }

        // ==========================================
        // COMPLETE LANDSCAPING STROKE
        // ==========================================

        end() {

            if (
                this.stroke &&
                this.stroke.size
            ) {

                this.history.push(this.stroke);

                if (this.history.length > 30) {

                    this.history.shift();

                }

            }

            this.stroke = null;

        }

        // ==========================================
        // UNDO
        // ==========================================

        undo() {

            this.end();

            const last = this.history.pop();

            if (!last) return 0;

            let n = 0;

            for (
                const [key, surface] of last
            ) {

                if (

                    this.town.setTerrain(

                        key % this.town.width,

                        Math.floor(
                            key / this.town.width
                        ),

                        surface

                    )

                ) n++;

            }

            return n;

        }

    }

    window.TownTerrain = TownTerrain;

})();
