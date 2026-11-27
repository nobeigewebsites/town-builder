
/* ==========================================
   TOWN BUILDER V1.0
   TRANSPORT & NETWORK ENGINE
   ========================================== */

(() => {

'use strict';

// ==========================================
// TRANSPORT CATALOGUE
// ==========================================

const TYPES = Object.freeze(Object.fromEntries([

    // ROADS

    ['lane','Country lane','Roads',
        'road',8,'#a39a7c',.48],

    ['road','Residential road','Roads',
        'road',12,'#646e70',.66],

    ['mainroad','Main road','Roads',
        'road',20,'#525d61',.88],

    ['roadbridge','Road bridge','Roads',
        'road',35,'#646e70',.66,true],

    // RAILWAYS

    ['rail','Railway track','Railways',
        'rail',24,'#9b8e7a',.72],

    ['railbridge','Railway bridge','Railways',
        'rail',45,'#9b8e7a',.72,true],

    ['platform','Railway platform','Railways',
        'platform',30,'#c1b9a7',.78],

    // TRAMS

    ['tram','Tram track','Trams',
        'tram',25,'#b1afa6',.72],

    // UNDERGROUND

    ['subway','Subway track','Underground',
        'subway',28,'#6f829c',.72,
        false,'underground'],

    // AVIATION

    ['runway','Airport runway','Aviation',
        'air',50,'#535b60',.94],

    ['taxiway','Airport taxiway','Aviation',
        'air',25,'#6e7577',.60],

    // WALKING AND CYCLING

    ['path','Garden path','Walking & cycling',
        'path',5,'#d2bd96',.36],

    ['pavement','Pavement','Walking & cycling',
        'path',8,'#c8c7bb',.54],

    ['cycle','Cycle lane','Walking & cycling',
        'cycle',12,'#719d72',.48]

].map(([

    id,name,category,family,cost,color,width,
    bridge=false,layer='surface'

]) => [

    id,

    Object.freeze({

        id,name,category,family,cost,
        color,width,bridge,layer

    })

])));

// ==========================================
// CONNECTION DIRECTIONS
// ==========================================

const DIRS = [

    [0,-1,1],
    [1,0,2],
    [0,1,4],
    [-1,0,8]

];

class TownTransport {

    constructor(town) {

        this.town = town;

        this.layers = {

            surface: new Map(),

            underground: new Map()

        };

    }

    // FIND TRANSPORT AT LOCATION

    get(x,y,layer='surface') {

        return this.town.inside(x,y)

            ? this.layers[layer]?.get(
                this.town.key(x,y)
              ) || null

            : null;

    }

    // CONTINUOUS ROUTE PLANNING

    path(a,b,xFirst=true) {

        if (

            !a || !b ||

            !this.town.inside(a.x,a.y) ||

            !this.town.inside(b.x,b.y)

        ) return [];

        let x = a.x;
        let y = a.y;

        const cells = [{x,y}];

        const walk = axis => {

            const end = b[axis];

            while (

                (axis === 'x' ? x : y) !== end

            ) {

                if (axis === 'x') {

                    x += Math.sign(end-x);

                } else {

                    y += Math.sign(end-y);

                }

                cells.push({x,y});

            }

        };

        walk(xFirst ? 'x' : 'y');

        walk(xFirst ? 'y' : 'x');

        return cells;

    }

    // ==========================================
    // VALIDATE THE ENTIRE ROUTE
    // ==========================================

    preview(type,a,b=a,xFirst=true) {

        const d = TYPES[type];

        const cells = this.path(a,b,xFirst);

        const fail = reason => ({

            ok:false,
            reason,
            cells,
            cost:0

        });

        if (!d) {

            return fail('Unknown transport type');

        }

        if (!cells.length) {

            return fail(
                'Choose two locations on the map'
            );

        }

        let cost = 0;

        for (const {x,y} of cells) {

            const key = this.town.key(x,y);

            const old = this.get(x,y,d.layer);

            if (d.layer === 'surface') {

                if (this.town.occupied.has(key)) {

                    return fail(
                        'A building occupies the route'
                    );

                }

                if (

                    this.town.getTerrain(x,y)
                        === 'water' &&

                    !d.bridge

                ) {

                    return fail(
                        'Water: use a bridge or subway'
                    );

                }

            }

            if (old && old !== type) {

                return fail(
                    'Another transport type occupies the route'
                );

            }

            if (!old) cost += d.cost;

        }

        if (this.town.cash < cost) {

            return {

                ...fail('Insufficient funds'),

                cost

            };

        }

        return {

            ok:true,

            type,

            a:{...a},

            b:{...b},

            xFirst,

            cells,

            cost

        };

    }

    // ==========================================
    // CONFIRMED CONSTRUCTION
    // ==========================================

    build(type,a,b=a,xFirst=true) {

        const p = this.preview(
            type,a,b,xFirst
        );

        if (!p.ok) return p;

        const layer = this.layers[
            TYPES[type].layer
        ];

        for (const {x,y} of p.cells) {

            layer.set(

                this.town.key(x,y),

                type

            );

        }

        this.town.cash -= p.cost;

        return p;

    }

    // ==========================================
    // REMOVE TRANSPORT SECTIONS
    // ==========================================

    erase(a,b=a,layer='surface',xFirst=true) {

        if (!this.layers[layer]) return 0;

        let n = 0;

        for (

            const {x,y} of
            this.path(a,b,xFirst)

        ) {

            if (

                this.layers[layer].delete(

                    this.town.key(x,y)

                )

            ) n++;

        }

        return n;

    }

    // ==========================================
    // AUTOMATIC TILE CONNECTIONS
    // ==========================================

    mask(x,y,layer='surface',overlay=null) {

        const read = (a,b) => {

            if (!this.town.inside(a,b)) {

                return null;

            }

            return overlay?.get(

                this.town.key(a,b)

            ) || this.get(a,b,layer);

        };

        const d = TYPES[read(x,y)];

        if (!d) return 0;

        let mask = 0;

        for (const [dx,dy,bit] of DIRS) {

            const other = TYPES[
                read(x+dx,y+dy)
            ];

            if (other?.family === d.family) {

                mask |= bit;

            }

        }

        return mask;

    }

    // ==========================================
    // CONNECTED NETWORK PATHFINDING
    // ==========================================

    route(a,b,layer='surface') {

        const first = TYPES[
            this.get(a?.x,a?.y,layer)
        ];

        const last = TYPES[
            this.get(b?.x,b?.y,layer)
        ];

        if (

            !first ||

            first.family !== last?.family

        ) return null;

        const key = p =>

            this.town.key(p.x,p.y);

        const start = key(a);

        const end = key(b);

        const queue = [a];

        const parents = new Map([

            [start,null]

        ]);

        for (let i=0; i<queue.length; i++) {

            const p = queue[i];

            const k = key(p);

            if (k === end) {

                const out = [];

                let v = k;

                while (v !== null) {

                    out.push({

                        x:v % this.town.width,

                        y:Math.floor(
                            v / this.town.width
                        )

                    });

                    v = parents.get(v);

                }

                return out.reverse();

            }

            const mask = this.mask(
                p.x,p.y,layer
            );

            for (const [dx,dy,bit] of DIRS) {

                if (!(mask & bit)) continue;

                const n = {

                    x:p.x+dx,

                    y:p.y+dy

                };

                const nk = key(n);

                if (!parents.has(nk)) {

                    parents.set(nk,k);

                    queue.push(n);

                }

            }

        }

        return null;

    }

}

window.TownTransport = TownTransport;

window.TownTransportTypes = TYPES;

})();
