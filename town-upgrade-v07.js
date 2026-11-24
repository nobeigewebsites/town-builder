
/* =====================================================
   TOWN BUILDER V0.7
   LIVING SOCIETY
   Requires previous versions V0.2–V0.6
   ===================================================== */

(()=>{
'use strict';

if(window.townV07)return;
window.townV07=true;

const old={
    act,
    drawObject,
    drawTile,
    render,
    hud,
    selectMode
};

const D=[[1,0],[-1,0],[0,1],[0,-1]];

const ROAD=new Set([
    'road','lane','cobble','avenue'
]);

const ROAD_STYLE=new Set([...ROAD,'path']);

const TRACK=new Set([
    'rail','tramTrack','subwayTrack',
    'cycle','runway'
]);

const bare=id=>id.replace(/^v6_/,'');

const title=id=>TYPES[id]?.name||id;

const clamp=(n,a,b)=>
    Math.max(a,Math.min(b,n));

const xy=k=>k.split(',').map(Number);

const state=town.v7||(town.v7={});

state.tick??=0;
state.stock??={};

state.stats??={
    harvest:0,
    produced:0,
    festivals:0
};

state.net??={};
state.tax??=8;
state.strict??=false;
state.event??=null;

for(const l of [
    'power','water','sewage','metro'
]){
    state.net[l]??={};
}

town.cleared??={};
town.awards??={};

let layer='surface';
let rotation=0;
let inspected=null;
let confirmDemolition=null;

let occupied=new Map();
let report=null;
let metroRoutes=[];
let serviceRoutes=[];

// =====================================================
// 01 — LAND AND BUILDING FOOTPRINTS
// =====================================================

const sizes={

    airport:[4,3],
    castle:[3,3],
    cathedral:[2,2],
    hospital:[2,2],
    army:[3,3],
    prison:[3,2],

    stadium:[3,2],
    university:[2,2],
    coal:[2,2],
    solar:[2,2],
    sewage:[2,2],

    museum:[2,2],
    aquarium:[2,2],
    resort:[2,2],
    station:[2,1],
    hotel:[2,2],
    manor:[2,2],

    apartments:[2,1],
    supermarket:[2,1],
    factory:[2,2],
    warehouse:[2,1],
    landfill:[2,2],

    recycling:[2,1],
    cityPark:[2,2],
    botanic:[2,2],
    festival:[2,2],
    wheel:[2,2],

    palace:[3,3],
    zoo:[3,3],
    safari:[4,3],
    rollercoaster:[3,2],
    miniCoaster:[2,2],

    circus:[2,2],
    football:[3,2],
    racecourse:[4,3],
    golf:[4,3],
    amphitheatre:[3,2],

    concertHall:[2,2],
    opera:[2,2],
    shoppingArcade:[2,2],
    superstore:[2,2],

    mansion:[2,2],
    penthouse:[2,1],
    retirement:[2,2],
    reservoir:[3,2],
    hydro:[2,2],

    gasPlant:[2,2],
    steelworks:[3,2],
    shipyard:[3,2],
    freight:[2,2],

    nationalLibrary:[2,2],
    artCollege:[2,2],
    research:[2,2],
    maternity:[2,2],

    lion:[2,2],
    elephant:[2,2],
    giraffe:[2,2],
    panda:[2,2],
    monkey:[2,2],
    penguin:[2,2],

    monastery:[2,2],
    abbey:[2,2],
    scienceMuseum:[2,2],
    waterTreatment:[2,2],

    distribution:[2,2],
    dataCentre:[2,2],
    musicFestival:[3,2],
    christmas:[2,2],

    botanical:[2,2],
    v7_royalGarden:[2,2]
};

function dimensions(id,r=0){

    const [a,b]=
        sizes[id]||
        sizes[bare(id)]||
        [1,1];

    return r?[b,a]:[a,b];
}

function cells(x,y,w=1,h=1){

    const a=[];

    for(let i=0;i<w;i++){

        for(let j=0;j<h;j++){

            a.push([x+i,y+j]);
        }
    }

    return a;
}

function parts(k,b){

    return cells(
        ...xy(k),
        b.w||1,
        b.h||1
    );
}

function rebuild(){

    occupied=new Map();

    for(const [k,b] of Object.entries(
        town.buildings
    )){

        for(const [x,y] of parts(k,b)){

            occupied.set(key(x,y),k);
        }
    }
}

function parcel(x,y){

    return key(
        Math.floor(x/6),
        Math.floor(y/6)
    );
}

// Existing construction is grandfathered into owned land.

if(!state.land){

    state.land={};

    for(let x=1;x<=4;x++){

        for(let y=1;y<=4;y++){

            state.land[key(x,y)]=true;
        }
    }

    for(const [k,b] of Object.entries(
        town.buildings
    )){

        for(const [x,y] of parts(k,b)){

            state.land[parcel(x,y)]=true;
        }
    }
}

function owned(x,y){

    return !!state.land[parcel(x,y)];
}

function valid(
    x,y,w,h,
    ignore=null,
    bridge=false
){

    return cells(x,y,w,h).every(
        ([a,b])=>

            inside(a,b)&&

            owned(a,b)&&

            (
                bridge
                    ?terrain(a,b)!=='grass'
                    :terrain(a,b)==='grass'
            )&&

            (
                !occupied.has(key(a,b))||

                occupied.get(key(a,b))===ignore
            )
    );
}

function recordAt(x,y){

    const k=occupied.get(key(x,y));

    return k
        ?{k,b:town.buildings[k]}
        :null;
}

function nearby(k,b){

    const result=new Set();

    for(const [x,y] of parts(k,b)){

        result.add(key(x,y));

        for(const [a,c] of D){

            if(inside(x+a,y+c)){

                result.add(
                    key(x+a,y+c)
                );
            }
        }
    }

    return [...result];
}

function roadAccess(k,b){

    return nearby(k,b).some(
        n=>ROAD.has(
            town.buildings[n]?.type
        )
    );
}

// Move previous surface metro tracks underground.

for(const [k,b] of Object.entries(
    town.buildings
)){

    if(b.type==='subwayTrack'){

        state.net.metro[k]=true;

        delete town.buildings[k];
    }
}

rebuild();

// =====================================================
// 02 — INDEPENDENT INFRASTRUCTURE NETWORKS
// =====================================================

const layers={

    power:{
        name:'Electricity cables',
        cost:8,
        col:'#e6ae36'
    },

    water:{
        name:'Water pipes',
        cost:6,
        col:'#247fdd'
    },

    sewage:{
        name:'Sewage pipes',
        cost:7,
        col:'#926e45'
    },

    metro:{
        name:'Metro tunnels',
        cost:28,
        col:'#9358c9'
    }
};

const capacity={

    coal:[180,0,0],
    solar:[45,0,0],
    wind:[30,0,0],
    waterTower:[0,120,0],
    sewage:[0,0,120],

    pump:[0,75,0],
    hydro:[220,0,0],
    gasPlant:[220,0,0],
    biomass:[120,0,0],

    reservoir:[0,250,0],
    desalination:[0,180,0],
    waterTreatment:[0,130,0]
};

const wasteCap={

    landfill:180,
    recycling:100,
    wasteDepot:70,
    wasteTransfer:90,
    compost:35
};

const services={

    school:['education',60],
    secondary:['education',100],
    university:['education',160],
    college:['education',100],
    nursery:['education',25],
    library:['education',45],
    nationalLibrary:['education',100],

    clinic:['health',60],
    hospital:['health',180],
    healthCentre:['health',75],
    dentist:['health',30],
    maternity:['health',80],

    fire:['safety',100],
    fireHQ:['safety',220],
    police:['safety',100],
    policeHQ:['safety',220],
    prison:['safety',100],
    army:['safety',60]
};

// Discover connected groups of infrastructure.

function components(nodes){

    const index=new Map();
    const groups=[];

    for(const k of nodes){

        if(index.has(k))continue;

        const a=[k];
        const i=groups.length;

        index.set(k,i);

        groups.push(a);

        for(let j=0;j<a.length;j++){

            const [x,y]=xy(a[j]);

            for(const [dx,dy] of D){

                const n=key(x+dx,y+dy);

                if(
                    nodes.has(n)&&
                    !index.has(n)
                ){

                    index.set(n,i);

                    a.push(n);
                }
            }
        }
    }

    return {index,groups};
}

function demand(b){

    const t=TYPES[b.type];

    if(
        !t||
        ![
            'Homes',
            'Business',
            'Industry',
            'Services',
            'Farming'
        ].includes(t.group)
    )return 0;

    return t.pop||

        ({
            Industry:10,
            Services:5,
            Business:4,
            Farming:3
        }[t.group]||0);
}

// Allocate utility capacity through actual connections.

function network(l,idx,entries){

    const nodes=new Set(
        Object.keys(state.net[l])
    );

    const {index,groups}=components(nodes);

    const available=groups.map(()=>0);

    const matches=(k,b)=>[
        ...new Set(
            nearby(k,b)

            .map(n=>index.get(n))

            .filter(n=>n!==undefined)
        )
    ];

    let installed=0;
    let connected=0;
    let need=0;
    let served=0;

    const status={};

    for(const [k,b] of entries){

        const cap=
            capacity[bare(b.type)]?.[idx]||0;

        installed+=cap;

        if(!cap)continue;

        const m=matches(k,b);

        if(m.length){

            available[m[0]]+=cap;

            connected+=cap;
        }
    }

    for(const [k,b] of entries){

        const n=demand(b);

        if(!n)continue;

        need+=n;

        let left=n;

        for(const i of matches(k,b)){

            const take=Math.min(
                left,
                available[i]
            );

            available[i]-=take;

            left-=take;

            if(!left)break;
        }

        status[k]=n-left;

        served+=n-left;
    }

    return {
        installed,
        connected,
        need,
        served,
        status
    };
}

// =====================================================
// 03 — SERVICE VEHICLES AND METRO ROUTES
// =====================================================

function travelPath(nodes,start){

    if(!start)return [];

    const parent=new Map([
        [start,null]
    ]);

    const queue=[start];

    for(let i=0;i<queue.length;i++){

        const [x,y]=xy(queue[i]);

        for(const [a,b] of D){

            const k=key(x+a,y+b);

            if(
                nodes.has(k)&&
                !parent.has(k)
            ){

                parent.set(k,queue[i]);

                queue.push(k);
            }
        }
    }

    let p=queue.at(-1);

    let route=[];

    while(p!==null){

        route.push(p);

        p=parent.get(p);
    }

    return route.reverse();
}

function rebuildRoutes(){

    const roadNodes=new Set(

        Object.entries(town.buildings)

        .filter(([,b])=>ROAD.has(b.type))

        .map(([k])=>k)
    );

    const metroNodes=new Set(
        Object.keys(state.net.metro)
    );

    metroRoutes=[];
    serviceRoutes=[];

    const seen=new Set();

    const fleet={

        fire:'#c94843',
        fireHQ:'#c94843',

        police:'#427bbb',
        policeHQ:'#427bbb',

        ambulance:'#f5e9ca',
        hospital:'#f5e9ca',

        wasteDepot:'#749750',
        recycling:'#749750',

        warehouse:'#b18a56',
        distribution:'#b18a56'
    };

    for(const [k,b] of Object.entries(
        town.buildings
    )){

        const id=bare(b.type);

        const isMetro=id==='subway';

        const col=fleet[id];

        if(!isMetro&&!col)continue;

        const nodes=isMetro
            ?metroNodes
            :roadNodes;

        const start=nearby(k,b)
            .find(n=>nodes.has(n));

        if(!start)continue;

        const route=travelPath(
            nodes,start
        );

        if(route.length<2)continue;

        if(isMetro){

            if(
                !seen.has(start)&&
                metroRoutes.length<8
            ){

                metroRoutes.push({
                    route,
                    col:'#9855c8'
                });

                for(const n of route){

                    seen.add(n);
                }
            }

        }else if(serviceRoutes.length<12){

            serviceRoutes.push({
                route,
                col
            });
        }
    }
}

// =====================================================
// 04 — FARMING, HARVESTING AND STOCK
// =====================================================

// Growth cycles, harvest quantity, sale price.

const crops={

    wheat:[3,6,9],
    corn:[4,7,10],
    potatoes:[3,6,8],
    carrots:[3,6,8],
    cabbages:[3,6,8],

    strawberry:[4,5,14],
    blueberry:[4,5,14],

    pumpkins:[4,5,16],
    sunflowers:[3,6,10],
    lavender:[4,5,15],

    herbs:[2,4,9],
    grapes:[5,6,15],
    apples:[5,6,13],
    cherries:[5,5,15],
    lemons:[5,6,13],
    olives:[5,5,16],

    mushrooms:[3,5,12],
    flowers:[3,6,10]
};

const fieldCrop={

    farm:'wheat',
    greenhouse:'herbs',
    orchard:'apples',
    vineyard:'grapes',
    olive:'olives',

    cherryOrchard:'cherries',
    lemonOrchard:'lemons',
    floraculture:'flowers',

    lavender:'lavender',
    pumpkins:'pumpkins',
    sunflowers:'sunflowers',

    corn:'corn',
    wheat:'wheat',

    strawberry:'strawberry',
    blueberry:'blueberry',

    herbs:'herbs',
    potatoes:'potatoes',
    carrots:'carrots',
    cabbages:'cabbages',
    mushrooms:'mushrooms'
};

const livestock={

    cow:['milk',3],
    chicken:['eggs',3],
    sheep:['wool',2],
    goatFarm:['milk',2],
    pigFarm:['farm produce',2],
    beehives:['honey',2]
};

// Input, input quantity, output, output quantity.

const recipes={

    flourmill:['wheat',2,'flour',2],

    bakery:['flour',2,'bread',2],

    dairy:['milk',2,'cheese',2],

    cheeseFactory:['milk',3,'cheese',3],

    winery:['grapes',2,'wine',2],

    brewery:['wheat',2,'beer',2],

    textile:['wool',2,'fabric',2],

    cannery:['corn',2,'canned food',2],

    furnitureFactory:[
        'timber',2,'furniture',1
    ],

    sawmill:[null,0,'timber',2],

    pottery:[null,0,'pottery',2],

    chocolateFactory:[
        null,0,'chocolate',1
    ],

    soapworks:[null,0,'soap',2],

    brickworks:[null,0,'bricks',2]
};

const salePrices={

    ...Object.fromEntries(

        Object.entries(crops)

        .map(([k,v])=>[k,v[2]])
    ),

    milk:9,
    eggs:8,
    wool:12,
    honey:15,

    'farm produce':10,

    flour:14,
    bread:22,
    cheese:25,
    wine:32,
    beer:24,
    fabric:24,

    'canned food':22,

    timber:9,
    furniture:30,
    pottery:15,
    chocolate:18,
    soap:12,
    bricks:10
};

function stock(name,n){

    state.stock[name]=Math.min(
        999,
        (state.stock[name]||0)+n
    );
}

function initialCrop(b){

    const crop=fieldCrop[bare(b.type)];

    if(
        crop&&
        !Object.hasOwn(b,'crop')
    ){

        b.crop={

            kind:crop,

            ready:
                state.tick+
                crops[crop][0]
        };
    }
}

for(const b of Object.values(
    town.buildings
)){

    initialCrop(b);
}

function plant(k,crop){

    const b=town.buildings[k];

    if(
        !b||
        !fieldCrop[bare(b.type)]||
        b.crop||
        !crops[crop]
    )return false;

    if(
        bare(b.type)!=='farm'&&
        bare(b.type)!=='greenhouse'&&
        crop!==fieldCrop[bare(b.type)]
    )return false;

    if(town.cash<8){

        message('Seeds cost £8.');

        return false;
    }

    town.cash-=8;

    b.crop={

        kind:crop,

        ready:
            state.tick+crops[crop][0]
    };

    changed('Planted '+crop+'.');

    return true;
}

function harvest(k){

    const b=town.buildings[k];

    if(!b?.crop)return false;

    const c=b.crop;

    if(c.ready>state.tick){

        message(

            c.kind+
            ' needs '+
            (c.ready-state.tick)+
            ' more growth cycles.'
        );

        return false;
    }

    const n=crops[c.kind][1];

    stock(c.kind,n);

    state.stats.harvest+=n;

    b.crop=null;

    changed(

        'Harvested '+n+' '+c.kind+
        ' • added to warehouse.'
    );

    return true;
}

function sellStock(name,all=false){

    const n=Math.min(

        state.stock[name]||0,

        all?999:10
    );

    if(n<=0)return;

    const cash=

        n*(salePrices[name]||8);

    state.stock[name]-=n;

    town.cash+=cash;

    changed(

        'Sold '+n+' '+name+
        ' for '+money(cash)
    );
}

// =====================================================
// 05 — ECONOMY, EMPLOYMENT AND TOURISM
// =====================================================

const festivals=new Set([

    'festival',
    'christmas',
    'halloween',
    'harvest',
    'medieval',
    'flowerShow',

    'wineFestival',
    'musicFestival',
    'winterVillage',
    'summerFair',

    'lanternFestival',
    'easterFair',
    'marketSquare'
]);

function calculate(){

    const entries=Object.entries(
        town.buildings
    );

    const nets=[
        'power','water','sewage'
    ].map(

        (l,i)=>network(l,i,entries)
    );

    let pop=0;
    let jobs=0;
    let gross=0;
    let expenses=0;
    let parks=0;
    let attractions=0;
    let waste=0;
    let trash=0;

    const svc={

        education:0,
        health:0,
        safety:0
    };

    const coverage={};

    for(const [k,b] of entries){

        const t=TYPES[b.type];

        if(!t)continue;

        const id=bare(b.type);

        const n=demand(b);

        pop+=t.pop||0;

        const supplied=n

            ?nets.filter(

                a=>(a.status[k]||0)>=n

            ).length

            :3;

        coverage[k]=supplied;

        const efficiency=

            state.strict

                ?.4+.6*supplied/3

                :1;

        if(

            !t.pop&&

            [
                'Business',
                'Industry',
                'Services',
                'Farming',
                'Utilities'
            ].includes(t.group)
        ){

            jobs+=Math.max(

                1,

                Math.round(
                    (t.rent||25)/12
                )
            );
        }

        // Crops generate income through harvesting
        // and selling produce rather than passive rent.

        if(!fieldCrop[id]){

            gross+=Math.floor(
                (t.rent||0)*efficiency
            );
        }

        if(t.group==='Nature')parks++;

        if(

            [
                'Tourism',
                'Funfair',
                'Wildlife',
                'Sports',
                'Waterfront',
                'Leisure',
                'Festivals'
            ].includes(t.section)

            ||

            [
                'museum',
                'castle',
                'hotel',
                'aquarium',
                'wheel',
                'stadium',
                'theatre'
            ].includes(id)
        ){

            if(roadAccess(k,b)){

                attractions+=Math.max(

                    1,

                    Math.round(
                        (t.rent||10)/20
                    )
                );
            }
        }

        if(

            [
                'Services',
                'Utilities'
            ].includes(t.group)
        ){

            expenses+=Math.max(

                1,

                Math.floor(t.cost/180)
            );
        }

        if(
            ROAD.has(id)||
            TRACK.has(id)
        ){

            expenses+=.12;
        }

        waste+=wasteCap[id]||0;

        trash+=Math.ceil(n/2);

        if(services[id]){

            const [s,v]=services[id];

            svc[s]+=v;
        }
    }

    const workers=Math.round(pop*.55);

    const employed=Math.min(
        workers,jobs
    );

    const util=

        pop||nets[0].need

        ?nets.reduce(

            (s,a)=>

                s+(
                    a.need
                        ?a.served/a.need
                        :1
                ),

            0

        )/3

        :1;

    const serviceScore=

        pop

        ?Object.values(svc).reduce(

            (s,n)=>s+Math.min(1,n/pop),

            0

        )/3

        :1;

    const happiness=clamp(

        Math.round(

            54+

            (workers
                ?employed/workers
                :1
            )*12+

            util*12+

            serviceScore*12+

            Math.min(12,parks*1.5)-

            state.tax*.8-

            (trash>waste?5:0)
        ),

        0,100
    );

    const tax=Math.floor(

        gross*state.tax/100+

        pop*state.tax/10
    );

    const eventBonus=

        state.event

            ?Math.max(

                15,

                Math.floor(
                    attractions*2+pop*.2
                )
            )

            :0;

    const visitors=

        attractions*2+

        (state.event?20:0);

    gross+=

        tax+

        eventBonus+

        Math.floor(visitors/3);

    expenses+=

        Object.keys(state.net.power).length*.06+

        Object.keys(state.net.water).length*.04+

        Object.keys(state.net.sewage).length*.05+

        Object.keys(state.net.metro).length*.15;

    return {

        pop,
        jobs,
        workers,
        employed,

        gross,

        expenses:Math.ceil(expenses),

        net:Math.floor(
            gross-Math.ceil(expenses)
        ),

        happiness,
        visitors,
        waste,
        trash,
        svc,
        nets,
        coverage
    };
}

// Preserve the original automatic cash timer.
// Do not create a duplicate income payment.

totals=function(){

    const r=report||calculate();

    return {

        pop:r.pop,

        rent:Math.max(
            -town.cash,r.net
        )
    };
};

function startFestival(k){

    const b=town.buildings[k];

    if(
        !b||
        !festivals.has(bare(b.type))
    )return;

    if(state.event){

        message(
            'A festival is already running.'
        );

        return;
    }

    if(!roadAccess(k,b)){

        message(
            'Connect the festival grounds to a road first.'
        );

        return;
    }

    if(town.cash<60){

        message(
            'A festival costs £60 to organise.'
        );

        return;
    }

    town.cash-=60;

    state.event={

        k,

        end:state.tick+6,

        name:title(b.type)
    };

    changed(

        'Festival started! Runs for six town cycles.'
    );
}

// =====================================================
// 06 — ACHIEVEMENTS AND EXCLUSIVE REWARDS
// =====================================================

const rewardTypes={

    v7_royalGarden:{

        name:'Royal botanical garden',

        cost:180,
        rent:35,
        pop:0,

        group:'Nature',
        section:'Nature',

        goldCost:5
    },

    v7_heritagePalace:{

        name:'Golden heritage palace',

        cost:750,
        rent:110,
        pop:0,

        group:'Business',
        section:'Tourism',

        goldCost:10
    }
};

sizes.v7_heritagePalace=[3,2];

const awards=[

    [
        'v7village',
        'A thriving village',
        r=>r.pop>=50,
        10
    ],

    [
        'v7jobs',
        'Working town',
        r=>r.employed>=25,
        8
    ],

    [
        'v7utility',
        'Connected community',

        r=>r.nets.every(

            n=>n.need>0&&
            n.served===n.need
        ),

        12
    ],

    [
        'v7harvest',
        'Master gardener',

        ()=>state.stats.harvest>=50,

        10,

        'v7_royalGarden'
    ],

    [
        'v7factory',
        'Made locally',

        ()=>state.stats.produced>=50,

        10
    ],

    [
        'v7tourism',
        'Tourist destination',

        r=>r.visitors>=60,

        15,

        'v7_heritagePalace'
    ],

    [
        'v7festival',
        'Festival organiser',

        ()=>state.stats.festivals>=3,

        10
    ],

    [
        'v7happy',
        'Happy community',

        r=>r.pop>=30&&r.happiness>=90,

        15
    ],

    [
        'v7rail',
        'Metro builder',

        ()=>metroRoutes.length>0,

        5
    ]
];

for(const [id,,,,reward] of awards){

    if(town.awards[id]&&reward){

        TYPES[reward]=rewardTypes[reward];
    }
}

function checkAwards(){

    const fresh=[];

    for(const [
        id,name,test,gold,reward
    ] of awards){

        if(
            !town.awards[id]&&
            test(report)
        ){

            town.awards[id]=true;

            town.gold+=gold;

            if(reward){

                TYPES[reward]=rewardTypes[reward];
            }

            fresh.push(

                name+' +'+gold+' gold'
            );
        }
    }

    return fresh;
}

function changed(
    msg='',
    topologyChanged=false
){

    if(topologyChanged){

        rebuild();

        rebuildRoutes();
    }

    report=calculate();

    const a=checkAwards();

    hud();

    save();

    dirty=true;

    refreshPanel();

    if(msg||a.length){

        message(

            [msg,...a]

            .filter(Boolean)

            .join(' • ')
        );
    }
}

// Town production cycle.

function tick(){

    state.tick++;

    for(const [k,b] of Object.entries(
        town.buildings
    )){

        if(

            state.strict&&

            (report.coverage[k]??3)<3
        )continue;

        const id=bare(b.type);

        const l=livestock[id];

        if(l)stock(...l);

        const recipe=recipes[id];

        if(recipe){

            const [
                input,n,output,m
            ]=recipe;

            if(

                !input||

                (state.stock[input]||0)>=n
            ){

                if(input){

                    state.stock[input]-=n;
                }

                stock(output,m);

                state.stats.produced+=m;
            }
        }
    }

    if(

        state.event&&

        state.tick>=state.event.end
    ){

        state.stats.festivals++;

        state.event=null;

        changed('Festival completed.');

    }else{

        changed();
    }
}

// =====================================================
// 07 — ADVANCED CONSTRUCTION
// =====================================================

canBuild=function(x,y){

    const rec=moving
        ?town.buildings[moving]
        :null;

    const [w,h]=rec

        ?[rec.w||1,rec.h||1]

        :dimensions(selected,rotation);

    return valid(

        x,y,w,h,

        moving||null,

        !!rec?.bridge
    );
};

function setLayer(l){

    layer=l;

    $('v7layer').value=l;

    selectMode('pan');

    dirty=true;

    refreshPanel();
}

function rotateBuilding(k){

    const b=town.buildings[k];

    if(

        !b||

        ROAD.has(b.type)||

        TRACK.has(b.type)||

        b.bridge
    )return;

    const [x,y]=xy(k);

    const w=b.h||1;

    const h=b.w||1;

    if(!valid(x,y,w,h,k)){

        message(
            'Not enough clear land to rotate.'
        );

        return;
    }

    b.w=w;

    b.h=h;

    b.rot=1-(b.rot||0);

    changed('Building rotated.',true);
}

selectMode=function(m){

    old.selectMode(m);

    confirmDemolition=null;

    if(layer!=='surface'){

        message(

            m==='pan'

                ?'Explore underground • Choose Build to lay lines'

                :m==='build'

                    ?'Tap a tile: '+
                        layers[layer].name+
                        ' '+
                        money(layers[layer].cost)

                    :'Tap a network segment to remove it'
        );

    }else if(m==='build'){

        const [w,h]=dimensions(
            selected,rotation
        );

        message(

            title(selected)+
            ' • '+w+' × '+h+
            ' tiles • '+
            money(TYPES[selected].cost)
        );

    }else if(m==='inspect'){

        message(

            'Tap a building to inspect, manage crops or host events.'
        );

    }else if(m==='bridge'){

        message(

            'Tap water or beach tiles to build a £45 road bridge.'
        );

    }else if(m==='expand'){

        message(

            'Tap a shaded parcel to unlock its land for £150.'
        );
    }
};

act=function(x,y){

    if(
        !inside(x,y)||
        mode==='pan'
    )return;

    const k=key(x,y);

    // Underground construction.

    if(layer!=='surface'){

        const net=state.net[layer];

        if(mode==='build'){

            if(!owned(x,y)){

                message(
                    'Purchase the land above first.'
                );

                return;
            }

            if(net[k])return;

            const cost=layers[layer].cost;

            if(town.cash<cost){

                message('Not enough cash.');

                return;
            }

            town.cash-=cost;

            net[k]=true;

            changed(

                'Network segment installed.',

                true
            );

        }else if(

            ['sell','bulldoze'].includes(mode)&&

            net[k]
        ){

            delete net[k];

            changed(

                'Network segment removed.',

                true
            );
        }

        return;
    }

    // Purchase additional land.

    if(mode==='expand'){

        const p=parcel(x,y);

        if(state.land[p]){

            message('Parcel already owned.');

            return;
        }

        if(town.cash<150){

            message('Land costs £150.');

            return;
        }

        state.land[p]=true;

        town.cash-=150;

        changed('Land purchased.');

        return;
    }

    // Working road bridges.

    if(mode==='bridge'){

        if(

            !valid(x,y,1,1,null,true)||

            town.cash<45
        ){

            message(

                'Choose available water or beach land. Bridge costs £45.'
            );

            return;
        }

        town.cash-=45;

        town.buildings[k]={

            type:'road',

            bridge:true,

            w:1,
            h:1,
            rot:0
        };

        changed(

            'Road bridge constructed.',

            true
        );

        return;
    }

    const hit=recordAt(x,y);

    if(mode==='inspect'){

        inspected=hit?.k||null;

        openPanel();

        return;
    }

    // Multi-tile building construction.

    if(mode==='build'){

        if(selected==='subwayTrack'){

            setLayer('metro');

            selectMode('build');

            act(x,y);

            return;
        }

        const t=TYPES[selected];

        if(!t)return;

        if(

            hit&&

            hit.k===k&&

            ROAD_STYLE.has(hit.b.type)&&

            ROAD_STYLE.has(selected)&&

            !hit.b.bridge
        ){

            old.act(x,y);

            changed('',true);

            return;
        }

        const [w,h]=dimensions(
            selected,rotation
        );

        if(!valid(x,y,w,h)){

            message(

                'The entire '+
                w+' × '+h+
                ' footprint must be clear, owned grass.'
            );

            return;
        }

        if(

            town.cash<t.cost||

            town.gold<(t.goldCost||0)
        ){

            message(

                'Not enough earned cash or gold.'
            );

            return;
        }

        town.cash-=t.cost;

        town.gold-=t.goldCost||0;

        const b={

            type:selected,

            w,h,

            rot:rotation
        };

        town.buildings[k]=b;

        initialCrop(b);

        const first=achievements();

        changed(

            title(selected)+
            ' constructed.'+
            first,

            true
        );

        return;
    }

    // Relocate complete buildings.

    if(mode==='move'){

        if(!moving){

            if(!hit)return;

            moving=hit.k;

            message(

                'Tap a clear destination for '+
                title(hit.b.type)+'.'
            );

            dirty=true;

            return;
        }

        if(

            hit?.k===moving&&

            k===moving
        ){

            moving=null;

            dirty=true;

            return;
        }

        const b=town.buildings[moving];

        if(!b){

            moving=null;

            return;
        }

        if(!valid(

            x,y,

            b.w||1,
            b.h||1,

            moving,

            !!b.bridge
        )){

            message(

                'Destination does not fit.'
            );

            return;
        }

        const prev=moving;

        delete town.buildings[prev];

        town.buildings[k]=b;

        if(state.event?.k===prev){

            state.event.k=k;
        }

        if(inspected===prev){

            inspected=k;
        }

        moving=null;

        changed(

            'Building moved for free.',

            true
        );

        return;
    }

    // Sell or bulldoze an entire footprint.

    if(

        mode==='sell'||

        mode==='bulldoze'
    ){

        if(!hit){

            if(

                mode==='bulldoze'&&

                owned(x,y)
            ){

                old.act(x,y);

                changed('',true);
            }

            return;
        }

        if(

            mode==='bulldoze'&&

            confirmDemolition!==hit.k
        ){

            confirmDemolition=hit.k;

            message(

                'Tap again to permanently demolish '+
                title(hit.b.type)+'.'
            );

            return;
        }

        const b=hit.b;

        const refund=

            mode==='sell'

                ?Math.floor(

                    (
                        b.bridge
                            ?45
                            :TYPES[b.type].cost
                    )/2
                )

                :0;

        for(const [a,c] of parts(hit.k,b)){

            town.cleared[key(a,c)]=true;
        }

        delete town.buildings[hit.k];

        town.cash+=refund;

        if(state.event?.k===hit.k){

            state.event=null;
        }

        if(inspected===hit.k){

            inspected=null;
        }

        confirmDemolition=null;

        changed(

            title(b.type)+
            ' removed • '+
            money(refund)+
            ' refund.',

            true
        );

        return;
    }
};

// =====================================================
// 08 — HIGH DETAIL GRAPHICAL ASSETS
// =====================================================

const artCache=new Map();

const special={

    airport:'airport',

    zoo:'zoo',
    safari:'zoo',
    lion:'zoo',
    elephant:'zoo',
    giraffe:'zoo',
    panda:'zoo',
    monkey:'zoo',
    penguin:'zoo',

    castle:'castle',

    stadium:'stadium',
    football:'stadium',
    racecourse:'stadium',

    golf:'park',
    cityPark:'park',
    botanic:'park',
    royalGarden:'park',
    v7_royalGarden:'park',

    circus:'circus',
    rollercoaster:'coaster',
    miniCoaster:'coaster',

    coal:'factory',
    gasPlant:'factory',
    steelworks:'factory',
    factory:'factory',

    hospital:'civic',
    university:'civic',
    museum:'civic',
    palace:'civic',
    v7_heritagePalace:'civic',

    townhall:'civic',
    library:'civic',
    nationalLibrary:'civic',

    station:'station',

    prison:'compound',
    army:'compound'
};

const palette=[

    ['#f3d99b','#b85b42','#6e9b97'],

    ['#f5e5cb','#617c94','#86a7bd'],

    ['#dca282','#875b50','#66867d'],

    ['#e2dbb8','#75936e','#cb7867'],

    ['#e8c9d5','#8f739c','#c97d92'],

    ['#b9dcd9','#497d9e','#e9b76a']
];

function kind(id){

    const t=TYPES[id];

    return special[id]||

        special[bare(id)]||

        (

            t?.group==='Homes'

                ?'home'

                :t?.group==='Business'&&

                (
                    !t.section||

                    [
                        'Shops',
                        'Food and drink'
                    ].includes(t.section)
                )&&

                ![
                    'museum',
                    'castle',
                    'hotel',
                    'aquarium',
                    'wheel',
                    'stadium',
                    'theatre',
                    'festival',
                    'resort',
                    'guesthouse',
                    'artgallery',
                    'visitor',
                    'clocktower',
                    'observatory',
                    'monument',
                    'pool',
                    'carousel',
                    'cinema',
                    'marketSquare',
                    'tennis',
                    'pub'
                ].includes(id)

                    ?'shop'

                    :null
        );
}

function detailed(id,w,h,r=0){

    const k=[id,w,h,r].join(':');

    if(artCache.has(k)){

        const v=artCache.get(k);

        artCache.delete(k);

        artCache.set(k,v);

        return v;
    }

    const type=kind(id);

    if(!type)return null;

    const width=(w+h)*HW+36;

    const origin=132+(w+h)*HH/2;

    const height=

        origin+(w+h)*HH/2+25;

    const c=document.createElement('canvas');

    c.width=width*2;

    c.height=height*2;

    const g=c.getContext('2d');

    g.scale(2,2);

    g.translate(width/2,origin);

    if(r)g.scale(-1,1);

    const X=r?h:w;

    const Y=r?w:h;

    const P=(x,y,z=0)=>[

        (x-y)*HW,

        (x+y)*HH-z
    ];

    const id0=bare(id);

    const seed=[...id].reduce(

        (n,ch)=>(

            (n*31+ch.charCodeAt(0))>>>0
        ),

        7
    );

    const architecturalPalettes={

        tudor:[
            '#f4e1bd','#7b5143','#79543d'
        ],

        villa:[
            '#fff0ce','#b86a48','#4c8c8b'
        ],

        greek:[
            '#fff1d8','#578daf','#4a91b7'
        ],

        tuscan:[
            '#e6c28d','#ad5e3e','#779254'
        ],

        dutch:[
            '#c98f70','#566779','#578477'
        ],

        victorian:[
            '#dfb391','#556e80','#80654e'
        ],

        georgian:[
            '#e6cda5','#68787f','#577b67'
        ],

        japanese:[
            '#e4d4b7','#627d71','#9b795a'
        ],

        thatched:[
            '#f5e4c0','#b29b58','#7c9d62'
        ],

        alpine:[
            '#d9b48e','#77513e','#8c6748'
        ]
    };

    const [wall,roof,accent]=

        architecturalPalettes[id0]||

        palette[seed%palette.length];

    const tint=(hex,n)=>

        '#'+hex.slice(1)

        .match(/../g)

        .map(v=>

            clamp(
                parseInt(v,16)+n,
                0,255
            )

            .toString(16)

            .padStart(2,'0')

        ).join('');

    function gradient(a,b,c,d){

        const p=g.createLinearGradient(
            ...a,...b
        );

        p.addColorStop(0,c);

        p.addColorStop(1,d);

        return p;
    }

    function poly(ps,col,edge){

        g.beginPath();

        ps.forEach((p,i)=>

            i

                ?g.lineTo(...p)

                :g.moveTo(...p)
        );

        g.closePath();

        g.fillStyle=col;

        g.fill();

        if(edge){

            g.strokeStyle=edge;

            g.lineWidth=.7;

            g.stroke();
        }
    }

    const face=(ps,col,edge)=>

        poly(
            ps.map(p=>P(...p)),
            col,edge
        );

    function ln(a,b,col,n=1){

        g.beginPath();

        g.moveTo(...a);

        g.lineTo(...b);

        g.strokeStyle=col;

        g.lineWidth=n;

        g.lineCap='round';

        g.stroke();
    }

    const L=(a,b,col,n)=>

        ln(P(...a),P(...b),col,n);

    function oval(x,y,rx,ry,col){

        g.beginPath();

        g.ellipse(

            x,y,rx,ry,

            0,0,Math.PI*2
        );

        g.fillStyle=col;

        g.fill();
    }

    function flat(a,b,c,d,col,z=0){

        face([

            [a,b,z],
            [c,b,z],
            [c,d,z],
            [a,d,z]

        ],col);
    }

    // Shaded architecture.

    function box(a,b,c,d,z,H,col){

        face([

            [a,d,z],
            [c,d,z],
            [c,d,z+H],
            [a,d,z+H]

        ],

        gradient(

            P(a,d,z+H),

            P(c,d,z),

            tint(col,13),

            tint(col,-11)
        ),

        '#654e3b35');

        face([

            [c,b,z],
            [c,d,z],
            [c,d,z+H],
            [c,b,z+H]

        ],

        tint(col,-32),

        '#654e3b35');

        flat(

            a,b,c,d,

            tint(col,20),

            z+H
        );
    }

    // Glazed windows with frames and reflections.

    function windowAt(
        x,y,z,
        a=.13,H=10,
        side=false
    ){

        const Q=(u,v)=>side

            ?P(x,y+u,z+v)

            :P(x+u,y,z+v);

        poly([

            Q(-.015,-1),
            Q(a+.015,-1),
            Q(a+.015,H+1),
            Q(-.015,H+1)

        ],

        '#ffedca',

        '#bda17b');

        poly([

            Q(.017,1),
            Q(a-.017,1),
            Q(a-.017,H-1),
            Q(.017,H-1)

        ],

        gradient(

            Q(0,H),
            Q(a,0),

            '#c8e5e4',
            '#3a779a'
        ));

        ln(

            Q(a/2,1),

            Q(a/2,H-1),

            '#fff0d6',.9
        );

        ln(

            Q(.02,H/2),

            Q(a-.02,H/2),

            '#fff0d6',.7
        );

        ln(

            Q(-.025,0),

            Q(a+.025,0),

            '#c9af87',1.5
        );
    }

    function door(
        x,y,z=0,
        a=.13,H=15,
        col='#80563e'
    ){

        face([

            [x-a,y,z],
            [x+a,y,z],
            [x+a,y,z+H],
            [x-a,y,z+H]

        ],

        col,

        '#f6e2bb');

        oval(

            ...P(x+a*.6,y,z+H*.45),

            .9,.9,

            '#f7ce70'
        );
    }

    // Individually textured roof tiles.

    function roofG(
        a,b,c,d,z,rise,
        col=roof,
        hip=false
    ){

        const mid=(a+c)/2;

        const q=hip?.10:0;

        face([

            [a,d,z],
            [c,d,z],
            [mid,d-q,z+rise]

        ],

        hip?tint(col,4):wall);

        const sides=[

            [
                [a,b,z],
                [a,d,z],
                [mid,d-q,z+rise],
                [mid,b+q,z+rise],
                tint(col,12)
            ],

            [
                [mid,b+q,z+rise],
                [mid,d-q,z+rise],
                [c,d,z],
                [c,b,z],
                tint(col,-17)
            ]
        ];

        for(const [
            A,B,C,E,color
        ] of sides){

            face(

                [A,B,C,E],

                gradient(

                    P(...A),

                    P(...C),

                    tint(color,15),

                    tint(color,-13)
                ),

                '#684c4055'
            );

            const mix=(a,b,f)=>

                a.map(

                    (v,i)=>v+(b[i]-v)*f
                );

            for(let i=1;i<=8;i++){

                const u=i/9;

                const U=mix(A,E,u);

                const V=mix(B,C,u);

                L(

                    U,V,

                    tint(color,-29),.7
                );

                for(let j=1;j<=8;j++){

                    const f=

                        (j-(i%2)*.5)/9;

                    L(

                        mix(U,V,f),

                        mix(

                            mix(A,E,(i-1)/9),

                            mix(B,C,(i-1)/9),

                            f
                        ),

                        tint(color,-25),.45
                    );
                }
            }
        }

        L(

            [mid,b+q,z+rise],

            [mid,d-q,z+rise],

            tint(col,38),1.6
        );
    }

    // Detailed garden vegetation.

    function bush(
        x,y,
        col='#82b45c',
        s=1
    ){

        const p=P(x,y);

        oval(

            p[0]+3,p[1]+2,

            7*s,3*s,

            '#34533628'
        );

        for(let i=0;i<3;i++){

            let a=p[0]+(i-1)*3*s;

            let b=p[1]-3*s;

            oval(

                a,b,

                4*s,4*s,

                gradient(

                    [a-4*s,b-4*s],

                    [a+4*s,b+4*s],

                    tint(col,25),

                    tint(col,-35)
                )
            );
        }
    }

    function tree(
        x,y,
        s=1,
        col='#82b75a'
    ){

        const p=P(x,y);

        g.save();

        g.translate(...p);

        g.scale(s,s);

        oval(6,3,16,6,'#3453362a');

        ln(

            [0,0],

            [0,-32],

            '#8e674a',5
        );

        for(const [a,b,r] of [

            [-9,-25,11],

            [9,-27,12],

            [-7,-36,12],

            [7,-38,12],

            [0,-46,10],

            [0,-28,13]
        ]){

            oval(

                a,b,r,r*.93,

                gradient(

                    [a-r,b-r],

                    [a+r,b+r],

                    tint(col,30),

                    tint(col,-36)
                )
            );

            oval(

                a-r*.28,

                b-r*.32,

                r*.29,r*.19,

                '#fff6c834'
            );
        }

        g.restore();
    }

    function flower(x,y,i){

        const [a,b]=P(x,y);

        ln(

            [a,b],

            [a,b-4],

            '#638c49',1
        );

        oval(

            a,b-5,

            2.4,2.1,

            [
                '#f7abc4',
                '#f0d47d',
                '#f7ebd6'
            ][i%3]
        );

        oval(

            a,b-5,.7,.7,

            '#fff0ad'
        );
    }

    function sign(text,x,y,z){

        const p=P(x,y,z);

        g.save();

        g.translate(...p);

        g.transform(1,.5,0,1,0,0);

        g.fillStyle='#f8e6bf';

        g.fillRect(-16,-4,32,8);

        g.strokeStyle='#a08060';

        g.lineWidth=.6;

        g.strokeRect(-16,-4,32,8);

        g.font='bold 5px sans-serif';

        g.fillStyle='#61483b';

        g.textAlign='center';

        g.fillText(text,0,1.7,29);

        g.restore();
    }

    const a=-X/2+.10;

    const b=-Y/2+.10;

    const C=X/2-.10;

    const F=Y/2-.10;

    const green=[

        'home',
        'park',
        'zoo',
        'coaster'

    ].includes(type);

    flat(

        -X/2,-Y/2,X/2,Y/2,

        green
            ?'#a7ca75'
            :'#d8c9a9'
    );

    flat(

        a,b,C,F,

        green
            ?'#a0c66f'
            :'#dfd2b5'
    );

    const corners=[

        [a,b],

        [C,b],

        [a,F],

        [C,F]
    ];

    // =================================================
    // 09 — RESIDENTIAL AND COMMERCIAL ARCHITECTURE
    // =================================================

    if(

        type==='home'||

        type==='shop'||

        type==='civic'||

        type==='station'
    ){

        const home=type==='home';

        const shop=type==='shop';

        const floors=

            home

                ?TYPES[id].pop>=14

                    ?4

                    :/bungalow|cottage|cabin|beachhut|thatched/i.test(id0)

                        ?1

                        :/townhouse|terrace|manor|mansion|brownstone|row/i.test(id0)

                            ?3

                            :2

                :shop

                    ?1+(seed%3===0?1:0)

                    :2;

        const modern=

            /modern|artdeco|penthouse|apartments|greek|supermarket|department|superstore|electronics/i.test(id0);

        const H=12+floors*14;

        const aa=a+.09;

        const bb=b+.08;

        const cc=C-.09;

        const ff=F-.23;

        oval(

            7,4,

            Math.min(60,HW*X*.8),

            12,

            '#364b332d'
        );

        flat(

            -.10,ff,.10,F,

            '#f2dfb7'
        );

        box(

            aa-.02,bb-.02,

            cc+.02,ff+.02,

            0,3,

            '#d6c19c'
        );

        box(

            aa,bb,cc,ff,

            3,H-3,

            wall
        );

        // Brick and stone texture.

        for(let z=6;z<H;z+=5){

            L(

                [aa,ff,z],

                [cc,ff,z],

                '#86664e25',.6
            );

            if(

                /stone|brick|dutch|victorian|edwardian|brownstone/.test(id0)
            ){

                for(let i=1;i<7;i++){

                    const x=

                        aa+

                        (cc-aa)*

                        (i+(z%2)*.4)/8;

                    L(

                        [x,ff,z],

                        [x,ff,z+4],

                        '#87684e40',.5
                    );
                }
            }
        }

        const n=Math.max(

            2,

            Math.round((cc-aa)*3.5)
        );

        const m=Math.max(

            2,

            Math.round((ff-bb)*3.5)
        );

        for(let f=0;f<floors;f++){

            const z=8+14*f;

            for(let j=0;j<n;j++){

                const x=

                    aa+

                    (j+.5)*(cc-aa)/n-

                    .065;

                if(

                    f||

                    Math.abs(x+.065)>.14
                ){

                    windowAt(
                        x,ff,z,.13,9
                    );
                }
            }

            for(let j=0;j<m;j++){

                windowAt(

                    cc,

                    bb+(j+.5)*(ff-bb)/m-.065,

                    z,.13,9,true
                );
            }

            if(f){

                L(

                    [aa,ff,z-4],

                    [cc,ff,z-4],

                    '#f3dfb5',1.3
                );
            }
        }

        door(

            0,ff,2,.09,14,

            accent
        );

        // Timber-framed houses.

        if(

            /tudor|alpine|scandi|japanese|logcabin/.test(id0)
        ){

            for(const x of [aa,0,cc]){

                L(

                    [x,ff,3],

                    [x,ff,H],

                    '#79543d',2.5
                );
            }

            L(

                [aa,ff,18],

                [cc,ff,18],

                '#79543d',2.5
            );
        }

        // Roof styles.

        if(

            modern||

            type==='station'
        ){

            box(

                aa-.04,bb-.04,

                cc+.04,ff+.04,

                H,4,

                roof
            );

            flat(

                aa+.04,bb+.04,

                cc-.04,ff-.04,

                tint(roof,36),

                H+4
            );

            box(

                -.15,-.20,.16,.02,

                H+4,5,

                '#d0cfc0'
            );

        }else{

            roofG(

                aa-.05,bb-.05,

                cc+.05,ff+.05,

                H,

                home?17:13,

                roof,

                /villa|manor|georgian|french|palace/.test(id0)
            );

            box(

                cc-.18,bb+.12,

                cc-.06,bb+.24,

                H+8,14,

                '#b9785b'
            );

            box(

                cc-.20,bb+.10,

                cc-.04,bb+.26,

                H+22,2,

                '#e0ae87'
            );
        }

        // Detailed balconies.

        if(

            home&&

            floors>1&&

            seed%3!==0
        ){

            box(

                -.23,ff,.23,ff+.11,

                18,2,

                '#e6d5b5'
            );

            for(let i=0;i<5;i++){

                L(

                    [-.22+i*.11,ff+.11,20],

                    [-.22+i*.11,ff+.11,26],

                    '#fff0d0',1.2
                );
            }

            L(

                [-.23,ff+.11,26],

                [.23,ff+.11,26],

                '#fff0d0',1.7
            );
        }

        // Victorian and Edwardian turrets.

        if(

            home&&

            /victorian|edwardian/.test(id0)
        ){

            const x=cc-.10;

            const y=ff-.01;

            box(

                x-.12,y-.14,

                x+.12,y+.13,

                0,H+7,

                wall
            );

            windowAt(

                x-.07,y+.13,

                18,.14,12
            );

            face([

                [x-.16,y+.17,H+7],

                [x+.16,y+.17,H+7],

                [x,y,H+26]

            ],

            tint(roof,16));

            face([

                [x+.16,y-.18,H+7],

                [x+.16,y+.17,H+7],

                [x,y,H+26]

            ],

            tint(roof,-17));
        }

        // Dutch stepped gables.

        if(

            home&&

            /dutch/.test(id0)
        ){

            for(let i=0;i<4;i++){

                const w=.28-i*.06;

                box(

                    -w,ff-.02,

                    w,ff+.012,

                    H+i*4,4,

                    wall
                );
            }

            windowAt(

                -.06,ff+.014,

                H+2,.12,8
            );
        }

        // Layered Japanese roofs.

        if(

            home&&

            /japanese/.test(id0)
        ){

            roofG(

                aa-.12,bb-.11,

                cc+.12,ff+.12,

                H-3,12,

                roof,true
            );

            roofG(

                aa+.04,bb+.04,

                cc-.04,ff-.04,

                H+10,10,

                roof,true
            );
        }

        // Classical residential entrances.

        if(

            home&&

            /villa|manor|mansion|colonial|french|georgian/.test(id0)
        ){

            box(

                -.23,ff,.23,ff+.12,

                0,3,

                '#e5d5ad'
            );

            for(const x of [-.20,.20]){

                L(

                    [x,ff+.11,3],

                    [x,ff+.11,17],

                    '#fff0cf',2.3
                );
            }

            face([

                [-.27,ff,20],

                [.27,ff,20],

                [.27,ff+.15,17],

                [-.27,ff+.15,17]

            ],roof);
        }

        // Commercial shopfronts.

        if(shop){

            for(let i=0;i<10;i++){

                const x=

                    aa+(cc-aa)*i/10;

                const u=

                    aa+(cc-aa)*(i+1)/10;

                const col=

                    i%2?'#fff2ce':accent;

                face([

                    [x,ff,19],

                    [u,ff,19],

                    [u,ff+.16,13],

                    [x,ff+.16,13]

                ],col);

                face([

                    [x,ff+.16,13],

                    [u,ff+.16,13],

                    [u,ff+.16,10],

                    [x,ff+.16,10]

                ],

                tint(col,-10));
            }

            sign(title(id),0,ff,23);
        }

        // Classical civic architecture.

        if(type==='civic'){

            for(const x of [

                aa+.08,
                -.16,
                .16,
                cc-.08
            ]){

                L(

                    [x,ff+.15,2],

                    [x,ff+.15,29],

                    '#f9eed0',4
                );
            }

            face([

                [aa,ff+.20,29],

                [cc,ff+.20,29],

                [0,ff+.20,42]

            ],

            '#e6cda1',

            '#baa079');

            sign(

                title(id),

                0,ff+.205,24
            );
        }

        if(type==='station'){

            sign('RAILWAY',0,ff,23);

            flat(

                a,F-.10,C,F,

                '#777f85'
            );

            L(

                [a,F-.05,1],

                [C,F-.05,1],

                '#edd6a2',1.7
            );
        }

        // Gardens and flower beds.

        bush(

            a+.02,F-.02,

            '#79ad56',.8
        );

        bush(

            C-.02,F-.02,

            '#89b85c',.8
        );

        for(let i=0;i<6;i++){

            flower(

                a+.1+i*(C-a-.2)/5,

                F-.02,

                i
            );
        }

        if(X>1||Y>1){

            tree(

                a+.1,b+.1,.60
            );

            tree(

                C-.1,F-.15,.56
            );
        }

    // =================================================
    // 10 — LARGE AIRPORT TERMINALS
    // =================================================

    }else if(type==='airport'){

        box(

            a+.1,b+.15,

            C-.1,F-.45,

            0,30,

            '#eee2c9'
        );

        box(

            a+.04,b+.09,

            C-.04,F-.39,

            30,5,

            '#6b9db0'
        );

        for(let i=0;i<Math.floor(X*5);i++){

            windowAt(

                a+.2+

                i*(X-.4)/Math.floor(X*5),

                F-.45,

                6,.13,18
            );
        }

        sign('AIRPORT',0,F-.45,24);

        box(

            C-.42,b+.25,

            C-.1,b+.6,

            0,70,

            '#e0ddca'
        );

        box(

            C-.49,b+.17,

            C-.03,b+.68,

            70,9,

            '#578ca4'
        );

        flat(

            a,F-.31,C,F,

            '#74848b'
        );

        for(let i=0;i<8;i++){

            L(

                [a+i*(C-a)/8,F-.16,1],

                [a+(i+.5)*(C-a)/8,F-.16,1],

                '#f4e1ac',2
            );
        }

    // =================================================
    // 11 — INDUSTRIAL AND SECURITY FACILITIES
    // =================================================

    }else if(

        type==='factory'||

        type==='compound'
    ){

        const col=

            type==='compound'

                ?'#b8c0a2'

                :'#c9b19a';

        if(type==='factory'){

            for(const x of [

                a+.24,

                a+.52
            ]){

                const [u,v]=P(
                    x,b+.2
                );

                g.fillStyle=gradient(

                    [u-5,v],

                    [u+5,v],

                    '#cf9676',

                    '#8f5c4c'
                );

                g.fillRect(

                    u-5,v-64,

                    10,64
                );

                oval(

                    u,v-64,

                    5,2.4,

                    '#8c5141'
                );
            }
        }

        for(let i=0;i<2;i++){

            const x=

                a+.07+i*(C-a)/2;

            const xx=

                x+(C-a)/2-.11;

            box(

                x,b+.25,

                xx,F-.18,

                0,32,col
            );

            roofG(

                x-.02,b+.22,

                xx+.02,F-.15,

                32,10,

                '#788b94'
            );

            for(let j=0;j<3;j++){

                windowAt(

                    x+.06+j*(xx-x-.13)/3,

                    F-.18,

                    10,.11,12
                );
            }
        }

        if(type==='compound'){

            for(const [x,y] of corners){

                box(

                    x-.04,y-.04,

                    x+.04,y+.04,

                    0,23,

                    '#7f8c77'
                );
            }

            for(const z of [6,13,20]){

                L(

                    [a,F,z],

                    [C,F,z],

                    '#697669',1
                );

                L(

                    [C,b,z],

                    [C,F,z],

                    '#697669',1
                );
            }
        }

        sign(title(id),0,F-.17,25);

    // =================================================
    // 12 — HISTORIC CASTLE COMPLEXES
    // =================================================

    }else if(type==='castle'){

        const stone='#cdbd9f';

        const edge='#e0d1b0';

        function turret(x,y,H){

            box(

                x-.16,y-.16,

                x+.16,y+.16,

                0,H,

                stone
            );

            for(let z=6;z<H;z+=6){

                L(

                    [x-.16,y+.16,z],

                    [x+.16,y+.16,z],

                    '#907f644d',.7
                );
            }

            windowAt(

                x-.045,y+.16,

                H-19,.09,11
            );

            box(

                x-.19,y-.19,

                x+.19,y+.19,

                H,4,

                edge
            );

            for(const u of [

                -.15,0,.15
            ]){

                box(

                    x+u-.035,y+.14,

                    x+u+.035,y+.19,

                    H+4,6,

                    edge
                );

                box(

                    x+.14,y+u-.035,

                    x+.19,y+u+.035,

                    H+4,6,

                    edge
                );
            }
        }

        const xa=a+.17;

        const xb=C-.17;

        const ya=b+.17;

        const yb=F-.17;

        turret(xa,ya,49);

        turret(xb,ya,54);

        box(

            xa,ya,xb,ya+.14,

            0,23,stone
        );

        box(

            xa,ya,xa+.14,yb,

            0,23,stone
        );

        const kw=Math.min(

            .57,(C-a)*.28
        );

        const kd=Math.min(

            .55,(F-b)*.28
        );

        box(

            -kw,-kd,kw,kd,

            0,43,stone
        );

        roofG(

            -kw-.04,-kd-.04,

            kw+.04,kd+.04,

            43,19,

            '#687e8d',true
        );

        for(const x of [

            -kw+.08,

            kw-.22
        ]){

            windowAt(

                x,kd,

                23,.14,14
            );
        }

        door(0,kd,0,.13,16);

        box(

            xa,yb-.13,xb,yb,

            0,23,stone
        );

        box(

            xb-.13,ya,xb,yb,

            0,23,stone
        );

        for(let z=5;z<23;z+=5){

            L(

                [xa,yb,z],

                [xb,yb,z],

                '#927e6550',.75
            );

            L(

                [xb,ya,z],

                [xb,yb,z],

                '#927e6550',.75
            );
        }

        for(

            let i=0;

            i<=Math.floor((xb-xa)*5);

            i++
        ){

            const x=xa+i*.2;

            if(x<xb){

                box(

                    x-.045,yb-.14,

                    x+.045,yb,

                    23,5,edge
                );
            }
        }

        for(

            let i=0;

            i<=Math.floor((yb-ya)*5);

            i++
        ){

            const y=ya+i*.2;

            if(y<yb){

                box(

                    xb-.14,y-.045,

                    xb,y+.045,

                    23,5,edge
                );
            }
        }

        door(

            0,yb+.002,

            0,.18,18,

            '#765b45'
        );

        for(const z of [5,10,15]){

            L(

                [-.18,yb+.006,z],

                [.18,yb+.006,z],

                '#a68c65',1
            );
        }

        turret(xa,yb,48);

        turret(xb,yb,54);

        tree(

            xa+.33,yb-.30,.46
        );

        tree(

            xb-.32,ya+.35,.46
        );

    // =================================================
    // 13 — LARGE PARKS AND ZOO ATTRACTIONS
    // =================================================

    }else if(

        type==='park'||

        type==='zoo'
    ){

        flat(

            -.10,b,.10,F,

            '#e8d6ac'
        );

        flat(

            a,-.10,C,.10,

            '#e8d6ac'
        );

        for(const [x,y] of corners){

            tree(

                x*.72,y*.72,

                .72,

                type==='park'

                    ?'#e4a5bf'

                    :'#80b35e'
            );
        }

        const q=P(0,0);

        oval(

            ...q,

            HW*X*.32,

            HH*Y*.35,

            '#d1c6a9'
        );

        oval(

            q[0],q[1]-1,

            HW*X*.28,

            HH*Y*.28,

            gradient(

                [-25,-12],

                [25,12],

                '#a1deda',

                '#54a7be'
            )
        );

        if(type==='zoo'){

            for(const [x,y] of corners){

                box(

                    x-.035,y-.035,

                    x+.035,y+.035,

                    0,16,

                    '#b18e61'
                );
            }

            for(const z of [6,12]){

                L(

                    [a,F,z],

                    [C,F,z],

                    '#a58a5e',1.5
                );

                L(

                    [C,b,z],

                    [C,F,z],

                    '#a58a5e',1.5
                );
            }

            for(let i=0;i<3;i++){

                const [x,y]=P(

                    a+.3+i*.25,

                    F-.38
                );

                const col=

                    /elephant|penguin|panda/.test(id0)

                        ?'#9ca9ab'

                        :'#d9b37a';

                oval(

                    x,y-7,8,5,col
                );

                for(const n of [-4,4]){

                    ln(

                        [x+n,y-4],

                        [x+n,y+2],

                        '#8e7655',1.8
                    );
                }

                if(

                    /giraffe|zoo|safari/.test(id0)
                ){

                    ln(

                        [x+5,y-8],

                        [x+7,y-22],

                        col,5
                    );

                    oval(

                        x+9,y-23,

                        4,3,col
                    );

                }else{

                    oval(

                        x+6,y-9,

                        4,4,col
                    );
                }
            }

        }else{

            for(let i=0;i<12;i++){

                flower(

                    a+.15+i*(C-a-.3)/11,

                    F-.1,

                    i
                );
            }
        }

    // =================================================
    // 14 — SPORTS STADIUMS
    // =================================================

    }else if(type==='stadium'){

        const rx=(X+Y)*HW*.40;

        const ry=(X+Y)*HH*.36;

        oval(

            0,2,rx,ry,

            '#9b9a89'
        );

        oval(

            0,-3,

            rx*.94,ry*.94,

            '#e0d4ba'
        );

        oval(

            0,-5,

            rx*.80,ry*.75,

            '#739bb0'
        );

        oval(

            0,-5,

            rx*.65,ry*.58,

            '#87b761'
        );

        flat(

            -X*.22,-Y*.22,

            X*.22,Y*.22,

            '#83b16a',4
        );

        for(const x of [

            -X*.22,0,X*.22
        ]){

            L(

                [x,-Y*.22,5],

                [x,Y*.22,5],

                '#f8efd7',1.2
            );
        }

        for(const y of [

            -Y*.22,Y*.22
        ]){

            L(

                [-X*.22,y,5],

                [X*.22,y,5],

                '#f8efd7',1.2
            );
        }

        for(let i=0;i<20;i++){

            const q=i*Math.PI/10;

            oval(

                rx*.87*Math.cos(q),

                -3+ry*.85*Math.sin(q),

                3,1.5,

                [
                    '#eac36d',
                    '#d88576',
                    '#85b3c2'
                ][i%3]
            );
        }

    // =================================================
    // 15 — FUNFAIR AND CIRCUS GRAPHICS
    // =================================================

    }else if(type==='circus'){

        const rx=Math.min(

            65,(X+Y)*HW*.33
        );

        const ry=Math.min(

            24,(X+Y)*HH*.27
        );

        oval(

            0,2,rx,ry,

            '#b39c7c'
        );

        oval(

            0,-5,

            rx*.94,ry*.9,

            '#e8d2a8'
        );

        for(let i=0;i<12;i++){

            const l=

                -rx+i*2*rx/12;

            const u=

                l+2*rx/12;

            poly([

                [

                    l,

                    -4+ry*.3*

                    Math.sqrt(

                        Math.max(
                            0,
                            1-l*l/(rx*rx)
                        )
                    )
                ],

                [

                    u,

                    -4+ry*.3*

                    Math.sqrt(

                        Math.max(
                            0,
                            1-u*u/(rx*rx)
                        )
                    )
                ],

                [0,-78]

            ],

            i%2?'#f6e3ba':'#c85e55',

            '#9a5c4b30');
        }

        oval(

            0,1,10,6,

            '#685149'
        );

        ln(

            [0,-78],

            [0,-90],

            '#9b805e',2
        );

        poly([

            [0,-90],

            [18,-85],

            [0,-79]

        ],

        '#f2d377');

    }else if(type==='coaster'){

        const route=[

            [a,F,9],

            [a+.25,F,28],

            [0,F,75],

            [C-.25,F,43],

            [C,F,12],

            [C,b,35],

            [0,b,56],

            [a,b,18],

            [a,F,9]
        ];

        for(const p of route){

            L(

                [p[0],p[1],0],

                p,

                '#a18969',3
            );
        }

        for(let i=1;i<route.length;i++){

            L(

                route[i-1],

                route[i],

                '#77564a',6
            );

            L(

                route[i-1],

                route[i],

                '#cd7160',3.5
            );
        }

        box(

            -.18,F-.07,

            .02,F+.05,

            48,7,

            '#e3b963'
        );
    }

    // Find visible sprite bounds to improve catalogue size.

    const rgba=g.getImageData(

        0,0,c.width,c.height

    ).data;

    let l=c.width;

    let t=c.height;

    let rgt=0;

    let btm=0;

    for(let y=0;y<c.height;y++){

        for(let x=0;x<c.width;x++){

            if(

                rgba[(y*c.width+x)*4+3]>20
            ){

                if(x<l)l=x;

                if(x>rgt)rgt=x;

                if(y<t)t=y;

                if(y>btm)btm=y;
            }
        }
    }

    const bounds=[

        l,t,

        Math.max(1,rgt-l+1),

        Math.max(1,btm-t+1)
    ];

    const result={

        c,width,height,origin,bounds
    };

    artCache.set(k,result);

    // Bounded cache for lower-memory computers.

    if(artCache.size>48){

        artCache.delete(

            artCache.keys().next().value
        );
    }

    return result;
}

// =====================================================
// 16 — TEXTURED LANDSCAPE RENDERING
// =====================================================

const tileCache=new Map();

visible=function(t){

    const [x,y]=project(t.x,t.y);

    const sx=x*zoom+camX;

    const sy=y*zoom+camY;

    return (

        sx>-290*zoom&&

        sx<W+290*zoom&&

        sy>-100*zoom&&

        sy<H+270*zoom
    );
};

function ground(t){

    const code=

        t.type+':'+

        Math.floor(t.variant*8);

    if(tileCache.has(code)){

        return tileCache.get(code);
    }

    const c=document.createElement('canvas');

    c.width=HW*4;

    c.height=HH*4;

    const g=c.getContext('2d');

    g.scale(2,2);

    g.translate(HW,HH);

    const v=t.variant;

    const water=t.type==='water';

    const sand=t.type==='sand';

    const colors=

        water

            ?['#68bfd5','#50adc9']

            :sand

                ?['#f7dfae','#eac68d']

                :['#a7d378','#9dc96f'];

    const grad=g.createLinearGradient(

        -HW,-HH,

        HW,HH
    );

    grad.addColorStop(0,colors[0]);

    grad.addColorStop(1,colors[1]);

    g.beginPath();

    g.moveTo(0,-HH);

    g.lineTo(HW,0);

    g.lineTo(0,HH);

    g.lineTo(-HW,0);

    g.closePath();

    g.fillStyle=grad;

    g.fill();

    g.clip();

    for(let i=0;i<16;i++){

        const a=

            (
                hash(i,Math.floor(v*8),21)-.5
            )*HW*1.7;

        const b=

            (
                hash(i,Math.floor(v*8),34)-.5
            )*HH*1.6;

        g.fillStyle=

            water

                ?'#d2f4ec38'

                :sand

                    ?'#bc98582a'

                    :'#609c4c25';

        g.fillRect(

            a,b,

            water?4+i%6:1.4,

            water?.7:1.4
        );
    }

    tileCache.set(code,c);

    return c;
}

drawTile=function(t){

    const k=key(t.x,t.y);

    const id=town.buildings[k]?.type;

    if(

        ROAD.has(id)||

        TRACK.has(id)||

        id==='path'
    ){

        old.drawTile(t);

    }else{

        const [x,y]=project(t.x,t.y);

        ctx.drawImage(

            ground(t),

            x-HW,y-HH,

            HW*2,HH*2
        );
    }

    // Road bridge railings.

    if(town.buildings[k]?.bridge){

        const p=project(t.x,t.y);

        ctx.save();

        ctx.translate(...p);

        const arms=D.filter(

            ([x,y])=>ROAD.has(

                town.buildings[

                    key(t.x+x,t.y+y)

                ]?.type
            )
        );

        for(const [x,y] of

            arms.length

                ?arms

                :[[1,0],[-1,0]]
        ){

            for(const o of [-.34,.34]){

                line(

                    project(-y*o,x*o,3),

                    project(

                        x*.5-y*o,

                        y*.5+x*o,

                        3
                    ),

                    '#e7d4b3',

                    2
                );
            }
        }

        ctx.restore();
    }

    // Unowned expansion areas.

    if(!owned(t.x,t.y)){

        ctx.save();

        ctx.translate(

            ...project(t.x,t.y)
        );

        diamond('#203c3750');

        ctx.restore();
    }
};

// =====================================================
// 17 — MULTI-TILE BUILDING RENDERER
// =====================================================

drawObject=function(t){

    const k=key(t.x,t.y);

    const a=occupied.get(k);

    if(!a)return old.drawObject(t);

    const b=town.buildings[a];

    if(!b)return;

    const [x,y]=xy(a);

    const w=b.w||1;

    const h=b.h||1;

    if(

        t.x!==x+w-1||

        t.y!==y+h-1

    )return;

    if(

        ROAD.has(b.type)||

        TRACK.has(b.type)||

        b.type==='path'

    )return;

    const [cx,cy]=project(

        x+(w-1)/2,

        y+(h-1)/2
    );

    const img=detailed(

        b.type,w,h,

        b.rot||0
    );

    ctx.save();

    if(moving===a){

        ctx.globalAlpha=.45;
    }

    if(img){

        ctx.drawImage(

            img.c,

            cx-img.width/2,

            cy-img.origin,

            img.width,img.height
        );

    }else{

        // Preserve artwork for existing catalogue items.

        const [ax,ay]=project(x,y);

        ctx.translate(cx,cy);

        const s=Math.min(

            2.2,

            Math.sqrt(w*h)
        );

        ctx.scale(

            (b.rot?-1:1)*s,

            s
        );

        ctx.translate(-ax,-ay);

        old.drawObject({

            ...t,x,y
        });
    }

    ctx.restore();

    // Display crop growth and harvest readiness.

    if(b.crop){

        const c=b.crop;

        const ready=

            c.ready<=state.tick;

        ctx.save();

        ctx.translate(cx,cy);

        disc(

            0,-22,7,4,

            ready

                ?'#e7c64e'

                :'#6e9f59'
        );

        ctx.font='bold 7px sans-serif';

        ctx.fillStyle='#fff9e3';

        ctx.textAlign='center';

        ctx.fillText(

            ready

                ?'✓'

                :String(c.ready-state.tick),

            0,-19.5
        );

        ctx.restore();
    }
};

// =====================================================
// 18 — MOVING SERVICE VEHICLES
// =====================================================

function drawVehicle(
    route,time,
    metro=false
){

    const n=route.route.length-1;

    if(n<1)return;

    const p=

        (time*(metro?1.5:.8))%(2*n);

    const a=p<=n?p:2*n-p;

    const i=Math.min(

        n-1,

        Math.floor(a)
    );

    const f=a-i;

    const [x,y]=xy(route.route[i]);

    const [u,v]=xy(route.route[i+1]);

    const pos=project(

        x+(u-x)*f,

        y+(v-y)*f
    );

    ctx.save();

    ctx.translate(...pos);

    ctx.rotate(

        Math.atan2(

            (u-x+v-y)*HH,

            (u-x-v+y)*HW
        )
    );

    disc(

        0,2,9,4,

        '#354a3540'
    );

    ctx.fillStyle=route.col;

    ctx.fillRect(-8,-6,16,7);

    ctx.fillStyle='#cde2df';

    ctx.fillRect(3,-5,4,4);

    ctx.fillStyle='#fff4ce';

    ctx.fillRect(-6,-7,5,2);

    ctx.restore();
}

// =====================================================
// 19 — WORLD AND UNDERGROUND MAP VIEWS
// =====================================================

render=function(){

    old.render();

    ctx.setTransform(

        DPR,0,0,DPR,0,0
    );

    ctx.translate(camX,camY);

    ctx.scale(zoom,zoom);

    const now=performance.now()/1000;

    if(layer==='surface'){

        if(

            hover&&

            inside(hover.x,hover.y)&&

            ['bridge','expand'].includes(mode)
        ){

            ctx.save();

            ctx.translate(

                ...project(hover.x,hover.y)
            );

            diamond(

                '#f6e1a34c',

                '#ffdf87'
            );

            ctx.restore();
        }

        for(let i=0;i<serviceRoutes.length;i++){

            drawVehicle(

                serviceRoutes[i],

                now+i
            );
        }

        // Show the complete construction footprint.

        if(

            hover&&

            inside(hover.x,hover.y)&&

            ['build','move'].includes(mode)
        ){

            const b=moving

                ?town.buildings[moving]

                :null;

            const [w,h]=b

                ?[b.w||1,b.h||1]

                :dimensions(
                    selected,rotation
                );

            const ok=valid(

                hover.x,hover.y,

                w,h,

                moving||null,

                !!b?.bridge
            );

            if(w*h>1){

                for(const [x,y] of cells(

                    hover.x,hover.y,w,h
                )){

                    ctx.save();

                    ctx.translate(

                        ...project(x,y)
                    );

                    diamond(

                        ok

                            ?'#ffe4a455'

                            :'#db665d55',

                        ok

                            ?'#fff0b2'

                            :'#b5423b'
                    );

                    ctx.restore();
                }
            }
        }

    }else{

        const col=layers[layer].col;

        const net=state.net[layer];

        ctx.save();

        ctx.globalAlpha=.65;

        for(const t of tiles.filter(visible)){

            ctx.save();

            ctx.translate(

                ...project(t.x,t.y)
            );

            diamond('#e7e6cb55');

            ctx.restore();
        }

        ctx.restore();

        // Draw connected underground lines.

        for(const k of Object.keys(net)){

            const [x,y]=xy(k);

            const p=project(x,y);

            for(const [a,b] of D){

                if(net[key(x+a,y+b)]){

                    line(

                        p,

                        project(x+a,y+b),

                        col,5
                    );
                }
            }

            disc(...p,4,3,col);

            disc(...p,1.5,1.5,'#fff4d5');
        }

        if(layer==='metro'){

            for(let i=0;i<metroRoutes.length;i++){

                drawVehicle(

                    metroRoutes[i],

                    now+i,

                    true
                );
            }
        }

        if(

            hover&&

            inside(hover.x,hover.y)
        ){

            ctx.save();

            ctx.translate(

                ...project(hover.x,hover.y)
            );

            diamond('#ffffff35',col);

            ctx.restore();
        }
    }
};

// =====================================================
// 20 — TOWN MANAGEMENT INTERFACE
// =====================================================

function el(tag,text,parent){

    const e=document.createElement(tag);

    if(text!==undefined){

        e.textContent=text;
    }

    if(parent)parent.append(e);

    return e;
}

function button(text,fn,parent){

    const b=el('button',text,parent);

    b.onclick=fn;

    return b;
}

const tool=el('div',undefined);

tool.id='v7tools';

$('tools').after(tool);

button(

    'Inspect',

    ()=>{

        setLayer('surface');

        selectMode('inspect');
    },

    tool
);

button(

    'Rotate ↻',

    ()=>{

        rotation=1-rotation;

        if(mode==='build'){

            selectMode('build');

        }else if(

            inspected&&

            town.buildings[inspected]
        ){

            rotateBuilding(inspected);
        }

        dirty=true;
    },

    tool
);

button(

    'Bridge',

    ()=>{

        setLayer('surface');

        selectMode('bridge');
    },

    tool
);

button(

    'Buy land',

    ()=>{

        setLayer('surface');

        selectMode('expand');
    },

    tool
);

const oldMetro=[...$('tools').children]

    .find(b=>b.textContent==='Metro view');

if(oldMetro){

    oldMetro.onclick=()=>

        setLayer(

            layer==='metro'

                ?'surface'

                :'metro'
        );
}

const layerSelect=el(

    'select',

    undefined,

    tool
);

layerSelect.id='v7layer';

for(const [v,n] of [

    ['surface','Surface'],

    ['power','Electricity'],

    ['water','Water pipes'],

    ['sewage','Sewage'],

    ['metro','Metro']
]){

    const o=el(

        'option',n,layerSelect
    );

    o.value=v;
}

layerSelect.onchange=()=>

    setLayer(layerSelect.value);

button(

    'Town management',

    ()=>{

        inspected=null;

        openPanel();
    },

    tool
);

// Selecting a normal building returns to the surface.

$('catalogue').addEventListener(

    'click',

    e=>{

        if(

            e.target.closest('[data-type]')&&

            layer!=='surface'
        ){

            setLayer('surface');
        }
    },

    true
);

const panel=el(

    'section',

    undefined,

    document.body
);

panel.id='v7panel';

panel.hidden=true;

function openPanel(){

    panel.hidden=false;

    refreshPanel();
}

function row(parent,label,value){

    const p=el(

        'div',

        undefined,

        parent
    );

    p.className='v7row';

    el('span',label,p);

    el('strong',String(value),p);

    return p;
}

function refreshPanel(){

    if(panel.hidden||!report)return;

    const scroll=panel.scrollTop;

    const chosen=

        panel.querySelector('#v7cropSelect')?.value;

    panel.replaceChildren();

    const header=el(

        'div',

        undefined,

        panel
    );

    header.className='v7head';

    el(

        'strong',

        'Town management',

        header
    );

    button(

        'Close ×',

        ()=>panel.hidden=true,

        header
    );

    const r=report;

    row(

        panel,

        'Gross income / 10s',

        money(r.gross)
    );

    row(

        panel,

        'Operating costs / 10s',

        money(r.expenses)
    );

    row(

        panel,

        'Net income / 10s',

        money(r.net)
    );

    row(

        panel,

        'Housing capacity',

        r.pop
    );

    row(

        panel,

        'Jobs filled / available',

        r.employed+' / '+r.jobs
    );

    row(

        panel,

        'Happiness',

        r.happiness+'%'
    );

    row(

        panel,

        'Visitor activity',

        r.visitors
    );

    row(

        panel,

        'Waste capacity / demand',

        r.waste+' / '+r.trash
    );

    row(

        panel,

        'Education / health / safety capacity',

        Object.values(r.svc).join(' / ')
    );

    // Tax management.

    const t=el(

        'div',

        undefined,

        panel
    );

    t.className='v7row';

    el(

        'span',

        'Local tax: '+state.tax+'%',

        t
    );

    button(

        '−',

        ()=>{

            state.tax=Math.max(

                0,state.tax-1
            );

            changed();
        },

        t
    );

    button(

        '+',

        ()=>{

            state.tax=Math.min(

                20,state.tax+1
            );

            changed();
        },

        t
    );

    // Optional infrastructure enforcement.

    const check=el(

        'label',

        undefined,

        panel
    );

    const input=el(

        'input',

        undefined,

        check
    );

    input.type='checkbox';

    input.checked=state.strict;

    input.onchange=()=>{

        state.strict=input.checked;

        changed();
    };

    check.append(

        ' Enforce utility shortages (reduces income and production)'
    );

    el(

        'h3',

        'Underground infrastructure',

        panel
    );

    for(const [i,l] of [

        'power','water','sewage'

    ].entries()){

        const n=r.nets[i];

        row(

            panel,

            l+' connected / installed',

            n.connected+' / '+n.installed
        );

        row(

            panel,

            l+' served / demand',

            n.served+' / '+n.need
        );
    }

    el(

        'p',

        'Choose a layer, then Build. Connect lines to the source and to the buildings you want served.',

        panel
    );

    // Individual property management.

    const b=

        inspected&&

        town.buildings[inspected];

    if(b){

        el(

            'h3',

            title(b.type),

            panel
        );

        row(

            panel,

            'Footprint',

            (b.w||1)+' × '+(b.h||1)
        );

        row(

            panel,

            'Road access',

            roadAccess(inspected,b)

                ?'Connected'

                :'Not connected'
        );

        row(

            panel,

            'Utilities satisfied',

            (r.coverage[inspected]??3)+' / 3'
        );

        button(

            'Rotate building',

            ()=>rotateBuilding(inspected),

            panel
        );

        // Farm management.

        if(fieldCrop[bare(b.type)]){

            const k=inspected;

            if(b.crop){

                row(

                    panel,

                    'Crop',

                    b.crop.kind
                );

                row(

                    panel,

                    'Growth',

                    b.crop.ready<=state.tick

                        ?'Ready to harvest'

                        :(b.crop.ready-state.tick)+
                            ' cycles'
                );

                button(

                    'Harvest',

                    ()=>harvest(k),

                    panel
                );

            }else{

                const s=el(

                    'select',

                    undefined,

                    panel
                );

                s.id='v7cropSelect';

                for(const c of

                    ['farm','greenhouse']

                    .includes(bare(b.type))

                        ?Object.keys(crops)

                        :[fieldCrop[bare(b.type)]]
                ){

                    const o=el(

                        'option',c,s
                    );

                    o.value=c;
                }

                if(

                    chosen&&

                    [...s.options].some(

                        o=>o.value===chosen
                    )
                ){

                    s.value=chosen;
                }

                button(

                    'Plant seeds (£8)',

                    ()=>plant(k,s.value),

                    panel
                );
            }
        }

        // Festival management.

        if(festivals.has(bare(b.type))){

            button(

                'Host festival (£60)',

                ()=>startFestival(inspected),

                panel
            );
        }
    }

    if(state.event){

        row(

            panel,

            'Active festival',

            state.event.name+

            ' • '+

            (state.event.end-state.tick)+

            ' cycles left'
        );
    }

    // Stored goods and trading.

    el(

        'h3',

        'Warehouse and exports',

        panel
    );

    const goods=Object.entries(

        state.stock

    ).filter(

        ([,v])=>v>0
    );

    if(!goods.length){

        el(

            'p',

            'No goods yet. Harvest crops or construct producers.',

            panel
        );
    }

    for(const [k,n] of goods){

        const a=row(

            panel,

            k+' × '+n,

            money(salePrices[k]||8)+'/unit'
        );

        button(

            'Sell 10',

            ()=>sellStock(k),

            a
        );

        button(

            'Sell all',

            ()=>sellStock(k,true),

            a
        );
    }

    // Achievement register.

    el(

        'h3',

        'Achievements and rewards',

        panel
    );

    for(const [

        id,name,,gold,reward

    ] of awards){

        row(

            panel,

            (
                town.awards[id]

                    ?'✓ '

                    :'○ '
            )+name,

            gold+' gold'+

            (reward?' + building':'')
        );
    }

    for(const [id,t] of Object.entries(

        rewardTypes
    )){

        if(TYPES[id]){

            button(

                'Build '+t.name+

                ' • '+t.goldCost+' gold',

                ()=>{

                    selected=id;

                    setLayer('surface');

                    selectMode('build');

                    panel.hidden=true;
                },

                panel
            );
        }
    }

    el(

        'p',

        'A cycle is 10 seconds while the game is running. No real-money purchases.',

        panel
    );

    panel.scrollTop=scroll;
}

// =====================================================
// 21 — HEADS-UP DISPLAY
// =====================================================

const happiness=el(

    'div',

    undefined,

    $('hud')
);

happiness.className='stat';

happiness.innerHTML=

    '<small>Happiness</small>'+

    '<b id="v7happy">—</b>';

hud=function(){

    old.hud();

    const r=report||calculate();

    $('v7happy').textContent=

        r.happiness+'%';

    if($('utilityNumbers')){

        $('utilityNumbers').textContent=

            r.nets.map(

                n=>n.served+'/'+n.need

            ).join(' · ');

        $('utilityNumbers')

            .previousElementSibling

            .textContent=

                'Power / Water / Sewage';

        $('utilityNumbers')

            .parentElement.title=

                'Connected service / demand: electricity, water, sewage';
    }

    const label=

        $('income').previousElementSibling;

    if(label){

        label.textContent='Net / 10s';
    }
};

// =====================================================
// 22 — LARGER CATALOGUE ILLUSTRATIONS
// =====================================================

function decorateCards(){

    for(const card of

        $('catalogue')

        .querySelectorAll('[data-type]')
    ){

        const id=card.dataset.type;

        const t=TYPES[id];

        if(!t)continue;

        const [w,h]=dimensions(id);

        const c=card.querySelector('canvas');

        const img=detailed(id,w,h);

        if(c&&img){

            const g=c.getContext('2d');

            g.clearRect(

                0,0,c.width,c.height
            );

            const [x,y,w,h]=img.bounds;

            const factor=Math.min(

                (c.width-8)/w,

                (c.height-6)/h
            );

            g.drawImage(

                img.c,

                x,y,w,h,

                (c.width-w*factor)/2,

                (c.height-h*factor)/2,

                w*factor,

                h*factor
            );
        }

        card.title=

            t.name+

            ' • '+w+' × '+h+

            ' tiles • '+money(t.cost);

        if(!card.querySelector('.v7foot')){

            const x=el(

                'small',

                w+'×'+h+' tiles',

                card
            );

            x.className='v7foot';
        }
    }
}

// =====================================================
// 23 — POLISHED INTERFACE STYLING
// =====================================================

const css=el(

    'style',

    undefined,

    document.head
);

css.textContent=`

#v7panel{

    position:absolute;

    top:75px;

    right:12px;

    width:min(
        395px,
        calc(100vw - 24px)
    );

    max-height:calc(100dvh - 175px);

    overflow:auto;

    z-index:25;

    background:#fff2d9;

    color:#584333;

    border:2px solid #a5805c;

    border-radius:15px;

    padding:13px;

    box-shadow:
        0 8px 28px #273b3d55;

    font-size:12px;
}

#v7panel[hidden]{

    display:none;
}

#v7panel h3{

    font-size:14px;

    margin:12px 0 6px;

    border-bottom:
        1px solid #d4b998;

    padding-bottom:5px;
}

#v7panel p{

    font-size:11px;

    line-height:1.4;

    color:#765d46;
}

#v7panel button,
#v7panel select,
#v7layer{

    background:#e4d1ad;

    color:#5b4634;

    border:1px solid #bda17f;

    border-radius:7px;

    padding:5px 8px;

    font:inherit;

    cursor:pointer;
}

#v7panel button{

    margin:3px 2px;
}

#v7panel label{

    display:flex;

    gap:5px;

    align-items:center;

    margin:8px 0;
}

.v7row,
.v7head{

    display:flex;

    gap:6px;

    align-items:center;

    justify-content:space-between;

    padding:3px 0;

    flex-wrap:wrap;
}

.v7row span{

    flex:1;
}

.v7head strong{

    font-size:16px;
}

.v7foot{

    color:#8a745a!important;

    font-size:9px!important;
}

#catalogue .item{

    height:153px;

    min-height:153px;

    grid-template-rows:

        86px 29px 13px 12px;
}

#tools{

    align-items:center;
}

#v7tools{

    display:flex;

    gap:5px;

    overflow-x:auto;

    align-items:center;

    padding-top:5px;

    scrollbar-width:thin;
}

#v7tools button{

    flex:none;

    border-radius:7px;

    background:#dec8a6;

    color:#674a34;

    padding:6px 9px;

    border:1px solid #c3a685;

    white-space:nowrap;
}

#v7tools button:last-child{

    background:#9bc395;

    color:#284f38;
}

#v7layer{

    flex:none;

    max-width:125px;
}

@media(max-height:480px){

    #catalogue .item{

        height:106px;

        min-height:106px;

        grid-template-rows:

            45px 25px 12px 12px;
    }

    #v7panel{

        top:48px;

        max-height:calc(100dvh - 65px);
    }
}

`;

// =====================================================
// 24 — ACTIVATE LIVING SOCIETY
// =====================================================


/* =====================================================
   TOWN BUILDER V0.8
   MARITIME & COASTAL DEVELOPMENT

   INSERT INSIDE V0.7 BEFORE:
   new MutationObserver(decorateCards)
   ===================================================== */

// =====================================================
// 25 — MARITIME CATALOGUE
// =====================================================

TYPES.v8_shippingPort={

    name:'Commercial shipping port',

    cost:1200,
    rent:65,
    pop:0,

    group:'Business',
    section:'Waterfront'
};

sizes.v8_shippingPort=[3,2];

sizes.fishingHarbour=[2,1];

const seaPorts=new Set([

    'v6_fishingHarbour',

    'v8_shippingPort'
]);

const coastalTypes=new Set([

    ...seaPorts,

    'harbour',

    'v6_marina',
    'v6_ferry',
    'v6_pier',

    'v6_boatHire',
    'v6_yachtClub',
    'v6_beachClub',

    'v6_lifeguard',
    'v6_beachCafe',
    'v6_boathouse',

    'v6_lighthouse',
    'v6_fishingHarbour'
]);

state.sea??={};

state.seaStats??={

    fishingTrips:0,
    cargoTrips:0,
    fishCaught:0
};

salePrices.fish=14;

const seaDirections=[

    [0,1],
    [1,0],
    [0,-1],
    [-1,0]
];

const facingNames=[

    'South-east',
    'South-west',
    'North-west',
    'North-east'
];

let plannedFacing=null;

let lastCoastalSelection=null;

let lastSeaTick=performance.now();

// =====================================================
// 26 — COASTAL PLACEMENT RULES
// =====================================================

function navigableWater(x,y){

    return (

        inside(x,y)&&

        terrain(x,y)==='water'
    );
}

function shoreSides(x,y,w,h){

    const result=[];

    for(let d=0;d<4;d++){

        const [dx,dy]=seaDirections[d];

        const waterTiles=[];

        for(const [a,b] of cells(x,y,w,h)){

            const nx=a+dx;
            const ny=b+dy;

            if(

                nx>=x&&nx<x+w&&

                ny>=y&&ny<y+h

            )continue;

            if(navigableWater(nx,ny)){

                waterTiles.push(
                    key(nx,ny)
                );
            }
        }

        if(waterTiles.length){

            result.push({

                facing:d,

                tiles:[
                    ...new Set(waterTiles)
                ]
            });
        }
    }

    return result;
}

const previousValid=valid;

valid=function(

    x,y,w,h,

    ignore=null,

    bridge=false
){

    const id=

        ignore&&town.buildings[ignore]

            ?town.buildings[ignore].type

            :selected;

    if(

        bridge||

        !coastalTypes.has(id)

    ){

        return previousValid(

            x,y,w,h,

            ignore,bridge
        );
    }

    const available=cells(x,y,w,h)

        .every(([a,b])=>{

            if(!inside(a,b))return false;

            if(!owned(a,b))return false;

            const ground=terrain(a,b);

            if(

                ground!=='grass'&&

                ground!=='sand'

            )return false;

            const occupant=

                occupied.get(key(a,b));

            return (

                !occupant||

                occupant===ignore
            );
        });

    return (

        available&&

        shoreSides(x,y,w,h).length>0
    );
};

// =====================================================
// 27 — FOUR-DIRECTION MARITIME ROTATION
// =====================================================

function harbourFacing(k,b){

    if(Number.isInteger(b.facing)){

        return (

            (b.facing%4)+4

        )%4;
    }

    const sides=shoreSides(

        ...xy(k),

        b.w||1,

        b.h||1
    );

    return sides[0]?.facing??0;
}

function alignHarbour(k,b,preferred=null){

    const sides=shoreSides(

        ...xy(k),

        b.w||1,

        b.h||1
    );

    const match=sides.find(

        s=>s.facing===preferred
    );

    b.facing=

        match?.facing??

        sides[0]?.facing??

        preferred??

        0;

    b.rot=b.facing%2;
}

const previousRotate=rotateBuilding;

rotateBuilding=function(k){

    const b=town.buildings[k];

    if(!b)return;

    if(!seaPorts.has(b.type)){

        return previousRotate(k);
    }

    if(state.sea[k]){

        message(

            'Wait for the vessel to return before rotating this port.'
        );

        return;
    }

    const [x,y]=xy(k);

    const next=

        (harbourFacing(k,b)+1)%4;

    const w=b.h||1;

    const h=b.w||1;

    if(!valid(x,y,w,h,k)){

        message(

            'Not enough coastal space to rotate this harbour.'
        );

        return;
    }

    b.w=w;

    b.h=h;

    b.facing=next;

    b.rot=next%2;

    changed(

        'Harbour rotated • Quay faces '+

        facingNames[next],

        true
    );
};

const seaRotateButton=[

    ...$('v7tools').querySelectorAll('button')

].find(

    b=>b.textContent.includes('Rotate')
);

if(seaRotateButton){

    seaRotateButton.onclick=()=>{

        if(

            mode==='build'&&

            seaPorts.has(selected)

        ){

            plannedFacing=

                ((plannedFacing??0)+1)%4;

            rotation=plannedFacing%2;

            selectMode('build');

            dirty=true;

            return;
        }

        if(

            mode==='inspect'&&

            inspected&&

            town.buildings[inspected]

        ){

            rotateBuilding(inspected);

            return;
        }

        rotation=1-rotation;

        if(mode==='build'){

            selectMode('build');
        }

        dirty=true;
    };
}

// =====================================================
// 28 — COASTAL CONSTRUCTION AND MANAGEMENT
// =====================================================

const previousSeaAct=act;

act=function(x,y){

    if(!inside(x,y))return;

    if(layer!=='surface'){

        return previousSeaAct(x,y);
    }

    const k=key(x,y);

    const hit=recordAt(x,y);

    // Protect ports while their boats are at sea.

    if(

        ['sell','bulldoze','move'].includes(mode)&&

        hit&&

        state.sea[hit.k]

    ){

        message(

            'This port has a vessel at sea. Wait for it to return.'
        );

        return;
    }

    if(

        moving&&

        state.sea[moving]

    ){

        message(

            'Cannot relocate a port while its vessel is away.'
        );

        return;
    }

    const before=town.buildings[k];

    const movingFrom=moving;

    const placing=

        mode==='build'&&

        coastalTypes.has(selected);

    if(placing){

        const [w,h]=dimensions(

            selected,rotation
        );

        if(!valid(x,y,w,h)){

            message(

                'Choose clear, owned coastal grass or sand beside water. '+

                'Required space: '+w+' × '+h+'.'
            );

            return;
        }
    }

    previousSeaAct(x,y);

    const after=town.buildings[k];

    // Automatically face newly constructed quays
    // towards an available water tile.

    if(

        placing&&

        after&&

        after!==before&&

        seaPorts.has(after.type)

    ){

        alignHarbour(

            k,after,plannedFacing
        );

        changed(

            title(after.type)+

            ' built • Quay faces '+

            facingNames[after.facing],

            true
        );
    }

    // Realign a relocated harbour.

    if(

        movingFrom&&

        !moving&&

        after&&

        after!==before&&

        seaPorts.has(after.type)

    ){

        alignHarbour(

            k,after,after.facing
        );

        changed(

            'Harbour relocated.',

            true
        );
    }
};

const previousSeaMode=selectMode;

selectMode=function(m){

    previousSeaMode(m);

    if(

        layer==='surface'&&

        m==='build'&&

        coastalTypes.has(selected)

    ){

        if(lastCoastalSelection!==selected){

            plannedFacing=null;

            lastCoastalSelection=selected;
        }

        const [w,h]=dimensions(

            selected,rotation
        );

        message(

            title(selected)+

            ' • '+w+' × '+h+

            ' • '+money(TYPES[selected].cost)+

            ' • Coastal grass or sand'+

            (

                plannedFacing!==null&&

                seaPorts.has(selected)

                    ?' • Preferred quay: '+

                        facingNames[plannedFacing]

                    :''
            )
        );

    }else if(m==='build'){

        lastCoastalSelection=null;
    }
};

// =====================================================
// 29 — NAVIGABLE SEA ROUTES
// =====================================================

function findSeaRoute(k,b){

    const sides=shoreSides(

        ...xy(k),

        b.w||1,

        b.h||1
    );

    const facing=harbourFacing(k,b);

    const side=sides.find(

        s=>s.facing===facing
    );

    if(!side)return [];

    let best=[];

    for(const start of side.tiles){

        const queue=[start];

        const parent=new Map([

            [start,null]
        ]);

        const depth=new Map([

            [start,0]
        ]);

        let destination=start;

        for(let i=0;i<queue.length;i++){

            const current=queue[i];

            const distance=depth.get(current);

            if(

                distance>

                depth.get(destination)

            ){

                destination=current;
            }

            if(distance>=10)continue;

            const [x,y]=xy(current);

            for(const [a,c] of seaDirections){

                const nx=x+a;

                const ny=y+c;

                const next=key(nx,ny);

                if(

                    navigableWater(nx,ny)&&

                    !parent.has(next)

                ){

                    parent.set(next,current);

                    depth.set(

                        next,distance+1
                    );

                    queue.push(next);
                }
            }
        }

        const route=[];

        let point=destination;

        while(point!==null){

            route.push(point);

            point=parent.get(point);
        }

        route.reverse();

        if(route.length>best.length){

            best=route;
        }
    }

    return best;
}

// =====================================================
// 30 — FISHING EXPEDITIONS
// =====================================================

function dispatchFishing(k){

    const b=town.buildings[k];

    if(

        !b||

        b.type!=='v6_fishingHarbour'

    )return;

    if(state.sea[k]){

        message(

            'The fishing boat is already at sea.'
        );

        return;
    }

    const route=findSeaRoute(k,b);

    if(route.length<3){

        message(

            'The quay needs access to open water. Rotate or relocate the harbour.'
        );

        return;
    }

    const fee=15;

    if(town.cash<fee){

        message(

            'A fishing expedition costs £15.'
        );

        return;
    }

    town.cash-=fee;

    state.sea[k]={

        type:'fishing',

        route,

        start:state.tick,

        end:state.tick+3,

        catch:Math.min(

            14,

            4+route.length
        )
    };

    changed(

        'Fishing boat dispatched! Returns in three town cycles.'
    );
}

// =====================================================
// 31 — SHIPPING AND INTERNATIONAL EXPORTS
// =====================================================

function dispatchCargo(k,goods){

    const b=town.buildings[k];

    if(

        !b||

        b.type!=='v8_shippingPort'

    )return;

    if(state.sea[k]){

        message(

            'A cargo ship is already at sea.'
        );

        return;
    }

    const route=findSeaRoute(k,b);

    if(route.length<3){

        message(

            'The shipping port needs a quay facing open water.'
        );

        return;
    }

    const amount=Math.min(

        10,

        state.stock[goods]||0
    );

    if(!amount){

        message(

            'There are no goods available to export.'
        );

        return;
    }

    const ordinaryValue=

        amount*(salePrices[goods]||8);

    const fee=Math.min(

        20,

        Math.ceil(ordinaryValue*.1)
    );

    if(town.cash<fee){

        message(

            'Not enough cash for shipping costs.'
        );

        return;
    }

    town.cash-=fee;

    state.stock[goods]-=amount;

    state.sea[k]={

        type:'cargo',

        goods,

        amount,

        payout:Math.floor(

            ordinaryValue*1.2
        ),

        route,

        start:state.tick,

        end:state.tick+4
    };

    changed(

        'Cargo ship dispatched with '+

        amount+' '+goods+

        ' • Shipping cost '+money(fee)
    );
}

// =====================================================
// 32 — VESSEL RETURNS AND MARITIME ECONOMY
// =====================================================

const previousSeaTick=tick;

tick=function(){

    lastSeaTick=performance.now();

    previousSeaTick();

    const returned=[];

    for(const [k,trip] of Object.entries(

        state.sea

    )){

        if(trip.end>state.tick)continue;

        if(trip.type==='fishing'){

            const previous=

                state.stock.fish||0;

            stock('fish',trip.catch);

            const stored=

                state.stock.fish-previous;

            state.seaStats.fishingTrips++;

            state.seaStats.fishCaught+=stored;

            returned.push(

                'Fishing boat returned with '+

                stored+' fish'
            );

        }else if(trip.type==='cargo'){

            town.cash+=trip.payout;

            state.seaStats.cargoTrips++;

            returned.push(

                'Cargo shipment completed • '+

                money(trip.payout)+' earned'
            );
        }

        delete state.sea[k];
    }

    if(returned.length){

        changed(

            returned.join(' • ')
        );
    }
};

// =====================================================
// 33 — MARITIME ACHIEVEMENTS
// =====================================================

awards.push(

    [

        'v8firstCatch',

        'First catch',

        ()=>state.seaStats.fishingTrips>=1,

        5
    ],

    [

        'v8masterFisher',

        'Master fisherman',

        ()=>state.seaStats.fishCaught>=100,

        12
    ],

    [

        'v8exporter',

        'International trader',

        ()=>state.seaStats.cargoTrips>=10,

        15
    ],

    [

        'v8maritimeTown',

        'Maritime community',

        ()=>

            state.seaStats.fishingTrips>=10&&

            state.seaStats.cargoTrips>=10,

        20
    ]
);

// =====================================================
// 34 — DETAILED HARBOUR ARTWORK
// =====================================================

function paintHarbour(

    g,cx,cy,w,h,facing,shipping

){

    const [dx,dy]=

        seaDirections[facing%4];

    const ux=dy;

    const uy=-dx;

    const width=dx?h:w;

    const depth=dx?w:h;

    const P=(u,v,z=0)=>project(

        cx+u*ux+v*dx,

        cy+u*uy+v*dy,

        z
    );

    function shade(col,n){

        return '#'+col.slice(1)

            .match(/../g)

            .map(a=>

                clamp(

                    parseInt(a,16)+n,

                    0,255

                ).toString(16).padStart(2,'0')

            ).join('');
    }

    function shape(points,col,edge){

        g.beginPath();

        points.forEach((p,i)=>

            i

                ?g.lineTo(...p)

                :g.moveTo(...p)
        );

        g.closePath();

        g.fillStyle=col;

        g.fill();

        if(edge){

            g.strokeStyle=edge;

            g.lineWidth=.7;

            g.stroke();
        }
    }

    function ln(a,b,col,size=1){

        g.beginPath();

        g.moveTo(...a);

        g.lineTo(...b);

        g.strokeStyle=col;

        g.lineWidth=size;

        g.lineCap='round';

        g.stroke();
    }

    function groundRect(a,b,c,d,col,z=0){

        shape([

            P(a,b,z),

            P(c,b,z),

            P(c,d,z),

            P(a,d,z)

        ],col);
    }

    function oval(x,y,rx,ry,col){

        g.beginPath();

        g.ellipse(

            x,y,rx,ry,

            0,0,Math.PI*2
        );

        g.fillStyle=col;

        g.fill();
    }

    // World-aligned 3D boxes ensure the visible
    // walls remain shaded correctly after rotation.

    function block(a,b,c,d,z,H,col){

        const points=[

            [a,b],[c,b],[c,d],[a,d]

        ].map(([u,v])=>[

            cx+u*ux+v*dx,

            cy+u*uy+v*dy
        ]);

        const xs=points.map(p=>p[0]);

        const ys=points.map(p=>p[1]);

        const x0=Math.min(...xs);

        const x1=Math.max(...xs);

        const y0=Math.min(...ys);

        const y1=Math.max(...ys);

        const Q=(x,y,Z)=>project(x,y,Z);

        shape([

            Q(x0,y1,z),

            Q(x1,y1,z),

            Q(x1,y1,z+H),

            Q(x0,y1,z+H)

        ],shade(col,-5),'#73594540');

        shape([

            Q(x1,y0,z),

            Q(x1,y1,z),

            Q(x1,y1,z+H),

            Q(x1,y0,z+H)

        ],shade(col,-33),'#73594540');

        shape([

            Q(x0,y0,z+H),

            Q(x1,y0,z+H),

            Q(x1,y1,z+H),

            Q(x0,y1,z+H)

        ],shade(col,22));
    }

    const a=-width/2+.04;

    const b=-depth/2+.04;

    const c=width/2-.04;

    const d=depth/2-.04;

    const quay=d-.28;

    // Stone foundations.

    groundRect(

        a,b,c,d,

        '#c9bda4'
    );

    // Wooden waterfront dock.

    groundRect(

        a,quay,c,d,

        '#b58c5a',2
    );

    for(let u=a;u<c;u+=.13){

        ln(

            P(u,quay,2.2),

            P(u,d,2.2),

            '#8e704e',.8
        );
    }

    // Dock edge.

    ln(

        P(a,d,2),

        P(c,d,2),

        '#715d49',2.6
    );

    // Stone paving.

    for(let u=a+.2;u<c;u+=.24){

        ln(

            P(u,b,0),

            P(u,quay,0),

            '#aa9c8355',.65
        );
    }

    // Mooring posts and rope details.

    for(let u=a+.12;u<c;u+=.42){

        block(

            u-.035,d-.08,

            u+.035,d-.01,

            2,9,

            '#866644'
        );

        const p=P(u,d-.04,11);

        oval(

            p[0],p[1],

            2,1,

            '#d7b27b'
        );
    }

    // =================================================
    // FISHING HARBOUR
    // =================================================

    if(!shipping){

        const hutWidth=

            Math.min(.65,width-.18);

        const hutDepth=

            Math.min(.36,depth-.38);

        const hu=a+.1;

        const hv=b+.08;

        block(

            hu,hv,

            hu+hutWidth,

            hv+hutDepth,

            0,24,

            '#e7d0a5'
        );

        // Raised roof and tiled detail.

        block(

            hu-.035,hv-.035,

            hu+hutWidth+.035,

            hv+hutDepth+.035,

            24,5,

            '#618b9d'
        );

        for(let u=hu;u<hu+hutWidth;u+=.09){

            ln(

                P(u,hv,29),

                P(u,hv+hutDepth,29),

                '#b0cad0',.8
            );
        }

        // Fish crates.

        for(let i=0;i<3;i++){

            const u=

                c-.13-i*.15;

            block(

                u-.055,quay-.19,

                u+.055,quay-.06,

                0,5,

                '#b08b59'
            );

            const p=P(

                u,quay-.12,5
            );

            oval(

                p[0],p[1],

                2.6,1.1,

                '#91b5c6'
            );
        }

        // Fishing nets.

        const p=P(a+.15,quay+.06,3);

        oval(

            p[0],p[1],

            7,4,

            '#668b72'
        );

        for(let i=-4;i<=4;i+=2){

            ln(

                [p[0]+i,p[1]-3],

                [p[0]+i+2,p[1]+3],

                '#a8bda0',.65
            );
        }

        // Harbour sign.

        const s=P(

            hu+hutWidth/2,

            hv+hutDepth,

            21
        );

        if(facing===0||facing===1){

            g.fillStyle='#f3e2bd';

            g.fillRect(

                s[0]-12,s[1]-3,

                24,6
            );

            g.font='bold 4.5px sans-serif';

            g.textAlign='center';

            g.fillStyle='#4d6570';

            g.fillText(

                'FISHING',

                s[0],s[1]+1.5
            );
        }

    // =================================================
    // COMMERCIAL SHIPPING PORT
    // =================================================

    }else{

        const warehouseDepth=

            Math.max(.35,depth-.75);

        const warehouseWidth=

            (width-.38)/2;

        for(let i=0;i<2;i++){

            const u=

                a+.08+i*(warehouseWidth+.12);

            const v=b+.08;

            block(

                u,v,

                u+warehouseWidth,

                v+warehouseDepth,

                0,29,

                '#d7d5c1'
            );

            block(

                u-.025,v-.025,

                u+warehouseWidth+.025,

                v+warehouseDepth+.025,

                29,5,

                '#748e9f'
            );

            for(

                let q=u;

                q<u+warehouseWidth;

                q+=.12

            ){

                ln(

                    P(q,v,34),

                    P(q,v+warehouseDepth,34),

                    '#aebec4',.8
                );
            }
        }

        // Colourful shipping containers.

        const colours=[

            '#c86c58',

            '#648fae',

            '#dfb85f',

            '#729f83'
        ];

        for(let i=0;i<6;i++){

            const u=

                a+.20+(i%3)*.26;

            const v=

                quay-.30+

                Math.floor(i/3)*.16;

            block(

                u,v,

                u+.20,v+.13,

                0,8,

                colours[i%4]
            );

            for(let j=0;j<4;j++){

                ln(

                    P(u+.03+j*.04,v+.13,1),

                    P(u+.03+j*.04,v+.13,7),

                    '#ffffff55',.6
                );
            }
        }

        // Harbour crane.

        const craneX=c-.22;

        const craneY=quay-.08;

        block(

            craneX-.09,craneY-.09,

            craneX+.09,craneY+.09,

            0,5,

            '#9b9380'
        );

        for(const offset of [-.07,.07]){

            ln(

                P(craneX+offset,craneY,5),

                P(craneX+offset,craneY,58),

                '#d4a245',3.6
            );
        }

        for(let z=8;z<55;z+=8){

            ln(

                P(craneX-.07,craneY,z),

                P(craneX+.07,craneY,z+7),

                '#a37c38',1.4
            );
        }

        ln(

            P(craneX,craneY,58),

            P(craneX,craneY+.62,48),

            '#e0b351',4
        );

        ln(

            P(craneX,craneY+.62,48),

            P(craneX,craneY+.62,13),

            '#626765',.9
        );

        block(

            craneX-.065,

            craneY+.55,

            craneX+.065,

            craneY+.67,

            10,4,

            '#9c8059'
        );
    }
}

// =====================================================
// 35 — INTEGRATE ROTATABLE HARBOUR GRAPHICS
// =====================================================

const previousHarbourDraw=drawObject;

drawObject=function(t){

    const anchor=

        occupied.get(key(t.x,t.y));

    const b=

        anchor&&town.buildings[anchor];

    if(!b||!seaPorts.has(b.type)){

        return previousHarbourDraw(t);
    }

    const [x,y]=xy(anchor);

    const w=b.w||1;

    const h=b.h||1;

    if(

        t.x!==x+w-1||

        t.y!==y+h-1

    )return;

    ctx.save();

    if(moving===anchor){

        ctx.globalAlpha=.45;
    }

    paintHarbour(

        ctx,

        x+(w-1)/2,

        y+(h-1)/2,

        w,h,

        harbourFacing(anchor,b),

        b.type==='v8_shippingPort'
    );

    ctx.restore();
};

// =====================================================
// 36 — ANIMATED FISHING AND CARGO VESSELS
// =====================================================

function drawSeaVessel(trip){

    const route=trip.route;

    if(!route||route.length<2)return;

    const fraction=clamp(

        (performance.now()-lastSeaTick)/10000,

        0,.99
    );

    const progress=clamp(

        (

            state.tick-trip.start+fraction

        )/(trip.end-trip.start),

        0,1
    );

    const length=route.length-1;

    // Travel out and return along the same route.

    const journey=progress*2;

    const returning=journey>1;

    const distance=

        (

            returning

                ?2-journey

                :journey

        )*length;

    const i=Math.min(

        length-1,

        Math.floor(distance)
    );

    const f=distance-i;

    const [x,y]=xy(route[i]);

    const [u,v]=xy(route[i+1]);

    const a=x+(u-x)*f;

    const b=y+(v-y)*f;

    const [sx,sy]=project(a,b);

    const direction=

        returning?-1:1;

    const angle=Math.atan2(

        (u-x+v-y)*HH*direction,

        (u-x-v+y)*HW*direction
    );

    const cargo=trip.type==='cargo';

    const size=cargo?1.7:1;

    ctx.save();

    ctx.translate(sx,sy);

    ctx.rotate(angle);

    ctx.scale(size,size);

    // Animated water wake.

    for(let j=0;j<3;j++){

        const wave=

            Math.sin(

                performance.now()/180+j

            )*1.4;

        line(

            [-12-j*5,-3-wave],

            [-16-j*5,0],

            '#d4f5edaa',1
        );

        line(

            [-12-j*5,3+wave],

            [-16-j*5,0],

            '#d4f5edaa',1
        );
    }

    // Hull shadow.

    disc(

        0,2,14,5,

        '#225b7140'
    );

    // Main vessel hull.

    poly([

        [-14,-5],

        [8,-5],

        [17,0],

        [8,6],

        [-14,5]

    ],cargo?'#456b83':'#b7644c');

    // Deck.

    poly([

        [-12,-3],

        [7,-3],

        [13,0],

        [7,3],

        [-12,3]

    ],'#e0c69c');

    // Cabin.

    ctx.fillStyle='#f4ead2';

    ctx.fillRect(-7,-7,10,7);

    ctx.fillStyle='#6b9eb4';

    ctx.fillRect(-6,-6,8,3);

    ctx.fillStyle='#f2dfb2';

    ctx.fillRect(-8,-8,12,2);

    if(cargo){

        // Shipping containers.

        for(let j=0;j<3;j++){

            ctx.fillStyle=[

                '#cc795c',

                '#dcb760',

                '#6fa58c'

            ][j];

            ctx.fillRect(

                4+j*2,-4,3,7
            );
        }

    }else{

        // Fishing equipment and nets.

        ctx.fillStyle='#6d927e';

        ctx.fillRect(5,-3,5,5);

        line(

            [-2,-8],

            [-2,-17],

            '#84745e',1.5
        );

        line(

            [-2,-17],

            [9,-8],

            '#f3e1b7',.8
        );

        disc(

            8,1,3,2,

            '#91b5c6'
        );
    }

    ctx.restore();
}

const previousSeaRender=render;

render=function(){

    previousSeaRender();

    if(layer!=='surface')return;

    ctx.save();

    ctx.setTransform(

        DPR,0,0,DPR,0,0
    );

    ctx.translate(camX,camY);

    ctx.scale(zoom,zoom);

    for(const trip of Object.values(

        state.sea

    )){

        drawSeaVessel(trip);
    }

    ctx.restore();
};

// Animate only when vessels are active.

setInterval(()=>{

    if(

        layer==='surface'&&

        Object.keys(state.sea).length

    ){

        dirty=true;
    }

},90);

// =====================================================
// 37 — HARBOUR MANAGEMENT CONTROLS
// =====================================================

const previousSeaPanel=refreshPanel;

refreshPanel=function(){

    previousSeaPanel();

    if(panel.hidden||!inspected)return;

    const k=inspected;

    const b=town.buildings[k];

    if(!b||!seaPorts.has(b.type))return;

    const section=el(

        'div',

        undefined
    );

    section.className='v8maritime';

    const shipping=

        b.type==='v8_shippingPort';

    el(

        'h3',

        shipping

            ?'Shipping port management'

            :'Fishing harbour management',

        section
    );

    row(

        section,

        'Quay direction',

        facingNames[harbourFacing(k,b)]
    );

    const route=findSeaRoute(k,b);

    row(

        section,

        'Open water access',

        route.length>=3

            ?'Connected'

            :'Rotate or relocate'
    );

    const trip=state.sea[k];

    if(trip){

        row(

            section,

            'Vessel status',

            'At sea'
        );

        row(

            section,

            'Returning in',

            Math.max(

                0,trip.end-state.tick

            )+' cycles'
        );

        if(trip.type==='cargo'){

            row(

                section,

                'Cargo',

                trip.amount+' '+trip.goods
            );

            row(

                section,

                'Expected payment',

                money(trip.payout)
            );

        }else{

            row(

                section,

                'Expected catch',

                trip.catch+' fish'
            );
        }

    }else if(shipping){

        const goods=Object.entries(

            state.stock

        ).filter(

            ([,quantity])=>quantity>0
        );

        row(

            section,

            'Cargo vessel',

            'Docked'
        );

        if(goods.length){

            const choices=el(

                'select',

                undefined,

                section
            );

            for(const [name,amount] of goods){

                const o=el(

                    'option',

                    name+' × '+amount,

                    choices
                );

                o.value=name;
            }

            button(

                'Export up to 10 goods',

                ()=>dispatchCargo(

                    k,choices.value
                ),

                section
            );

            el(

                'p',

                'Sea exports pay a 20% bonus before shipping costs. '+

                'The voyage takes four town cycles.',

                section
            );

        }else{

            el(

                'p',

                'Your warehouse is empty. Harvest crops, catch fish or manufacture products to export.',

                section
            );
        }

    }else{

        row(

            section,

            'Fishing boat',

            'Docked'
        );

        button(

            'Send fishing boat (£15)',

            ()=>dispatchFishing(k),

            section
        );

        el(

            'p',

            'The boat returns after three town cycles. Your catch is automatically stored in the warehouse.',

            section
        );
    }

    row(

        section,

        'Fish in warehouse',

        state.stock.fish||0
    );

    row(

        section,

        'Completed fishing trips',

        state.seaStats.fishingTrips
    );

    row(

        section,

        'Completed cargo trips',

        state.seaStats.cargoTrips
    );

    panel.firstElementChild.after(

        section
    );
};

// =====================================================
// 38 — ILLUSTRATED MARITIME CATALOGUE
// =====================================================

const previousSeaCards=decorateCards;

decorateCards=function(){

    previousSeaCards();

    for(const card of

        $('catalogue').querySelectorAll('[data-type]')

    ){

        const id=card.dataset.type;

        if(!seaPorts.has(id))continue;

        const c=card.querySelector('canvas');

        if(!c)continue;

        const g=c.getContext('2d');

        const [w,h]=dimensions(id);

        g.clearRect(

            0,0,c.width,c.height
        );

        const scale=Math.min(

            (c.width-10)/((w+h)*HW+20),

            (c.height-10)/((w+h)*HH+65)
        );

        g.save();

        g.translate(

            c.width/2,

            c.height/2+18*scale
        );

        g.scale(scale,scale);

        paintHarbour(

            g,

            0,0,

            w,h,

            0,

            id==='v8_shippingPort'
        );

        g.restore();

        card.title=

            title(id)+

            ' • Coastal grass or sand'+

            ' • '+w+' × '+h+

            ' tiles'+

            ' • Four quay orientations';
    }
};

// =====================================================
// 39 — MARITIME INTERFACE STYLING
// =====================================================

const maritimeCSS=el(

    'style',

    undefined,

    document.head
);

maritimeCSS.textContent=`

.v8maritime{

    background:
        linear-gradient(
            #e5f0df,
            #d7e9e1
        );

    border:1px solid #a0b7a6;

    border-radius:10px;

    padding:9px;

    margin:8px 0;

    color:#3e6057;
}

#v7panel .v8maritime h3{

    margin-top:0;

    color:#3e6057;

    border-color:#b1c7b5;
}

#v7panel .v8maritime button{

    background:#79a9b4;

    border:1px solid #628e98;

    color:#fffaf0;

    font-weight:750;

    padding:8px 10px;
}

#v7panel .v8maritime select{

    max-width:100%;

    background:#f7f5e9;

    margin:5px 0;

    border-color:#a0b7a6;
}

#v7panel .v8maritime p{

    color:#557369;
}

`;

// Refresh the existing V0.6 catalogue.

$('v5search').dispatchEvent(

    new Event('input')
);

console.log(

    'Town Builder V0.8 Maritime Systems loaded'
);

/* END OF V0.8 MARITIME EXPANSION */


/* V0.9 — COASTAL WORLD & LIT 3D SPRITES
   Insert inside V0.7 after the V0.8 end marker.
*/

(()=>{
'use strict';

const prior={
    detailed,
    ground,
    drawObject,
    decorateCards,
    rotateBuilding,
    selectMode,
    act,
    tick,
    refreshPanel,
    render,
    calculate,
    rebuildRoutes,
    drawSeaVessel
};

const V=state.v9||(state.v9={});

V.auto??={};
V.imports??=0;
V.passengers??=0;

const norm=id=>
    id.replace(/^v[6789]_/,'').toLowerCase();

const rand=(i,j=0)=>hash(i,j,91);

const rgb=s=>
    [1,3,5].map(
        i=>parseInt(s.slice(i,i+2),16)
    );

const cache=new Map();
const grounds=new Map();

let bytes=0;
let facing=0;
let lastSelected='';
let ferries=[];

const budget=48*1024*1024;

const isPort=id=>seaPorts.has(id);

// ==========================================
// 01 — GRAPHICS MODEL CLASSIFICATION
// ==========================================

function type9(id){

    const t=TYPES[id];

    if(!t||isPort(id))return null;

    if(t.group==='Homes')return 'home';

    if(
        kind(id)==='shop'||
        id==='v9_fishmonger'||
        id==='v9_cruise'
    )return 'shop';

    if([
        'tree',
        'oak',
        'pine',
        'autumn',
        'palm',
        'cherry',
        'v6_magnolia',
        'v6_weepingWillow',
        'v6_birch',
        'v6_redwood',
        'v6_wisteria'
    ].includes(id))return 'tree';

    if([
        'park',
        'cityPark',
        'botanic',
        'v7_royalGarden',
        'v6_japaneseGarden',
        'v6_formalGarden'
    ].includes(id))return 'park';

    if([
        'v9_fishCannery',
        'v9_coldStore'
    ].includes(id))return 'factory';

    return null;
}

// ==========================================
// 02 — NEW MARITIME BUILDINGS
// ==========================================

function add(
    id,name,cost,rent,group,section
){

    TYPES[id]={
        name,cost,rent,
        pop:0,group,section
    };
}

add(
    'v9_fishmonger',
    'Fishmonger',
    280,35,
    'Business','Shops'
);

add(
    'v9_fishCannery',
    'Fish cannery',
    540,50,
    'Industry','Industry'
);

add(
    'v9_coldStore',
    'Cold storage warehouse',
    420,20,
    'Industry','Waterfront'
);

add(
    'v9_cruise',
    'Cruise terminal',
    1400,90,
    'Business','Waterfront'
);

sizes.v9_fishCannery=[2,1];
sizes.v9_coldStore=[2,1];
sizes.v9_cruise=[3,2];

coastalTypes.add('v9_cruise');

recipes.v9_fishmonger=[
    'fish',2,'fresh seafood',2
];

recipes.v9_fishCannery=[
    'fish',3,'canned fish',3
];

recipes.seafood=[
    'fish',2,'seafood meals',2
];

salePrices['fresh seafood']=22;
salePrices['canned fish']=25;
salePrices['seafood meals']=30;

// ==========================================
// 03 — SOFTWARE 3D GRAPHICS ENGINE
//
// Depth-buffer rendering
// Directional lighting
// Surface textures
// Four real viewing orientations
// Memory-limited sprite caching
// ==========================================

function sprite(id,w,h,r=0){

    const type=type9(id);

    if(!type)return null;

    r=((r%4)+4)%4;

    const k=[id,w,h,r].join(':');

    if(cache.has(k)){

        const z=cache.get(k);

        cache.delete(k);
        cache.set(k,z);

        return z;
    }

    const localW=r%2?h:w;
    const localH=r%2?w:h;

    const width=Math.ceil(
        (w+h)*HW+26
    );

    const origin=
        148+(w+h)*HH/2;

    const height=Math.ceil(
        origin+(w+h)*HH/2+12
    );

    const scale=1.5;

    const c=document.createElement(
        'canvas'
    );

    c.width=Math.ceil(width*scale);
    c.height=Math.ceil(height*scale);

    const g=c.getContext('2d');

    const Wp=c.width;
    const Hp=c.height;

    const pixels=g.createImageData(
        Wp,Hp
    );

    const data=pixels.data;

    const depth=new Float32Array(
        Wp*Hp
    );

    depth.fill(-Infinity);

    const seed=[...id].reduce(
        (a,b)=>
            (a*31+b.charCodeAt(0))>>>0,
        7
    );

    function rotate(x,y){

        return r===1
            ?[y,-x]
            :r===2
                ?[-x,-y]
                :r===3
                    ?[-y,x]
                    :[x,y];
    }

    function project3(p){

        const [x,y]=rotate(
            p[0],p[1]
        );

        const z=p[2];

        return [

            (
                width/2+
                (x-y)*HW
            )*scale,

            (
                origin+
                (x+y)*HH-
                z*HW
            )*scale,

            x+y+z*HW/(2*HH)
        ];
    }

    // Rasterise a 3D triangular surface.

    function tri(A,B,C,col){

        const a=project3(A);
        const b=project3(B);
        const c=project3(C);

        const u=B.map(
            (v,i)=>v-A[i]
        );

        const v=C.map(
            (v,i)=>v-A[i]
        );

        let nx=
            u[1]*v[2]-u[2]*v[1];

        let ny=
            u[2]*v[0]-u[0]*v[2];

        let nz=
            u[0]*v[1]-u[1]*v[0];

        const n=Math.hypot(
            nx,ny,nz
        )||1;

        [nx,ny]=rotate(nx/n,ny/n);

        nz/=n;

        if(
            nx+ny+nz*2*HH/HW<-.0001
        ){

            nx=-nx;
            ny=-ny;
            nz=-nz;
        }

        const light=

            .72+.35*Math.max(
                0,
                -.50*nx+
                .32*ny+
                .80*nz
            );

        const base=rgb(col);

        const den=

            (b[1]-c[1])*
            (a[0]-c[0])+

            (c[0]-b[0])*
            (a[1]-c[1]);

        if(Math.abs(den)<.001)return;

        const minX=Math.max(
            0,
            Math.floor(
                Math.min(a[0],b[0],c[0])
            )
        );

        const maxX=Math.min(
            Wp-1,
            Math.ceil(
                Math.max(a[0],b[0],c[0])
            )
        );

        const minY=Math.max(
            0,
            Math.floor(
                Math.min(a[1],b[1],c[1])
            )
        );

        const maxY=Math.min(
            Hp-1,
            Math.ceil(
                Math.max(a[1],b[1],c[1])
            )
        );

        for(let y=minY;y<=maxY;y++){

            for(let x=minX;x<=maxX;x++){

                const p=(

                    (b[1]-c[1])*
                    (x+.5-c[0])+

                    (c[0]-b[0])*
                    (y+.5-c[1])

                )/den;

                const q=(

                    (c[1]-a[1])*
                    (x+.5-c[0])+

                    (a[0]-c[0])*
                    (y+.5-c[1])

                )/den;

                const s=1-p-q;

                if(
                    p<-.0001||
                    q<-.0001||
                    s<-.0001
                )continue;

                const z=

                    p*a[2]+
                    q*b[2]+
                    s*c[2];

                const i=y*Wp+x;

                if(z<depth[i]-.00001)
                    continue;

                depth[i]=z;

                const grain=

                    (
                        (x*13+y*23+seed)%11
                    )-5;

                for(let j=0;j<3;j++){

                    data[i*4+j]=

                        base[j]*light+
                        grain;
                }

                data[i*4+3]=255;
            }
        }
    }

    function quad(a,b,c,d,col){

        tri(a,b,c,col);
        tri(a,c,d,col);
    }

    // Solid 3D cuboid.

    function box(a,b,c,d,z,H,col){

        if(
            c<=a||
            d<=b||
            H<=0
        )return;

        const A=[a,b,z];
        const B=[c,b,z];
        const C=[c,d,z];
        const D=[a,d,z];

        const E=[a,b,z+H];
        const F=[c,b,z+H];
        const G=[c,d,z+H];
        const I=[a,d,z+H];

        quad(A,B,F,E,col);
        quad(B,C,G,F,col);
        quad(C,D,I,G,col);
        quad(D,A,E,I,col);
        quad(E,F,G,I,col);
    }

    // Rounded 3D shapes for vegetation.

    function ellipsoid(
        x,y,z,rx,ry,rz,col
    ){

        const p=(a,b)=>[

            x+rx*Math.sin(a)*Math.cos(b),

            y+ry*Math.sin(a)*Math.sin(b),

            z+rz*Math.cos(a)
        ];

        for(let i=0;i<7;i++){

            for(let j=0;j<12;j++){

                const a=i*Math.PI/7;

                const b=(i+1)*Math.PI/7;

                const u=j*Math.PI/6;

                const v=(j+1)*Math.PI/6;

                quad(
                    p(a,u),
                    p(b,u),
                    p(b,v),
                    p(a,v),
                    col
                );
            }
        }
    }

    // ======================================
    // 04 — THREE DIMENSIONAL VEGETATION
    // ======================================

    function tree(
        x,y,s=1,col='#78ae49'
    ){

        box(
            x-.035*s,
            y-.035*s,

            x+.035*s,
            y+.035*s,

            0,.56*s,
            '#a17951'
        );

        for(const [a,b,z,q] of [

            [-.11,0,.66,.24],

            [.11,.06,.69,.23],

            [0,-.10,.76,.25],

            [0,.10,.78,.22],

            [0,0,.99,.22]

        ]){

            ellipsoid(

                x+a*s,

                y+b*s,

                z*s,

                q*s,

                q*s,

                q*1.2*s,

                col
            );
        }
    }

    function flowers(x,y,n){

        for(let i=0;i<n;i++){

            const a=x+i*.075;

            ellipsoid(

                a,y,.055,

                .047,.045,.055,

                '#6d9d45'
            );

            ellipsoid(

                a,y,.11,

                .035,.033,.025,

                [
                    '#f3a0be',
                    '#ffcf63',
                    '#fff1cd'
                ][i%3]
            );
        }
    }

    // ======================================
    // 05 — INDIVIDUAL ROOF TILES
    // ======================================

    function roof(a,b,c,d,z,rise,col){

        const m=(a+c)/2;

        tri(
            [a,b,z],
            [c,b,z],
            [m,b,z+rise],
            wall
        );

        tri(
            [a,d,z],
            [c,d,z],
            [m,d,z+rise],
            wall
        );

        for(const side of [0,1]){

            const edge=side?c:a;

            for(let i=0;i<9;i++){

                const f=i/9;

                const j=(i+1)/9;

                const X=
                    edge+(m-edge)*f;

                const Y=
                    edge+(m-edge)*j;

                const Z=z+rise*f;

                const Q=z+rise*j;

                const n=Math.max(

                    5,

                    Math.round((d-b)*10)
                );

                for(let t=0;t<n;t++){

                    const p=

                        b+(d-b)*t/n;

                    const q=

                        b+(d-b)*(t+1)/n;

                    const color=rgb(col)
                        .map(v=>clamp(

                            v+

                            Math.floor(
                                rand(
                                    i*11+t,
                                    seed%97
                                )*23
                            )-11,

                            0,255
                        ));

                    const hex=

                        '#'+color.map(

                            v=>v.toString(16)
                                .padStart(2,'0')

                        ).join('');

                    quad(

                        [X,p,Z],

                        [X,q,Z],

                        [Y,q,Q],

                        [Y,p,Q],

                        hex
                    );

                    quad(

                        [X,p,Z+.006],

                        [X,q,Z+.006],

                        [
                            X+(Y-X)*.09,
                            q,
                            Z+(Q-Z)*.09+.006
                        ],

                        [
                            X+(Y-X)*.09,
                            p,
                            Z+(Q-Z)*.09+.006
                        ],

                        '#a67462'
                    );
                }
            }
        }
    }

    // ======================================
    // 06 — ARCHITECTURAL COLOUR COLLECTION
    // ======================================

    const pal=[

        [
            '#f8d99c',
            '#c36249',
            '#527e79'
        ],

        [
            '#f3e9cc',
            '#577e9f',
            '#769bb1'
        ],

        [
            '#e8ac8d',
            '#845d50',
            '#789858'
        ],

        [
            '#e9e0aa',
            '#7c9668',
            '#d07866'
        ],

        [
            '#efd4d9',
            '#8974a7',
            '#ab6889'
        ]
    ];

    let [wall,roofCol,accent]=

        pal[seed%pal.length];

    const id0=norm(id);

    const a=-localW/2+.055;

    const b=-localH/2+.055;

    const C=localW/2-.055;

    const D=localH/2-.055;

    if(/tudor|thatched/.test(id0)){

        wall='#f1dfb8';

        roofCol='#987346';

        accent='#795239';
    }

    if(/greek/.test(id0)){

        wall='#fff4da';

        roofCol='#6595cb';

        accent='#4c83b2';
    }

    if(/italian|tuscan|spanish/.test(id0)){

        wall='#f4cb8b';

        roofCol='#be6244';

        accent='#638d65';
    }

    if(/dutch|victorian|brownstone/.test(id0)){

        wall='#dba185';

        roofCol='#62788c';
    }

    // ======================================
    // 07 — TREES AND LANDSCAPED PARKS
    // ======================================

    if(type==='tree'){

        tree(

            0,0,1.05,

            /cherry|magnolia|wisteria/.test(id0)

                ?'#dc94ba'

                :/autumn/.test(id0)

                    ?'#d6a04e'

                    :'#78ad4e'
        );

    }else if(type==='park'){

        box(
            a,b,C,D,
            -.018,.02,
            '#a5ce74'
        );

        box(
            -.075,b,.075,D,
            0,.018,
            '#e7d2a8'
        );

        box(
            a,-.075,C,.075,
            0,.019,
            '#e7d2a8'
        );

        for(const [x,y] of [

            [a+.19,b+.19],

            [C-.19,b+.19],

            [a+.19,D-.19],

            [C-.19,D-.19]

        ]){

            tree(

                x,y,.64,

                /japanese/.test(id0)

                    ?'#d898bb'

                    :'#7caf53'
            );
        }

        ellipsoid(

            0,0,.025,

            .21,.21,.05,

            '#e5d4b0'
        );

        ellipsoid(

            0,0,.065,

            .17,.17,.025,

            '#70c9df'
        );

        flowers(

            a+.1,

            D-.07,

            Math.max(

                3,

                Math.floor(
                    (C-a-.18)/.075
                )
            )
        );

    // ======================================
    // 08 — HOUSES AND COMMERCIAL BUILDINGS
    // ======================================

    }else{

        const home=type==='home';

        const shop=type==='shop';

        const tall=

            /apartment|penthouse|student|tower/

                .test(id0);

        const small=

            /cottage|bungalow|cabin|beachhut/

                .test(id0);

        const modern=

            /modern|artdeco|apartment|penthouse|greek|supermarket|superstore|electronics/

                .test(id0)||

            type==='factory';

        const floors=

            tall?4:

            small?1:

            /townhouse|dutch|mansion|manor|terraced/

                .test(id0)?3:

            home?2:1;

        const H=.19+floors*.34;

        const x=a+.10;

        const y=b+.07;

        const X=C-.10;

        const Y=D-.19;

        // Property foundations.

        box(

            a,b,C,D,

            -.035,.04,

            home
                ?'#b0d480'
                :'#dfd0ad'
        );

        box(

            x-.025,y-.025,

            X+.025,Y+.025,

            0,.07,

            '#d9c5a0'
        );

        box(

            x,y,X,Y,

            .07,H-.07,

            wall
        );

        // Four individually modelled elevations.

        function pane(u,v,z,side){

            if(side===0){

                box(
                    u-.072,Y-.01,
                    u+.072,Y+.025,
                    z,.24,
                    '#f8e5bb'
                );

                box(
                    u-.055,Y+.026,
                    u+.055,Y+.031,
                    z+.025,.19,
                    '#548cab'
                );

                box(
                    u-.008,Y+.032,
                    u+.008,Y+.040,
                    z+.025,.19,
                    '#fff1d3'
                );

                box(
                    u-.055,Y+.032,
                    u+.055,Y+.040,
                    z+.11,.015,
                    '#fff1d3'
                );
            }

            if(side===1){

                box(
                    X-.01,v-.072,
                    X+.025,v+.072,
                    z,.24,
                    '#f8e5bb'
                );

                box(
                    X+.026,v-.055,
                    X+.031,v+.055,
                    z+.025,.19,
                    '#548cab'
                );

                box(
                    X+.032,v-.008,
                    X+.04,v+.008,
                    z+.025,.19,
                    '#fff1d3'
                );
            }

            if(side===2){

                box(
                    u-.072,y-.025,
                    u+.072,y+.01,
                    z,.24,
                    '#f8e5bb'
                );

                box(
                    u-.055,y-.033,
                    u+.055,y-.026,
                    z+.025,.19,
                    '#548cab'
                );
            }

            if(side===3){

                box(
                    x-.025,v-.072,
                    x+.01,v+.072,
                    z,.24,
                    '#f8e5bb'
                );

                box(
                    x-.033,v-.055,
                    x-.026,v+.055,
                    z+.025,.19,
                    '#548cab'
                );
            }
        }

        const nx=Math.max(

            2,

            Math.round((X-x)*4)
        );

        const ny=Math.max(

            2,

            Math.round((Y-y)*4)
        );

        for(let f=0;f<floors;f++){

            const z=.13+f*.34;

            for(let i=0;i<nx;i++){

                const u=

                    x+

                    (i+.5)*(X-x)/nx;

                if(f||Math.abs(u)>.13){

                    pane(u,0,z,0);
                }

                pane(u,0,z,2);
            }

            for(let i=0;i<ny;i++){

                const v=

                    y+

                    (i+.5)*(Y-y)/ny;

                pane(0,v,z,1);

                pane(0,v,z,3);
            }

            if(f){

                box(

                    x-.015,y-.015,

                    X+.015,Y+.015,

                    z-.045,.035,

                    '#e8d8b6'
                );
            }
        }

        // Front doors and pathways.

        box(

            -.10,Y-.015,

            .10,Y+.027,

            .045,.35,

            '#f5e6bd'
        );

        box(

            -.077,Y+.028,

            .077,Y+.039,

            .05,.30,

            accent
        );

        box(

            -.10,Y+.04,

            .10,D,

            0,.025,

            '#e6d3ae'
        );

        // Timber-framed houses.

        if(/tudor|logcabin|scandi/.test(id0)){

            for(const u of [x,0,X]){

                box(

                    u-.022,Y,

                    u+.022,Y+.027,

                    .07,H-.07,

                    '#80563a'
                );
            }
        }

        // Modern architecture.

        if(modern){

            box(

                x-.035,y-.035,

                X+.035,Y+.035,

                H,.09,

                roofCol
            );

            box(

                x+.03,y+.03,

                X-.03,Y-.03,

                H+.09,.025,

                '#d6d8cb'
            );

            box(

                x+.06,y+.06,

                x+.22,y+.22,

                H+.115,.15,

                accent
            );

        }else{

            roof(

                x-.045,y-.045,

                X+.045,Y+.045,

                H,.38,

                roofCol
            );

            // Chimneys.

            box(

                X-.16,y+.09,

                X-.055,y+.20,

                H+.12,.34,

                '#bb8063'
            );

            box(

                X-.18,y+.07,

                X-.035,y+.22,

                H+.46,.045,

                '#e0af8c'
            );
        }

        // Shopfront awnings.

        if(shop){

            const n=10;

            for(let i=0;i<n;i++){

                const u=x+(X-x)*i/n;

                const v=x+(X-x)*(i+1)/n;

                quad(

                    [u,Y,.48],

                    [v,Y,.48],

                    [v,Y+.19,.34],

                    [u,Y+.19,.34],

                    i%2

                        ?'#fff0ce'

                        :accent
                );
            }

            box(

                x,Y+.185,

                X,Y+.20,

                .29,.05,

                accent
            );
        }

        // Residential balconies and railings.

        if(home&&floors>1&&!modern){

            box(

                -.23,Y,

                .23,Y+.10,

                .42,.045,

                '#e4d0a5'
            );

            for(let i=0;i<6;i++){

                box(

                    -.22+i*.085,

                    Y+.085,

                    -.20+i*.085,

                    Y+.105,

                    .465,.13,

                    '#f6e7c7'
                );
            }

            box(

                -.24,Y+.08,

                .24,Y+.11,

                .595,.025,

                '#f6e7c7'
            );
        }

        // Front gardens.

        if(home){

            flowers(

                a+.05,

                D-.055,

                Math.max(

                    3,

                    Math.floor(
                        (C-a-.12)/.075
                    )
                )
            );

            if(localW>1||localH>1){

                tree(

                    a+.12,

                    b+.12,

                    .48
                );
            }
        }

        // Industrial chimneys.

        if(type==='factory'){

            box(

                X-.15,y+.04,

                X-.03,y+.16,

                H,.85,

                '#b78061'
            );

            box(

                X-.17,y+.02,

                X-.01,y+.18,

                H+.85,.05,

                '#e1b390'
            );
        }
    }

    // ======================================
    // 09 — RENDER AND CACHE THE 3D MODEL
    // ======================================

    g.putImageData(pixels,0,0);

    // Soft ground shadows.

    g.save();

    g.globalCompositeOperation=
        'destination-over';

    g.scale(scale,scale);

    g.translate(width/2,origin);

    const sh=g.createRadialGradient(

        5,3,1,

        5,3,

        Math.max(

            15,

            (w+h)*HW*.40
        )
    );

    sh.addColorStop(
        0,'#37492c38'
    );

    sh.addColorStop(
        1,'#37492c00'
    );

    g.scale(1,.48);

    g.fillStyle=sh;

    g.fillRect(

        -width/2,-80,

        width,160
    );

    g.restore();

    let l=Wp;

    let top=Hp;

    let R=0;

    let B=0;

    for(let y=0;y<Hp;y++){

        for(let x=0;x<Wp;x++){

            if(data[(y*Wp+x)*4+3]){

                l=Math.min(l,x);

                R=Math.max(R,x);

                top=Math.min(top,y);

                B=Math.max(B,y);
            }
        }
    }

    const result={

        c,width,height,origin,

        bounds:[

            l,top,

            Math.max(1,R-l+1),

            Math.max(1,B-top+1)
        ]
    };

    const size=Wp*Hp*4;

    // Limit the memory used by the new sprite cache.

    while(
        cache.size&&
        bytes+size>budget
    ){

        const first=

            cache.keys().next().value;

        const v=cache.get(first);

        bytes-=

            v.c.width*

            v.c.height*4;

        cache.delete(first);
    }

    cache.set(k,result);

    bytes+=size;

    return result;
}

// Keep existing artwork for all other buildings.

detailed=function(id,w,h,r=0){

    return sprite(id,w,h,r)||

        prior.detailed(id,w,h,r);
};

// ==========================================
// 10 — HIGHER QUALITY TERRAIN
// ==========================================

ground=function(t){

    const v=Math.floor(t.variant*8);

    const k=t.type+':'+v;

    if(grounds.has(k)){

        return grounds.get(k);
    }

    const c=document.createElement(
        'canvas'
    );

    c.width=HW*4;

    c.height=HH*4;

    const g=c.getContext('2d');

    g.scale(2,2);

    g.translate(HW,HH);

    const water=t.type==='water';

    const sand=t.type==='sand';

    const color=

        water

            ?['#80d7e4','#43adc9']

            :sand

                ?['#ffe7b0','#edc587']

                :['#a9d279','#a1cb72'];

    const p=g.createLinearGradient(

        -HW,-HH,

        HW,HH
    );

    p.addColorStop(0,color[0]);

    p.addColorStop(1,color[1]);

    g.beginPath();

    g.moveTo(0,-HH);

    g.lineTo(HW,0);

    g.lineTo(0,HH);

    g.lineTo(-HW,0);

    g.closePath();

    g.fillStyle=p;

    g.fill();

    g.clip();

    // Fine grass, sand and water texture.

    for(let i=0;i<70;i++){

        const x=

            (rand(i,v)-.5)*HW*2;

        const y=

            (rand(i,v+12)-.5)*HH*2;

        g.fillStyle=

            water

                ?'#efffff38'

                :sand

                    ?'#b28c5535'

                    :'#558c3b26';

        g.fillRect(

            x,y,

            water?3+i%7:1.1,

            water?.7:1.2
        );
    }

    grounds.set(k,c);

    return c;
};

// Wild trees use a cached 3D oak model.

drawObject=function(t){

    const k=key(t.x,t.y);

    if(

        !occupied.has(k)&&

        t.tree&&

        !town.cleared[k]&&

        TYPES.oak
    ){

        const im=sprite('oak',1,1,0);

        const [x,y]=project(t.x,t.y);

        const s=.75+t.variant*.25;

        ctx.drawImage(

            im.c,

            x-im.width*s/2,

            y-im.origin*s,

            im.width*s,

            im.height*s
        );

        return;
    }

    prior.drawObject(t);
};

// ==========================================
// 11 — FOUR-DIRECTION BUILDING ROTATION
// ==========================================

selectMode=function(m){

    prior.selectMode(m);

    if(

        m==='build'&&

        selected!==lastSelected
    ){

        lastSelected=selected;

        facing=rotation%2;
    }
};

const rotateBtn=seaRotateButton;

const oldClick=rotateBtn?.onclick;

if(rotateBtn){

    rotateBtn.onclick=()=>{

        if(

            mode==='build'&&

            type9(selected)
        ){

            facing=(facing+1)%4;

            rotation=facing%2;

            message(

                title(selected)+

                ' • Direction '+

                (facing+1)+'/4'
            );

            dirty=true;

            return;
        }

        if(mode==='inspect'&&inspected){

            rotateBuilding(inspected);

            return;
        }

        oldClick?.();
    };
}

rotateBuilding=function(k){

    const b=town.buildings[k];

    if(!b)return;

    // Correct the existing harbour rotation system.

    if(isPort(b.type)){

        if(state.sea[k]){

            message(
                'Vessel is at sea.'
            );

            return;
        }

        const start=harbourFacing(k,b);

        for(let i=1;i<4;i++){

            const f=(start+i)%4;

            const swap=

                f%2!==start%2;

            const w=

                swap

                    ?b.h||1

                    :b.w||1;

            const h=

                swap

                    ?b.w||1

                    :b.h||1;

            if(

                valid(...xy(k),w,h,k)&&

                shoreSides(

                    ...xy(k),w,h

                ).some(s=>s.facing===f)
            ){

                b.w=w;

                b.h=h;

                b.facing=f;

                b.rot=f%2;

                changed(

                    'Quay rotated.',

                    true
                );

                return;
            }
        }

        message(

            'No other quay direction has water access.'
        );

        return;
    }

    // Older graphics retain their original rotation.

    if(!type9(b.type)){

        return prior.rotateBuilding(k);
    }

    const r=((b.rot||0)+1)%4;

    const w=b.h||1;

    const h=b.w||1;

    if(!valid(...xy(k),w,h,k)){

        message(
            'Not enough space to rotate.'
        );

        return;
    }

    b.w=w;

    b.h=h;

    b.rot=r;

    changed(

        'Rotated to direction '+(r+1),

        true
    );
};

// ==========================================
// 12 — CONSTRUCTION INTEGRATION
// ==========================================

act=function(x,y){

    const k=key(x,y);

    if(

        layer==='surface'&&

        mode==='bridge'&&

        Object.values(state.sea)

            .some(t=>t.route?.includes(k))
    ){

        message(
            'A vessel is using this waterway.'
        );

        return;
    }

    const before=town.buildings[k];

    const building=

        layer==='surface'&&

        mode==='build';

    const movingFrom=moving;

    prior.act(x,y);

    const b=town.buildings[k];

    if(

        building&&

        b&&

        b!==before&&

        type9(b.type)
    ){

        b.rot=facing;

        changed();
    }

    // Preserve automatic fishing settings when moving.

    if(

        movingFrom&&

        !moving&&

        b&&

        b!==before&&

        V.auto[movingFrom]
    ){

        V.auto[k]=true;

        delete V.auto[movingFrom];

        save();
    }

    // Remove settings belonging to deleted buildings.

    if(

        layer==='surface'&&

        ['sell','bulldoze'].includes(mode)
    ){

        for(const a of Object.keys(V.auto)){

            if(!town.buildings[a]){

                delete V.auto[a];
            }
        }

        save();
    }
};

// Boats cannot sail through road bridges.

const oldNavigable=navigableWater;

navigableWater=function(x,y){

    return oldNavigable(x,y)&&

        !town.buildings[key(x,y)]?.bridge;
};

// Correct saved harbour directions where possible.

for(const [k,b] of Object.entries(

    town.buildings
)){

    if(

        isPort(b.type)&&

        !state.sea[k]
    ){

        alignHarbour(k,b,b.facing);
    }
}

// ==========================================
// 13 — COMMERCIAL SHIPPING IMPORTS
// ==========================================

const imports={

    wheat:12,

    corn:14,

    timber:13,

    fish:18,

    flour:19,

    eggs:12,

    milk:13
};

function importGoods(k,goods){

    const b=town.buildings[k];

    if(

        b?.type!=='v8_shippingPort'||

        state.sea[k]||

        !Object.hasOwn(imports,goods)
    )return;

    const route=findSeaRoute(k,b);

    const n=Math.min(

        10,

        999-(state.stock[goods]||0)
    );

    const cost=

        n*imports[goods]+15;

    if(route.length<3){

        message(
            'Port needs open water.'
        );

        return;
    }

    if(n<=0||town.cash<cost){

        message(
            'Not enough cash or storage.'
        );

        return;
    }

    town.cash-=cost;

    state.sea[k]={

        type:'import',

        goods,

        amount:n,

        route,

        start:state.tick,

        end:state.tick+4
    };

    changed(
        'Import ship dispatched.'
    );
}

drawSeaVessel=function(trip){

    prior.drawSeaVessel(

        trip.type==='import'

            ?{...trip,type:'cargo'}

            :trip
    );
};

// ==========================================
// 14 — CONNECTED PASSENGER FERRY NETWORK
// ==========================================

function pathBetween(nodes,starts,ends){

    const target=new Set(ends);

    const parent=new Map();

    const q=[];

    for(const k of starts){

        if(nodes.has(k)&&!parent.has(k)){

            q.push(k);

            parent.set(k,null);
        }
    }

    for(let i=0;i<q.length;i++){

        const k=q[i];

        if(target.has(k)){

            const route=[];

            for(

                let a=k;

                a!==null;

                a=parent.get(a)
            ){

                route.push(a);
            }

            return route.reverse();
        }

        for(const [a,b] of D){

            const [x,y]=xy(k);

            const n=key(x+a,y+b);

            if(

                nodes.has(n)&&

                !parent.has(n)
            ){

                parent.set(n,k);

                q.push(n);
            }
        }
    }

    return [];
}

rebuildRoutes=function(){

    prior.rebuildRoutes();

    ferries=[];

    const ports=

        Object.entries(town.buildings)

        .filter(

            ([k,b])=>

                b.type==='v6_ferry'&&

                roadAccess(k,b)
        );

    const nodes=new Set(

        tiles.filter(

            t=>t.type==='water'&&

                !town.buildings[

                    key(t.x,t.y)

                ]?.bridge

        ).map(

            t=>key(t.x,t.y)
        )
    );

    const shore=(k,b)=>

        shoreSides(

            ...xy(k),

            b.w||1,

            b.h||1

        ).flatMap(s=>s.tiles);

    for(

        let i=0;

        i<ports.length-1&&ferries.length<6;

        i++
    ){

        const [k,b]=ports[i];

        for(let j=i+1;j<ports.length;j++){

            const [a,c]=ports[j];

            const route=pathBetween(

                nodes,

                shore(k,b),

                shore(a,c)
            );

            if(route.length>=2){

                ferries.push(route);

                break;
            }
        }
    }
};

// ==========================================
// 15 — MARITIME ECONOMY
// ==========================================

calculate=function(){

    const r=prior.calculate();

    const bonus=ferries.length*8;

    const cruises=

        Object.entries(town.buildings)

        .filter(

            ([k,b])=>

                b.type==='v9_cruise'&&

                roadAccess(k,b)&&

                shoreSides(

                    ...xy(k),

                    b.w||1,

                    b.h||1

                ).length

        ).length;

    r.visitors+=bonus+cruises*12;

    r.gross+=bonus+cruises*6;

    r.net+=bonus+cruises*6;

    return r;
};

// ==========================================
// 16 — AUTOMATIC FISHING AND CARGO RETURNS
// ==========================================

tick=function(){

    const due=

        Object.values(state.sea)

        .filter(

            t=>t.type==='import'&&

                t.end<=state.tick+1
        );

    prior.tick();

    for(const t of due){

        stock(t.goods,t.amount);

        V.imports++;
    }

    V.passengers+=ferries.length*8;

    for(const k of Object.keys(V.auto)){

        const b=town.buildings[k];

        if(

            !b||

            b.type!=='v6_fishingHarbour'
        ){

            delete V.auto[k];

            continue;
        }

        if(

            !state.sea[k]&&

            town.cash>=15&&

            (state.stock.fish||0)<980&&

            findSeaRoute(k,b).length>=3
        ){

            dispatchFishing(k);
        }
    }

    changed(

        due.length

            ?'Import cargo unloaded.'

            :''
    );
};

// ==========================================
// 17 — ADDITIONAL ACHIEVEMENTS
// ==========================================

awards.push(

    [

        'v9importer',

        'International importer',

        ()=>V.imports>=5,

        10
    ],

    [

        'v9ferry',

        'Passenger ferry service',

        ()=>V.passengers>=100,

        10
    ]
);

// ==========================================
// 18 — MOVING PASSENGER FERRIES
// ==========================================

render=function(){

    prior.render();

    if(

        layer!=='surface'||

        !ferries.length
    )return;

    ctx.save();

    ctx.setTransform(

        DPR,0,0,DPR,0,0
    );

    ctx.translate(camX,camY);

    ctx.scale(zoom,zoom);

    for(const [i,route] of ferries.entries()){

        const n=route.length-1;

        const p=

            (

                performance.now()/1300+i*2

            )%(n*2);

        const d=p<=n?p:2*n-p;

        const j=Math.min(

            n-1,

            Math.floor(d)
        );

        const f=d-j;

        const [x,y]=xy(route[j]);

        const [u,v]=xy(route[j+1]);

        const [a,b]=project(

            x+(u-x)*f,

            y+(v-y)*f
        );

        ctx.save();

        ctx.translate(a,b);

        ctx.rotate(

            Math.atan2(

                (u-x+v-y)*HH,

                (u-x-v+y)*HW
            )+

            (p>n?Math.PI:0)
        );

        // Ferry hull.

        poly([

            [-15,-5],

            [8,-5],

            [17,0],

            [8,5],

            [-15,5]

        ],'#467b9b');

        // Passenger cabin.

        ctx.fillStyle='#fff0d3';

        ctx.fillRect(

            -10,-10,19,10
        );

        ctx.fillStyle='#6ca7c0';

        for(let z=0;z<4;z++){

            ctx.fillRect(

                -8+z*4,

                -8,

                3,4
            );
        }

        ctx.restore();
    }

    ctx.restore();
};

// Request animation frames only when needed.

setInterval(()=>{

    if(

        layer==='surface'&&

        ferries.length
    ){

        dirty=true;
    }

},125);

// ==========================================
// 19 — COASTAL MANAGEMENT INTERFACE
// ==========================================

refreshPanel=function(){

    prior.refreshPanel();

    if(panel.hidden)return;

    const box=el(

        'div',

        undefined
    );

    box.className='v8maritime';

    el(

        'h3',

        'Coastal trade & transport',

        box
    );

    row(

        box,

        'Operating ferry routes',

        ferries.length
    );

    row(

        box,

        'Passenger journeys',

        V.passengers
    );

    row(

        box,

        'Completed imports',

        V.imports
    );

    const k=inspected;

    const b=k&&town.buildings[k];

    // Automatic fishing control.

    if(b?.type==='v6_fishingHarbour'){

        const label=el(

            'label',

            undefined,

            box
        );

        const c=el(

            'input',

            undefined,

            label
        );

        c.type='checkbox';

        c.checked=!!V.auto[k];

        label.append(

            ' Automatic fishing expeditions'
        );

        c.onchange=()=>{

            if(c.checked){

                V.auto[k]=true;

            }else{

                delete V.auto[k];
            }

            save();
        };
    }

    // Incoming cargo details.

    if(state.sea[k]?.type==='import'){

        const t=state.sea[k];

        row(

            box,

            'Incoming cargo',

            t.amount+' '+t.goods
        );

        for(const e of

            panel.querySelectorAll('.v7row')
        ){

            if(

                e.firstElementChild?.textContent===

                'Expected catch'
            ){

                e.remove();
            }
        }
    }

    // Import goods from an overseas market.

    if(

        b?.type==='v8_shippingPort'&&

        !state.sea[k]
    ){

        const s=el(

            'select',

            undefined,

            box
        );

        for(const [name,price] of

            Object.entries(imports)
        ){

            const o=el(

                'option',

                name+

                ' • '+

                money(price)+

                '/unit',

                s
            );

            o.value=name;
        }

        button(

            'Import up to 10 units (+£15 freight)',

            ()=>importGoods(k,s.value),

            box
        );
    }

    panel.firstElementChild.after(box);
};

// ==========================================
// 20 — REFRESH THE CATALOGUE
// ==========================================

$('v5search').dispatchEvent(

    new Event('input')
);

console.log(

    'Town Builder V0.9: coastal systems and lit sprites ready'
);

})();

/* END OF V0.9 — COASTAL WORLD */

   
new MutationObserver(decorateCards)

    .observe(

        $('catalogue'),

        {childList:true}
    );

rebuildRoutes();

report=calculate();

checkAwards();

decorateCards();

hud();

save();

dirty=true;

setInterval(tick,10000);

setInterval(

    ()=>{

        if(

            serviceRoutes.length||

            layer==='metro'&&metroRoutes.length
        ){

            dirty=true;
        }
    },

    120
);

document.title=

    'Town Builder • Living Society';

message(

    'Living Society V0.7 • Inspect, build, rotate, connect utilities and manage your town.'
);

})();
