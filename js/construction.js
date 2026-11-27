
/* ==========================================
   TOWN BUILDER V1.0
   CONSTRUCTION CONTROLLER
   ========================================== */

(() => {

    'use strict';

    class TownConstruction {

        constructor(town) {

            this.town = town;
            this.pending = null;

        }

        // SELECT A NEW BUILDING

        select(type) {

            if (!this.town.catalogue.has(type)) {
                return false;
            }

            this.pending = {
                action: 'build',
                type,
                x: null,
                y: null,
                rotation: 0,
                id: null
            };

            return true;

        }

        // SELECT A LOCATION

        target(x, y) {

            if (
                !this.pending ||
                this.pending.action === 'remove' ||
                !Number.isInteger(x) ||
                !Number.isInteger(y)
            ) return false;

            this.pending.x = x;
            this.pending.y = y;

            return true;

        }

        // ROTATE THE PREVIEW

        rotate(direction = 1) {

            if (
                !this.pending ||
                this.pending.action === 'remove' ||
                !Number.isInteger(direction)
            ) return false;

            this.pending.rotation = (

                (
                    this.pending.rotation +
                    direction
                ) % 4 + 4

            ) % 4;

            return true;

        }

        // CALCULATE ROTATED FOOTPRINT

        footprint() {

            if (!this.pending) return null;

            const p = this.pending;

            const item =
                this.town.catalogue.get(p.type);

            if (!item) return null;

            return {

                x: p.x,

                y: p.y,

                width: p.rotation % 2
                    ? item.height
                    : item.width,

                height: p.rotation % 2
                    ? item.width
                    : item.height,

                rotation: p.rotation

            };

        }

        // VALIDATE WITHOUT SPENDING MONEY

        preview() {

            const p = this.pending;

            if (!p) {

                return {
                    ok: false,
                    reason: 'Select a building'
                };

            }

            if (p.action === 'remove') {

                return {

                    ok: this.town.buildings.has(p.id),

                    cost: 0,

                    reason: 'Confirm demolition'

                };

            }

            if (p.x === null || p.y === null) {

                return {

                    ok: false,

                    reason: 'Choose a location'

                };

            }

            return this.town.preview(

                p.type,

                p.x,

                p.y,

                p.rotation,

                p.action === 'move'
                    ? p.id
                    : null

            );

        }

        // RELOCATE EXISTING BUILDING

        beginMove(id) {

            const b = this.town.buildings.get(id);

            if (!b) return false;

            this.pending = {

                action: 'move',

                type: b.type,

                id,

                x: b.x,

                y: b.y,

                rotation: b.rotation

            };

            return true;

        }

        // PREPARE DEMOLITION

        beginRemove(id) {

            const b = this.town.buildings.get(id);

            if (!b) return false;

            this.pending = {

                action: 'remove',

                type: b.type,

                id,

                x: b.x,

                y: b.y,

                rotation: b.rotation

            };

            return true;

        }

        // CANCEL WITHOUT ALTERING THE TOWN

        cancel() {

            this.pending = null;

        }

        // CONFIRM THE CURRENT ACTION

        confirm() {

            const p = this.pending;

            if (!p) {

                return {

                    ok: false,

                    reason: 'Nothing to confirm'

                };

            }

            const check = this.preview();

            if (!check.ok) return check;

            let result;

            if (p.action === 'build') {

                result = this.town.place(

                    p.type,

                    p.x,

                    p.y,

                    p.rotation

                );

            } else if (p.action === 'move') {

                result = this.town.move(

                    p.id,

                    p.x,

                    p.y,

                    p.rotation

                );

            } else if (p.action === 'remove') {

                result = {

                    ok: this.town.remove(p.id)

                };

            } else {

                return {

                    ok: false,

                    reason: 'Unknown construction action'

                };

            }

            if (result.ok) this.cancel();

            return result;

        }

        // FIND BUILDING AT MAP LOCATION

        buildingAt(x, y) {

            if (!this.town.inside(x, y)) {

                return null;

            }

            const id = this.town.occupied.get(

                this.town.key(x, y)

            );

            return this.town.buildings.get(id) || null;

        }

    }

    window.TownConstruction = TownConstruction;

})();
