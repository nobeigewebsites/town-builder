
/* ==========================================
   TOWN BUILDER V1.0
   SAVE, LOAD & MULTIPLE TOWNS
   ========================================== */

(() => {

'use strict';

const VERSION=1;
const FORMAT='TownBuilderSave';
const STORAGE_KEY='town-builder-v1-saves';
const MAX_FILE=2000000;

const own=(o,k)=>Object.hasOwn(o,k);
const integer=n=>Number.isSafeInteger(n)&&n>=0;

function requireValid(condition,message){
    if(!condition) throw new Error(message);
}

// Explicit list of persistent module state.
// References to other engines are reconstructed on load.

const SCHEMA={

    transport:{
        layers:'object'
    },

    utilities:{
        lines:'object',
        profiles:'map'
    },

    farm:{
        day:'number',
        fields:'map',
        pens:'map',
        stock:'map',
        baseStorage:'number',
        revenue:'number',
        expenses:'number',
        messages:'array'
    },

    industry:{
        factories:'map',
        revenue:'number',
        expenses:'number',
        completed:'number'
    },

    economy:{
        householdTax:'number',
        businessTax:'number',
        properties:'map',
        arrears:'number',
        history:'array',
        last:'nullable',
        contractRevenue:'number',
        contracts:'map'
    },

    simulation:{
        knownHomes:'set',
        history:'array',
        last:'nullable',
        tourismRevenue:'number',
        peoplePerHousehold:'number',
        workersPerHousehold:'number'
    },

    progression:{
        researched:'set',
        active:'nullable',
        automation:'map',
        achievements:'set',
        objectives:'map',
        harvested:'number',
        exportRevenue:'number',
        researchCosts:'number',
        objectiveRevenue:'number'
    },

    landscaping:{
        habitats:'map',
        animals:'map',
        nextHabitat:'number',
        nextAnimal:'number'
    }

};

// ==========================================
// SERIALISE MAPS AND SETS
// ==========================================

function encode(value){

    return JSON.parse(JSON.stringify(value,(key,v)=>{

        if(v instanceof Map)
            return {$townType:'Map',entries:[...v]};

        if(v instanceof Set)
            return {$townType:'Set',values:[...v]};

        return v;

    }));

}

function decode(value){

    return JSON.parse(JSON.stringify(value),(key,v)=>{

        if(v&&typeof v==='object'){

            if(own(v,'$townType')){

                if(v.$townType==='Map'){

                    requireValid(
                        Array.isArray(v.entries)&&
                        v.entries.every(
                            p=>Array.isArray(p)&&p.length===2
                        ),
                        'Invalid saved map'
                    );

                    const result=new Map(v.entries);

                    requireValid(
                        result.size===v.entries.length,
                        'Duplicate map entries'
                    );

                    return result;

                }

                if(v.$townType==='Set'){

                    requireValid(
                        Array.isArray(v.values),
                        'Invalid saved set'
                    );

                    return new Set(v.values);

                }

                throw new Error('Unknown saved data type');

            }

        }

        return v;

    });

}

function matches(value,type){

    switch(type){

        case 'number':
            return integer(value);

        case 'map':
            return value instanceof Map;

        case 'set':
            return value instanceof Set;

        case 'array':
            return Array.isArray(value);

        case 'object':
            return value!==null&&
                typeof value==='object'&&
                !Array.isArray(value);

        case 'nullable':
            return value===null||
                (
                    typeof value==='object'&&
                    !Array.isArray(value)
                );

        default:
            return false;

    }

}

// ==========================================
// CREATE A SHARED WORLD
// ==========================================

class TownSave {

    static createWorld(
        options={},
        useSimulation=typeof window.TownSimulation==='function'
    ){

        const town=new TownEngine(options);

        const terrain=new TownTerrain(town);
        const transport=new TownTransport(town);
        const utilities=new TownUtilities(town);

        const farm=new TownFarming(town);
        const industry=new TownIndustry(town,farm);

        const economy=new TownEconomy(
            town,farm,industry
        );

        let simulation=null;

        if(useSimulation){

            requireValid(
                typeof window.TownSimulation==='function',
                'Population module required to load this town'
            );

            simulation=new TownSimulation(
                town,economy,transport,utilities
            );

        }

        const progression=new TownProgression(
            economy,simulation
        );

        const landscaping=new TownLandscaping(
            town,transport
        );

        const construction=new TownConstruction(town);

        return {
            town,terrain,transport,utilities,
            farm,industry,economy,simulation,
            progression,landscaping,construction
        };

    }

    // ======================================
    // CAPTURE COMPLETE TOWN STATE
    // ======================================

    static capture(world){

        const t=world.town;

        world.farm.sync();
        world.industry.sync();
        world.economy.sync();

        if(world.simulation)
            world.simulation.sync();

        const state={};

        for(const [module,fields] of Object.entries(SCHEMA)){

            const source=world[module];

            if(!source){

                requireValid(
                    module==='simulation',
                    'Missing module: '+module
                );

                state[module]=null;
                continue;

            }

            state[module]={};

            for(const [key,type] of Object.entries(fields)){

                requireValid(
                    matches(source[key],type),
                    'Invalid state: '+module+'.'+key
                );

                state[module][key]=source[key];

            }

        }

        return encode({

            format:FORMAT,
            version:VERSION,

            core:{
                width:t.width,
                height:t.height,
                cash:t.cash,
                terrain:[...t.terrain],
                catalogue:t.catalogue,
                buildings:[...t.buildings.values()],
                nextId:t.nextId
            },

            state,

            preview:{
                cash:t.cash,
                day:world.farm.day,
                households:world.economy.households(),
                population:world.economy.households()*
                    (world.simulation?.peoplePerHousehold||3),
                buildings:t.buildings.size
            }

        });

    }

    // ======================================
    // RECONSTRUCT A SAVED WORLD
    // ======================================

    static restore(snapshot){

        requireValid(
            snapshot?.format===FORMAT,
            'Not a Town Builder save'
        );

        requireValid(
            snapshot.version===VERSION,
            'Unsupported save version'
        );

        const data=decode(snapshot);

        const c=data.core;

        requireValid(
            c&&data.state&&
            integer(c.cash)&&
            integer(c.width)&&
            integer(c.height)&&
            c.width>=1&&c.width<=256&&
            c.height>=1&&c.height<=256,
            'Invalid saved world'
        );

        const w=this.createWorld({
            width:c.width,
            height:c.height,
            cash:0
        },!!data.state.simulation);

        const t=w.town;

        // Restore the original catalogue.

        requireValid(
            c.catalogue instanceof Map,
            'Invalid building catalogue'
        );

        t.catalogue.clear();

        for(const [id,d] of c.catalogue)
            t.register(id,d);

        // Restore terrain before buildings.

        requireValid(
            Array.isArray(c.terrain)&&
            c.terrain.length===t.width*t.height,
            'Invalid terrain dimensions'
        );

        for(let k=0;k<c.terrain.length;k++){

            requireValid(
                t.setTerrain(
                    k%t.width,
                    Math.floor(k/t.width),
                    c.terrain[k]
                ),
                'Invalid terrain tile'
            );

        }

        requireValid(
            Array.isArray(c.buildings),
            'Invalid building list'
        );

        // Validate placement without charging saved cash.

        t.cash=Number.MAX_SAFE_INTEGER;

        let highestId=0;

        for(const b of c.buildings){

            requireValid(
                b&&integer(b.id)&&b.id>0&&
                !t.buildings.has(b.id)&&
                integer(b.cost)&&
                integer(b.rotation)&&b.rotation<4,
                'Invalid saved building'
            );

            const p=t.preview(
                b.type,b.x,b.y,b.rotation
            );

            requireValid(
                p.ok,
                'Cannot restore building '+b.id+
                ': '+p.reason
            );

            const restored=Object.freeze({
                ...p,
                id:b.id,
                cost:b.cost,
                cells:Object.freeze(p.cells)
            });

            t.buildings.set(b.id,restored);

            for(const k of p.cells)
                t.occupied.set(k,b.id);

            highestId=Math.max(highestId,b.id);

        }

        requireValid(
            integer(c.nextId)&&c.nextId>highestId,
            'Invalid next building ID'
        );

        t.nextId=c.nextId;
        t.cash=c.cash;

        // Restore each persistent module.

        for(const [module,fields] of Object.entries(SCHEMA)){

            const source=data.state[module];
            const target=w[module];

            if(module==='simulation'&&!source)
                continue;

            requireValid(
                source&&target,
                'Missing saved module: '+module
            );

            for(const [key,type] of Object.entries(fields)){

                requireValid(
                    own(source,key)&&
                    matches(source[key],type),
                    'Invalid saved '+module+'.'+key
                );

                target[key]=source[key];

            }

        }

        this.validateWorld(w);

        // Reconnect the latest finance report to history.

        if(w.economy.history.length)
            w.economy.last=w.economy.history[0];

        return w;

    }

    // ======================================
    // CHECK IMPORTANT SAVE REFERENCES
    // ======================================

    static validateWorld(w){

        const t=w.town;

        const validKey=k=>
            integer(k)&&k<t.width*t.height;

        const exists=id=>t.buildings.has(id);

        requireValid(
            w.farm.day>=1,
            'Invalid simulation day'
        );

        requireValid(
            w.economy.householdTax<=30&&
            w.economy.businessTax<=30,
            'Invalid tax rates'
        );

        for(const layer of ['surface','underground']){

            const network=w.transport.layers[layer];

            requireValid(
                network instanceof Map,
                'Invalid transport layer'
            );

            for(const [k,type] of network){

                requireValid(
                    validKey(k)&&
                    own(TownTransportTypes,type)&&
                    TownTransportTypes[type].layer===layer&&
                    (
                        layer!=='surface'||
                        !t.occupied.has(k)
                    ),
                    'Invalid transport tile'
                );

            }

        }

        for(const type of Object.keys(TownUtilityTypes)){

            const lines=w.utilities.lines[type];

            requireValid(
                lines instanceof Set&&
                [...lines].every(validKey),
                'Invalid utility network'
            );

        }

        for(const [id,profile] of w.utilities.profiles){

            requireValid(
                typeof id==='string'&&
                profile&&typeof profile==='object',
                'Invalid utility profile'
            );

            w.utilities.register(id,profile);

        }

        for(const [id,n] of w.farm.stock){

            requireValid(
                own(TownIndustryProducts,id)&&
                integer(n)&&n>0,
                'Invalid inventory entry'
            );

        }

        for(const [id,f] of w.farm.fields){

            requireValid(
                TownFarmBuildings[
                    t.buildings.get(id)?.type
                ]?.kind==='field'&&
                f&&integer(f.age)&&
                (
                    f.crop===null||
                    own(TownFarmCrops,f.crop)
                ),
                'Invalid saved field'
            );

        }

        for(const [id,p] of w.farm.pens){

            const d=TownFarmBuildings[
                t.buildings.get(id)?.type
            ];

            requireValid(
                d?.kind==='pen'&&
                p&&integer(p.count)&&
                p.count<=d.capacity&&
                (
                    p.animal===null||
                    own(TownFarmAnimals,p.animal)
                )&&
                (!p.count||p.animal!==null),
                'Invalid livestock enclosure'
            );

        }

        for(const [id,f] of w.industry.factories){

            const b=t.buildings.get(id);

            requireValid(
                b&&own(TownIndustryBuildings,b.type)&&
                f&&integer(f.progress)&&
                integer(f.completed)&&
                typeof f.enabled==='boolean'&&
                (
                    f.recipe===null||
                    TownIndustryRecipes[f.recipe]?.factory===b.type
                ),
                'Invalid factory state'
            );

        }

        for(const [id,p] of w.economy.properties){

            const d=TownEconomyBuildings[
                t.buildings.get(id)?.type
            ];

            requireValid(
                d&&p&&integer(p.occupied)&&
                p.occupied<=(d.households||0)&&
                (
                    d.kind!=='retail'||
                    d.products.includes(p.stockProduct)
                ),
                'Invalid residential or retail state'
            );

        }

        for(const id of w.progression.researched){

            requireValid(
                own(TownResearchProjects,id),
                'Unknown completed research'
            );

        }

        const active=w.progression.active;

        if(active){

            requireValid(
                own(TownResearchProjects,active.id)&&
                integer(active.remaining)&&
                active.remaining>0&&
                active.remaining<=
                    TownResearchProjects[active.id].days&&
                !w.progression.researched.has(active.id),
                'Invalid active research'
            );

        }

        for(const id of w.progression.automation.keys()){

            requireValid(
                w.farm.fields.has(id),
                'Unknown automated field'
            );

        }

        for(const id of w.progression.achievements){

            requireValid(
                own(TownAchievements,id),
                'Unknown achievement'
            );

        }

        if(w.simulation){

            requireValid(
                [...w.simulation.knownHomes].every(exists)&&
                w.simulation.peoplePerHousehold>0,
                'Invalid population state'
            );

        }

        const land=w.landscaping;

        let maxHabitat=0;
        let maxAnimal=0;

        for(const [id,h] of land.habitats){

            requireValid(
                h&&integer(id)&&id>0&&h.id===id&&
                ['paddock','meadow','garden','pond'].includes(h.kind)&&
                integer(h.width)&&h.width>0&&
                integer(h.height)&&h.height>0&&
                t.inside(h.x,h.y)&&
                t.inside(
                    h.x+h.width-1,
                    h.y+h.height-1
                ),
                'Invalid animal habitat'
            );

            maxHabitat=Math.max(maxHabitat,id);

        }

        const animalTiles=new Set();

        for(const [id,a] of land.animals){

            const h=land.habitats.get(a?.habitat);
            const d=TownDecorativeAnimals[a?.type];

            requireValid(
                a&&integer(id)&&id>0&&a.id===id&&
                h&&d&&d.habitat===h.kind&&
                t.inside(a.x,a.y)&&
                land.validAnimalTile(h,a.x,a.y),
                'Invalid decorative animal'
            );

            const k=t.key(a.x,a.y);

            requireValid(
                !animalTiles.has(k),
                'Overlapping saved animals'
            );

            animalTiles.add(k);

            maxAnimal=Math.max(maxAnimal,id);

        }

        requireValid(
            land.nextHabitat>maxHabitat&&
            land.nextAnimal>maxAnimal,
            'Invalid wildlife ID counters'
        );

    }

}

// ==========================================
// MULTIPLE TOWN STORAGE
// ==========================================

class TownSaveStore {

    constructor(storage=localStorage,key=STORAGE_KEY){

        this.storage=storage;
        this.key=key;

    }

    read(){

        const raw=this.storage.getItem(this.key);

        if(raw===null)
            return {version:VERSION,towns:[]};

        const data=JSON.parse(raw);

        requireValid(
            data?.version===VERSION&&
            Array.isArray(data.towns)&&
            data.towns.every(r=>
                r&&typeof r.id==='string'&&
                typeof r.name==='string'&&
                typeof r.updated==='string'&&
                r.snapshot?.format===FORMAT
            ),
            'Save library is damaged or unsupported'
        );

        return data;

    }

    write(data){

        // Do not erase an existing save before writing.
        // If storage is full, setItem throws an error.

        this.storage.setItem(
            this.key,
            JSON.stringify(data)
        );

    }

    name(value){

        const name=String(value||'').trim();

        requireValid(
            name.length>=1&&name.length<=60,
            'Town name must contain 1–60 characters'
        );

        return name;

    }

    list(){

        return this.read().towns.map(r=>({
            id:r.id,
            name:r.name,
            created:r.created,
            updated:r.updated,
            ...r.snapshot.preview
        })).sort(
            (a,b)=>b.updated.localeCompare(a.updated)
        );

    }

    get(id){

        const r=this.read().towns.find(
            a=>a.id===id
        );

        requireValid(r,'Town not found');

        return r;

    }

    create(name,world){

        const data=this.read();

        const now=new Date().toISOString();

        const record={
            id:crypto.randomUUID(),
            name:this.name(name),
            created:now,
            updated:now,
            snapshot:TownSave.capture(world)
        };

        data.towns.push(record);

        this.write(data);

        return record.id;

    }

    save(id,world){

        const data=this.read();

        const r=data.towns.find(a=>a.id===id);

        requireValid(r,'Town not found');

        r.snapshot=TownSave.capture(world);

        r.updated=new Date().toISOString();

        this.write(data);

        return r.updated;

    }

    load(id){

        return TownSave.restore(
            this.get(id).snapshot
        );

    }

    rename(id,name){

        const data=this.read();

        const r=data.towns.find(a=>a.id===id);

        requireValid(r,'Town not found');

        r.name=this.name(name);

        this.write(data);

    }

    duplicate(id,name){

        const original=this.get(id);

        return this.create(
            name||(
                original.name.slice(0,53)+' (copy)'
            ),
            TownSave.restore(original.snapshot)
        );

    }

    remove(id){

        const data=this.read();

        requireValid(
            data.towns.some(a=>a.id===id),
            'Town not found'
        );

        data.towns=data.towns.filter(
            a=>a.id!==id
        );

        this.write(data);

    }

    exportTown(id){

        const r=this.get(id);

        return JSON.stringify({
            format:FORMAT,
            version:VERSION,
            name:r.name,
            snapshot:r.snapshot
        },null,2);

    }

    importTown(text){

        requireValid(
            typeof text==='string'&&text.length<=MAX_FILE,
            'Backup is too large'
        );

        const file=JSON.parse(text);

        requireValid(
            file?.format===FORMAT&&
            file.version===VERSION,
            'Unsupported backup file'
        );

        const name=this.name(file.name);

        // Validate and reconstruct before writing anything.

        const world=TownSave.restore(file.snapshot);

        // Import always creates a separate town.

        return this.create(name,world);

    }

}

window.TownSave=TownSave;
window.TownSaveStore=TownSaveStore;
window.TownSaveVersion=VERSION;

})();
