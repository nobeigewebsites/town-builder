
/* ==========================================
   TOWN BUILDER V1.0
   UTILITY NETWORK ENGINE
   ========================================== */

(() => {

'use strict';

const TYPES = Object.freeze({

    power: {
        name:'Electricity',
        cost:8,
        color:'#e8c448'
    },

    water: {
        name:'Clean water',
        cost:6,
        color:'#4aa9e8'
    },

    sewage: {
        name:'Sewage',
        cost:7,
        color:'#af8258'
    },

    telecom: {
        name:'Telecommunications',
        cost:5,
        color:'#c08aeb'
    }

});

const DIRS = [

    [1,0],
    [-1,0],
    [0,1],
    [0,-1]

];

class TownUtilities {

    constructor(town) {

        this.town = town;

        this.lines = Object.fromEntries(

            Object.keys(TYPES).map(
                k => [k,new Set()]
            )

        );

        this.profiles = new Map();

    }

    // ==========================================
    // REGISTER BUILDING REQUIREMENTS
    // ==========================================

    register(type, profile = {}) {

        const clean = {};

        for (const k of Object.keys(TYPES)) {

            const {

                supply=0,

                demand=0

            } = profile[k] || {};

            if (

                ![supply,demand].every(

                    n => Number.isSafeInteger(n) && n>=0

                )

            ) {

                throw new Error(
                    'Invalid utility profile'
                );

            }

            clean[k] = {supply,demand};

        }

        this.profiles.set(type,clean);

    }

    // ==========================================
    // PLAN CONTINUOUS UTILITY ROUTES
    // ==========================================

    path(a,b,xFirst=true) {

        if (

            !a || !b ||

            !this.town.inside(a.x,a.y) ||

            !this.town.inside(b.x,b.y)

        ) return [];

        let {x,y} = a;

        const cells = [{x,y}];

        for (

            const axis of

            xFirst ? ['x','y'] : ['y','x']

        ) {

            while (

                (axis==='x'?x:y)!==b[axis]

            ) {

                if (axis==='x') {

                    x+=Math.sign(b.x-x);

                } else {

                    y+=Math.sign(b.y-y);

                }

                cells.push({x,y});

            }

        }

        return cells;

    }

    // ==========================================
    // PREVIEW AND VALIDATE
    // ==========================================

    preview(type,a,b=a,xFirst=true,erase=false) {

        const d=TYPES[type];

        let cells=this.path(a,b,xFirst);

        if (!d || !cells.length) {

            return {

                ok:false,

                cells,

                cost:0,

                reason:'Choose a valid route'

            };

        }

        const t=this.town;

        const set=this.lines[type];

        if (erase) {

            cells=cells.filter(

                p=>set.has(t.key(p.x,p.y))

            );

            return {

                ok:cells.length>0,

                cells,

                cost:0,

                reason:'No lines to remove'

            };

        }

        if (

            cells.some(

                p=>t.getTerrain(p.x,p.y)==='water'

            )

        ) {

            return {

                ok:false,

                cells,

                cost:0,

                reason:'Utility lines require land'

            };

        }

        const cost=cells.filter(

            p=>!set.has(t.key(p.x,p.y))

        ).length*d.cost;

        return {

            ok:t.cash>=cost,

            cells,

            cost,

            reason:'Insufficient funds'

        };

    }

    // ==========================================
    // CONFIRMED CONSTRUCTION OR REMOVAL
    // ==========================================

    commit(type,a,b=a,xFirst=true,erase=false) {

        const p=this.preview(

            type,a,b,xFirst,erase

        );

        if (!p.ok) return p;

        for (const {x,y} of p.cells) {

            const k=this.town.key(x,y);

            if (erase) {

                this.lines[type].delete(k);

            } else {

                this.lines[type].add(k);

            }

        }

        this.town.cash-=p.cost;

        return p;

    }

    // ==========================================
    // IDENTIFY INDEPENDENT CONNECTED NETWORKS
    // ==========================================

    components(type) {

        const t=this.town;

        const ids=new Map();

        const groups=[];

        for (const start of this.lines[type]) {

            if (ids.has(start)) continue;

            const id=groups.length;

            const group={

                supply:0,

                demand:0,

                buildings:[]

            };

            groups.push(group);

            const queue=[start];

            ids.set(start,id);

            for (let i=0;i<queue.length;i++) {

                const k=queue[i];

                const x=k%t.width;

                const y=Math.floor(k/t.width);

                for (const [dx,dy] of DIRS) {

                    const a=x+dx;

                    const b=y+dy;

                    if (!t.inside(a,b)) continue;

                    const n=t.key(a,b);

                    if (

                        this.lines[type].has(n) &&

                        !ids.has(n)

                    ) {

                        ids.set(n,id);

                        queue.push(n);

                    }

                }

            }

        }

        return {ids,groups};

    }

    // ==========================================
    // CONNECT BUILDINGS TO UTILITIES
    // ==========================================

    connection(building,ids) {

        const t=this.town;

        const found=new Set();

        for (const k of building.cells) {

            const x=k%t.width;

            const y=Math.floor(k/t.width);

            for (

                const [dx,dy] of

                [[0,0],...DIRS]

            ) {

                if (

                    !t.inside(x+dx,y+dy)

                ) continue;

                const id=ids.get(

                    t.key(x+dx,y+dy)

                );

                if (id!==undefined) {

                    found.add(id);

                }

            }

        }

        return found.size

            ? Math.min(...found)

            : null;

    }

    // ==========================================
    // SUPPLY, DEMAND AND CAPACITY CALCULATION
    // ==========================================

    report(type) {

        if (!TYPES[type]) {

            throw new Error('Unknown utility');

        }

        const {ids,groups}=this.components(type);

        const buildings=new Map();

        let supply=0;

        let demand=0;

        let served=0;

        let connectedSupply=0;

        for (

            const b of

            this.town.buildings.values()

        ) {

            const p=this.profiles.get(b.type)?.[type];

            if (

                !p || (!p.supply && !p.demand)

            ) continue;

            const component=this.connection(b,ids);

            const row={

                id:b.id,

                type:b.type,

                component,

                supply:p.supply,

                demand:p.demand,

                served:0

            };

            buildings.set(b.id,row);

            supply+=p.supply;

            demand+=p.demand;

            if (component===null) continue;

            const g=groups[component];

            g.supply+=p.supply;

            g.demand+=p.demand;

            g.buildings.push(row);

            connectedSupply+=p.supply;

        }

        for (const g of groups) {

            let remaining=g.supply;

            for (

                const row of

                g.buildings.sort((a,b)=>a.id-b.id)

            ) {

                row.served=Math.min(

                    row.demand,

                    remaining

                );

                remaining-=row.served;

                served+=row.served;

            }

            g.spare=remaining;

        }

        return {

            type,

            supply,

            connectedSupply,

            demand,

            served,

            unmet:demand-served,

            buildings,

            groups

        };

    }

}

window.TownUtilities=TownUtilities;

window.TownUtilityTypes=TYPES;

})();
