
/* ==========================================
   TOWN BUILDER V0.5
   THE LIVING TOWN
   Requires V0.2, V0.3 and V0.4
   ========================================== */

(()=>{
'use strict';

const A={};
const cache=new Map();
const oldPreviews=new Map();

const oldDraw=drawObject;
const oldTile=drawTile;
const oldMode=selectMode;

const tabs=$('categories');
const list=$('catalogue');

// Preserve existing illustrated previews.

for(const tab of [...tabs.children]){
    tab.click();

    for(const card of list.children){
        const c=card.querySelector('canvas');

        if(c){
            oldPreviews.set(card.dataset.type,c);
        }
    }
}

// ==========================================
// 01 — MASSIVE CATALOGUE EXPANSION
// ==========================================

function add(
    id,name,cost,rent,section,
    shape,wall,roof,detail=''
){

    const group=({
        Civic:'Services',
        Education:'Services',
        Tourism:'Business',
        Leisure:'Business',
        Transport:'Services',
        Agriculture:'Farming',
        Utilities:'Utilities',
        Industry:'Industry',
        Decoration:'Nature',
        Fences:'Nature',
        Nature:'Nature',
        Faith:'Services'
    })[section]||section;

    TYPES[id]={
        name,cost,rent,pop:0,group,section
    };

    A[id]={shape,wall,roof,detail};
}

const rows=[

// CIVIC BUILDINGS

['townhall','Town hall',800,0,'Civic','hall','#efd5a4','#a65d43','clock'],

['courthouse','Courthouse',760,0,'Civic','temple','#e8dfc5','#70808d'],

['postoffice','Post office',320,35,'Civic','shop','#e4b48a','#8c5045','POST'],

['council','Council offices',590,0,'Civic','block','#e8d6b6','#648287','CIVIC'],

['community','Community centre',360,0,'Civic','hall','#f4d6a1','#6b9b92'],

['hospital','Hospital',1100,0,'Civic','hospital','#f3eddb','#729ca8'],

['ambulance','Ambulance station',380,0,'Civic','garage','#f1e3cf','#5e8f91','EMS'],

['rescue','Rescue station',420,0,'Civic','garage','#edb5a4','#92584d','RESCUE'],

['registry','Registry office',380,0,'Civic','temple','#f1d7b2','#8e797d'],

['army','Military base',1000,0,'Civic','compound','#b8b99b','#74836a','ARMY'],

['prison','Prison',950,0,'Civic','compound','#d0c6ad','#7c8587','PRISON'],

// EDUCATION

['secondary','Secondary school',780,0,'Education','hall','#e9c58d','#a5684a','clock'],

['university','University',1250,0,'Education','temple','#e6caa0','#6b778a'],

['nursery','Nursery school',260,0,'Education','house','#f5d0a6','#d08170'],

['college','College',760,0,'Education','block','#e2c3a3','#688a92','COLLEGE'],

['nationalLibrary','Grand library',1000,0,'Education','temple','#ecd7ac','#7a8b9d'],

// TOURISM

['museum','History museum',780,95,'Tourism','temple','#eee0ba','#7b8d91'],

['artgallery','Art gallery',540,65,'Tourism','block','#eee5d4','#9b7f9c','ART'],

['castle','Historic castle',1400,145,'Tourism','castle','#c7b99b','#7a8793'],

['clocktower','Clock tower',480,35,'Tourism','tower','#e9caa0','#a46648','clock'],

['aquarium','Aquarium',920,110,'Tourism','dome','#b9dce0','#579bb7','SEA'],

['visitor','Visitor centre',300,35,'Tourism','shop','#e9c9a2','#619586','INFO'],

['guesthouse','Guesthouse',420,55,'Tourism','house','#f2d3b1','#a56c83'],

['resort','Holiday resort',1050,125,'Tourism','block','#f4dfb3','#d07b58','RESORT'],

['observatory','Observatory',850,75,'Tourism','dome','#d8dfdc','#8098b7','STAR'],

['monument','Town monument',220,15,'Tourism','monument','#d8d0b9','#8d9f8b'],

// ENTERTAINMENT AND LEISURE

['theatre','Theatre',680,82,'Leisure','temple','#f2c6a7','#9a6075'],

['cinema','Cinema',520,68,'Leisure','block','#d9c1d9','#79598e','CINEMA'],

['stadium','Sports stadium',1200,120,'Leisure','stadium','#d5d5c6','#6899ad'],

['pool','Swimming pool',420,45,'Leisure','pool','#e8dbc3','#58b5d1'],

['wheel','Ferris wheel',850,95,'Leisure','wheel','#f5d4b2','#d36e72'],

['carousel','Carousel',360,45,'Leisure','carousel','#efd2a0','#d27b68'],

['playground','Playground',150,0,'Leisure','play','#f4d9a0','#dc795a'],

['festival','Festival grounds',350,35,'Leisure','tents','#e6c39d','#d57079'],

['marketSquare','Market square',380,50,'Leisure','tents','#e7d4a8','#6f9e80'],

['tennis','Tennis court',160,15,'Leisure','court','#e0d4b8','#75a47b'],

// RELIGIOUS AND HERITAGE BUILDINGS

['chapel','Village chapel',320,0,'Faith','church','#eedcbd','#8c766a'],

['church','Parish church',680,0,'Faith','church','#d8cbb0','#718496'],

['cathedral','Cathedral',1300,0,'Faith','cathedral','#dfd1b5','#718497'],

['temple','Community temple',620,0,'Faith','temple','#e9d6b1','#a97857'],

// TRANSPORT NETWORKS

['station','Railway station',740,65,'Transport','hall','#e4b78c','#637d88','RAIL'],

['busstop','Bus shelter',80,0,'Transport','shelter','#e9e4d3','#549d9f'],

['busdepot','Bus depot',420,25,'Transport','garage','#c9d9d6','#6b8a9b','BUS'],

['carpark','Car park',95,15,'Transport','parking','#c9c4b4','#757d82'],

['taxi','Taxi rank',120,12,'Transport','parking','#e7cdab','#737b80'],

['rail','Railway track',24,0,'Transport','track','#d4bd95','#656b70'],

['tramTrack','Tram track',25,0,'Transport','track','#cfc5b0','#666d73'],

['subwayTrack','Subway tunnel',28,0,'Transport','track','#b3c1c2','#536b78'],

['cycle','Cycle lane',12,0,'Transport','track','#b5ce88','#729b72'],

['tramstop','Tram stop',150,0,'Transport','shelter','#f2e5ce','#d08e60'],

['subway','Subway station',520,0,'Transport','subway','#d9e2d9','#6294a5'],

['airport','Airport terminal',1800,140,'Transport','airport','#e6e5d8','#7195aa'],

['runway','Airport runway',100,0,'Transport','track','#c6c6b8','#69757c'],

['hangar','Aircraft hangar',620,0,'Transport','garage','#d3d8d7','#758b9e','HANGAR'],

['harbour','Harbour office',650,40,'Transport','hall','#e8d5b4','#5e8195','PORT'],

// AGRICULTURE

['windmill','Traditional windmill',380,38,'Agriculture','mill','#e9d2ab','#986447'],

['watermill','Watermill',390,40,'Agriculture','watermill','#d7b28b','#775c4e'],

['orchard','Apple orchard',160,18,'Agriculture','orchard','#a1c879','#d36e53'],

['vineyard','Vineyard',180,22,'Agriculture','vines','#a5bf70','#79579a'],

['chicken','Chicken coop',110,12,'Agriculture','coop','#e2be91','#b67551'],

['sheep','Sheep pasture',130,15,'Agriculture','pasture','#a5c977','#efe8d4'],

['cow','Dairy pasture',180,22,'Agriculture','pasture','#a5c977','#8f684b'],

['silo','Grain silo',220,15,'Agriculture','silo','#d5d2bf','#a88b64'],

// INDUSTRY

['brewery','Brewery',530,65,'Industry','garage','#ddc29d','#8c6c54','BREW'],

['textile','Textile works',520,60,'Industry','garage','#d7c6b5','#7a8d98','TEXTILE'],

['brickworks','Brickworks',460,55,'Industry','garage','#c99b80','#93654f','BRICK'],

// UTILITIES AND WASTE

['substation','Substation',220,0,'Utilities','substation','#d5d7c4','#6d8585'],

['pump','Water pumping station',280,0,'Utilities','garage','#c8dedb','#5796aa','PUMP'],

['landfill','Landfill',330,0,'Utilities','landfill','#b5a481','#766955'],

['wasteDepot','Waste collection depot',420,0,'Utilities','garage','#d1d6b7','#6e8b65','WASTE'],

// FENCES AND BOUNDARIES

['woodFence','Wooden fence',8,0,'Fences','fence','#be9160','#895d40'],

['whiteFence','White picket fence',10,0,'Fences','fence','#f4ecd6','#b8b8a7'],

['stoneWall','Stone wall',15,0,'Fences','wall','#d2c4aa','#928b7f'],

['ironFence','Wrought iron fence',18,0,'Fences','fence','#536567','#39474a'],

['hedge','Trimmed hedge',12,0,'Fences','hedge','#78ab55','#397e44'],

// STREET FURNITURE AND DECORATIONS

['bench','Park bench',20,0,'Decoration','bench','#bf8750','#516a5e'],

['lamp','Street lamp',22,0,'Decoration','lamp','#f7dc8c','#52666c'],

['flowers','Flower bed',18,0,'Decoration','flowers','#f29dc2','#e9ba5e'],

['roseGarden','Rose garden',60,0,'Decoration','flowers','#d86b8e','#f6d7ac'],

['statue','Statue',85,0,'Decoration','monument','#e4d9c1','#999b92'],

['gazebo','Garden gazebo',95,0,'Decoration','gazebo','#f0e5c9','#668b89'],

// PARKS AND NATURE

['pond','Garden pond',65,0,'Nature','pool','#a2cb78','#6cb9ca'],

['oak','Oak tree',25,0,'Nature','tree','#9bc968','#487d40'],

['pine','Pine tree',25,0,'Nature','pine','#6eaa66','#346b4b'],

['autumn','Autumn maple',30,0,'Nature','tree','#e6a153','#a85c3c'],

['palm','Palm tree',35,0,'Nature','palm','#8bc77b','#4f8c51'],

['rock','Rock garden',35,0,'Nature','rocks','#c9c1a5','#8f968e'],

['botanic','Botanical garden',300,20,'Nature','flowers','#bf7fad','#f1c46d'],

['cityPark','City park',260,0,'Nature','park','#9bc76d','#79b9cf']

];

rows.forEach(r=>add(...r));

// Keep old building IDs and reorganise categories.

const sectionOf=(id,t)=>
    t.section||
    ({
        Services:'Civic',
        Farming:'Agriculture',
        Business:'Shops',
        Homes:'Homes',
        Nature:'Nature',
        Roads:'Roads',
        Industry:'Industry',
        Utilities:'Utilities'
    })[t.group]||t.group;

TYPES.school.section='Education';
TYPES.library.section='Education';
TYPES.hotel.section='Tourism';
TYPES.pub.section='Leisure';

// Transport track tiles do not consume utilities.

for(const id of [
    'rail','tramTrack','subwayTrack',
    'cycle','runway'
]){
    TYPES[id].group='Roads';
}

const fenceIds=new Set(
    rows.filter(r=>r[4]==='Fences')
        .map(r=>r[0])
);

// ==========================================
// 02 — HIGH RESOLUTION GRAPHICAL ASSETS
// ==========================================

function makeArt(id,links=0){

    const ck=id+':'+links;

    if(cache.has(ck)){
        return cache.get(ck);
    }

    const s=A[id];

    const c=document.createElement('canvas');

    c.width=360;
    c.height=450;

    const g=c.getContext('2d');

    g.scale(3,3);
    g.translate(60,122);

    const P=(x,y,z=0)=>[
        (x-y)*HW,
        (x+y)*HH-z
    ];

    const tone=(h,n)=>
        '#'+h.slice(1)
        .match(/../g)
        .map(x=>
            Math.max(
                0,
                Math.min(
                    255,
                    parseInt(x,16)+n
                )
            ).toString(16).padStart(2,'0')
        ).join('');

    function grad(x,y,X,Y,a,b){

        const z=g.createLinearGradient(x,y,X,Y);

        z.addColorStop(0,a);
        z.addColorStop(1,b);

        return z;
    }

    function poly(ps,col,edge){

        g.beginPath();

        ps.forEach(
            (p,i)=>i
                ?g.lineTo(...p)
                :g.moveTo(...p)
        );

        g.closePath();

        g.fillStyle=col;
        g.fill();

        if(edge){
            g.strokeStyle=edge;
            g.lineWidth=.65;
            g.stroke();
        }
    }

    const face=(ps,col,edge)=>
        poly(ps.map(p=>P(...p)),col,edge);

    const flat=(a,b,c,d,col,z=0)=>
        face([
            [a,b,z],
            [c,b,z],
            [c,d,z],
            [a,d,z]
        ],col);

    function line(a,b,col,w=1){

        g.beginPath();

        g.moveTo(...a);
        g.lineTo(...b);

        g.strokeStyle=col;
        g.lineWidth=w;
        g.lineCap='round';

        g.stroke();
    }

    const L=(a,b,col,w)=>
        line(P(...a),P(...b),col,w);

    function oval(x,y,rx,ry,col){

        g.beginPath();

        g.ellipse(
            x,y,rx,ry,
            0,0,Math.PI*2
        );

        g.fillStyle=col;
        g.fill();
    }

    const W=s.wall;
    const R=s.roof;

    // THREE DIMENSIONAL ARCHITECTURE

    function box(a,b,c,d,z,h,col=W){

        face([
            [a,d,z],
            [c,d,z],
            [c,d,z+h],
            [a,d,z+h]
        ],
        grad(
            -25,-h,20,12,
            tone(col,12),
            tone(col,-10)
        ),
        '#80694b35');

        face([
            [c,b,z],
            [c,d,z],
            [c,d,z+h],
            [c,b,z+h]
        ],
        tone(col,-35),
        '#80694b35');

        flat(
            a,b,c,d,
            tone(col,20),
            z+h
        );
    }

    // TEXTURED ROOF TILES

    function roof(
        a,b,c,d,h,r,
        col=R,hip=false
    ){

        const m=(a+c)/2;
        const y0=hip?b+.11:b;
        const y1=hip?d-.11:d;

        face([
            [a,d,h],
            [c,d,h],
            [m,y1,h+r]
        ],hip?tone(col,5):W);

        const sides=[
            [a,m,h,h+r,b,d,y0,y1,tone(col,12)],
            [m,c,h+r,h,y0,y1,b,d,tone(col,-15)]
        ];

        for(const [
            x0,x1,z0,z1,
            yy0,yy1,YY0,YY1,color
        ] of sides){

            face([
                [x0,yy0,z0],
                [x0,yy1,z0],
                [x1,YY1,z1],
                [x1,YY0,z1]
            ],color,'#59473860');

            for(let i=1;i<6;i++){

                let t=i/6;
                let x=x0+(x1-x0)*t;
                let z=z0+(z1-z0)*t;

                let ya=yy0+(YY0-yy0)*t;
                let yb=yy1+(YY1-yy1)*t;

                L(
                    [x,ya,z],
                    [x,yb,z],
                    tone(color,-22),
                    .65
                );

                for(let j=1;j<5;j++){

                    let u=(j-(i%2)*.35)/5;
                    let tt=(i-1)/6;

                    let xx=x0+(x1-x0)*tt;
                    let zz=z0+(z1-z0)*tt;

                    let aa=yy0+(YY0-yy0)*tt;
                    let bb=yy1+(YY1-yy1)*tt;

                    L(
                        [x,ya+(yb-ya)*u,z],
                        [xx,aa+(bb-aa)*u,zz],
                        tone(color,-18),
                        .45
                    );
                }
            }
        }

        L(
            [m,y0,h+r],
            [m,y1,h+r],
            tone(col,35),
            1.6
        );
    }

    function windowAt(
        x,y,z,w=.12,h=9,side=false
    ){

        const Q=(u,v)=>side
            ?P(x,y+u,z+v)
            :P(x+u,y,z+v);

        poly([
            Q(0,0),
            Q(w,0),
            Q(w,h),
            Q(0,h)
        ],'#fff0ce','#a78e72');

        poly([
            Q(.018,1),
            Q(w-.018,1),
            Q(w-.018,h-1),
            Q(.018,h-1)
        ],grad(
            ...Q(0,h),
            ...Q(w,0),
            '#b9e2e5',
            '#3e7494'
        ));

        line(
            Q(w/2,1),
            Q(w/2,h-1),
            '#fff3dc',.75
        );

        line(
            Q(.02,h/2),
            Q(w-.02,h/2),
            '#fff3dc',.7
        );

        line(
            Q(-.018,0),
            Q(w+.018,0),
            '#b49a78',1.6
        );
    }

    function door(x,y,z=0,w=.18,h=13){

        face([
            [x-w/2,y,z],
            [x+w/2,y,z],
            [x+w/2,y,z+h],
            [x-w/2,y,z+h]
        ],'#795742','#f2dfb4');
    }

    function sign(text,x,y,z){

        const p=P(x,y,z);

        g.save();

        g.translate(...p);
        g.transform(1,.5,0,1,0,0);

        g.fillStyle='#fff0d0';
        g.fillRect(-14,-3,28,6);

        g.font='bold 4.4px sans-serif';
        g.textAlign='center';

        g.fillStyle='#5b5147';

        g.fillText(text,0,1.6,26);

        g.restore();
    }

    function bush(
        x,y,col='#79ad53',size=1
    ){

        const [a,b]=P(x,y);

        oval(
            a+2,b+1,
            6*size,2.5*size,
            '#31573933'
        );

        for(let i=0;i<3;i++){

            oval(
                a+(i-1)*3*size,
                b-(2+i%2)*size,
                4*size,4*size,
                grad(
                    a-6,b-7,
                    a+6,b,
                    tone(col,25),
                    tone(col,-27)
                )
            );
        }
    }

    function tree(
        x,y,col=W,scale=1
    ){

        const [a,b]=P(x,y);

        g.save();

        g.translate(a,b);
        g.scale(scale,scale);

        oval(5,1,15,5,'#34583738');

        line(
            [0,0],[0,-27],
            '#926747',4
        );

        const parts=[
            [-9,-26,11],
            [9,-27,12],
            [-6,-38,12],
            [7,-39,11],
            [0,-47,10],
            [0,-29,12]
        ];

        for(const [X,Y,r] of parts){

            oval(
                X,Y,r,r*.89,
                grad(
                    X-r,Y-r,
                    X+r,Y+r,
                    tone(col,24),
                    tone(col,-36)
                )
            );

            oval(
                X-r*.3,Y-r*.3,
                r*.3,r*.19,
                '#fff1b32b'
            );
        }

        g.restore();
    }

    function clock(x,y,z){

        const p=P(x,y,z);

        oval(...p,6,7,'#6d584c');

        oval(...p,4.8,5.6,'#fff1cb');

        line(
            p,[p[0],p[1]-3.5],
            '#665144',1
        );

        line(
            p,[p[0]+2.5,p[1]+1],
            '#665144',1
        );
    }

    function base(col='#d9c9a9'){

        oval(4,4,36,12,'#34533827');

        flat(-.46,-.46,.46,.46,col);
    }

    function windows(h){

        for(let z=7;z<h-4;z+=15){

            for(const x of [-.29,-.06,.17]){
                windowAt(x,.24,z,.12,9);
            }

            for(const y of [-.26,.03]){
                windowAt(.35,y,z,.14,9,true);
            }
        }
    }

    function tower(x,y,w,h,spire=false){

        box(x-w,y-w,x+w,y+w,0,h,W);

        windowAt(
            x-w*.6,y+w,
            h-15,w*1.2,8
        );

        if(spire){

            face([
                [x-w-.035,y+w+.035,h],
                [x+w+.035,y+w+.035,h],
                [x,y,h+18]
            ],tone(R,15));

            face([
                [x+w+.035,y-w-.035,h],
                [x+w+.035,y+w+.035,h],
                [x,y,h+18]
            ],tone(R,-18));

        }else{

            box(
                x-w-.03,y-w-.03,
                x+w+.03,y+w+.03,
                h,3,W
            );

            for(const t of [-1,1]){

                box(
                    x+t*w-.035,y+w-.04,
                    x+t*w+.035,y+w+.04,
                    h+3,4,W
                );
            }
        }
    }

    function cylinder(x,y,z,h,r,col=W){

        const [a,b]=P(x,y,z);

        g.fillStyle=grad(
            a-r,b,a+r,b,
            tone(col,25),
            tone(col,-32)
        );

        g.fillRect(a-r,b-h,r*2,h);

        oval(a,b,r,r*.32,tone(col,-12));

        oval(a,b-h,r,r*.32,tone(col,24));
    }

    const sh=s.shape;

// ==========================================
// 03 — TRANSPORT AND CIVIC GRAPHICS
// ==========================================

    if(sh==='track'){

        base(W);

        flat(-.5,-.25,.5,.25,R);

        for(let i=-.42;i<.5;i+=.14){

            L(
                [i,-.22,1],
                [i,.22,1],
                '#f0e1bf',1.1
            );
        }

        L(
            [-.5,-.13,1],
            [.5,-.13,1],
            '#e0e5e3',1.8
        );

        L(
            [-.5,.13,1],
            [.5,.13,1],
            '#e0e5e3',1.8
        );

    }else if(sh==='airport'){

        base('#c6c9c1');

        box(
            -.43,-.32,.43,.14,
            0,24,W
        );

        box(
            -.45,-.34,.45,.16,
            24,3,R
        );

        for(let i=0;i<5;i++){

            windowAt(
                -.38+i*.15,
                .14,5,.12,13
            );
        }

        tower(.24,-.14,.11,45);

        box(
            .10,-.28,.38,0,
            45,7,R
        );

        sign('AIRPORT',0,.14,22);

        flat(
            -.4,.22,.4,.45,
            '#89969c'
        );

        L(
            [-.36,.34,1],
            [.36,.34,1],
            '#f4e6af',1.2
        );

    }else if(sh==='subway'){

        base();

        box(
            -.32,-.28,.32,.22,
            0,4,W
        );

        flat(
            -.26,-.2,.26,.15,
            '#384c58',4
        );

        for(let i=0;i<6;i++){

            L(
                [-.23,-.18+i*.055,5],
                [.23,-.18+i*.055,5],
                '#9cabb0',1.6
            );
        }

        for(const x of [-.31,.31]){

            L(
                [x,-.24,0],
                [x,-.24,27],
                R,2.5
            );
        }

        roof(
            -.36,-.29,.36,.26,
            27,5,R
        );

        sign('METRO',0,.26,25);

    }else if(sh==='compound'){

        base('#bbb9a2');

        box(
            -.3,-.30,.31,.20,
            0,24,W
        );

        box(
            -.34,-.34,.35,.24,
            24,4,R
        );

        windows(24);
        door(0,.20);

        sign(s.detail,0,.20,22);

        for(const [x,y] of [
            [-.4,-.4],
            [.4,-.4],
            [-.4,.4],
            [.4,.4]
        ]){

            box(
                x-.055,y-.055,
                x+.055,y+.055,
                0,14,R
            );
        }

        for(const z of [4,10]){

            L(
                [-.4,.4,z],
                [.4,.4,z],
                R,1.2
            );

            L(
                [.4,-.4,z],
                [.4,.4,z],
                R,1.2
            );
        }

    }else if(sh==='landfill'){

        base('#a6967c');

        for(let i=0;i<14;i++){

            const x=(hash(i,5)-.5)*.68;
            const y=(hash(i,8)-.5)*.68;

            const p=P(x,y);

            oval(
                p[0],p[1]-4,
                6,4,
                [
                    '#777e71',
                    '#a5957e',
                    '#b9b6a5',
                    '#817361'
                ][i%4]
            );
        }

        box(
            .18,.10,.38,.31,
            0,7,'#c3aa62'
        );

    }else if(sh==='park'){

        base('#9bc76d');

        flat(
            -.07,-.45,.07,.45,
            '#e6d5ae'
        );

        flat(
            -.45,-.07,.45,.07,
            '#e6d5ae'
        );

        tree(-.27,-.25,W,.55);
        tree(.28,.27,W,.55);
        tree(.28,-.27,W,.45);

        oval(-12,5,9,5,R);

        bush(-.3,.3,'#9fba6a');

// ==========================================
// 04 — PUBLIC AND COMMERCIAL BUILDINGS
// ==========================================

    }else if([
        'hall','temple','block',
        'hospital','garage',
        'shop','house'
    ].includes(sh)){

        base(
            sh==='house'
                ?'#a5cb79'
                :'#d8c8aa'
        );

        const h=
            sh==='block'||sh==='hospital'
                ?48
                :sh==='hall'||sh==='temple'
                    ?34
                    :sh==='house'?31:24;

        box(-.36,-.34,.35,.24,0,h,W);

        windows(h);

        door(0,.24,0,.17,14);

        if([
            'block','hospital','garage'
        ].includes(sh)){

            box(
                -.40,-.38,.39,.28,
                h,4,R
            );

            flat(
                -.32,-.30,.31,.20,
                tone(R,25),h+4
            );

            box(
                -.19,-.24,.15,.02,
                h+4,5,'#c3c8ba'
            );

        }else{

            roof(
                -.40,-.38,.39,.28,
                h,14,R,
                sh==='hall'||sh==='house'
            );
        }

        // Classical columns and entrance.

        if(sh==='temple'){

            box(
                -.38,.24,.38,.46,
                0,3,'#e5d6b6'
            );

            for(const x of [
                -.32,-.16,0,.16,.32
            ]){

                L(
                    [x,.43,3],
                    [x,.43,28],
                    '#f6ead1',3.7
                );
            }

            face([
                [-.41,.46,28],
                [.41,.46,28],
                [0,.46,39]
            ],'#f0dfb8','#b8a688');

            L(
                [-.41,.46,28],
                [.41,.46,28],
                '#a89071',1.3
            );
        }

        if(
            sh==='hall'&&
            s.detail==='clock'
        ){

            tower(0,-.03,.13,h+22,true);

            clock(0,.10,h+13);
        }

        if(sh==='hospital'){

            sign('HOSPITAL',0,.24,26);

            const [x,y]=P(0,.24,39);

            line(
                [x-5,y],[x+5,y],
                '#c95d57',3
            );

            line(
                [x,y-5],[x,y+5],
                '#c95d57',3
            );
        }

        if(sh==='garage'){

            for(const x of [-.23,.10]){

                face([
                    [x,.245,0],
                    [x+.18,.245,0],
                    [x+.18,.245,15],
                    [x,.245,15]
                ],'#657a7c','#e2d7b9');

                for(let z=3;z<15;z+=3){

                    L(
                        [x,.25,z],
                        [x+.18,.25,z],
                        '#b9ceca',.8
                    );
                }
            }
        }

        if(sh==='shop'){

            for(let i=0;i<8;i++){

                let x=-.35+i*.0875;

                face([
                    [x,.24,18],
                    [x+.0875,.24,18],
                    [x+.0875,.43,12],
                    [x,.43,12]
                ],i%2?'#fff0d0':R);
            }
        }

        if(s.detail&&s.detail!=='clock'){

            sign(
                s.detail,0,.245,h-5
            );
        }

        bush(-.36,.37,'#85ad54');
        bush(.36,.34,'#89b85c');

// ==========================================
// 05 — CASTLES, CHURCHES AND LANDMARKS
// ==========================================

    }else if([
        'church','cathedral',
        'castle','tower'
    ].includes(sh)){

        base('#d2c5a8');

        if(sh==='castle'){

            box(
                -.29,-.31,.29,.31,
                0,23,W
            );

            for(const [x,y] of [
                [-.29,-.29],
                [.29,-.29],
                [-.29,.29],
                [.29,.29]
            ]){

                tower(
                    x,y,.12,
                    40+(x===y?7:0)
                );
            }

            door(0,.32,0,.2,17);

        }else if(sh==='tower'){

            tower(0,0,.23,61,true);

            clock(0,.23,49);

            door(0,.23);

        }else{

            box(
                -.28,-.35,.28,.28,
                0,29,W
            );

            roof(
                -.32,-.39,.32,.32,
                29,18
            );

            for(const y of [-.24,0]){

                windowAt(
                    .28,y,8,.12,15,true
                );
            }

            tower(
                0,.24,.17,
                sh==='cathedral'?63:49,
                true
            );

            door(0,.41);

            clock(
                0,.41,
                sh==='cathedral'?51:37
            );

            if(sh==='cathedral'){

                tower(-.32,.18,.11,51,true);
                tower(.32,.18,.11,51,true);
            }

            L(
                [
                    0,.24,
                    sh==='cathedral'?81:67
                ],
                [
                    0,.24,
                    sh==='cathedral'?89:75
                ],
                '#c5a16c',1.5
            );
        }

    }else if(sh==='dome'){

        base();

        box(
            -.35,-.34,.35,.29,
            0,21,W
        );

        windows(21);

        const [x,y]=P(0,0,22);

        oval(
            x,y,28,12,
            tone(R,-20)
        );

        g.beginPath();

        g.ellipse(
            x,y,28,30,
            0,Math.PI,Math.PI*2
        );

        g.closePath();

        g.fillStyle=grad(
            x-27,y-28,
            x+27,y,
            R,tone(R,-39)
        );

        g.fill();

        for(let i=-2;i<=2;i++){

            g.beginPath();

            g.ellipse(
                x,y,
                Math.abs(i)*9+1,30,
                0,Math.PI,Math.PI*2
            );

            g.strokeStyle='#e1f0e25c';
            g.lineWidth=.8;

            g.stroke();
        }

        sign(s.detail,0,.29,16);
        door(0,.29);

// ==========================================
// 06 — MILLS AND AGRICULTURE
// ==========================================

    }else if([
        'mill','watermill',
        'silo','coop'
    ].includes(sh)){

        base('#aacb77');

        if(sh==='mill'||sh==='silo'){

            cylinder(
                0,0,0,
                sh==='mill'?46:32,
                sh==='mill'?15:19
            );

            const h=sh==='mill'?46:32;

            poly([
                [-19,-h],
                [0,-h-19],
                [19,-h]
            ],R);

            door(0,.25);

            if(sh==='mill'){

                const [x,y]=P(0,.31,43);

                for(let i=0;i<4;i++){

                    let a=
                        Math.PI/4+
                        i*Math.PI/2;

                    g.save();

                    g.translate(x,y);
                    g.rotate(a);

                    line(
                        [0,0],[30,0],
                        '#785841',2.4
                    );

                    poly([
                        [7,-3],
                        [30,-3],
                        [30,5],
                        [7,3]
                    ],'#f4e5c7','#9c805d');

                    for(let k=10;k<30;k+=4){

                        line(
                            [k,-2],[k,4],
                            '#a88e70',.6
                        );
                    }

                    g.restore();
                }

                oval(x,y,3,3,'#805d42');
            }

        }else{

            box(
                -.34,-.32,.28,.20,
                0,sh==='coop'?14:24,W
            );

            roof(
                -.38,-.36,.32,.24,
                sh==='coop'?14:24,11
            );

            door(0,.20);

            if(sh==='watermill'){

                const [x,y]=P(.32,.12,10);

                oval(x,y,13,18,'#815b3d');

                oval(x,y,10,14,'#c7a06b');

                for(let i=0;i<8;i++){

                    let a=i*Math.PI/4;

                    line(
                        [x,y],
                        [
                            x+12*Math.cos(a),
                            y+16*Math.sin(a)
                        ],
                        '#785334',1.8
                    );
                }

            }else{

                for(let i=0;i<3;i++){

                    let [x,y]=P(
                        -.28+i*.24,.35
                    );

                    oval(x,y-2,4,3,'#fff0d3');

                    oval(x+3,y-4,2,2,'#f9e6c4');

                    oval(x+3,y-6,1.2,1,'#db654b');
                }
            }
        }

// ==========================================
// 07 — AUTOMATICALLY CONNECTING FENCES
// ==========================================

    }else if([
        'fence','wall','hedge'
    ].includes(sh)){

        const ds=[
            [1,0],[-1,0],[0,1],[0,-1]
        ];

        const arms=ds.filter(
            (_,i)=>links&(1<<i)
        );

        if(!arms.length){
            arms.push(ds[0],ds[1]);
        }

        function post(x,y){

            if(sh==='hedge'){

                bush(x,y,W,1.1);

            }else{

                box(
                    x-.035,y-.035,
                    x+.035,y+.035,
                    0,
                    sh==='wall'?11:17,
                    W
                );
            }
        }

        for(const [x,y] of arms){

            if(sh==='hedge'){

                for(let i=1;i<=3;i++){

                    bush(
                        x*i/6,y*i/6,
                        W,1.1
                    );
                }

            }else if(sh==='wall'){

                const a=Math.min(0,x*.5)-.045;
                const b=Math.min(0,y*.5)-.045;

                const c=Math.max(0,x*.5)+.045;
                const d=Math.max(0,y*.5)+.045;

                box(a,b,c,d,0,10,W);

                for(let z=3;z<10;z+=3){

                    L(
                        [a,d,z],
                        [c,d,z],
                        R,.6
                    );
                }

            }else{

                for(const z of [5,11]){

                    L(
                        [0,0,z],
                        [x*.5,y*.5,z],
                        R,2.1
                    );
                }

                for(let i=1;i<=3;i++){

                    L(
                        [x*i/6,y*i/6,0],
                        [x*i/6,y*i/6,15],
                        W,2
                    );
                }
            }
        }

        post(0,0);

// ==========================================
// 08 — NATURAL LANDSCAPING AND LIVESTOCK
// ==========================================

    }else if([
        'orchard','vines','pasture',
        'flowers','tree','pine',
        'palm','rocks'
    ].includes(sh)){

        if([
            'orchard','vines',
            'pasture','flowers','rocks'
        ].includes(sh)){

            base(
                sh==='vines'
                    ?'#a99362'
                    :'#a5ca76'
            );
        }

        if(sh==='tree'){

            tree(0,0,W,1.0);
        }

        if(sh==='pine'){

            const [x,y]=P(0,0);

            line(
                [x,y],[x,y-44],
                '#85654a',3
            );

            for(let i=0;i<3;i++){

                let h=13+i*13;
                let r=20-i*5;

                poly([
                    [x-r,y-h],
                    [x,y-h-27],
                    [x+r,y-h]
                ],grad(
                    x-r,y-h-20,
                    x+r,y-h,W,R
                ));
            }
        }

        if(sh==='palm'){

            line(
                [0,0],[4,-39],
                '#a78054',4
            );

            for(let i=0;i<7;i++){

                let a=i*2*Math.PI/7;

                poly([
                    [4,-39],
                    [
                        4+24*Math.cos(a),
                        -39+11*Math.sin(a)
                    ],
                    [
                        4+14*Math.cos(a),
                        -32+10*Math.sin(a)
                    ]
                ],i%2?W:R);
            }
        }

        if(sh==='orchard'){

            for(const [x,y] of [
                [-.25,-.25],
                [.23,-.25],
                [-.25,.23],
                [.23,.23]
            ]){

                tree(x,y,'#90b95f',.47);

                const p=P(x,y);

                for(let i=0;i<3;i++){

                    oval(
                        p[0]-5+i*5,
                        p[1]-13-i%2*4,
                        1.6,1.5,R
                    );
                }
            }
        }

        if(sh==='vines'){

            for(let i=0;i<4;i++){

                let x=-.34+i*.22;

                L(
                    [x,-.39,7],
                    [x,.39,7],
                    '#806547',1.2
                );

                for(let j=0;j<5;j++){

                    let y=-.34+j*.17;

                    bush(x,y,'#6da358',.65);

                    let p=P(x,y,3);

                    oval(
                        p[0],p[1],
                        2.4,2,R
                    );
                }
            }
        }

        if(sh==='pasture'){

            for(let i=0;i<4;i++){

                let p=P(
                    -.29+i*.18,
                    (i%2)*.34-.16
                );

                oval(...p,6,3.8,R);

                oval(
                    p[0]+5,p[1]-1,
                    3,2.5,'#78644d'
                );

                for(const x of [-3,3]){

                    line(
                        [p[0]+x,p[1]+1],
                        [p[0]+x,p[1]+5],
                        '#78644d',1
                    );
                }
            }
        }

        if(sh==='flowers'){

            flat(
                -.33,-.33,.33,.33,
                '#977754'
            );

            for(let i=0;i<5;i++){

                for(let j=0;j<5;j++){

                    let p=P(
                        -.28+i*.14,
                        -.28+j*.14
                    );

                    line(
                        p,[p[0],p[1]-5],
                        '#4f8846',1
                    );

                    oval(
                        p[0],p[1]-5,
                        2.7,2.2,
                        (i+j)%2?W:R
                    );

                    oval(
                        p[0],p[1]-5,
                        .9,.8,'#fff0c0'
                    );
                }
            }
        }

        if(sh==='rocks'){

            for(const [x,y,r] of [
                [-.2,-.1,10],
                [.15,.1,8],
                [-.13,.28,6]
            ]){

                const p=P(x,y);

                poly([
                    [p[0]-r,p[1]],
                    [p[0]-r*.5,p[1]-r],
                    [p[0]+r*.55,p[1]-r*.7],
                    [p[0]+r,p[1]]
                ],grad(
                    p[0]-r,p[1]-r,
                    p[0]+r,p[1],
                    W,R
                ));

                bush(x+.12,y+.1);
            }
        }

// ==========================================
// 09 — ENTERTAINMENT AND FESTIVAL GRAPHICS
// ==========================================

    }else if([
        'stadium','pool','court',
        'parking','wheel','carousel',
        'play','tents'
    ].includes(sh)){

        base(
            sh==='pool'&&id==='pond'
                ?'#a5cb76'
                :'#dbccae'
        );

        if([
            'stadium','pool','court'
        ].includes(sh)){

            oval(0,1,35,17,tone(W,-22));
            oval(0,-1,31,14,W);

            oval(
                0,-2,27,11,
                sh==='pool'?R:'#83b466'
            );

            if(sh==='pool'){

                for(let i=0;i<4;i++){

                    line(
                        [-15+i*9,-4],
                        [-8+i*9,0],
                        '#d2f0e8',1.1
                    );
                }

            }else{

                flat(
                    -.27,-.30,.27,.30,
                    '#78a96c',1
                );

                for(const x of [-.26,0,.26]){

                    L(
                        [x,-.29,2],
                        [x,.29,2],
                        '#fff3d9',.9
                    );
                }

                for(const y of [-.29,.29]){

                    L(
                        [-.26,y,2],
                        [.26,y,2],
                        '#fff3d9',.9
                    );
                }

                if(sh==='court'){

                    L(
                        [-.28,0,5],
                        [.28,0,5],
                        '#f4e5ca',1.5
                    );
                }
            }
        }

        if(sh==='parking'){

            flat(-.42,-.42,.42,.42,R);

            for(let i=0;i<5;i++){

                L(
                    [-.4+i*.2,-.38,1],
                    [-.4+i*.2,.38,1],
                    '#eee7c9',.9
                );
            }

            for(let i=0;i<3;i++){

                let x=-.3+i*.3;

                box(
                    x-.075,-.14,
                    x+.075,.13,
                    0,5,
                    [
                        '#c66b58',
                        '#82a4ba',
                        '#e4c16f'
                    ][i]
                );

                box(
                    x-.06,-.065,
                    x+.06,.05,
                    5,3,'#b1d7df'
                );
            }
        }

        if(sh==='wheel'){

            line(
                [-18,4],[0,-43],
                '#8b786c',4
            );

            line(
                [18,4],[0,-43],
                '#8b786c',4
            );

            g.beginPath();

            g.arc(
                0,-43,29,
                0,Math.PI*2
            );

            g.strokeStyle=R;
            g.lineWidth=3;
            g.stroke();

            for(let i=0;i<8;i++){

                let a=i*Math.PI/4;

                let x=29*Math.cos(a);
                let y=-43+29*Math.sin(a);

                line(
                    [0,-43],[x,y],
                    '#c2a58c',1
                );

                oval(
                    x,y,4.5,5,
                    [
                        '#e78876',
                        '#e7c56f',
                        '#76b8b3',
                        '#9b91c0'
                    ][i%4]
                );
            }

            oval(0,-43,5,5,'#f1d6a2');
        }

        if(sh==='carousel'){

            oval(0,0,32,14,'#a78965');
            oval(0,-3,29,11,'#f2dfb4');

            for(let i=0;i<6;i++){

                let a=i*Math.PI/3;

                let x=23*Math.cos(a);
                let y=8*Math.sin(a);

                line(
                    [x,y],[x,y-29],
                    '#9d805e',1.5
                );

                oval(
                    x,y-7,5,3,
                    '#f1c47c'
                );
            }

            poly([
                [-31,-28],
                [0,-54],
                [31,-28]
            ],R);

            oval(0,-28,31,8,'#f2c58f');

            poly([
                [-31,-28],
                [0,-54],
                [-10,-28]
            ],'#fff0ca');

            poly([
                [10,-28],
                [0,-54],
                [31,-28]
            ],'#fff0ca');
        }

        if(sh==='play'){

            for(const x of [-.26,.24]){

                L(
                    [x,-.2,0],
                    [x,0,24],
                    R,2.5
                );

                L(
                    [x,.2,0],
                    [x,0,24],
                    R,2.5
                );
            }

            L(
                [-.26,0,24],
                [.24,0,24],
                '#7c9e98',3
            );

            for(const x of [-.1,.1]){

                L(
                    [x,0,24],
                    [x,.02,5],
                    '#82694f',.8
                );

                flat(
                    x-.045,-.02,
                    x+.045,.07,
                    '#e6b45f',5
                );
            }
        }

        if(sh==='tents'){

            for(const [x,y,col] of [
                [-.22,-.22,R],
                [.22,-.18,'#e5b45b'],
                [-.2,.23,'#75aeb0'],
                [.22,.22,'#a68cbd']
            ]){

                box(
                    x-.15,y-.13,
                    x+.15,y+.13,
                    0,7,'#b38d62'
                );

                face([
                    [x-.19,y+.17,12],
                    [x+.19,y+.17,12],
                    [x,y,28]
                ],col);

                face([
                    [x+.19,y-.17,12],
                    [x+.19,y+.17,12],
                    [x,y,28]
                ],tone(col,-25));

                for(const q of [-.13,.13]){

                    L(
                        [x+q,y+.13,0],
                        [x+q,y+.13,12],
                        '#896e50',1
                    );
                }
            }
        }

// ==========================================
// 10 — STREET FURNITURE AND DECORATION
// ==========================================

    }else if([
        'bench','lamp','monument',
        'gazebo','shelter','substation'
    ].includes(sh)){

        if(sh==='bench'){

            for(const x of [-.23,.23]){

                L(
                    [x,0,0],
                    [x,0,8],
                    R,2.5
                );
            }

            flat(
                -.3,-.1,.3,.10,
                W,8
            );

            face([
                [-.3,-.1,10],
                [.3,-.1,10],
                [.3,-.1,19],
                [-.3,-.1,19]
            ],W);
        }

        if(sh==='lamp'){

            oval(3,1,7,3,'#36513b33');

            line([0,0],[0,-34],R,3);

            line([0,-34],[7,-39],R,2);

            oval(8,-36,4.5,5,W);

            oval(8,-40,5,2,R);
        }

        if(sh==='monument'){

            base('#d9cdb4');

            box(
                -.26,-.26,.26,.26,
                0,4,W
            );

            box(
                -.19,-.19,.19,.19,
                4,8,W
            );

            box(
                -.09,-.09,.09,.09,
                12,23,W
            );

            const [x,y]=P(0,0,37);

            oval(x,y,4,5,R);
        }

        if(
            sh==='gazebo'||
            sh==='shelter'
        ){

            base();

            for(const [x,y] of [
                [-.32,-.25],
                [.32,-.25],
                [-.32,.25],
                [.32,.25]
            ]){

                L(
                    [x,y,0],
                    [x,y,26],
                    W,2.6
                );
            }

            roof(
                -.38,-.32,.38,.32,
                26,
                sh==='gazebo'?16:3,
                R,true
            );

            flat(
                -.26,-.15,.26,-.04,
                '#b3916b',8
            );
        }

        if(sh==='substation'){

            base();

            for(const x of [-.23,.23]){

                box(
                    x-.12,-.20,
                    x+.12,.18,
                    0,15,W
                );

                for(const y of [-.1,.1]){

                    L(
                        [x,y,15],
                        [x,y,27],
                        R,2
                    );

                    for(let z=18;z<=26;z+=4){

                        let p=P(x,y,z);

                        oval(
                            ...p,
                            3,1.2,'#e8e4ce'
                        );
                    }
                }
            }

            L(
                [-.23,-.1,26],
                [.23,-.1,26],
                '#526765',1
            );
        }
    }

    cache.set(ck,c);

    return c;
}

// ==========================================
// 11 — WORLD RENDERING
// ==========================================

function fenceMask(x,y){

    let m=0;

    [
        [1,0],[-1,0],[0,1],[0,-1]
    ].forEach(([a,b],i)=>{

        if(
            fenceIds.has(
                town.buildings[
                    key(x+a,y+b)
                ]?.type
            )
        ){

            m|=1<<i;
        }
    });

    return m;
}

drawObject=function(t){

    const id=town.buildings[
        key(t.x,t.y)
    ]?.type;

    if(!A[id]){
        return oldDraw(t);
    }

    const [x,y]=project(t.x,t.y);

    ctx.save();

    if(moving===key(t.x,t.y)){
        ctx.globalAlpha=.45;
    }

    ctx.drawImage(
        makeArt(
            id,
            fenceIds.has(id)
                ?fenceMask(t.x,t.y)
                :0
        ),
        x-60,y-122,
        120,150
    );

    ctx.restore();
};

// Add wildflowers and terrain detail.

drawTile=function(t){

    oldTile(t);

    if(
        t.type!=='grass'||
        town.buildings[key(t.x,t.y)]||
        t.tree
    )return;

    if(t.variant<.84)return;

    const [x,y]=project(t.x,t.y);

    ctx.save();

    ctx.translate(x,y);

    for(let i=0;i<3;i++){

        const a=(
            hash(t.x,t.y,i+80)-.5
        )*25;

        const b=(
            hash(t.x,t.y,i+90)-.5
        )*10;

        disc(
            a,b,1.2,.85,
            i%2
                ?'#f3df94'
                :'#d9efa8'
        );
    }

    ctx.restore();
};

// ==========================================
// 12 — SEARCHABLE BUILDING CATALOGUE
// ==========================================

const sections=[
    'Homes',
    'Shops',
    'Civic',
    'Education',
    'Tourism',
    'Leisure',
    'Faith',
    'Transport',
    'Roads',
    'Agriculture',
    'Industry',
    'Utilities',
    'Nature',
    'Fences',
    'Decoration'
];

let group='Homes';
let query='';

const bar=document.createElement('div');

bar.id='v5bar';

bar.innerHTML=`
    <input
        id="v5search"
        placeholder="Search all buildings…"
        aria-label="Search buildings"
    >
    <span id="v5count"></span>
    <button id="v5toggle">
        Hide catalogue
    </button>
`;

tabs.before(bar);

function preview(id){

    const c=document.createElement('canvas');

    c.width=108;
    c.height=88;

    const g=c.getContext('2d');

    if(A[id]){

        g.drawImage(
            makeArt(id),
            45,54,270,350,
            20,0,68,88
        );

    }else if(oldPreviews.has(id)){

        g.drawImage(
            oldPreviews.get(id),
            0,0,108,88
        );

    }else{

        g.font='32px sans-serif';

        g.textAlign='center';

        const icons={
            road:'🛣️',
            lane:'🛤️',
            cobble:'🧱',
            avenue:'🛣️',
            path:'🚶',
            farm:'🌾',
            park:'🌳',
            cherry:'🌸',
            fountain:'⛲'
        };

        g.fillText(
            icons[id]||'🌱',
            54,57
        );
    }

    return c;
}

function showCards(){

    list.replaceChildren();

    const entries=
        Object.entries(TYPES)
        .filter(([id,t])=>

            query
                ?t.name.toLowerCase()
                    .includes(query)
                :sectionOf(id,t)===group
        );

    $('v5count').textContent=

        entries.length+' / '+
        Object.keys(TYPES).length;

    for(const [id,t] of entries){

        const b=document.createElement(
            'button'
        );

        b.className='item';
        b.dataset.type=id;

        b.append(preview(id));

        const n=document.createElement('span');
        const p=document.createElement('small');

        n.textContent=t.name;

        p.textContent=
            money(t.cost)+
            (
                t.rent
                    ?' · +'+money(t.rent)
                    :''
            );

        b.append(n,p);

        b.onclick=()=>{

            selected=id;
            selectMode('build');
        };

        if(
            mode==='build'&&
            selected===id
        ){

            b.classList.add('active');
        }

        list.append(b);
    }
}

function showTabs(){

    tabs.replaceChildren();

    for(const s of sections){

        const b=document.createElement(
            'button'
        );

        b.textContent=s;

        b.className=
            s===group&&!query
                ?'chosen'
                :'';

        b.onclick=()=>{

            group=s;
            query='';

            $('v5search').value='';

            selectMode('pan');

            showTabs();
            showCards();
        };

        tabs.append(b);
    }
}

$('v5search').addEventListener(
    'input',e=>{

        query=e.target.value
            .trim()
            .toLowerCase();

        showTabs();
        showCards();
    }
);

$('v5toggle').onclick=()=>{

    const hidden=$('dock')
        .classList.toggle('v5collapsed');

    $('v5toggle').textContent=

        hidden
            ?'Show catalogue'
            :'Hide catalogue';
};

selectMode=function(m){

    oldMode(m);

    if(
        m==='build'&&
        fenceIds.has(selected)
    ){

        message(
            'Tap empty grass to place fences • '+
            'Neighbouring fences join automatically.'
        );
    }
};

// ==========================================
// 13 — TRANSPORT NETWORKS
// ==========================================

const D=[
    [1,0],[-1,0],[0,1],[0,-1]
];

const roadSet=new Set([
    'road','lane','cobble','avenue'
]);

const walkSet=new Set([
    ...roadSet,'path','cycle'
]);

const trackSet=new Set([
    'rail',
    'tramTrack',
    'subwayTrack',
    'cycle',
    'runway'
]);

const has=(x,y,ids)=>

    ids.has(
        town.buildings[
            key(x,y)
        ]?.type
    );

let metroVisible=false;

function trackDraw(t,id){

    const [x,y]=project(t.x,t.y);

    ctx.save();

    ctx.translate(x,y);

    const arms=D.filter(
        ([a,b])=>
            has(
                t.x+a,t.y+b,
                new Set([id])
            )
    );

    if(!arms.length){

        arms.push(D[0],D[1]);
    }

    const col=({
        rail:'#9c927f',
        tramTrack:'#a3a7a3',
        subwayTrack:'#a4bfbe',
        cycle:'#63965e',
        runway:'#687982'
    })[id];

    const w=
        id==='runway'
            ?.39
            :id==='cycle'
                ?.19
                :.25;

    if(id!=='subwayTrack'){

        flat(-w,-w,w,w,col);

        for(const [a,b] of arms){

            flat(
                Math.min(0,a*.5)-Math.abs(b)*w,
                Math.min(0,b*.5)-Math.abs(a)*w,
                Math.max(0,a*.5)+Math.abs(b)*w,
                Math.max(0,b*.5)+Math.abs(a)*w,
                col
            );
        }
    }

    for(const [a,b] of arms){

        if(
            id==='rail'||
            id==='tramTrack'
        ){

            // Railway sleepers.

            for(let i=.06;i<.5;i+=.12){

                line(
                    project(
                        a*i-b*.20,
                        b*i+a*.20
                    ),
                    project(
                        a*i+b*.20,
                        b*i-a*.20
                    ),
                    '#705b48',2.1
                );
            }

            // Connected steel rails.

            for(const o of [-.12,.12]){

                line(
                    project(-b*o,a*o),
                    project(
                        a*.5-b*o,
                        b*.5+a*o
                    ),
                    '#e1e1db',1.6
                );
            }

        }else if(id==='subwayTrack'){

            if(metroVisible){

                line(
                    project(0,0),
                    project(a*.5,b*.5),
                    '#7743b5',4
                );
            }

        }else{

            line(
                project(a*.08,b*.08),
                project(a*.42,b*.42),
                '#f1e6b8',1.5
            );
        }
    }

    ctx.restore();
}

// Underground metro viewing mode.

const metroButton=
    document.createElement('button');

metroButton.textContent='Metro view';

metroButton.onclick=()=>{

    metroVisible=!metroVisible;

    metroButton.textContent=
        metroVisible
            ?'Hide metro'
            :'Metro view';

    dirty=true;
};

$('tools').append(metroButton);

const tileBeforeTraffic=drawTile;
const objectBeforeTraffic=drawObject;

drawTile=function(t){

    tileBeforeTraffic(t);

    const id=town.buildings[
        key(t.x,t.y)
    ]?.type;

    if(trackSet.has(id)){

        trackDraw(t,id);
    }
};

drawObject=function(t){

    if(
        !trackSet.has(
            town.buildings[
                key(t.x,t.y)
            ]?.type
        )
    ){

        objectBeforeTraffic(t);
    }
};

// ==========================================
// 14 — LIVING TRAFFIC SIMULATION
// ==========================================

const specs=[

    {
        kind:'car',
        ids:roadSet,
        step:1.25,
        max:12
    },

    {
        kind:'person',
        ids:walkSet,
        step:.48,
        max:22
    },

    {
        kind:'bike',
        ids:new Set(['cycle']),
        step:.85,
        max:7
    },

    {
        kind:'bus',
        ids:roadSet,
        step:.9,
        max:4,
        stations:[
            'busstop','busdepot'
        ]
    },

    {
        kind:'train',
        ids:new Set(['rail']),
        step:1.5,
        max:3,
        stations:['station']
    },

    {
        kind:'tram',
        ids:new Set(['tramTrack']),
        step:1,
        max:4,
        stations:['tramstop']
    },

    {
        kind:'metro',
        ids:new Set(['subwayTrack']),
        step:1.6,
        max:4,
        stations:['subway']
    },

    {
        kind:'plane',
        ids:new Set(['runway']),
        step:1.7,
        max:2,
        stations:['airport']
    }
];

let agents=[];
let topology='';
let lastCheck=0;
let previousTime=performance.now();

function refreshTraffic(now){

    if(now-lastCheck<750)return;

    lastCheck=now;

    const entries=
        Object.entries(town.buildings);

    const sign=entries
        .map(([k,b])=>k+':'+b.type)
        .sort()
        .join('|');

    if(sign===topology)return;

    topology=sign;

    agents=[];

    const residents=totals().pop;

    for(const spec of specs){

        if(
            ['person','car','bike']
                .includes(spec.kind)&&
            residents===0
        )continue;

        const nodes=new Set(

            entries
                .filter(
                    ([,b])=>spec.ids.has(b.type)
                )
                .map(([k])=>k)
        );

        function neighbors(k){

            const [x,y]=k
                .split(',')
                .map(Number);

            return D
                .map(
                    ([a,b])=>key(x+a,y+b)
                )
                .filter(n=>nodes.has(n));
        }

        const visited=new Set();

        let count=0;

        for(const k of nodes){

            if(visited.has(k))continue;

            const queue=[k];

            visited.add(k);

            // Discover connected transport networks.

            for(let i=0;i<queue.length;i++){

                for(const n of neighbors(queue[i])){

                    if(!visited.has(n)){

                        visited.add(n);

                        queue.push(n);
                    }
                }
            }

            if(queue.length<2)continue;

            // Find suitable stations along the network.

            const stations=spec.stations

                ?queue.filter(k=>{

                    const [x,y]=k
                        .split(',')
                        .map(Number);

                    return D.some(
                        ([a,b])=>
                            spec.stations.includes(
                                town.buildings[
                                    key(x+a,y+b)
                                ]?.type
                            )
                    );
                })

                :queue;

            if(!stations.length)continue;

            const num=Math.min(

                spec.max-count,

                Math.max(
                    1,
                    Math.floor(
                        queue.length/
                        (
                            spec.kind==='person'
                                ?3
                                :6
                        )
                    )
                )
            );

            for(let i=0;i<num;i++){

                const from=stations[
                    Math.floor(
                        i*stations.length/num
                    )
                ];

                const next=neighbors(from)[0];

                if(next){

                    agents.push({

                        spec,

                        from,

                        to:next,

                        t:i/num,

                        color:[
                            '#d96c54',
                            '#e2b94f',
                            '#70a8c8',
                            '#af91c4'
                        ][i%4]
                    });
                }
            }

            count+=num;

            if(count>=spec.max)break;
        }
    }
}

function updateTraffic(now){

    refreshTraffic(now);

    const dt=Math.min(
        .1,
        (now-previousTime)/1000
    );

    previousTime=now;

    for(const a of agents){

        a.t+=dt*a.spec.step;

        while(a.t>=1){

            a.t-=1;

            const [x,y]=a.to
                .split(',')
                .map(Number);

            const opts=D

                .map(
                    ([i,j])=>key(x+i,y+j)
                )

                .filter(k=>{

                    const [u,v]=k
                        .split(',')
                        .map(Number);

                    return has(
                        u,v,a.spec.ids
                    );
                });

            if(!opts.length){

                a.t=0;
                break;
            }

            const forward=opts.filter(
                k=>k!==a.from
            );

            const next=(

                forward.length
                    ?forward
                    :opts

            )[

                Math.floor(
                    Math.random()*
                    (
                        forward.length||
                        opts.length
                    )
                )
            ];

            a.from=a.to;
            a.to=next;
        }
    }
}

function agentPos(a){

    const [x,y]=a.from
        .split(',')
        .map(Number);

    const [u,v]=a.to
        .split(',')
        .map(Number);

    const side=

        a.spec.kind==='person'
            ?.32

            :a.spec.kind==='car'||
             a.spec.kind==='bus'
                ?.13
                :0;

    return [

        x+(u-x)*a.t-(v-y)*side,

        y+(v-y)*a.t+(u-x)*side,

        u-x,

        v-y
    ];
}

// ==========================================
// 15 — ANIMATED PEOPLE AND VEHICLES
// ==========================================

function drawAgent(a){

    if(
        a.spec.kind==='metro'&&
        !metroVisible
    )return;

   if(window.townArtAgent?.(a,agentPos(a))){
    return;
}

    const [x,y,dx,dy]=agentPos(a);

    const [sx,sy]=project(x,y);

    ctx.save();

    ctx.translate(sx,sy);

    const k=a.spec.kind;

    // WALKING RESIDENTS

    if(k==='person'){

        disc(
            1,1,3,1.5,
            '#39543d50'
        );

        const f=Math.sin(a.t*24)*2;

        line(
            [-1,-4],[-1+f,0],
            '#444b58',1.4
        );

        line(
            [1,-4],[1-f,0],
            '#444b58',1.4
        );

        disc(
            0,-6,2.5,3.1,
            a.color
        );

        disc(
            0,-10,2.1,2.4,
            '#efc69c'
        );

    // CYCLISTS

    }else if(k==='bike'){

        disc(
            -4,0,2.5,2.5,
            '#485c60'
        );

        disc(
            4,0,2.5,2.5,
            '#485c60'
        );

        line(
            [-4,0],[0,-4],
            '#d8dfcd',1
        );

        line(
            [0,-4],[4,0],
            '#d8dfcd',1
        );

        disc(
            0,-5,2,2.5,
            a.color
        );

        disc(
            0,-9,2,2,
            '#f0c6a0'
        );

    // MOTORISED TRANSPORT

    }else{

        const angle=Math.atan2(
            (dx+dy)*HH,
            (dx-dy)*HW
        );

        ctx.rotate(angle);

        let len=

            k==='plane'?28:

            k==='train'?24:

            k==='tram'||
            k==='metro'||
            k==='bus'?18:11;

        let col=

            k==='train'?'#ba6551':

            k==='tram'?'#e0a54f':

            k==='metro'?'#8c62bc':

            k==='plane'?'#f1eee0':

            a.color;

        // Vehicle shadow.

        disc(
            1,2,
            len*.52,4,
            '#29483b40'
        );

        // Wheels and undercarriage.

        ctx.fillStyle='#4b565e';

        ctx.fillRect(
            -len*.5,-2,len,5
        );

        // Bodywork.

        ctx.fillStyle=col;

        ctx.fillRect(
            -len*.5,-6,len,7
        );

        // Windscreen.

        ctx.fillStyle='#b5d9df';

        ctx.fillRect(
            len*.22,-5,
            len*.2,4
        );

        // Headlights.

        ctx.fillStyle='#f4e1a7';

        ctx.fillRect(
            len*.43,-3,1.5,2
        );

        if(k==='plane'){

            poly([
                [-4,-4],
                [3,-17],
                [7,-16],
                [4,6],
                [-1,14],
                [-5,13]
            ],'#e5e8df');

        }else if(len>12){

            for(
                let i=-len*.4;
                i<len*.12;
                i+=4
            ){

                ctx.fillStyle='#c9e8e5';

                ctx.fillRect(i,-5,2.5,3);
            }
        }
    }

    ctx.restore();
}

// ==========================================
// 16 — DEPTH SORTING AND LIVE RENDERING
// ==========================================

render=function(){

    ctx.setTransform(
        DPR,0,0,DPR,0,0
    );

    ctx.fillStyle='#54b4ce';

    ctx.fillRect(0,0,W,H);

    ctx.translate(camX,camY);

    ctx.scale(zoom,zoom);

    const view=tiles.filter(visible);

    for(const t of view){

        drawTile(t);
    }

    // Construction and demolition highlights.

    if(
        hover&&
        inside(hover.x,hover.y)&&
        mode!=='pan'
    ){

        const b=town.buildings[
            key(hover.x,hover.y)
        ];

        const roads=new Set([
            'road',
            'lane',
            'cobble',
            'avenue',
            'path'
        ]);

        const ok=mode==='build'

            ?(
                canBuild(
                    hover.x,hover.y
                )||
                (
                    roads.has(selected)&&
                    roads.has(b?.type)
                )
            )

            :mode==='move'&&moving

                ?canBuild(
                    hover.x,hover.y
                )

                :!!b||
                    (
                        mode==='bulldoze'&&
                        terrain(
                            hover.x,hover.y
                        )==='grass'&&
                        hash(
                            hover.x,hover.y,7
                        )>.82&&
                        !town.cleared?.[
                            key(hover.x,hover.y)
                        ]
                    );

        ctx.save();

        ctx.translate(
            ...project(
                hover.x,hover.y
            )
        );

        diamond(

            ok
                ?'#fff7b066'
                :'#e95f5966',

            ok
                ?'#fff6b0'
                :'#a32e30'
        );

        ctx.restore();
    }

    // Draw vehicles and residents in world depth order.

    const sorted=agents
        .map(a=>({
            a,
            p:agentPos(a)
        }))
        .sort(
            (a,b)=>
                a.p[0]+a.p[1]-
                b.p[0]-b.p[1]
        );

    let i=0;

    for(const t of view){

        while(

            i<sorted.length&&

            sorted[i].p[0]+
            sorted[i].p[1]
                <=t.x+t.y

        ){

            drawAgent(sorted[i++].a);
        }

        drawObject(t);
    }

    while(i<sorted.length){

        drawAgent(sorted[i++].a);
    }
};

function trafficFrame(now){

    updateTraffic(now);

    if(agents.length){

        dirty=true;
    }

    requestAnimationFrame(trafficFrame);
}

requestAnimationFrame(trafficFrame);

// ==========================================
// 17 — IMPROVED CONSTRUCTION INTERFACE
// ==========================================

const css=document.createElement('style');

css.textContent=`

#v5bar{

    display:flex;

    align-items:center;

    gap:8px;

    margin-top:7px;

    flex-wrap:wrap;
}

#v5search{

    flex:1;

    min-width:100px;

    max-width:300px;

    border:1px solid #bd9c77;

    background:#fffaf0;

    border-radius:8px;

    padding:6px 9px;

    color:#594231;

    font:inherit;
}

#v5count{

    font-size:11px;

    color:#765d46;
}

#v5toggle{

    margin-left:auto;

    background:#d9c3a2;

    color:#644a36;

    padding:6px 9px;

    border-radius:8px;
}

#dock.v5collapsed #catalogue,
#dock.v5collapsed #categories,
#dock.v5collapsed #v5search,
#dock.v5collapsed #v5count{

    display:none;
}

#categories{

    scrollbar-width:thin;
}

#catalogue .item{

    flex-basis:110px;

    height:126px;

    min-height:126px;

    grid-template-rows:

        77px 24px 12px;
}

#catalogue .item canvas{

    width:94px;

    height:77px;
}

#catalogue .item span{

    min-height:23px;

    display:grid;

    place-items:center;
}

@media(max-height:480px){

    #catalogue .item{

        height:91px;

        min-height:91px;

        grid-template-rows:

            42px 24px 12px;
    }

    #catalogue .item canvas{

        height:42px;

        width:64px;
    }
}

`;

document.head.append(css);

// ==========================================
// 18 — ACTIVATE VERSION 0.5
// ==========================================

showTabs();

showCards();

selectMode('pan');

hud();

save();

dirty=true;

document.title=
    'Town Builder • The Living Town';

})();
