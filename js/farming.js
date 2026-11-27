
/* ==========================================
   TOWN BUILDER V1.0
   FARMING, LIVESTOCK & PRODUCE STORAGE
   ========================================== */

(() => {

'use strict';

// ==========================================
// CROP CATALOGUE
// Name, growing days, planting cost per tile,
// harvest yield per tile, selling price per unit
// ==========================================

const CROPS = Object.freeze(Object.fromEntries([

    ['wheat','Wheat',3,2,6,5,'🌾'],
    ['corn','Corn',4,3,7,7,'🌽'],
    ['barley','Barley',3,2,5,5,'🌾'],
    ['oats','Oats',3,2,5,5,'🌾'],
    ['potato','Potatoes',3,3,7,6,'🥔'],
    ['carrot','Carrots',2,3,5,7,'🥕'],
    ['cabbage','Cabbages',3,3,5,7,'🥬'],
    ['strawberry','Strawberries',3,5,4,13,'🍓'],
    ['blueberry','Blueberries',4,5,5,14,'🫐'],
    ['tomato','Tomatoes',3,4,6,9,'🍅'],
    ['pumpkin','Pumpkins',4,5,4,15,'🎃'],
    ['sunflower','Sunflowers',4,4,5,9,'🌻'],
    ['lavender','Lavender',5,5,4,18,'🪻'],
    ['herbs','Herbs',2,3,4,10,'🌿'],
    ['grape','Grapes',5,6,5,16,'🍇'],
    ['olive','Olives',6,6,6,15,'🫒'],
    ['apple','Apples',5,5,6,11,'🍎'],
    ['lemon','Lemons',5,5,5,13,'🍋']

].map(([

    id,name,days,seedCost,yieldPerTile,price,icon

]) => [

    id,

    Object.freeze({

        id,name,days,seedCost,
        yieldPerTile,price,icon

    })

])));

// ==========================================
// LIVESTOCK CATALOGUE
// ==========================================

const ANIMALS = Object.freeze(Object.fromEntries([

    ['chicken','Chickens',20,1,'eggs',2,'🐔'],
    ['cow','Cows',100,3,'milk',3,'🐄'],
    ['sheep','Sheep',65,2,'wool',2,'🐑'],
    ['goat','Goats',50,2,'goatMilk',3,'🐐'],
    ['pig','Pigs',55,2,'manure',4,'🐖'],
    ['duck','Ducks',25,1,'duckEggs',2,'🦆']

].map(([

    id,name,cost,feed,product,yieldPerDay,icon

]) => [

    id,

    Object.freeze({

        id,name,cost,feed,product,
        yieldPerDay,icon

    })

])));

// ==========================================
// PRODUCT CATALOGUE
// ==========================================

const PRODUCTS = Object.freeze({

    ...Object.fromEntries(

        Object.values(CROPS).map(c=>[

            c.id,

            {

                name:c.name,

                price:c.price,

                icon:c.icon

            }

        ])

    ),

    feed:{

        name:'Animal feed',
        price:2,
        icon:'🌾'

    },

    eggs:{

        name:'Eggs',
        price:8,
        icon:'🥚'

    },

    milk:{

        name:'Milk',
        price:10,
        icon:'🥛'

    },

    wool:{

        name:'Wool',
        price:14,
        icon:'🧶'

    },

    goatMilk:{

        name:'Goat milk',
        price:12,
        icon:'🥛'

    },

    manure:{

        name:'Manure',
        price:3,
        icon:'🌱'

    },

    duckEggs:{

        name:'Duck eggs',
        price:10,
        icon:'🥚'

    }

});

// ==========================================
// AGRICULTURAL BUILDINGS
// ==========================================

const BUILDINGS = Object.freeze({

    farmField:{

        name:'Small field',
        width:2,
        height:2,
        cost:120,
        kind:'field',
        surfaces:['grass','soil']

    },

    largeField:{

        name:'Large field',
        width:3,
        height:3,
        cost:250,
        kind:'field',
        surfaces:['grass','soil']

    },

    greenhouse:{

        name:'Greenhouse',
        width:2,
        height:2,
        cost:450,
        kind:'field',
        surfaces:['grass','soil','paving']

    },

    animalPen:{

        name:'Livestock enclosure',
        width:3,
        height:2,
        cost:300,
        kind:'pen',
        capacity:6,
        surfaces:['grass','soil']

    },

    farmBarn:{

        name:'Storage barn',
        width:2,
        height:2,
        cost:400,
        kind:'storage',
        capacity:150

    },

    grainSilo:{

        name:'Grain silo',
        width:1,
        height:1,
        cost:300,
        kind:'storage',
        capacity:100

    },

    farmWarehouse:{

        name:'Farm warehouse',
        width:3,
        height:2,
        cost:700,
        kind:'storage',
        capacity:350

    }

});

class TownFarming {

    constructor(town) {

        this.town=town;

        this.day=1;

        this.fields=new Map();

        this.pens=new Map();

        this.stock=new Map();

        this.baseStorage=60;

        this.revenue=0;

        this.expenses=0;

        this.messages=[];

        for (

            const [id,d] of
            Object.entries(BUILDINGS)

        ) {

            if (!town.catalogue.has(id)) {

                town.register(id,d);

            }

        }

    }

    // ==========================================
    // GENERAL HELPERS
    // ==========================================

    fail(reason) {

        return {ok:false,reason};

    }

    note(message) {

        this.messages.unshift(

            'Day '+this.day+': '+message

        );

        this.messages.length=Math.min(

            this.messages.length,30

        );

    }

    sync() {

        for (const b of this.town.buildings.values()) {

            const d=BUILDINGS[b.type];

            if (

                d?.kind==='field' &&

                !this.fields.has(b.id)

            ) {

                this.fields.set(b.id,{

                    crop:null,

                    age:0

                });

            }

            if (

                d?.kind==='pen' &&

                !this.pens.has(b.id)

            ) {

                this.pens.set(b.id,{

                    animal:null,

                    count:0,

                    status:'Empty enclosure'

                });

            }

        }

        for (const id of this.fields.keys()) {

            if (!this.town.buildings.has(id)) {

                this.fields.delete(id);

            }

        }

        for (const id of this.pens.keys()) {

            if (!this.town.buildings.has(id)) {

                this.pens.delete(id);

            }

        }

    }

    // ==========================================
    // STORAGE & INVENTORY
    // ==========================================

    capacity() {

        let n=this.baseStorage;

        for (const b of this.town.buildings.values()) {

            const d=BUILDINGS[b.type];

            if (d?.kind==='storage') {

                n+=d.capacity;

            }

        }

        return n;

    }

    used() {

        return [...this.stock.values()]

            .reduce((a,b)=>a+b,0);

    }

    amount(product) {

        return this.stock.get(product)||0;

    }

    freeSpace() {

        return Math.max(

            0,this.capacity()-this.used()

        );

    }

    deposit(product,quantity) {

        if (

            !PRODUCTS[product] ||

            !Number.isSafeInteger(quantity) ||

            quantity<=0 ||

            quantity>this.freeSpace()

        ) return false;

        this.stock.set(

            product,

            this.amount(product)+quantity

        );

        return true;

    }

    withdraw(product,quantity) {

        if (

            !Number.isSafeInteger(quantity) ||

            quantity<=0 ||

            quantity>this.amount(product)

        ) return false;

        const left=this.amount(product)-quantity;

        if (left) {

            this.stock.set(product,left);

        } else {

            this.stock.delete(product);

        }

        return true;

    }

    // ==========================================
    // PLANT CROPS
    // ==========================================

    plant(id,crop) {

        this.sync();

        const field=this.fields.get(id);

        const b=this.town.buildings.get(id);

        const c=CROPS[crop];

        if (!field || !b || !c) {

            return this.fail('Invalid field or crop');

        }

        if (field.crop) {

            return this.fail('Field already planted');

        }

        const cost=c.seedCost*b.width*b.height;

        if (this.town.cash<cost) {

            return this.fail('Insufficient funds');

        }

        this.town.cash-=cost;

        this.expenses+=cost;

        field.crop=crop;

        field.age=0;

        this.note(c.name+' planted.');

        return {ok:true,cost};

    }

    // ==========================================
    // CROP GROWTH STAGES
    // ==========================================

    growingDays(id) {

        const f=this.fields.get(id);

        const b=this.town.buildings.get(id);

        if (!f?.crop || !b) return 0;

        const days=CROPS[f.crop].days;

        return b.type==='greenhouse'

            ? Math.max(1,days-1)

            : days;

    }

    stage(id) {

        const f=this.fields.get(id);

        if (!f?.crop) return 'Empty';

        const progress=f.age/this.growingDays(id);

        if (progress>=1) return 'Ready to harvest';

        if (progress>=.66) return 'Maturing';

        if (progress>=.33) return 'Growing';

        return 'Planted';

    }

    // ==========================================
    // HARVEST PRODUCE
    // ==========================================

    harvest(id) {

        this.sync();

        const f=this.fields.get(id);

        const b=this.town.buildings.get(id);

        if (!f?.crop || !b) {

            return this.fail('Nothing planted');

        }

        if (f.age<this.growingDays(id)) {

            return this.fail('Crop is not ready');

        }

        const c=CROPS[f.crop];

        const quantity=

            c.yieldPerTile*b.width*b.height;

        if (!this.deposit(f.crop,quantity)) {

            return this.fail(

                'Not enough storage space'

            );

        }

        this.note(

            'Harvested '+quantity+

            ' units of '+c.name+'.'

        );

        f.crop=null;

        f.age=0;

        return {ok:true,quantity};

    }

    // ==========================================
    // PURCHASE LIVESTOCK
    // ==========================================

    buyAnimals(id,animal,quantity=1) {

        this.sync();

        const p=this.pens.get(id);

        const b=this.town.buildings.get(id);

        const a=ANIMALS[animal];

        if (

            !p || !a || !b ||

            !Number.isSafeInteger(quantity) ||

            quantity<1

        ) {

            return this.fail('Invalid livestock order');

        }

        if (p.count && p.animal!==animal) {

            return this.fail(

                'This enclosure holds another species'

            );

        }

        if (

            p.count+quantity>

            BUILDINGS[b.type].capacity

        ) {

            return this.fail('Enclosure is full');

        }

        const cost=quantity*a.cost;

        if (this.town.cash<cost) {

            return this.fail('Insufficient funds');

        }

        this.town.cash-=cost;

        this.expenses+=cost;

        p.animal=animal;

        p.count+=quantity;

        p.status='Awaiting next farming day';

        this.note(

            quantity+' '+a.name+' purchased.'

        );

        return {ok:true,cost};

    }

    // ==========================================
    // SELL LIVESTOCK
    // ==========================================

    sellAnimals(id,quantity=1) {

        this.sync();

        const p=this.pens.get(id);

        if (

            !p?.animal ||

            !Number.isSafeInteger(quantity) ||

            quantity<1 ||

            quantity>p.count

        ) {

            return this.fail('Invalid livestock sale');

        }

        const a=ANIMALS[p.animal];

        const income=

            Math.floor(a.cost*.75)*quantity;

        this.town.cash+=income;

        this.revenue+=income;

        p.count-=quantity;

        if (!p.count) {

            p.animal=null;

            p.status='Empty enclosure';

        }

        this.note(

            'Sold '+quantity+' '+a.name+

            ' for £'+income+'.'

        );

        return {ok:true,income};

    }

    // ==========================================
    // BUY OR MAKE ANIMAL FEED
    // ==========================================

    buyFeed(quantity=10) {

        if (

            !Number.isSafeInteger(quantity) ||

            quantity<1

        ) {

            return this.fail('Invalid feed quantity');

        }

        const cost=quantity*3;

        if (this.town.cash<cost) {

            return this.fail('Insufficient funds');

        }

        if (!this.deposit('feed',quantity)) {

            return this.fail('Not enough storage space');

        }

        this.town.cash-=cost;

        this.expenses+=cost;

        this.note('Purchased '+quantity+' animal feed.');

        return {ok:true,cost};

    }

    makeFeed(quantity=10) {

        if (

            !Number.isSafeInteger(quantity) ||

            quantity<1

        ) {

            return this.fail('Invalid feed quantity');

        }

        if (this.amount('wheat')<quantity) {

            return this.fail('Not enough wheat');

        }

        this.withdraw('wheat',quantity);

        this.stock.set(

            'feed',

            this.amount('feed')+quantity

        );

        this.note(

            quantity+' wheat converted into feed.'

        );

        return {ok:true};

    }

    // ==========================================
    // DAILY SIMULATION
    // ==========================================

    advance(days=1) {

        if (

            !Number.isSafeInteger(days) ||

            days<1 ||

            days>365

        ) {

            return this.fail('Invalid number of days');

        }

        this.sync();

        for (let i=0;i<days;i++) {

            this.day++;

            // Grow planted crops

            for (const [id,f] of this.fields) {

                if (!f.crop) continue;

                const required=this.growingDays(id);

                if (f.age<required) {

                    f.age++;

                    if (f.age===required) {

                        this.note(

                            CROPS[f.crop].name+

                            ' ready to harvest.'

                        );

                    }

                }

            }

            // Collect livestock products

            for (const p of this.pens.values()) {

                if (!p.animal || !p.count) continue;

                const a=ANIMALS[p.animal];

                const feed=a.feed*p.count;

                const output=a.yieldPerDay*p.count;

                if (this.amount('feed')<feed) {

                    p.status='Needs animal feed';

                    continue;

                }

                if (

                    this.used()-feed+output>

                    this.capacity()

                ) {

                    p.status='Storage full';

                    continue;

                }

                this.withdraw('feed',feed);

                this.deposit(a.product,output);

                p.status=

                    'Produced '+output+' '+

                    PRODUCTS[a.product].name;

                this.note(p.status+'.');

            }

        }

        return {ok:true,day:this.day};

    }

    // ==========================================
    // SELL PRODUCE
    // ==========================================

    sell(product,quantity) {

        const d=PRODUCTS[product];

        if (!d || !this.withdraw(product,quantity)) {

            return this.fail('Not enough produce');

        }

        const income=d.price*quantity;

        this.town.cash+=income;

        this.revenue+=income;

        this.note(

            'Sold '+quantity+' '+d.name+

            ' for £'+income+'.'

        );

        return {ok:true,income};

    }

    // ==========================================
    // SAFE AGRICULTURAL DEMOLITION
    // ==========================================

    canRemove(id) {

        this.sync();

        const b=this.town.buildings.get(id);

        if (!b) return this.fail('Building not found');

        const d=BUILDINGS[b.type];

        if (this.fields.get(id)?.crop) {

            return this.fail('Harvest the field first');

        }

        if (this.pens.get(id)?.count) {

            return this.fail('Sell the livestock first');

        }

        if (

            d?.kind==='storage' &&

            this.used()>

            this.capacity()-d.capacity

        ) {

            return this.fail(

                'Sell or transfer stored goods first'

            );

        }

        return {ok:true};

    }

}

window.TownFarming=TownFarming;

window.TownFarmCrops=CROPS;

window.TownFarmAnimals=ANIMALS;

window.TownFarmProducts=PRODUCTS;

window.TownFarmBuildings=BUILDINGS;

})();
