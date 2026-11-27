
/* ==========================================
   TOWN BUILDER V1.0
   INDUSTRY & MANUFACTURING ENGINE
   ========================================== */

(() => {

'use strict';

// ==========================================
// SHARED PRODUCT CATALOGUE
// Includes existing agricultural products
// ==========================================

const PRODUCTS = Object.freeze({

    ...TownFarmProducts,

    timber:       {name:'Timber',price:8,icon:'🪵'},
    planks:       {name:'Wooden planks',price:14,icon:'🪵'},
    furniture:    {name:'Furniture',price:65,icon:'🪑'},
    flour:        {name:'Flour',price:10,icon:'🌾'},
    bread:        {name:'Bread',price:22,icon:'🍞'},
    cakes:        {name:'Cakes',price:38,icon:'🍰'},
    cheese:       {name:'Cheese',price:30,icon:'🧀'},
    butter:       {name:'Butter',price:26,icon:'🧈'},
    yoghurt:      {name:'Yoghurt',price:17,icon:'🥛'},
    jam:          {name:'Jam',price:32,icon:'🫙'},
    cannedFood:   {name:'Canned food',price:24,icon:'🥫'},
    juice:        {name:'Fruit juice',price:22,icon:'🧃'},
    wine:         {name:'Wine',price:48,icon:'🍇'},
    oliveOil:     {name:'Olive oil',price:36,icon:'🫒'},
    sunflowerOil: {name:'Sunflower oil',price:25,icon:'🌻'},
    fabric:       {name:'Fabric',price:28,icon:'🧵'},
    clothing:     {name:'Clothing',price:65,icon:'👕'},
    clay:         {name:'Clay',price:5,icon:'🟫'},
    bricks:       {name:'Bricks',price:12,icon:'🧱'},
    stone:        {name:'Stone',price:6,icon:'🪨'},
    cement:       {name:'Cement',price:18,icon:'🏗️'},
    ironOre:      {name:'Iron ore',price:9,icon:'🪨'},
    coal:         {name:'Coal',price:5,icon:'⬛'},
    steel:        {name:'Steel',price:28,icon:'🔩'},
    silica:       {name:'Silica sand',price:5,icon:'⏳'},
    glass:        {name:'Glass',price:16,icon:'🪟'},
    paper:        {name:'Paper',price:12,icon:'📄'},
    books:        {name:'Books',price:35,icon:'📚'},
    fish:         {name:'Fish',price:9,icon:'🐟'},
    cannedFish:   {name:'Canned fish',price:24,icon:'🥫'},
    cocoa:        {name:'Cocoa',price:10,icon:'🌱'},
    chocolate:    {name:'Chocolate',price:32,icon:'🍫'},
    soap:         {name:'Soap',price:29,icon:'🧼'},
    perfume:      {name:'Perfume',price:65,icon:'🌸'},
    components:   {name:'Electronic components',price:25,icon:'🔌'},
    electronics:  {name:'Electronics',price:85,icon:'📱'}

});

// ==========================================
// FACTORY CATALOGUE
// ==========================================

const BUILDINGS = Object.freeze(Object.fromEntries([

    ['industryMill','Flour mill',2,2,450,'🌾'],
    ['industryBakery','Bakery',2,1,400,'🥖'],
    ['industryDairy','Dairy factory',2,2,650,'🧀'],
    ['industryFood','Food factory',3,2,900,'🥫'],
    ['industryDrinks','Beverage factory',2,2,650,'🧃'],
    ['industryWinery','Winery',2,2,750,'🍇'],
    ['industryOil','Oil press',2,2,600,'🫒'],
    ['industryTextile','Textile mill',3,2,850,'🧵'],
    ['industryClothing','Clothing factory',2,2,850,'👕'],
    ['industrySawmill','Sawmill',3,2,700,'🪵'],
    ['industryFurniture','Furniture factory',3,2,950,'🪑'],
    ['industryBrick','Brickworks',3,2,850,'🧱'],
    ['industryCement','Cement works',3,3,1100,'🏗️'],
    ['industrySteel','Steelworks',4,3,1800,'🔩'],
    ['industryGlass','Glassworks',3,2,950,'🪟'],
    ['industryPaper','Paper mill',3,2,850,'📄'],
    ['industryPrinting','Printing works',2,2,700,'📚'],
    ['industryFish','Fish cannery',3,2,850,'🐟'],
    ['industryChocolate','Chocolate factory',2,2,850,'🍫'],
    ['industrySoap','Soap factory',2,2,700,'🧼'],
    ['industryPerfume','Perfume factory',2,2,850,'🌸'],
    ['industryElectronics','Electronics factory',3,2,1500,'📱']

].map(([id,name,width,height,cost,icon])=>[

    id,

    Object.freeze({
        id,name,width,height,cost,icon
    })

])));

// ==========================================
// PRODUCTION RECIPES
// id, factory, name, processing days,
// inputs, outputs, operating cost
// ==========================================

const RECIPES = Object.freeze(Object.fromEntries([

    ['millWheat','industryMill','Mill wheat',
        1,{wheat:4},{flour:5},4],

    ['bakeBread','industryBakery','Bake bread',
        1,{flour:3},{bread:4},5],

    ['bakeCake','industryBakery','Bake cakes',
        2,{flour:3,eggs:2,milk:1},{cakes:4},7],

    ['makeCheese','industryDairy','Make cheese',
        2,{milk:4},{cheese:3},5],

    ['makeButter','industryDairy','Make butter',
        1,{milk:3},{butter:2},4],

    ['makeYoghurt','industryDairy','Make yoghurt',
        1,{milk:3},{yoghurt:4},4],

    ['makeGoatCheese','industryDairy','Goat cheese',
        2,{goatMilk:4},{cheese:4},6],

    ['makeJam','industryFood','Strawberry jam',
        2,{strawberry:4},{jam:3},6],

    ['blueberryJam','industryFood','Blueberry jam',
        2,{blueberry:4},{jam:4},6],

    ['canVegetables','industryFood','Can vegetables',
        1,{carrot:3,cabbage:2},{cannedFood:4},5],

    ['appleJuice','industryDrinks','Apple juice',
        1,{apple:4},{juice:4},4],

    ['lemonJuice','industryDrinks','Lemon juice',
        1,{lemon:4},{juice:5},4],

    ['makeWine','industryWinery','Make wine',
        3,{grape:4},{wine:3},8],

    ['pressOlives','industryOil','Press olive oil',
        2,{olive:4},{oliveOil:4},6],

    ['pressSunflowers','industryOil','Sunflower oil',
        1,{sunflower:4},{sunflowerOil:3},4],

    ['weaveWool','industryTextile','Weave fabric',
        1,{wool:3},{fabric:3},5],

    ['makeClothes','industryClothing','Make clothing',
        2,{fabric:3},{clothing:3},8],

    ['sawTimber','industrySawmill','Saw timber',
        1,{timber:4},{planks:6},5],

    ['makeFurniture','industryFurniture','Make furniture',
        2,{planks:5},{furniture:3},8],

    ['makeBricks','industryBrick','Fire bricks',
        1,{clay:5,coal:1},{bricks:5},5],

    ['makeCement','industryCement','Make cement',
        2,{stone:5,coal:2},{cement:4},8],

    ['makeSteel','industrySteel','Smelt steel',
        2,{ironOre:4,coal:2},{steel:4},10],

    ['makeGlass','industryGlass','Make glass',
        1,{silica:5,coal:1},{glass:5},6],

    ['makePaper','industryPaper','Make paper',
        1,{timber:3},{paper:5},5],

    ['printBooks','industryPrinting','Print books',
        2,{paper:4},{books:3},6],

    ['canFish','industryFish','Can fish',
        1,{fish:4},{cannedFish:4},5],

    ['makeChocolate','industryChocolate','Make chocolate',
        2,{cocoa:4,milk:2},{chocolate:5},7],

    ['makeSoap','industrySoap','Make soap',
        1,{oliveOil:2,herbs:1},{soap:4},5],

    ['makePerfume','industryPerfume','Make perfume',
        2,{lavender:3,glass:1},{perfume:3},8],

    ['makeElectronics','industryElectronics','Assemble electronics',
        2,{components:4,steel:2},{electronics:3},12]

].map(([id,factory,name,days,inputs,outputs,cost])=>[

    id,

    Object.freeze({

        id,factory,name,days,

        inputs:Object.freeze(inputs),

        outputs:Object.freeze(outputs),

        cost

    })

])));

// ==========================================
// INDUSTRY ENGINE
// ==========================================

class TownIndustry {

    constructor(town,farm) {

        if (farm.town!==town) {

            throw new Error(
                'Industry must share the farming world'
            );

        }

        this.town=town;
        this.farm=farm;

        this.factories=new Map();

        this.revenue=0;
        this.expenses=0;
        this.completed=0;

        for (const [id,d] of Object.entries(BUILDINGS)) {

            if (!town.catalogue.has(id)) {

                town.register(id,d);

            }

        }

    }

    fail(reason) {

        return {ok:false,reason};

    }

    // ==========================================
    // FIND EXISTING FACTORIES
    // ==========================================

    sync() {

        for (const b of this.town.buildings.values()) {

            if (

                Object.hasOwn(BUILDINGS,b.type) &&

                !this.factories.has(b.id)

            ) {

                this.factories.set(b.id,{

                    recipe:null,

                    progress:0,

                    enabled:false,

                    completed:0,

                    status:'Choose a recipe'

                });

            }

        }

        for (const id of this.factories.keys()) {

            if (!this.town.buildings.has(id)) {

                this.factories.delete(id);

            }

        }

    }

    recipesFor(id) {

        const b=this.town.buildings.get(id);

        if (!b) return [];

        return Object.values(RECIPES).filter(

            r=>r.factory===b.type

        );

    }

    // ==========================================
    // CONFIGURE FACTORY PRODUCTION
    // ==========================================

    configure(id,recipe) {

        this.sync();

        const f=this.factories.get(id);

        const b=this.town.buildings.get(id);

        const r=RECIPES[recipe];

        if (!f || !b || !r || r.factory!==b.type) {

            return this.fail('Invalid factory recipe');

        }

        if (f.recipe!==recipe) {

            f.progress=0;

        }

        f.recipe=recipe;

        f.enabled=true;

        f.status='Production scheduled';

        return {ok:true};

    }

    setRunning(id,running) {

        this.sync();

        const f=this.factories.get(id);

        if (!f?.recipe) {

            return this.fail('Choose a recipe first');

        }

        f.enabled=!!running;

        f.status=f.enabled

            ? 'Production scheduled'

            : 'Paused';

        return {ok:true};

    }

    // ==========================================
    // SHARED INVENTORY
    // ==========================================

    amount(product) {

        return this.farm.amount(product);

    }

    add(product,quantity) {

        if (

            !Object.hasOwn(PRODUCTS,product) ||

            !Number.isSafeInteger(quantity) ||

            quantity<1 ||

            quantity>this.farm.freeSpace()

        ) return false;

        this.farm.stock.set(

            product,

            this.amount(product)+quantity

        );

        return true;

    }

    // ==========================================
    // IMPORT GOODS
    // ==========================================

    importPrice(product) {

        const d=PRODUCTS[product];

        return d

            ? Math.ceil(d.price*1.25)+1

            : 0;

    }

    buy(product,quantity) {

        if (

            !Object.hasOwn(PRODUCTS,product) ||

            !Number.isSafeInteger(quantity) ||

            quantity<1 || quantity>10000

        ) {

            return this.fail('Invalid import order');

        }

        const cost=this.importPrice(product)*quantity;

        if (cost>this.town.cash) {

            return this.fail('Insufficient funds');

        }

        if (!this.add(product,quantity)) {

            return this.fail('Not enough storage');

        }

        this.town.cash-=cost;

        this.expenses+=cost;

        this.farm.note(

            'Imported '+quantity+' '+

            PRODUCTS[product].name+' for £'+cost+'.'

        );

        return {ok:true,cost};

    }

    // ==========================================
    // SELL RAW OR MANUFACTURED GOODS
    // ==========================================

    sell(product,quantity) {

        if (

            !Object.hasOwn(PRODUCTS,product) ||

            !this.farm.withdraw(product,quantity)

        ) {

            return this.fail('Not enough stock');

        }

        const income=PRODUCTS[product].price*quantity;

        this.town.cash+=income;

        this.revenue+=income;

        this.farm.note(

            'Sold '+quantity+' '+

            PRODUCTS[product].name+' for £'+income+'.'

        );

        return {ok:true,income};

    }

    // ==========================================
    // VALIDATE PRODUCTION BATCH
    // ==========================================

    check(recipe) {

        const r=RECIPES[recipe];

        if (!r) return this.fail('Choose a recipe');

        for (const [id,n] of Object.entries(r.inputs)) {

            if (this.amount(id)<n) {

                return this.fail(

                    'Needs '+(n-this.amount(id))+

                    ' more '+PRODUCTS[id].name

                );

            }

        }

        if (this.town.cash<r.cost) {

            return this.fail('Insufficient operating funds');

        }

        const inputTotal=Object.values(r.inputs)

            .reduce((a,b)=>a+b,0);

        const outputTotal=Object.values(r.outputs)

            .reduce((a,b)=>a+b,0);

        if (

            this.farm.used()-inputTotal+outputTotal>

            this.farm.capacity()

        ) {

            return this.fail('Storage full');

        }

        return {ok:true};

    }

    // ==========================================
    // PRODUCTION SIMULATION
    // ==========================================

    tick() {

        this.sync();

        const entries=[...this.factories.entries()]

            .sort((a,b)=>a[0]-b[0]);

        for (const [id,f] of entries) {

            if (!f.recipe || !f.enabled) continue;

            const r=RECIPES[f.recipe];

            const check=this.check(f.recipe);

            if (!check.ok) {

                f.status=check.reason;

                continue;

            }

            f.progress++;

            if (f.progress<r.days) {

                f.status=

                    'Processing '+f.progress+

                    '/'+r.days+' days';

                continue;

            }

            // All requirements checked before changing stock.

            for (const [product,n] of Object.entries(r.inputs)) {

                this.farm.withdraw(product,n);

            }

            for (const [product,n] of Object.entries(r.outputs)) {

                this.farm.stock.set(

                    product,

                    this.amount(product)+n

                );

            }

            this.town.cash-=r.cost;

            this.expenses+=r.cost;

            this.completed++;

            f.completed++;

            f.progress=0;

            f.status='Batch completed';

            this.farm.note(

                BUILDINGS[

                    this.town.buildings.get(id).type

                ].name+': '+r.name+' completed.'

            );

        }

    }

    // ==========================================
    // SHARED FARMING & INDUSTRY CLOCK
    // ==========================================

    advance(days=1) {

        if (

            !Number.isSafeInteger(days) ||

            days<1 || days>365

        ) {

            return this.fail('Invalid number of days');

        }

        for (let i=0;i<days;i++) {

            this.farm.advance(1);

            this.tick();

        }

        return {

            ok:true,

            day:this.farm.day

        };

    }

}

window.TownIndustry=TownIndustry;

window.TownIndustryProducts=PRODUCTS;

window.TownIndustryBuildings=BUILDINGS;

window.TownIndustryRecipes=RECIPES;

})();
