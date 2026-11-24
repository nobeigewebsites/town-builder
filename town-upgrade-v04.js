
/* ==========================================
   TOWN BUILDER V0.4
   ARCHITECTURE, INDUSTRY & UTILITIES
   ========================================== */

(() => {
'use strict';

// ==========================================
// 01 — EXPANDED BUILDING CATALOGUE
// ==========================================

const art={};

function add(
    id,name,cost,rent,pop,group,
    style,wall,shade,roof,accent,
    levels,extra=''
){
    Object.assign(
        TYPES[id]||(TYPES[id]={}),
        {name,cost,rent,pop,group}
    );

    art[id]={
        style,wall,shade,roof,
        accent,levels,extra
    };
}

// RESIDENTIAL BUILDINGS

add('cottage','Country cottage',250,30,4,'Homes',
'gable','#ffe1a3','#c49a65','#ad5037','#57894d',1,'garden');

add('villa','Mediterranean villa',650,70,8,'Homes',
'hip','#fff0c8','#c6aa87','#c56b44','#468f99',2,'balcony');

add('tudor','Tudor house',380,43,5,'Homes',
'gable','#f8e0b5','#b69b78','#795045','#79513c',2,'timber');

add('terrace','Townhouse',520,60,7,'Homes',
'mansard','#f2bba1','#b87862','#476980','#517e84',3,'bay');

add('bungalow','Bungalow',190,23,3,'Homes',
'hip','#f8e8bc','#c8b28b','#56828e','#408a86',1,'porch');

add('stonehouse','Stone cottage',290,35,4,'Homes',
'gable','#dcd5bc','#a19c88','#687a79','#76966b',1,'stone');

add('georgian','Georgian house',480,54,6,'Homes',
'hip','#f8e5c3','#c5aa87','#51616c','#447c71',2,'columns');

add('victorian','Victorian villa',560,65,7,'Homes',
'gable','#df9b7d','#a76758','#506779','#6c8269',2,'tower');

add('alpine','Alpine chalet',340,40,5,'Homes',
'gable','#e9c396','#af845b','#805340','#704a37',2,'timber');

add('coastal','Coastal house',320,37,4,'Homes',
'gable','#bfe0d5','#7aa9a8','#627f9d','#f8e1b2',1,'porch');

add('modern','Modern home',420,49,5,'Homes',
'flat','#fff1da','#b8c5bf','#516c70','#50a3b4',2,'terrace');

add('apartments','Apartment block',850,100,16,'Homes',
'flat','#e8d4bc','#b69d8b','#687982','#6aa7a6',4,'balcony');

add('manor','Country manor',980,115,12,'Homes',
'mansard','#f8e3c1','#c6aa82','#576a84','#8f594e',3,'columns');

// SHOPS AND BUSINESSES

add('shop','General store',400,55,0,'Business',
'flat','#ffe2ad','#c59e72','#4f8b8d','#d95748',1,'awning');

add('bakery','Bakery',460,65,0,'Business',
'gable','#f9d8a4','#c29a65','#bd6b43','#d7943d',1,'awning');

add('butcher','Butcher',360,48,0,'Business',
'gable','#f2d1b4','#bf9b81','#754c48','#af4e48',1,'awning');

add('greengrocer','Greengrocer',280,39,0,'Business',
'hip','#f6e1ae','#c0aa78','#718c50','#639c55',1,'market');

add('florist','Florist',260,36,0,'Business',
'gable','#f7c9cb','#c8959b','#866b9a','#c9659a',1,'market');

add('cafe','Cafe',380,52,0,'Business',
'flat','#f8dfbe','#c2a18a','#5f857b','#549c91',2,'patio');

add('restaurant','Restaurant',580,78,0,'Business',
'hip','#f5d9aa','#bfa07b','#bb694c','#d05a4d',2,'patio');

add('bookshop','Bookshop',330,44,0,'Business',
'mansard','#c7d6e3','#8fa5bd','#526d87','#466e83',2,'awning');

add('pharmacy','Pharmacy',430,58,0,'Business',
'flat','#e0eedb','#a0bfa8','#638b79','#419768',1,'cross');

add('clothes','Clothing boutique',490,66,0,'Business',
'mansard','#f5d0df','#bf99af','#765c85','#aa6398',2,'awning');

add('hardware','Hardware shop',350,46,0,'Business',
'gable','#e8cba0','#ac936f','#67747e','#bd7b3b',1,'awning');

add('supermarket','Supermarket',760,105,0,'Business',
'flat','#d9e5ec','#a4b9c2','#577a91','#4a8cba',1,'wide');

add('hotel','Boutique hotel',900,120,0,'Business',
'mansard','#f9e3b6','#c9a681','#a15e51','#6b8c91',4,'balcony');

add('pub','Village inn',510,69,0,'Business',
'gable','#f0d9a7','#b7a07d','#705044','#8d5540',2,'timber');

add('icecream','Ice cream shop',300,42,0,'Business',
'flat','#f8cdd8','#cba1b9','#6e9fbc','#ed81aa',1,'awning');

// AGRICULTURE

add('barn','Farm barn',300,25,0,'Farming',
'gable','#d88661','#a35b46','#687c86','#f4dab3',1,'barn');

add('farmhouse','Farmhouse',360,40,5,'Farming',
'gable','#f6e1b7','#bfa783','#b06446','#6c8c57',2,'garden');

add('greenhouse','Greenhouse',180,22,0,'Farming',
'glass','#a5dbcd','#669f92','#76c6bf','#ecf5d7',1,'garden');

// INDUSTRIAL BUILDINGS

add('sawmill','Sawmill',480,58,0,'Industry',
'flat','#e0c299','#a78b6e','#6d8580','#ac754a',1,'mill');

add('flourmill','Flour mill',540,66,0,'Industry',
'gable','#e9d5b4','#b29c7b','#947151','#a98258',2,'mill');

add('factory','Factory',850,95,0,'Industry',
'flat','#e0bb98','#b18f79','#6d7f85','#aa725b',1,'factory');

add('warehouse','Warehouse',460,50,0,'Industry',
'flat','#d0e0e3','#9dafb7','#60828c','#567c93',1,'warehouse');

add('dairy','Dairy works',560,68,0,'Industry',
'flat','#eee1cd','#b8ad9e','#76a7b1','#5a8d9a',1,'factory');

add('workshop','Workshop',390,48,0,'Industry',
'gable','#e5c7a6','#b49b85','#8a7363','#9c7650',1,'warehouse');

// ELECTRICITY, WATER AND WASTE

add('coal','Coal power station',950,0,0,'Utilities',
'flat','#d8c5b0','#a39b91','#74858c','#ad745d',1,'coal');

add('solar','Solar farm',420,0,0,'Utilities',
'flat','#e3e6d3','#a2b6a4','#557eac','#629fc0',1,'solar');

add('wind','Wind turbine',350,0,0,'Utilities',
'flat','#e8eee6','#a9beb9','#72919c','#7daeba',1,'wind');

add('waterTower','Water tower',360,0,0,'Utilities',
'flat','#dbe7e4','#99b8bc','#71b0c7','#75b2cb',1,'water');

add('sewage','Sewage works',550,0,0,'Utilities',
'flat','#ddd8bd','#9da99a','#648e80','#77a5a0',1,'sewage');

add('recycling','Recycling centre',450,0,0,'Utilities',
'flat','#d6e6c6','#a2b99a','#668d62','#7aa559',1,'warehouse');

// PUBLIC SERVICES

add('school','Primary school',620,0,0,'Services',
'hip','#f7dca4','#bbad83','#9b5d48','#739ec0',2,'columns');

add('clinic','Health clinic',520,0,0,'Services',
'flat','#f3eee1','#b3c9c5','#7199a2','#67a6a1',2,'cross');

add('fire','Fire station',670,0,0,'Services',
'flat','#e6a08e','#ae6d60','#78888d','#c65045',1,'warehouse');

add('police','Police station',650,0,0,'Services',
'hip','#dce3e9','#9aadc0','#58778f','#46749f',2,'columns');

add('library','Library',540,0,0,'Services',
'mansard','#f2d9ad','#b8a589','#7c829e','#806b9c',2,'columns');

// ==========================================
// 02 — UTILITY CAPACITY
// ==========================================

const capacities={
    coal:[180,0,0],
    solar:[45,0,0],
    wind:[30,0,0],
    waterTower:[0,120,0],
    sewage:[0,0,120]
};

// ==========================================
// 03 — GRAPHICS ENGINE
// ==========================================

const sprites=new Map();

const oldObject=drawObject;
const oldTile=drawTile;
const oldAct=act;
const oldHud=hud;
const oldMode=selectMode;

town.cleared ||= {};

let demolition=null;

function sprite(id){

    if(sprites.has(id)){
        return sprites.get(id);
    }

    const s=art[id];

    const img=document.createElement('canvas');

    img.width=336;
    img.height=420;

    const g=img.getContext('2d');

    g.scale(3,3);
    g.translate(56,112);

    const P=(x,y,z=0)=>[
        (x-y)*HW,
        (x+y)*HH-z
    ];

    const tone=(c,n)=>
        '#'+c.slice(1)
        .match(/../g)
        .map(v=>
            Math.max(
                0,
                Math.min(
                    255,
                    parseInt(v,16)+n
                )
            ).toString(16).padStart(2,'0')
        ).join('');

    function poly(p,col,edge=null,lw=.65){

        g.beginPath();

        p.forEach(
            (v,i)=>i
                ?g.lineTo(...v)
                :g.moveTo(...v)
        );

        g.closePath();

        g.fillStyle=col;
        g.fill();

        if(edge){
            g.strokeStyle=edge;
            g.lineWidth=lw;
            g.stroke();
        }
    }

    function face(p,col,edge){

        poly(
            p.map(v=>P(...v)),
            col,
            edge
        );
    }

    function flat(a,b,c,d,z,col){

        face([
            [a,b,z],
            [c,b,z],
            [c,d,z],
            [a,d,z]
        ],col);
    }

    function line(a,b,col,w=1){

        g.beginPath();

        g.moveTo(...a);
        g.lineTo(...b);

        g.lineWidth=w;
        g.strokeStyle=col;
        g.lineCap='round';

        g.stroke();
    }

    function ellipse(x,y,rx,ry,col){

        g.beginPath();

        g.ellipse(
            x,y,rx,ry,
            0,0,Math.PI*2
        );

        g.fillStyle=col;
        g.fill();
    }

    function grad(a,b,c,d){

        const v=g.createLinearGradient(
            ...a,...b
        );

        v.addColorStop(0,c);
        v.addColorStop(1,d);

        return v;
    }

    // SHADED ARCHITECTURAL WALLS

    function wall(
        x0,y0,x1,y1,z,h,c,d
    ){

        face([
            [x0,y1,z],
            [x1,y1,z],
            [x1,y1,z+h],
            [x0,y1,z+h]
        ],
        grad(
            P(x0,y1,z+h),
            P(x1,y1,z),
            tone(c,9),
            tone(c,-13)
        ),
        '#775c493d');

        face([
            [x1,y0,z],
            [x1,y1,z],
            [x1,y1,z+h],
            [x1,y0,z+h]
        ],
        grad(
            P(x1,y0,z+h),
            P(x1,y1,z),
            d,
            tone(d,-18)
        ),
        '#775c493d');

        flat(
            x0,y0,x1,y1,
            z+h,
            tone(c,10)
        );
    }

    // DETAILED WINDOWS

    function windowAt(
        a,b,z,w,h,
        side=false,
        shop=false
    ){

        const Q=(u,v)=>side
            ?P(a,b+u,z+v)
            :P(a+u,b,z+v);

        const rect=(x,y,r,t,c,e)=>
            poly([
                Q(x,y),
                Q(r,y),
                Q(r,t),
                Q(x,t)
            ],c,e);

        rect(
            -.02,-1,w+.02,h+1,
            '#715b4a55'
        );

        rect(
            0,0,w,h,
            '#fff0d2',
            '#b39a76'
        );

        rect(
            .018,1,w-.018,h-1,
            grad(
                Q(0,h),
                Q(w,0),
                '#b7e2e3',
                '#386e92'
            )
        );

        line(
            Q(w*.5,1),
            Q(w*.5,h-1),
            '#fff1d8',
            .8
        );

        if(!shop){

            line(
                Q(.02,h*.48),
                Q(w-.02,h*.48),
                '#fff1d8',
                .8
            );
        }

        line(
            Q(.025,h-2),
            Q(w*.45,h*.52),
            '#e2f4edbb',
            .8
        );

        line(
            Q(-.025,0),
            Q(w+.025,0),
            '#d9be95',
            1.7
        );
    }

    // LANDSCAPING DETAILS

    function bush(
        x,y,c='#81bc57',
        flower=false
    ){

        const [a,b]=P(x,y);

        ellipse(
            a+2,b+1,
            5.5,2,
            '#35583b38'
        );

        for(let i=0;i<3;i++){

            ellipse(
                a+(i-1)*2.6,
                b-2-(i%2),
                3.8,3.6,
                grad(
                    [a-4,b-7],
                    [a+4,b],
                    tone(c,22),
                    tone(c,-36)
                )
            );
        }

        if(flower){

            for(let i=0;i<3;i++){

                ellipse(
                    a-3+i*3,
                    b-4+(i%2),
                    1.3,1.2,
                    i===1
                        ?'#ffe47d'
                        :'#f6a2b8'
                );
            }
        }
    }

    const business=
        TYPES[id].group==='Business'||
        TYPES[id].group==='Services';

    const e=s.extra;

// ==========================================
// 04 — INDUSTRIAL AND UTILITY GRAPHICS
// ==========================================

    if([
        'mill','factory','warehouse',
        'coal','solar','wind',
        'water','sewage'
    ].includes(e)){

        ellipse(
            5,5,35,12,
            '#34533830'
        );

        flat(
            -.48,-.48,.48,.48,0,
            e==='solar'||e==='wind'
                ?'#a5cb72'
                :'#c6c7b8'
        );

        function cylinder(
            x,y,z,h,r,body,top
        ){

            const [a,b]=P(x,y,z);

            g.fillStyle=grad(
                [a-r,b],
                [a+r,b],
                tone(body,22),
                tone(body,-30)
            );

            g.fillRect(
                a-r,b-h,r*2,h
            );

            ellipse(
                a,b,r,r*.34,body
            );

            ellipse(
                a,b-h,r,r*.34,top
            );
        }

        function shed(
            a,b,c,d,h,col
        ){

            wall(
                a,b,c,d,0,h,
                s.wall,s.shade
            );

            const mid=(a+c)/2;

            face([
                [a,d,h],
                [c,d,h],
                [mid,d,h+9]
            ],s.wall);

            face([
                [a,b,h],
                [a,d,h],
                [mid,d,h+9],
                [mid,b,h+9]
            ],
            tone(col,14),
            '#605a544d');

            face([
                [mid,b,h+9],
                [mid,d,h+9],
                [c,d,h],
                [c,b,h]
            ],
            tone(col,-15),
            '#605a544d');

            for(let i=1;i<5;i++){

                line(
                    P(
                        mid+(c-mid)*i/5,
                        b,
                        h+9*(1-i/5)
                    ),
                    P(
                        mid+(c-mid)*i/5,
                        d,
                        h+9*(1-i/5)
                    ),
                    '#384e5940',
                    .7
                );
            }

            face([
                [a+.06,d,1],
                [c-.06,d,1],
                [c-.06,d,12],
                [a+.06,d,12]
            ],s.accent);

            for(let j=3;j<12;j+=3){

                line(
                    P(a+.07,d,j),
                    P(c-.07,d,j),
                    '#e3e2d2a0',
                    .65
                );
            }
        }

        function chimney(x,y,h,r){

            cylinder(
                x,y,0,h,r,
                '#b5785d',
                '#e7b38c'
            );

            const [a,b]=P(x,y,h);

            ellipse(
                a,b,
                r*.68,r*.23,
                '#69483d'
            );

            line(
                [a-r,b+6],
                [a+r,b+6],
                '#eedec7',
                2.5
            );
        }

        // WIND TURBINES

        if(e==='wind'){

            wall(
                -.14,-.14,.14,.14,
                0,3,
                '#deded0',
                '#a2b4aa'
            );

            const [x,y]=P(0,0,0);

            poly([
                [x-3,y],
                [x+3,y],
                [x+1.5,y-68],
                [x-1.5,y-68]
            ],
            grad(
                [x-3,y],
                [x+3,y],
                '#f6f2e1',
                '#91adb2'
            ));

            for(let i=0;i<3;i++){

                let a=
                    -Math.PI/2+
                    i*Math.PI*2/3;

                g.save();

                g.translate(x,y-66);
                g.rotate(a);

                poly([
                    [0,-2],
                    [27,-3],
                    [32,0],
                    [12,4]
                ],
                '#f4f0dc',
                '#a2b7b5');

                g.restore();
            }

            ellipse(
                x,y-66,4,3.5,
                '#d1e1dc'
            );

        // SOLAR FARMS

        }else if(e==='solar'){

            for(const y of [-.3,.14]){

                for(const x of [-.3,.14]){

                    const a=x-.15;
                    const b=x+.16;
                    const c=y-.12;
                    const d=y+.13;

                    line(
                        P(a,d,0),
                        P(a,d,5),
                        '#778e90',
                        1.6
                    );

                    line(
                        P(b,c,0),
                        P(b,c,10),
                        '#778e90',
                        1.6
                    );

                    face([
                        [a,c,10],
                        [b,c,10],
                        [b,d,5],
                        [a,d,5]
                    ],
                    '#355b8e',
                    '#e2edf0');

                    for(let i=1;i<4;i++){

                        line(
                            P(
                                a+(b-a)*i/4,
                                c,10
                            ),
                            P(
                                a+(b-a)*i/4,
                                d,5
                            ),
                            '#83a8cb',
                            .65
                        );
                    }

                    line(
                        P(a,(c+d)/2,7.5),
                        P(b,(c+d)/2,7.5),
                        '#83a8cb',
                        .7
                    );
                }
            }

        // WATER TOWERS

        }else if(e==='water'){

            for(const x of [-.16,.16]){

                for(const y of [-.16,.16]){

                    line(
                        P(x,y,0),
                        P(x,y,39),
                        '#a0b3b5',
                        3
                    );
                }
            }

            line(
                P(-.16,.16,0),
                P(.16,.16,37),
                '#869fa3',
                1.5
            );

            line(
                P(.16,.16,0),
                P(-.16,.16,37),
                '#869fa3',
                1.5
            );

            cylinder(
                0,0,37,24,17,
                '#6eacbf',
                '#bce1df'
            );

            const [x,y]=P(0,0,61);

            ellipse(
                x,y-1,17,6,
                '#a0d4da'
            );

        // SEWAGE TREATMENT

        }else if(e==='sewage'){

            for(const [x,y] of [
                [-.22,-.22],
                [.22,.22]
            ]){

                cylinder(
                    x,y,0,6,12,
                    '#c6c7b5',
                    '#e4e1c8'
                );

                const [a,b]=P(x,y,6);

                ellipse(
                    a,b,9.5,4,
                    '#6b9d92'
                );

                line(
                    [a-8,b],
                    [a+8,b],
                    '#dce0c7',
                    1.3
                );
            }

            wall(
                .12,-.38,.42,-.05,
                0,12,
                s.wall,s.shade
            );

        // FACTORIES AND POWER PLANTS

        }else{

            if(e==='coal'){

                chimney(
                    -.24,-.26,60,5
                );

                chimney(
                    .05,-.28,48,5
                );
            }

            if(e==='mill'){

                cylinder(
                    -.22,-.24,
                    0,39,8,
                    '#b3a89a',
                    '#e5d5b7'
                );
            }

            if(e==='factory'){

                chimney(
                    -.28,-.27,45,4
                );

                shed(
                    -.42,-.29,
                    -.04,.34,
                    20,s.roof
                );

                shed(
                    -.04,-.29,
                    .40,.34,
                    20,s.roof
                );

            }else{

                shed(
                    -.43,-.28,
                    .41,.34,
                    e==='warehouse'
                        ?24:28,
                    s.roof
                );
            }

            if(e==='mill'){

                for(let i=0;i<3;i++){

                    cylinder(
                        .28,-.22+i*.1,
                        0,5,3,
                        '#b78955',
                        '#ead0a0'
                    );
                }
            }

            if(
                e==='warehouse'||
                e==='coal'
            ){

                wall(
                    -.38,.37,-.20,.46,
                    0,5,
                    '#ba9565',
                    '#967449'
                );

                wall(
                    .23,.37,.40,.46,
                    0,6,
                    '#ba9565',
                    '#967449'
                );
            }
        }

        sprites.set(id,img);

        return img;
    }

// ==========================================
// 05 — RESIDENTIAL AND COMMERCIAL GRAPHICS
// ==========================================

    const wide=
        e==='wide'||
        id==='manor'||
        id==='hotel';

    const a=wide?-.44:-.36;
    const b=wide?.44:.36;
    const c=-.38;
    const d=.23;

    const h=s.levels*15+8;

    // SOFT SHADOWS AND GROUNDS

    ellipse(
        6,6,36,13,
        '#34533824'
    );

    ellipse(
        4,4,31,10,
        '#34533825'
    );

    flat(
        -.47,-.47,.47,.47,0,
        business
            ?'#d9c6a7'
            :'#a8cb77'
    );

    flat(
        -.11,d,.11,.49,
        0,'#e8d5ae'
    );

    // FOUNDATIONS

    wall(
        a-.02,c-.02,b+.02,d+.02,
        0,3,
        '#e5d3ac',
        '#b5a17e'
    );

    wall(
        a,c,b,d,
        3,h-3,
        s.wall,s.shade
    );

    // BRICKWORK AND STONE TEXTURES

    for(let z=5;z<h;z+=5){

        line(
            P(a,d,z),
            P(b,d,z),
            '#8d70551c',
            .65
        );

        line(
            P(b,c,z),
            P(b,d,z),
            '#72553c21',
            .65
        );

        if(e==='stone'||e==='tower'){

            for(let i=0;i<5;i++){

                let x=a+
                    (b-a)*
                    (i+.5+(z%2)*.25)/5;

                line(
                    P(x,d,z),
                    P(x,d,z+4),
                    '#806f5940',
                    .55
                );
            }
        }
    }

    // FRONT DOORS AND STEPS

    const door=e==='barn'?.22:.09;

    face([
        [-door-.025,d,2],
        [door+.025,d,2],
        [door+.025,d,15],
        [-door-.025,d,15]
    ],'#fff0cb');

    face([
        [-door,d,2],
        [door,d,2],
        [door,d,13],
        [-door,d,13]
    ],
    e==='barn'
        ?'#995441'
        :s.accent
    );

    if(e!=='barn'){

        ellipse(
            ...P(.048,d,7),
            .8,.8,
            '#f9da8a'
        );
    }

    wall(
        -door-.025,d,
        door+.025,d+.095,
        0,2,
        '#ead8b7',
        '#bca586'
    );

    // MULTIPLE STOREYS

    for(
        let floor=0;
        floor<s.levels;
        floor++
    ){

        const z=7+floor*15;
        const wh=10;

        if(e!=='barn'||floor>0){

            windowAt(
                a+.045,d,z,.19,wh,
                false,
                business&&floor===0
            );

            windowAt(
                b-.235,d,z,.19,wh,
                false,
                business&&floor===0
            );
        }

        windowAt(
            b,c+.065,z,.19,wh,
            true,
            business&&floor===0
        );

        windowAt(
            b,d-.22,z,.15,wh,
            true
        );

        if(floor>0&&s.levels>2){

            windowAt(
                -.07,d,z,.14,wh
            );
        }

        if(floor>0){

            line(
                P(a,d,z-3),
                P(b,d,z-3),
                tone(s.wall,12),
                1.5
            );

            line(
                P(b,c,z-3),
                P(b,d,z-3),
                tone(s.shade,12),
                1.5
            );
        }
    }

    // TUDOR AND ALPINE TIMBERWORK

    if(e==='timber'){

        for(const x of [a,0,b]){

            line(
                P(x,d,3),
                P(x,d,h),
                '#76503b',
                2
            );
        }

        for(let z=17;z<h;z+=15){

            line(
                P(a,d,z),
                P(b,d,z),
                '#76503b',
                2
            );

            line(
                P(b,c,z),
                P(b,d,z),
                '#76503b',
                2
            );
        }

        line(
            P(a,d,18),
            P(0,d,h),
            '#76503b',
            1.5
        );
    }

    // BALCONIES AND COLUMNS

    if([
        'balcony',
        'columns',
        'bay'
    ].includes(e)){

        const z=e==='columns'?0:18;

        wall(
            -.29,d,.29,d+.12,
            z,3,
            '#f4e4c8',
            '#bba78a'
        );

        for(let i=0;i<5;i++){

            line(
                P(
                    -.27+i*.135,
                    d+.11,z+3
                ),
                P(
                    -.27+i*.135,
                    d+.11,z+10
                ),
                '#fff0d2',
                e==='columns'?2.5:1.1
            );
        }

        line(
            P(-.29,d+.11,z+10),
            P(.29,d+.11,z+10),
            '#e6d0ac',
            1.8
        );
    }

    // COVERED PORCHES

    if(e==='porch'){

        for(const x of [-.23,.23]){

            line(
                P(x,d+.12,2),
                P(x,d+.12,18),
                '#e9dfc7',
                2.1
            );
        }

        face([
            [-.27,d,21],
            [.27,d,21],
            [.27,d+.16,17],
            [-.27,d+.16,17]
        ],s.roof);
    }

// ==========================================
// 06 — ADVANCED ROOF STYLES
// ==========================================

    const x0=a-.055;
    const x1=b+.055;
    const y0=c-.055;
    const y1=d+.055;

    function tiled(A,B,C,D,col){

        face(
            [A,B,C,D],
            grad(
                P(...A),
                P(...C),
                tone(col,16),
                tone(col,-15)
            ),
            '#59433765'
        );

        const mix=(a,b,t)=>
            a.map(
                (v,i)=>v+(b[i]-v)*t
            );

        for(let i=1;i<7;i++){

            let t=i/7;

            const L=mix(A,D,t);
            const R=mix(B,C,t);

            line(
                P(...L),
                P(...R),
                tone(col,-26),
                .7
            );

            line(
                P(...mix(A,D,t-.02)),
                P(...mix(B,C,t-.02)),
                tone(col,22),
                .45
            );

            for(let j=1;j<8;j++){

                const u=
                    (j-(i%2)*.5)/8;

                line(
                    P(...mix(L,R,u)),
                    P(
                        ...mix(
                            mix(A,D,t-1/7),
                            mix(B,C,t-1/7),
                            u
                        )
                    ),
                    tone(col,-19),
                    .45
                );
            }
        }
    }

    // MODERN FLAT ROOFS

    if(s.style==='flat'){

        wall(
            x0,y0,x1,y1,
            h,4,
            tone(s.roof,23),
            s.roof
        );

        flat(
            x0+.045,y0+.045,
            x1-.045,y1-.045,
            h+4,
            tone(s.roof,42)
        );

        if(e==='terrace'){

            flat(
                -.28,-.25,.04,.19,
                h+4,
                '#9dc18b'
            );

            wall(
                .12,-.28,.28,-.04,
                h+4,8,
                '#eee8ce',
                '#a6a9a0'
            );

        }else{

            wall(
                -.15,-.22,.17,.08,
                h+4,5,
                '#d9d9c7',
                '#8eaaa8'
            );
        }

    // GREENHOUSE ROOFS

    }else if(s.style==='glass'){

        const r=13;

        face([
            [x0,y1,h],
            [x1,y1,h],
            [0,y1,h+r]
        ],
        '#b9ebd9a9',
        '#e8f6d6');

        tiled(
            [x0,y0,h],
            [x0,y1,h],
            [0,y1,h+r],
            [0,y0,h+r],
            s.roof
        );

        tiled(
            [0,y0,h+r],
            [0,y1,h+r],
            [x1,y1,h],
            [x1,y0,h],
            tone(s.roof,-15)
        );

    // HIPPED AND MANSARD ROOFS

    }else if(
        s.style==='hip'||
        s.style==='mansard'
    ){

        const r=
            s.style==='mansard'
                ?18:13;

        const k=
            s.style==='mansard'
                ?.23:.04;

        tiled(
            [x0,y0,h],
            [x0,y1,h],
            [-k,.09,h+r],
            [-k,-.17,h+r],
            tone(s.roof,10)
        );

        tiled(
            [x0,y1,h],
            [x1,y1,h],
            [k,.09,h+r],
            [-k,.09,h+r],
            tone(s.roof,5)
        );

        tiled(
            [k,-.17,h+r],
            [k,.09,h+r],
            [x1,y1,h],
            [x1,y0,h],
            tone(s.roof,-15)
        );

        flat(
            -k,-.17,k,.09,
            h+r,
            tone(s.roof,22)
        );

    // TRADITIONAL GABLED ROOFS

    }else{

        const r=
            e==='timber'?23:17;

        face([
            [x0,y1,h],
            [x1,y1,h],
            [0,y1,h+r]
        ],
        tone(s.wall,8),
        '#8a664e55');

        tiled(
            [x0,y0,h],
            [x0,y1,h],
            [0,y1,h+r],
            [0,y0,h+r],
            tone(s.roof,10)
        );

        tiled(
            [0,y0,h+r],
            [0,y1,h+r],
            [x1,y1,h],
            [x1,y0,h],
            tone(s.roof,-14)
        );

        line(
            P(0,y0,h+r),
            P(0,y1,h+r),
            tone(s.roof,35),
            2
        );

        windowAt(
            -.065,y1-.001,
            h+3,.13,7
        );
    }

    // CHIMNEYS

    if(
        s.style!=='flat'&&
        s.style!=='glass'
    ){

        wall(
            .14,-.25,.25,-.13,
            h+8,15,
            '#b7785d',
            '#92543f'
        );

        wall(
            .12,-.27,.27,-.11,
            h+23,2,
            '#e0ad87',
            '#ad795e'
        );

        flat(
            .16,-.23,.23,-.15,
            h+25,
            '#674a42'
        );
    }

    // VICTORIAN TURRETS

    if(e==='tower'){

        wall(
            .12,.02,.34,.29,
            0,h+8,
            s.wall,s.shade
        );

        windowAt(
            .16,.29,h-3,.13,9
        );

        face([
            [.09,.32,h+8],
            [.37,.32,h+8],
            [.23,.14,h+26]
        ],tone(s.roof,12));

        face([
            [.37,-.01,h+8],
            [.37,.32,h+8],
            [.23,.14,h+26]
        ],tone(s.roof,-15));
    }

// ==========================================
// 07 — COMMERCIAL SHOPFRONTS
// ==========================================

    if(business){

        // STRIPED AWNINGS

        if(
            TYPES[id].group==='Business'&&
            e!=='timber'&&
            e!=='balcony'
        ){

            for(let i=0;i<10;i++){

                const x=a+(b-a)*i/10;
                const xx=a+(b-a)*(i+1)/10;

                const col=i%2
                    ?'#fff2d6'
                    :s.accent;

                face([
                    [x,d,20],
                    [xx,d,20],
                    [xx,d+.19,14],
                    [x,d+.19,14]
                ],col);

                face([
                    [x,d+.19,14],
                    [xx,d+.19,14],
                    [xx,d+.19,11],
                    [x,d+.19,11]
                ],tone(col,-9));
            }
        }

        // INDIVIDUAL SHOP SIGNS

        const [sx,sy]=P(0,d,24);

        g.save();

        g.translate(sx,sy);
        g.transform(1,.5,0,1,0,0);

        const name=({
            shop:'MARKET',
            greengrocer:'PRODUCE',
            icecream:'ICE CREAM',
            clothes:'BOUTIQUE',
            hotel:'HOTEL',
            pub:'THE INN',
            hardware:'HARDWARE',
            supermarket:'FOOD MART'
        })[id]||
        TYPES[id].name.toUpperCase();

        g.fillStyle='#fff0ce';

        g.fillRect(
            -14,-3,28,6
        );

        g.strokeStyle=s.accent;
        g.lineWidth=.6;

        g.strokeRect(
            -14,-3,28,6
        );

        g.fillStyle='#654b3c';
        g.textAlign='center';
        g.font='bold 4.3px sans-serif';

        g.fillText(
            name,0,1.6,26
        );

        g.restore();

        // MEDICAL CROSS

        if(e==='cross'){

            const [x,y]=P(.3,d,27);

            line(
                [x-3,y],
                [x+3,y],
                '#3d965e',2
            );

            line(
                [x,y-3],
                [x,y+3],
                '#3d965e',2
            );
        }

        // PRODUCE AND FLOWER DISPLAYS

        if(e==='market'){

            for(let i=0;i<3;i++){

                let x=-.38+i*.13;

                wall(
                    x,.39,x+.1,.48,
                    0,3,
                    '#bd9057',
                    '#977445'
                );

                bush(
                    x+.05,.43,
                    id==='florist'
                        ?'#b987bb'
                        :'#94bd59',
                    true
                );
            }
        }

        // OUTDOOR CAFE TABLES

        if(e==='patio'){

            let [x,y]=P(.32,.4);

            ellipse(
                x,y,6,3,
                '#987151'
            );

            line(
                [x,y],
                [x,y-9],
                '#8e7151'
            );

            poly([
                [x-8,y-7],
                [x,y-15],
                [x+8,y-7]
            ],s.accent);
        }
    }

    // FINAL GARDEN DETAILS

    bush(
        -.37,.39,
        '#7eb75a',
        true
    );

    bush(
        .37,.35,
        '#8cc35f',
        true
    );

    if(e==='garden'){

        bush(
            .28,.43,
            '#8fc16a',
            true
        );
    }

    // CACHE GRAPHICS FOR PERFORMANCE

    sprites.set(id,img);

    return img;
}

// ==========================================
// 08 — UPGRADED WORLD RENDERING
// ==========================================

drawObject=function(t){

    const id=town.buildings[
        key(t.x,t.y)
    ]?.type;

    if(!art[id]){

        if(
            !id&&
            town.cleared[
                key(t.x,t.y)
            ]
        ){
            return;
        }

        return oldObject(t);
    }

    const p=project(t.x,t.y);

    ctx.save();

    if(
        moving===key(t.x,t.y)
    ){

        ctx.globalAlpha=.45;
    }

    ctx.drawImage(
        sprite(id),
        p[0]-56,
        p[1]-112,
        112,
        140
    );

    ctx.restore();
};

// ==========================================
// 09 — ILLUSTRATED CONSTRUCTION CATALOGUE
// ==========================================

const tabs=$('categories');

let group='Homes';

const groups=[
    'Homes',
    'Business',
    'Industry',
    'Utilities',
    'Services',
    'Roads',
    'Farming',
    'Nature'
];

const fallback={
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

function catalogue(){

    tabs.replaceChildren();

    $('catalogue').replaceChildren();

    for(const label of groups){

        const b=document.createElement(
            'button'
        );

        b.textContent=label;

        b.className=label===group
            ?'chosen'
            :'';

        b.onclick=()=>{

            group=label;

            selectMode('pan');

            catalogue();
        };

        tabs.append(b);
    }

    for(
        const [id,t]
        of Object.entries(TYPES)
    ){

        if(t.group!==group)continue;

        const b=document.createElement(
            'button'
        );

        b.className='item';

        b.dataset.type=id;

        // SHOW THE ACTUAL BUILDING

        if(art[id]){

            const thumb=
                document.createElement(
                    'canvas'
                );

            thumb.width=108;
            thumb.height=88;

            const c=thumb.getContext('2d');

            const im=sprite(id);

            c.drawImage(
                im,
                36,90,
                264,310,
                17,0,
                75,88
            );

            b.append(thumb);

        }else{

            const i=document.createElement(
                'i'
            );

            i.textContent=
                fallback[id]||'🌱';

            b.append(i);
        }

        const name=document.createElement(
            'span'
        );

        name.textContent=t.name;

        const cost=document.createElement(
            'small'
        );

        cost.textContent=
            money(t.cost)+
            (
                t.rent
                    ?' · +'+money(t.rent)
                    :''
            );

        b.append(name,cost);

        b.onclick=()=>{

            selected=id;

            selectMode('build');
        };

        $('catalogue').append(b);
    }
}

// ==========================================
// 10 — BULLDOZER AND LAND CLEARANCE
// ==========================================

const bulldoze=document.createElement(
    'button'
);

bulldoze.dataset.mode='bulldoze';

bulldoze.textContent='Bulldoze';

bulldoze.onclick=()=>
    selectMode('bulldoze');

$('tools').append(bulldoze);

selectMode=function(m){

    oldMode(m);

    demolition=null;

    if(m==='bulldoze'){

        message(
            'Tap a building twice to demolish it • '+
            'Tap a wild tree to clear it • No refund'
        );
    }
};

act=function(x,y){

    if(!inside(x,y))return;

    const k=key(x,y);

    const b=town.buildings[k];

    if(mode==='bulldoze'){

        // REQUIRE CONFIRMATION

        if(
            b&&
            demolition!==k
        ){

            demolition=k;

            message(
                'Tap again to demolish '+
                TYPES[b.type].name+
                ' permanently. No refund.'
            );

            dirty=true;

            return;
        }

        // DEMOLISH BUILDING

        if(b){

            delete town.buildings[k];

            town.cleared[k]=true;

            message(
                TYPES[b.type].name+
                ' demolished.'
            );

        // CLEAR WILD TREES

        }else if(
            terrain(x,y)==='grass'&&
            hash(x,y,7)>.82&&
            !town.cleared[k]
        ){

            town.cleared[k]=true;

            message('Tree cleared.');

        }else{

            demolition=null;

            message(
                'Nothing to bulldoze here.'
            );

            dirty=true;

            return;
        }

        demolition=null;

        hud();

        save();

        dirty=true;

        return;
    }

    oldAct(x,y);
};

// ==========================================
// 11 — UTILITY SUPPLY AND DEMAND
// ==========================================

const utility=document.createElement(
    'div'
);

utility.className='stat';

utility.innerHTML=
    '<small>Power / water / waste</small>'+
    '<b id="utilityNumbers"></b>';

$('hud').insertBefore(
    utility,
    $('save')
);

hud=function(){

    oldHud();

    const supply=[0,0,0];
    const demand=[0,0,0];

    for(
        const b
        of Object.values(town.buildings)
    ){

        const t=TYPES[b.type];

        const cap=capacities[b.type];

        if(!t)continue;

        if(cap){

            cap.forEach(
                (n,i)=>supply[i]+=n
            );

        }else if([
            'Homes',
            'Business',
            'Industry',
            'Services',
            'Farming'
        ].includes(t.group)){

            const n=t.pop||
                (
                    t.group==='Industry'
                        ?8:4
                );

            demand[0]+=n;
            demand[1]+=n;
            demand[2]+=n;
        }
    }

    $('utilityNumbers').textContent=

        supply.map(
            (n,i)=>n+'/'+demand[i]
        ).join(' · ');

    utility.title=
        'Supply / demand. Power, water and '+
        'sewage networks are not active yet.';
};

// ==========================================
// 12 — IMPROVED GAMING INTERFACE
// ==========================================

const css=document.createElement(
    'style'
);

css.textContent=`

#dock{

    max-width:960px;

    padding:8px 10px;
}

#categories{

    gap:6px;
}

#categories button{

    font-weight:750;
}

#catalogue{

    padding-bottom:5px;

    gap:7px;
}

.item{

    flex:0 0 112px;

    height:120px;

    min-height:120px;

    grid-template-rows:77px auto auto;

    align-content:center;

    padding:3px;

    gap:1px;
}

.item canvas{

    width:90px;

    height:74px;

    object-fit:contain;

    filter:
        drop-shadow(
            0 2px 1px #795b3430
        );
}

.item i{

    font-size:36px;

    align-self:center;
}

.item span{

    font-size:11px;

    font-weight:750;

    line-height:1.1;

    text-align:center;
}

.item small{

    font-size:10px;

    white-space:nowrap;
}

#status{

    font-weight:650;
}

#tools [data-mode=bulldoze]{

    color:#8e392d;

    background:#f1c7a7;
}

#tools [data-mode=bulldoze].active{

    background:#c75842;

    color:white;
}

@media(max-height:420px){

    .item{

        height:88px;

        min-height:88px;

        grid-template-rows:
            45px auto auto;
    }

    .item canvas{

        height:45px;

        width:56px;
    }
}

`;

document.head.append(css);

// ==========================================
// 13 — ACTIVATE VERSION 0.4
// ==========================================

catalogue();

selectMode('pan');

hud();

save();

dirty=true;

document.title=
    'Town Builder • Architecture Collection';

})();
