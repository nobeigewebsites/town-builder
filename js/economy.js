
/* ==========================================
   TOWN BUILDER V1.0
   ECONOMY, COMMERCE & TRADE ENGINE
   ========================================== */

(() => {

'use strict';

const PRODUCTS = TownIndustryProducts;

// ==========================================
// ECONOMIC BUILDING CATALOGUE
// ==========================================

const BUILDINGS = Object.freeze({

    econCottage: {
        name:'Country cottage',
        icon:'🏡',
        width:1,height:1,cost:250,
        kind:'housing',
        households:1,
        rent:12,
        earnings:40,
        upkeep:2
    },

    econFamilyHome: {
        name:'Family home',
        icon:'🏠',
        width:2,height:1,cost:450,
        kind:'housing',
        households:2,
        rent:15,
        earnings:50,
        upkeep:4
    },

    econApartments: {
        name:'Apartments',
        icon:'🏢',
        width:2,height:2,cost:1200,
        kind:'housing',
        households:8,
        rent:10,
        earnings:45,
        upkeep:12
    },

    econManor: {
        name:'Country manor',
        icon:'🏰',
        width:3,height:2,cost:1800,
        kind:'housing',
        households:1,
        rent:55,
        earnings:150,
        upkeep:15
    },

    econGrocer: {
        name:'Grocery shop',
        icon:'🏪',
        width:2,height:1,cost:400,
        kind:'retail',
        salesCapacity:8,
        upkeep:5,
        products:[
            'bread','milk','eggs','cheese',
            'carrot','potato','apple','jam',
            'cabbage','tomato'
        ]
    },

    econClothingShop: {
        name:'Clothing shop',
        icon:'👕',
        width:2,height:1,cost:500,
        kind:'retail',
        salesCapacity:4,
        upkeep:6,
        products:['clothing','fabric']
    },

    econFurnitureShop: {
        name:'Furniture shop',
        icon:'🪑',
        width:2,height:2,cost:650,
        kind:'retail',
        salesCapacity:3,
        upkeep:8,
        products:['furniture']
    },

    econBookshop: {
        name:'Bookshop',
        icon:'📚',
        width:1,height:1,cost:300,
        kind:'retail',
        salesCapacity:5,
        upkeep:4,
        products:['books']
    },

    econElectronicsShop: {
        name:'Electronics shop',
        icon:'📱',
        width:2,height:1,cost:650,
        kind:'retail',
        salesCapacity:3,
        upkeep:8,
        products:['electronics']
    },

    econCafe: {
        name:'Village café',
        icon:'☕',
        width:1,height:1,cost:350,
        kind:'business',
        turnover:120,
        upkeep:3
    },

    econRestaurant: {
        name:'Restaurant',
        icon:'🍽️',
        width:2,height:2,cost:750,
        kind:'business',
        turnover:250,
        upkeep:6
    },

    econHotel: {
        name:'Hotel',
        icon:'🏨',
        width:3,height:2,cost:1500,
        kind:'business',
        turnover:450,
        upkeep:10
    },

    econMarket: {
        name:'Market square',
        icon:'🛍️',
        width:3,height:2,cost:500,
        kind:'business',
        turnover:180,
        upkeep:5
    },

    econSolar: {
        name:'Solar power station',
        icon:'☀️',
        width:2,height:2,cost:700,
        kind:'utility',
        upkeep:18
    },

    econWater: {
        name:'Water tower',
        icon:'💧',
        width:1,height:2,cost:500,
        kind:'utility',
        upkeep:12
    },

    econSewage: {
        name:'Sewage treatment',
        icon:'⚙️',
        width:2,height:2,cost:850,
        kind:'utility',
        upkeep:20
    },

    econLandfill: {
        name:'Landfill',
        icon:'♻️',
        width:3,height:2,cost:600,
        kind:'utility',
        upkeep:15
    },

    econCouncil: {
        name:'Council office',
        icon:'🏛️',
        width:2,height:2,cost:600,
        kind:'public',
        upkeep:12
    },

    econSchool: {
        name:'Primary school',
        icon:'🏫',
        width:3,height:2,cost:900,
        kind:'public',
        upkeep:18
    },

    econClinic: {
        name:'Medical clinic',
        icon:'🏥',
        width:2,height:2,cost:800,
        kind:'public',
        upkeep:15
    },

    econPolice: {
        name:'Police station',
        icon:'🚓',
        width:2,height:2,cost:750,
        kind:'public',
        upkeep:15
    },

    econFire: {
        name:'Fire station',
        icon:'🚒',
        width:2,height:2,cost:800,
        kind:'public',
        upkeep:15
    }

});

// ==========================================
// OPTIONAL TRADE CONTRACTS
// ==========================================

const CONTRACTS = Object.freeze({

    wheatOrder:{
        name:'Regional grain supplier',
        product:'wheat',
        quantity:30,
        reward:260,
        days:7
    },

    breadOrder:{
        name:'Neighbouring town bakery',
        product:'bread',
        quantity:20,
        reward:720,
        days:10
    },

    cheeseOrder:{
        name:'Regional food market',
        product:'cheese',
        quantity:15,
        reward:750,
        days:10
    },

    furnitureOrder:{
        name:'Furniture retailer',
        product:'furniture',
        quantity:10,
        reward:1100,
        days:12
    },

    clothingOrder:{
        name:'Clothing distributor',
        product:'clothing',
        quantity:12,
        reward:1250,
        days:12
    },

    jamOrder:{
        name:'Farm shop supplier',
        product:'jam',
        quantity:15,
        reward:800,
        days:10
    }

});

// ==========================================
// ECONOMY ENGINE
// ==========================================

class TownEconomy {

    constructor(town,farm,industry) {

        if (

            farm.town!==town ||

            industry.town!==town ||

            industry.farm!==farm

        ) {

            throw new Error(
                'Economy requires a shared town and inventory'
            );

        }

        this.town=town;
        this.farm=farm;
        this.industry=industry;

        this.householdTax=10;
        this.businessTax=15;

        this.properties=new Map();

        this.arrears=0;

        this.history=[];

        this.last=null;

        this.contractRevenue=0;

        this.contracts=new Map(

            Object.keys(CONTRACTS).map(id=>[

                id,

                {
                    status:'available',
                    deadline:null
                }

            ])

        );

        for (const [id,d] of Object.entries(BUILDINGS)) {

            if (!town.catalogue.has(id)) {

                town.register(id,d);

            }

        }

        this.sync();

    }

    fail(reason) {

        return {ok:false,reason};

    }

    // ==========================================
    // REGISTER NEWLY CONSTRUCTED PROPERTIES
    // ==========================================

    sync() {

        for (const b of this.town.buildings.values()) {

            const d=BUILDINGS[b.type];

            if (!Object.hasOwn(BUILDINGS,b.type)) {

                continue;

            }

            if (!this.properties.has(b.id)) {

                this.properties.set(b.id,{

                    occupied:d.households||0,

                    stockProduct:d.products?.[0]||null,

                    soldToday:0,

                    incomeToday:0

                });

            }

        }

        for (const id of this.properties.keys()) {

            if (!this.town.buildings.has(id)) {

                this.properties.delete(id);

            }

        }

    }

    // ==========================================
    // TAXATION
    // ==========================================

    setTaxes(household,business) {

        if (

            ![household,business].every(

                n=>Number.isInteger(n) && n>=0 && n<=30

            )

        ) {

            return this.fail(
                'Tax rates must be between 0 and 30%'
            );

        }

        this.householdTax=household;

        this.businessTax=business;

        return {ok:true};

    }

    // ==========================================
    // RESIDENTIAL OCCUPANCY
    // ==========================================

    setOccupancy(id,quantity) {

        this.sync();

        const b=this.town.buildings.get(id);

        const d=BUILDINGS[b?.type];

        const p=this.properties.get(id);

        if (

            !p ||

            d?.kind!=='housing' ||

            !Number.isInteger(quantity) ||

            quantity<0 ||

            quantity>d.households

        ) {

            return this.fail('Invalid occupancy');

        }

        p.occupied=quantity;

        return {ok:true};

    }

    households() {

        this.sync();

        let count=0;

        for (const p of this.properties.values()) {

            count+=p.occupied;

        }

        return count;

    }

    // ==========================================
    // RETAIL MANAGEMENT
    // ==========================================

    setStock(id,product) {

        this.sync();

        const b=this.town.buildings.get(id);

        const d=BUILDINGS[b?.type];

        const p=this.properties.get(id);

        if (

            !p ||

            d?.kind!=='retail' ||

            !d.products.includes(product)

        ) {

            return this.fail(
                'This shop cannot sell that product'
            );

        }

        p.stockProduct=product;

        return {ok:true};

    }

    retailPrice(product) {

        return Object.hasOwn(PRODUCTS,product)

            ? Math.ceil(PRODUCTS[product].price*1.45)

            : 0;

    }

    // ==========================================
    // PAY OUTSTANDING COUNCIL BILLS
    // ==========================================

    payBills() {

        const amount=Math.min(

            this.arrears,

            Math.max(0,this.town.cash)

        );

        this.town.cash-=amount;

        this.arrears-=amount;

        return amount;

    }

    // ==========================================
    // DAILY ECONOMIC SIMULATION
    // ==========================================

    calculateDay() {

        this.sync();

        const households=this.households();

        // Each household creates basic retail demand.

        let retailDemand=households*2;

        const report={

            day:this.farm.day,

            households,

            rent:0,

            householdTax:0,

            businessTax:0,

            retail:0,

            maintenance:0,

            paid:0,

            arrears:0,

            income:0,

            operatingNet:0

        };

        const entries=[...this.properties.entries()]

            .sort((a,b)=>a[0]-b[0]);

        for (const [id,p] of entries) {

            const b=this.town.buildings.get(id);

            const d=BUILDINGS[b.type];

            p.soldToday=0;

            p.incomeToday=0;

            report.maintenance+=d.upkeep||0;

            // RESIDENTIAL RENT AND TAXATION

            if (d.kind==='housing') {

                const rent=p.occupied*d.rent;

                const tax=Math.floor(

                    p.occupied*d.earnings*

                    this.householdTax/100

                );

                report.rent+=rent;

                report.householdTax+=tax;

                p.incomeToday=rent+tax;

            }

            // TAX FROM PRIVATE BUSINESSES

            else if (d.kind==='business') {

                const turnover=Math.min(

                    d.turnover,

                    households*8

                );

                const tax=Math.floor(

                    turnover*this.businessTax/100

                );

                report.businessTax+=tax;

                p.incomeToday=tax;

            }

            // TOWN-OWNED RETAIL SALES

            else if (d.kind==='retail') {

                const product=p.stockProduct;

                const quantity=Math.min(

                    d.salesCapacity,

                    retailDemand,

                    this.industry.amount(product)

                );

                if (

                    quantity>0 &&

                    this.farm.withdraw(product,quantity)

                ) {

                    const income=

                        quantity*this.retailPrice(product);

                    report.retail+=income;

                    p.soldToday=quantity;

                    p.incomeToday=income;

                    retailDemand-=quantity;

                }

            }

        }

        report.income=

            report.rent+

            report.householdTax+

            report.businessTax+

            report.retail;

        this.town.cash+=report.income;

        this.arrears+=report.maintenance;

        report.paid=this.payBills();

        report.arrears=this.arrears;

        report.operatingNet=

            report.income-report.maintenance;

        return report;

    }

    // ==========================================
    // ACCEPT A TRADE CONTRACT
    // ==========================================

    acceptContract(id) {

        const d=CONTRACTS[id];

        const c=this.contracts.get(id);

        if (!d || c?.status!=='available') {

            return this.fail('Contract unavailable');

        }

        c.status='active';

        c.deadline=this.farm.day+d.days;

        this.farm.note(

            'Accepted trade contract: '+d.name+'.'

        );

        return {ok:true,deadline:c.deadline};

    }

    // ==========================================
    // DELIVER A TRADE CONTRACT
    // ==========================================

    deliverContract(id) {

        const d=CONTRACTS[id];

        const c=this.contracts.get(id);

        if (!d || c?.status!=='active') {

            return this.fail('Contract is not active');

        }

        if (this.farm.day>c.deadline) {

            c.status='expired';

            return this.fail('Contract has expired');

        }

        if (

            !this.farm.withdraw(d.product,d.quantity)

        ) {

            return this.fail(

                'Not enough goods to complete contract'

            );

        }

        this.town.cash+=d.reward;

        this.contractRevenue+=d.reward;

        c.status='completed';

        this.farm.note(

            'Trade contract completed for £'+d.reward+'.'

        );

        return {ok:true,income:d.reward};

    }

    cancelContract(id) {

        const c=this.contracts.get(id);

        if (c?.status!=='active') {

            return this.fail('Contract is not active');

        }

        c.status='cancelled';

        return {ok:true};

    }

    expireContracts() {

        for (const [id,c] of this.contracts) {

            if (

                c.status==='active' &&

                this.farm.day>c.deadline

            ) {

                c.status='expired';

                this.farm.note(

                    CONTRACTS[id].name+' contract expired.'

                );

            }

        }

    }

    // ==========================================
    // IMPORTS AND EXPORTS
    // ==========================================

    importGoods(product,quantity) {

        return this.industry.buy(product,quantity);

    }

    exportGoods(product,quantity) {

        return this.industry.sell(product,quantity);

    }

    // ==========================================
    // UNIFIED SIMULATION CLOCK
    // ==========================================

    advance(days=1) {

        if (

            !Number.isSafeInteger(days) ||

            days<1 || days>365

        ) {

            return this.fail('Invalid number of days');

        }

        for (let i=0;i<days;i++) {

            const opening=this.town.cash;

            this.industry.advance(1);

            const productionNet=

                this.town.cash-opening;

            const report=this.calculateDay();

            report.openingCash=opening;

            report.productionNet=productionNet;

            report.closingCash=this.town.cash;

            report.cashChange=

                report.closingCash-opening;

            this.expireContracts();

            this.last=report;

            this.history.unshift(report);

            if (this.history.length>30) {

                this.history.pop();

            }

        }

        return {

            ok:true,

            day:this.farm.day,

            report:this.last

        };

    }

}

window.TownEconomy=TownEconomy;

window.TownEconomyBuildings=BUILDINGS;

window.TownTradeContracts=CONTRACTS;

})();
