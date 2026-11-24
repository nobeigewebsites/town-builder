
/* ==========================================
   TOWN BUILDER V0.3
   STREETS & ARCHITECTURE
   ========================================== */

(() => {
'use strict';

// ==========================================
// 01 — EXTENDED BUILDING CATALOGUE
// ==========================================

const add = (id,name,cost,rent,pop,group,icon) => {
    TYPES[id]={name,cost,rent,pop,group,icon};
};

Object.assign(TYPES.cottage,{group:'Homes'});
Object.assign(TYPES.villa,{group:'Homes'});
Object.assign(TYPES.shop,{group:'Business'});
Object.assign(TYPES.road,{
    name:'Asphalt road',
    group:'Roads'
});
Object.assign(TYPES.park,{group:'Nature'});
Object.assign(TYPES.farm,{group:'Farming'});

add('lane','Country lane',8,0,0,'Roads','🛤️');
add('cobble','Cobbled street',22,0,0,'Roads','🛤️');
add('avenue','Grand avenue',35,0,0,'Roads','🛣️');
add('path','Garden path',5,0,0,'Roads','🚶');

add('tudor','Tudor house',380,43,5,'Homes','🏠');
add('terrace','Townhouse',520,60,7,'Homes','🏠');

add('bakery','Bakery',460,65,0,'Business','🥐');
add('barn','Farm barn',300,25,0,'Farming','🌾');

add('cherry','Blossom tree',35,0,0,'Nature','🌸');
add('fountain','Fountain plaza',160,0,0,'Nature','⛲');

const roads={
    road:['#d9ccb5','#68747b',.30],
    lane:['#acd078','#cda66f',.25],
    cobble:['#e4d5ba','#a6a49e',.34],
    avenue:['#e6dbc7','#555f6a',.39],
    path:['#afd47d','#ead5a4',.16]
};

const isRoad=id=>Object.hasOwn(roads,id);

const dirs=[
    [1,0],
    [-1,0],
    [0,1],
    [0,-1]
];

const rnd=(x,y,s)=>hash(x,y,s);

// ==========================================
// 02 — ADVANCED GRAPHICAL FUNCTIONS
// ==========================================

function grad(x1,y1,x2,y2,a,b){

    const g=ctx.createLinearGradient(
        x1,y1,x2,y2
    );

    g.addColorStop(0,a);
    g.addColorStop(1,b);

    return g;
}

function oval(x,y,rx,ry,a,b){

    disc(
        x,y,rx,ry,
        grad(
            x-rx,y-ry,
            x+rx,y+ry,
            a,b
        )
    );
}

function box3(x0,y0,x1,y1,z,h,a,b,c){

    face([
        [x0,y1,z],
        [x1,y1,z],
        [x1,y1,z+h],
        [x0,y1,z+h]
    ],a,'#49372b30');

    face([
        [x1,y0,z],
        [x1,y1,z],
        [x1,y1,z+h],
        [x1,y0,z+h]
    ],b,'#49372b30');

    flat(x0,y0,x1,y1,c,z+h);
}

function shadow(rx=32,ry=12){

    disc(7,6,rx,ry,'#37523927');

    disc(
        4,4,
        rx*.83,
        ry*.75,
        '#37523925'
    );
}

function flower(x,y,c){

    const [a,b]=project(x,y);

    line(
        [a,b],
        [a,b-4],
        '#4c8842',
        1.2
    );

    disc(a,b-4,2.1,1.8,c);
    disc(a-.6,b-4.8,.7,.7,'#fff4ba');
}

// ==========================================
// 03 — DETAILED TREES AND VEGETATION
// ==========================================

function lushTree(
    x,y,size=1,pink=false,seed=0
){

    const p=project(x,y);

    ctx.save();
    ctx.translate(...p);
    ctx.scale(size,size);

    disc(8,3,15,6,'#294c3432');

    line([0,2],[0,-24],'#79513a',5);
    line([-1,-1],[-1,-19],'#bb8250',1.5);
    line([0,-16],[-7,-26],'#79513a',2);

    const colors=pink
        ?['#ed9abf','#b95290','#ffe0e9']
        :['#85bf55','#357c42','#b9dc76'];

    const branches=[
        [-9,-24,11],
        [8,-25,12],
        [-6,-36,12],
        [6,-37,11],
        [0,-27,13],
        [-2,-42,9]
    ];

    for(const [a,b,r] of branches){

        oval(
            a,b,r,r*.93,
            colors[0],
            colors[1]
        );

        disc(
            a-r*.26,
            b-r*.35,
            r*.33,
            r*.22,
            colors[2]+'99'
        );
    }

    for(let i=0;i<8;i++){

        const a=(rnd(i,seed,4)-.5)*22;
        const b=-22-rnd(i,seed,6)*22;

        disc(a,b,1.5,1.1,colors[2]);
    }

    ctx.restore();
}

function garden(){

    shadow();

    flat(
        -.46,-.46,.46,.46,
        '#91bf63'
    );

    flat(
        -.43,.28,.43,.45,
        '#b1d37b'
    );

    flat(
        -.09,.17,.08,.49,
        '#e9d4aa'
    );

    for(let i=0;i<5;i++){

        flower(
            -.38+i*.065,
            .36,
            i%2?'#f9e0a3':'#f9a9bf'
        );

        flower(
            .16+i*.055,
            .36,
            i%2?'#f6cd6c':'#f195a6'
        );
    }
}

// ==========================================
// 04 — DETAILED ROOF TILES
// ==========================================

function tilesRoof(
    x0,y0,x1,y1,h,rise,palette
){

    const mid=(x0+x1)/2;

    const sides=[
        [x0,mid,0,rise,palette[0]],
        [mid,x1,rise,0,palette[1]]
    ];

    face([
        [x0,y1,h],
        [x1,y1,h],
        [mid,y1,h+rise]
    ],palette[2]);

    for(const [a,b,za,zb,col] of sides){

        const p=project(a,y0,h+za);
        const q=project(b,y1,h+zb);

        face([
            [a,y0,h+za],
            [a,y1,h+za],
            [b,y1,h+zb],
            [b,y0,h+zb]
        ],grad(...p,...q,col,palette[3]));

        for(let i=0;i<=5;i++){

            const t=i/5;
            const X=a+(b-a)*t;
            const Z=h+za+(zb-za)*t;

            line(
                project(X,y0,Z),
                project(X,y1,Z),
                '#51352c45',
                .8
            );

            if(i===5)continue;

            const u=(i+1)/5;
            const X2=a+(b-a)*u;
            const Z2=h+za+(zb-za)*u;

            for(let j=1;j<7;j++){

                const Y=y0+
                    (y1-y0)*
                    (j-(i%2)*.5)/7;

                line(
                    project(X,Y,Z),
                    project(X2,Y,Z2),
                    '#51352c39',
                    .65
                );
            }
        }
    }

    line(
        project(x0,y1,h),
        project(mid,y1,h+rise),
        palette[0],
        2.4
    );

    line(
        project(mid,y1,h+rise),
        project(x1,y1,h),
        palette[1],
        2.4
    );

    line(
        project(mid,y0,h+rise),
        project(mid,y1,h+rise),
        '#ffe5bc88',
        2
    );
}

// ==========================================
// 05 — DETAILED WINDOWS
// ==========================================

function detailedWindow(
    x,y,z,w,h,side=false
){

    if(side){
        windowSide(x,y,z,w,h);
    }else{
        windowFront(x,y,z,w,h);
    }

    const P=(u,v)=>side
        ?project(x,y+u,z+v)
        :project(x+u,y,z+v);

    line(
        P(.02,h*.52),
        P(w-.02,h*.52),
        '#fff2d3',
        1
    );

    line(
        P(w*.5,1),
        P(w*.5,h-1),
        '#fff2d3',
        .8
    );

    line(
        P(-.018,0),
        P(w+.018,0),
        '#a98260',
        2.2
    );

    line(
        P(.025,h-2),
        P(w*.42,h*.58),
        '#b4dce3',
        .8
    );
}

// ==========================================
// 06 — ARCHITECTURAL COLOUR PALETTES
// ==========================================

const palettes={

    cottage:[
        '#ffe4af',
        '#d3a777',
        '#e99a64',
        '#a95b3c',
        '#ebc58d',
        '#9a4c34'
    ],

    villa:[
        '#fff1cf',
        '#d2ba9b',
        '#7faab1',
        '#4a7187',
        '#f1d9b5',
        '#365e77'
    ],

    tudor:[
        '#f8e3c6',
        '#c8ab87',
        '#b97954',
        '#73493c',
        '#ddc3a0',
        '#70473a'
    ],

    terrace:[
        '#f5c5a2',
        '#b97f61',
        '#7392a2',
        '#456777',
        '#e4b49b',
        '#3c5c6c'
    ],

    barn:[
        '#e5a070',
        '#ad5c43',
        '#a7bab9',
        '#657a80',
        '#d98b59',
        '#4e626b'
    ]
};

// ==========================================
// 07 — ADVANCED RESIDENTIAL BUILDINGS
// ==========================================

function detailedHouse(id){

    const p=palettes[id];

    const h={
        cottage:25,
        villa:39,
        tudor:34,
        terrace:45,
        barn:30
    }[id];

    const a=-.34;
    const b=.34;
    const c=-.34;
    const d=.22;

    garden();

    walls(
        a,c,b,d,h,
        grad(-20,-h,9,8,p[0],p[4]),
        grad(8,-h,25,10,p[4],p[1])
    );

    // Wall texture

    for(let z=2;z<h;z+=10){

        line(
            project(a,d,z),
            project(b,d,z),
            '#9e775b22',
            .7
        );

        line(
            project(b,c,z),
            project(b,d,z),
            '#805a4122',
            .7
        );
    }

    // Tudor timber framing

    if(id==='tudor'){

        for(const x of [-.33,0,.33]){

            line(
                project(x,d,0),
                project(x,d,h),
                '#79503c',
                2.5
            );
        }

        line(
            project(a,d,18),
            project(b,d,18),
            '#79503c',
            2.5
        );

        line(
            project(b,c,18),
            project(b,d,18),
            '#79503c',
            2.5
        );

        line(
            project(a,d,18),
            project(0,d,h),
            '#79503c',
            2
        );
    }

    // Front entrance

    const dw=id==='barn'?.27:.14;

    face([
        [-dw,d,0],
        [dw,d,0],
        [dw,d,14],
        [-dw,d,14]
    ],'#f7dfad');

    face([
        [-dw+.025,d,0],
        [dw-.025,d,0],
        [dw-.025,d,12],
        [-dw+.025,d,12]
    ],id==='barn'?'#9f4d38':'#79523c');

    // Ground floor windows

    if(id!=='barn'){

        detailedWindow(-.29,d,7,.14,11);
        detailedWindow(.15,d,7,.14,11);
    }

    detailedWindow(
        b,-.25,7,.19,11,true
    );

    // First floor windows

    if(h>=34){

        detailedWindow(-.26,d,23,.17,10);
        detailedWindow(.1,d,23,.17,10);

        detailedWindow(
            b,-.25,23,.19,10,true
        );
    }

    // Third floor windows

    if(id==='terrace'){

        detailedWindow(-.26,d,35,.17,8);
        detailedWindow(.1,d,35,.17,8);

        detailedWindow(
            b,-.25,35,.19,8,true
        );
    }

    // Villa balcony

    if(id==='villa'){

        box3(
            -.30,d,.30,d+.12,
            20,2,
            '#eee0be',
            '#b7a27d',
            '#f8ebca'
        );

        for(let i=0;i<6;i++){

            const x=-.29+i*.115;

            line(
                project(x,d+.12,22),
                project(x,d+.12,28),
                '#ece3c9',
                1.4
            );
        }

        line(
            project(-.30,d+.12,28),
            project(.30,d+.12,28),
            '#fff1d2',
            1.8
        );
    }

    // Textured roof

    const rise=id==='barn'?12:17;

    tilesRoof(
        a-.055,
        c-.06,
        b+.055,
        d+.06,
        h,
        rise,
        [p[2],p[3],p[4],p[5]]
    );

    // Chimneys

    if(id!=='barn'){

        box3(
            .12,-.22,.24,-.10,
            h+6,15,
            '#bd7657',
            '#995942',
            '#db9a73'
        );

        box3(
            .10,-.24,.26,-.08,
            h+21,2,
            '#dba78b',
            '#a97760',
            '#f0c7a1'
        );

        flat(
            .14,-.20,.22,-.12,
            '#65443c',
            h+23.1
        );
    }

    // Landscaping

    if(id==='cottage'||id==='tudor'){

        lushTree(
            -.38,.29,.41,false,2
        );
    }

    if(id==='villa'){

        lushTree(
            .36,.34,.48,true,3
        );
    }

    disc(8,11,2.5,1.4,'#f5cd6a');
}

// ==========================================
// 08 — COMMERCIAL BUILDINGS
// ==========================================

function detailedShop(bakery){

    shadow();

    flat(
        -.47,-.43,.47,.45,
        '#d9c8aa'
    );

    const h=29;
    const d=.25;

    walls(
        -.37,-.35,.36,d,h,
        '#ffe6bd',
        '#c9a47b'
    );

    detailedWindow(-.32,d,3,.24,14);
    detailedWindow(.08,d,3,.22,14);

    detailedWindow(
        .36,-.25,4,.24,15,true
    );

    face([
        [-.08,d,0],
        [.08,d,0],
        [.08,d,15],
        [-.08,d,15]
    ],'#815741');

    if(bakery){

        tilesRoof(
            -.42,-.40,.41,.30,h,13,
            [
                '#df9360',
                '#ac573d',
                '#f0d0a0',
                '#934c35'
            ]
        );

    }else{

        box3(
            -.41,-.39,.40,.30,
            h,3,
            '#749ca2',
            '#4a7786',
            '#90b4b6'
        );

        box3(
            -.28,-.26,.22,.12,
            h+3,3,
            '#b3c9c1',
            '#6e8d8d',
            '#d0e1d4'
        );
    }

    // Striped shop awning

    const accent=bakery
        ?'#dba34d'
        :'#d96458';

    for(let i=0;i<8;i++){

        const x=-.38+i*.095;
        const col=i%2?'#fff1d1':accent;

        face([
            [x,d,20],
            [x+.095,d,20],
            [x+.095,.46,14],
            [x,.46,14]
        ],col);

        face([
            [x,.46,14],
            [x+.095,.46,14],
            [x+.095,.46,11],
            [x,.46,11]
        ],col);
    }

    // Shop sign

    face([
        [-.27,d,23],
        [.27,d,23],
        [.27,d,28],
        [-.27,d,28]
    ],'#f9e5b7');

    const [a,b]=project(0,d,25.5);

    ctx.save();
    ctx.translate(a,b);
    ctx.transform(1,.5,0,1,0,0);

    ctx.fillStyle='#694b36';
    ctx.font='bold 4.5px sans-serif';
    ctx.textAlign='center';

    ctx.fillText(
        bakery?'BAKERY':'MARKET',
        0,1
    );

    ctx.restore();

    flower(-.39,.38,'#f3b6cd');
    flower(.39,.38,'#f4cf62');
}

// ==========================================
// 09 — FOUNTAIN PLAZAS
// ==========================================

function plaza(){

    shadow(26,10);

    diamond('#c9bd9e');

    flat(
        -.38,-.38,.38,.38,
        '#e5d7bd'
    );

    // Paving texture

    for(let i=-.3;i<.4;i+=.15){

        line(
            project(i,-.38),
            project(i,.38),
            '#aa9d824d',
            .7
        );

        line(
            project(-.38,i),
            project(.38,i),
            '#aa9d824d',
            .7
        );
    }

    // Fountain basin

    oval(
        0,2,22,11,
        '#f5e8cc',
        '#a99b81'
    );

    oval(
        0,0,18,8,
        '#b5e8e7',
        '#49a7b9'
    );

    box3(
        -.05,-.05,.05,.05,
        0,10,
        '#f7e1b5',
        '#bbab90',
        '#fff2d1'
    );

    disc(0,-11,7,3,'#e2e4d0');
    disc(0,-12,5,2,'#89d6da');

    line(
        [0,-12],
        [0,-21],
        '#baf5f5',
        1.6
    );

    disc(0,-21,1.4,1.4,'#efffff');

    for(const [x,y] of [
        [-.35,.35],
        [.35,-.35]
    ]){

        lushTree(x,y,.37,true,6);
    }
}

// ==========================================
// 10 — MULTIPLE ROAD NETWORKS
// ==========================================

function street(x,y,id){

    const [border,surface,w]=roads[id];

    const links=dirs.filter(
        ([a,b])=>isRoad(
            town.buildings[
                key(x+a,y+b)
            ]?.type
        )
    );

    const arms=links.length
        ?links
        :[[1,0],[-1,0]];

    function network(width,col){

        flat(
            -width,-width,
            width,width,
            col
        );

        for(const [a,b] of arms){

            if(a===1){

                flat(
                    width,-width,
                    .5,width,col
                );
            }

            if(a===-1){

                flat(
                    -.5,-width,
                    -width,width,col
                );
            }

            if(b===1){

                flat(
                    -width,width,
                    width,.5,col
                );
            }

            if(b===-1){

                flat(
                    -width,-.5,
                    width,-width,col
                );
            }
        }
    }

    // Pavements and road surfaces

    network(
        Math.min(.49,w+.085),
        border
    );

    network(w,surface);

    // Asphalt road markings

    if(id==='road'||id==='avenue'){

        for(const [a,b] of arms){

            line(
                project(a*.29,b*.29),
                project(a*.46,b*.46),
                '#f4d88b',
                1.4
            );

            // Avenue markings

            if(id==='avenue'){

                for(const s of [-1,1]){

                    line(
                        project(
                            a*.29-b*.32*s,
                            b*.29+a*.32*s
                        ),
                        project(
                            a*.49-b*.32*s,
                            b*.49+a*.32*s
                        ),
                        '#e9e7dd',
                        .75
                    );
                }
            }
        }
    }

    // Cobbles and country lane textures

    if(id==='cobble'||id==='lane'){

        for(let i=0;i<40;i++){

            const X=rnd(x+i,y,12)-.5;
            const Y=rnd(x,y+i,19)-.5;

            const valid=

                (
                    Math.abs(X)<=w &&
                    Math.abs(Y)<=w
                )

                ||

                arms.some(
                    ([a,b])=>

                        (
                            a &&
                            X*a>=0 &&
                            Math.abs(Y)<=w
                        )

                        ||

                        (
                            b &&
                            Y*b>=0 &&
                            Math.abs(X)<=w
                        )
                );

            if(valid){

                const p=project(X,Y);

                disc(
                    ...p,
                    id==='cobble'?2.1:1.1,
                    id==='cobble'?1:0.6,
                    id==='cobble'
                        ?'#d9d4c78c'
                        :'#a87b4e65'
                );
            }
        }
    }
}

// ==========================================
// 11 — IMPROVED TERRAIN GRAPHICS
// ==========================================

drawTile=function(t){

    ctx.save();

    ctx.translate(
        ...project(t.x,t.y)
    );

    const v=t.variant;

    // Water

    if(t.type==='water'){

        const shore=dirs.some(
            ([a,b])=>
                inside(t.x+a,t.y+b) &&
                !water(t.x+a,t.y+b)
        );

        diamond(
            shore
                ?'#78cbd0'
                :v>.5
                    ?'#54b4ce'
                    :'#52b2cc'
        );

        if(v>.35){

            const x=(v-.5)*25;

            line(
                [x-8,1],
                [x+5,1],
                '#d1f4ee65',
                1
            );

            line(
                [x-2,4],
                [x+8,4],
                '#d1f4ee40',
                .7
            );
        }

    // Beaches

    }else if(t.type==='sand'){

        diamond(
            v>.5
                ?'#f3dca9'
                :'#f0d8a4'
        );

        for(const [a,b] of dirs){

            if(water(t.x+a,t.y+b)){

                const p=project(
                    a*.49-b*.46,
                    b*.49+a*.46
                );

                const q=project(
                    a*.49+b*.46,
                    b*.49-a*.46
                );

                line(
                    p,q,
                    '#fef0c7',
                    2.8
                );
            }
        }

        if(v>.5){

            disc(
                -7,3,
                1.3,.8,
                '#c7a779'
            );
        }

    // Grass and wildflowers

    }else{

        const greens=[
            '#a0cd72',
            '#a2ce74',
            '#a4cf76',
            '#a1cc73'
        ];

        diamond(
            greens[Math.floor(v*4)]
        );

        for(let i=0;i<4;i++){

            const x=(
                rnd(t.x,t.y,i+11)-.5
            )*.76;

            const y=(
                rnd(t.x,t.y,i+21)-.5
            )*.76;

            const p=project(x,y);

            line(
                p,
                [p[0]-1,p[1]-2],
                '#659e4960',
                .8
            );

            if(i===0&&v>.77){

                flower(
                    x,y,
                    v>.9
                        ?'#fff0c4'
                        :'#f5b6cc'
                );
            }
        }
    }

    const id=town.buildings[
        key(t.x,t.y)
    ]?.type;

    if(isRoad(id)){

        street(t.x,t.y,id);
    }

    ctx.restore();
};

// ==========================================
// 12 — NEW BUILDING RENDERER
// ==========================================

drawObject=function(t){

    const id=town.buildings[
        key(t.x,t.y)
    ]?.type;

    if(isRoad(id))return;

    ctx.save();

    ctx.translate(
        ...project(t.x,t.y)
    );

    if(moving===key(t.x,t.y)){

        ctx.globalAlpha=.45;
    }

    if(palettes[id]){

        detailedHouse(id);

    }else if(
        id==='shop'||
        id==='bakery'
    ){

        detailedShop(id==='bakery');

    }else if(id==='park'){

        park();

        flower(-.32,.32,'#f4a8c1');
        flower(.31,.32,'#ffe59b');

    }else if(id==='farm'){

        farm();

    }else if(id==='cherry'){

        lushTree(0,0,.95,true,5);

    }else if(id==='fountain'){

        plaza();

    }else if(!id&&t.tree){

        lushTree(
            0,0,
            .65+t.variant*.32,
            false,
            t.x+t.y
        );
    }

    ctx.restore();
};

// ==========================================
// 13 — UPGRADED WORLD RENDERER
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

    // Construction highlights

    if(
        hover &&
        inside(hover.x,hover.y) &&
        mode!=='pan'
    ){

        const b=town.buildings[
            key(hover.x,hover.y)
        ];

        const ok=mode==='build'

            ?(
                canBuild(
                    hover.x,
                    hover.y
                )
                ||
                (
                    isRoad(selected) &&
                    isRoad(b?.type)
                )
            )

            :mode==='move'&&moving

                ?canBuild(
                    hover.x,
                    hover.y
                )

                :!!b;

        ctx.save();

        ctx.translate(
            ...project(
                hover.x,
                hover.y
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

    for(const t of view){

        drawObject(t);
    }
};

// ==========================================
// 14 — ACHIEVEMENT COMPATIBILITY
// ==========================================

achievements=function(){

    const count=Object.values(
        town.buildings
    ).filter(
        b=>TYPES[b.type]?.pop>0
    ).length;

    if(
        count>=5 &&
        !town.awards.firstVillage
    ){

        town.awards.firstVillage=true;

        town.gold+=5;

        return ' • First village! +5 gold';
    }

    return '';
};

// ==========================================
// 15 — ROAD UPGRADES
// ==========================================

const oldAct=act;

act=function(x,y){

    const b=town.buildings[
        key(x,y)
    ];

    if(
        mode==='build' &&
        isRoad(selected) &&
        isRoad(b?.type)
    ){

        if(b.type===selected){

            message(
                'This road is already '+
                TYPES[selected].name.toLowerCase()+
                '.'
            );

            return;
        }

        const charge=Math.max(
            0,
            TYPES[selected].cost-
            TYPES[b.type].cost
        );

        if(town.cash<charge){

            message(
                'Not enough cash to change this road.'
            );

            return;
        }

        town.cash-=charge;

        b.type=selected;

        hud();
        save();

        dirty=true;

        message(
            'Road changed • '+
            money(charge)+
            ' charged'
        );

        return;
    }

    oldAct(x,y);
};

// ==========================================
// 16 — CONSTRUCTION CATEGORIES
// ==========================================

const tabs=document.createElement('div');

tabs.id='categories';

$('catalogue').before(tabs);

let group='Homes';

const groups=[
    'Homes',
    'Business',
    'Roads',
    'Farming',
    'Nature'
];

const oldSelect=selectMode;

selectMode=function(m){

    oldSelect(m);

    if(
        m==='build'&&
        isRoad(selected)
    ){

        message(
            'Tap grass to build • '+
            'Tap an existing road to change its type'
        );
    }
};

function catalogue(){

    tabs.replaceChildren();

    $('catalogue').replaceChildren();

    for(const g of groups){

        const b=document.createElement(
            'button'
        );

        b.textContent=g;

        b.className=g===group
            ?'chosen'
            :'';

        b.onclick=()=>{

            group=g;

            selectMode('pan');

            catalogue();
        };

        tabs.append(b);
    }

    for(const [id,t] of Object.entries(TYPES)){

        if(t.group!==group)continue;

        const b=document.createElement(
            'button'
        );

        b.className='item';
        b.dataset.type=id;

        const i=document.createElement('i');

        i.textContent=t.icon;

        const label=document.createElement(
            'span'
        );

        label.textContent=t.name;

        const price=document.createElement(
            'small'
        );

        price.textContent=money(t.cost);

        b.append(
            i,
            label,
            price
        );

        b.onclick=()=>{

            selected=id;

            selectMode('build');
        };

        $('catalogue').append(b);
    }
}

// ==========================================
// 17 — POLISHED GAME INTERFACE
// ==========================================

const css=document.createElement('style');

css.textContent=`

#hud .stat{

    background:
        linear-gradient(#fff5dc,#f0dfbd);

    color:#5a4635;

    border:2px solid #9a785b;

    border-radius:13px;

    box-shadow:0 3px 0 #755a48;

    min-width:72px;
}

.stat small{
    color:#79634d;
}

.stat b{
    color:#3b6751;
}

#dock{

    background:
        linear-gradient(#fff3d8,#ebd7b6);

    border:2px solid #a68160;

    color:#594231;

    box-shadow:
        0 4px 0 #927051,
        0 7px 18px #234b4050;

    padding:8px;

    max-width:650px;
}

#tools button,
#categories button{

    background:#dec8a6;

    color:#674a34;

    border-radius:8px;

    padding:6px 10px;

    flex:none;

    border:1px solid #c3a685;
}

#tools .active,
#categories .chosen{

    background:#83bf83;

    color:#224f35;

    border-color:#5f9b69;
}

#categories{

    display:flex;

    gap:5px;

    overflow-x:auto;

    margin-top:7px;

    scrollbar-width:thin;
}

.item{

    background:
        linear-gradient(#fffaf0,#f4e5ca);

    border:1px solid #c9ab88;

    box-shadow:0 2px 0 #c9ab88;

    height:66px;

    min-height:66px;

    gap:1px;

    font-size:12px;
}

.item.active{

    background:#fff3b7;

    border:2px solid #ca9443;
}

.item i{
    font-size:19px;
}

.item span{
    line-height:1.1;
}

.item small{
    font-size:10px;
}

#status{
    color:#694d36;
}

#zoom button{

    background:#fff1d6;

    color:#74523a;

    border:2px solid #a68160;

    box-shadow:0 2px 0 #927051;
}

@media(max-width:500px){

    #dock{
        padding:6px;
    }

    #categories button,
    #tools button{

        padding:5px 8px;

        font-size:12px;
    }

    .item{
        flex-basis:88px;
    }

    .stat small{
        font-size:9px;
    }
}

`;

document.head.append(css);

// ==========================================
// 18 — ACTIVATE VERSION 0.3
// ==========================================

document.title=
    'Town Builder • Streets & Architecture';

catalogue();

selectMode('pan');

hud();

save();

dirty=true;

})();
