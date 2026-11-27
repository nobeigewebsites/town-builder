
/* ==========================================
   TOWN BUILDER V1.0
   LANDSCAPING, FENCING & WILDLIFE
   ========================================== */

(() => {

'use strict';

const ITEMS=Object.freeze(Object.fromEntries([

 ['oak','Oak tree','Trees',30,'🌳',2],
 ['willow','Willow tree','Trees',35,'🌳',2],
 ['pine','Pine tree','Trees',25,'🌲',2],
 ['cherry','Cherry blossom','Trees',40,'🌸',3],
 ['palm','Palm tree','Trees',35,'🌴',2],
 ['oliveTree','Olive tree','Trees',35,'🫒',2],
 ['maple','Maple tree','Trees',35,'🍁',2],
 ['birch','Birch tree','Trees',25,'🌳',2],

 ['rose','Rose bush','Plants',12,'🌹',2],
 ['lavenderBed','Lavender','Plants',10,'🪻',2],
 ['tulip','Tulips','Plants',8,'🌷',1],
 ['sunflowerBed','Sunflowers','Plants',8,'🌻',1],
 ['wildflowers','Wildflowers','Plants',6,'🌼',1],
 ['shrub','Ornamental shrub','Plants',10,'🌿',1],
 ['bamboo','Bamboo','Plants',12,'🎋',1],
 ['climber','Climbing plants','Plants',12,'🌿',1],

 ['flowerBed','Flower bed','Gardens',18,'🌺',2],
 ['formalBed','Formal garden bed','Gardens',22,'🌸',2],
 ['rockery','Rock garden','Gardens',20,'🪨',2],

 ['planter','Flower planter','Decorations',18,'🪴',2],
 ['bench','Garden bench','Decorations',15,'🪑',1],
 ['fountain','Fountain','Decorations',75,'⛲',4],
 ['birdbath','Bird bath','Decorations',20,'💧',2],
 ['sculpture','Sculpture','Decorations',60,'🗿',3],
 ['pergola','Pergola','Decorations',45,'🌿',3],
 ['lamp','Street lamp','Decorations',20,'💡',1],
 ['trellis','Garden trellis','Decorations',18,'🌿',1],

 ['woodFence','Wooden fence','Fences',5,'','#95643d'],
 ['stoneWall','Stone wall','Fences',9,'','#a29f96'],
 ['brickWall','Brick wall','Fences',9,'','#ad6551'],
 ['ironFence','Wrought iron fence','Fences',12,'','#343d3c'],
 ['bambooFence','Bamboo fence','Fences',6,'','#c4a05d'],
 ['hedge','Hedge','Fences',8,'','#416f35'],
 ['farmGate','Farm gate','Fences',15,'','#d8a265']

].map(([id,name,category,cost,icon,value])=>[

 id,

 Object.freeze({
  id,name,category,cost,icon,
  fence:category==='Fences',
  color:category==='Fences'?value:null,
  beauty:category==='Fences'?0:value,
  surfaces:category==='Decorations'
   ?['grass','soil','paving','sand']
   :['grass','soil']
 })

])));

// ==========================================
// DECORATIVE ANIMALS
// ==========================================

const ANIMALS=Object.freeze(Object.fromEntries([

 ['horse','Chestnut horse','paddock',45,'🐎','#9a5935'],
 ['blackHorse','Black horse','paddock',45,'🐎','#333b3c'],
 ['greyHorse','Grey horse','paddock',45,'🐎','#d6d6d1'],
 ['foal','Foal','paddock',25,'🐎','#bb8052'],
 ['deer','Deer','meadow',25,'🦌','#a67b50'],
 ['rabbit','Rabbit','meadow',10,'🐇','#c2b6a1'],
 ['bird','Bird','garden',5,'🐦','#5c91b9'],
 ['butterfly','Butterfly','garden',5,'🦋','#c88adb'],
 ['swan','Swan','pond',20,'🦢','#f8f6ef']

].map(([id,name,habitat,cost,icon,color])=>[

 id,

 Object.freeze({
  id,name,habitat,cost,icon,color
 })

])));

const DIRS=[
 [0,-1,1],
 [1,0,2],
 [0,1,4],
 [-1,0,8]
];

const own=(o,k)=>Object.hasOwn(o,k);

const fail=reason=>({ok:false,reason});

class TownLandscaping {

 constructor(town,transport=null){

  if(transport&&transport.town!==town)
   throw Error('World mismatch');

  this.town=town;
  this.transport=transport;

  this.habitats=new Map();
  this.animals=new Map();

  this.nextHabitat=1;
  this.nextAnimal=1;

  for(const d of Object.values(ITEMS)){

   const id='land_'+d.id;

   if(!town.catalogue.has(id))
    town.register(id,{
     name:d.name,
     cost:d.cost,
     surfaces:d.surfaces
    });

  }

 }

 // ==========================================
 // MAP LOOKUPS
 // ==========================================

 itemAt(x,y){

  const t=this.town;

  if(!t.inside(x,y))return null;

  const b=t.buildings.get(
   t.occupied.get(t.key(x,y))
  );

  const id=b?.type.startsWith('land_')
   ?b.type.slice(5):null;

  return own(ITEMS,id)
   ?{building:b,type:ITEMS[id]}
   :null;

 }

 habitatAt(x,y){

  for(const h of this.habitats.values()){

   if(
    x>=h.x&&y>=h.y&&
    x<h.x+h.width&&y<h.y+h.height
   )return h;

  }

  return null;

 }

 // ==========================================
 // AREA AND LINE SELECTION
 // ==========================================

 rect(a,b){

  if(
   !a||!b||
   !this.town.inside(a.x,a.y)||
   !this.town.inside(b.x,b.y)
  )return [];

  const cells=[];

  for(
   let y=Math.min(a.y,b.y);
   y<=Math.max(a.y,b.y);
   y++
  ){

   for(
    let x=Math.min(a.x,b.x);
    x<=Math.max(a.x,b.x);
    x++
   )cells.push({x,y});

  }

  return cells;

 }

 line(a,b,xFirst=true){

  if(
   !a||!b||
   !this.town.inside(a.x,a.y)||
   !this.town.inside(b.x,b.y)
  )return [];

  let {x,y}=a;

  const cells=[{x,y}];

  for(
   const axis of
   xFirst?['x','y']:['y','x']
  ){

   while((axis==='x'?x:y)!==b[axis]){

    if(axis==='x')
     x+=Math.sign(b.x-x);
    else
     y+=Math.sign(b.y-y);

    cells.push({x,y});

   }

  }

  return cells;

 }

 // ==========================================
 // LANDSCAPING PREVIEW
 // ==========================================

 preview(type,a,b=a,xFirst=true){

  if(!own(ITEMS,type))
   return fail('Unknown landscaping item');

  const d=ITEMS[type];
  const t=this.town;

  const cells=d.fence
   ?this.line(a,b,xFirst)
   :this.rect(a,b);

  if(!cells.length)
   return fail('Choose valid tiles');

  const fresh=[];

  for(const p of cells){

   const existing=this.itemAt(p.x,p.y);

   if(existing?.type.id===type)
    continue;

   const h=this.habitatAt(p.x,p.y);

   if(
    h&&!(
     h.kind==='garden'&&
     this.gardenPlant(d)
    )
   )return {
    ...fail('Animal habitat occupies this tile'),
    cells
   };

   if(this.transport?.get(p.x,p.y))
    return {
     ...fail('Transport occupies this tile'),
     cells
    };

   const r=t.preview(
    'land_'+type,p.x,p.y
   );

   if(!r.ok)
    return {...fail(r.reason),cells};

   fresh.push(p);

  }

  const cost=fresh.length*d.cost;

  return {
   ok:t.cash>=cost,
   reason:t.cash<cost?'Insufficient funds':null,
   cells,fresh,cost
  };

 }

 // ==========================================
 // CONFIRMED CONSTRUCTION
 // ==========================================

 build(type,a,b=a,xFirst=true){

  const p=this.preview(type,a,b,xFirst);

  if(!p.ok)return p;

  for(const c of p.fresh)
   this.town.place(
    'land_'+type,c.x,c.y
   );

  return p;

 }

 // ==========================================
 // CONNECTING FENCES
 // ==========================================

 fenceMask(x,y){

  if(!this.itemAt(x,y)?.type.fence)
   return 0;

  let mask=0;

  for(const [dx,dy,bit] of DIRS){

   if(this.itemAt(x+dx,y+dy)?.type.fence)
    mask|=bit;

  }

  return mask;

 }

 ring(h){

  const cells=[];

  for(
   let y=h.y-1;
   y<=h.y+h.height;
   y++
  ){

   for(
    let x=h.x-1;
    x<=h.x+h.width;
    x++
   ){

    if(
     x===h.x-1||
     y===h.y-1||
     x===h.x+h.width||
     y===h.y+h.height
    )cells.push({x,y});

   }

  }

  return cells;

 }

 remove(x,y){

  const item=this.itemAt(x,y);

  if(!item)
   return fail('No landscaping item here');

  if(item.type.fence){

   for(const h of this.habitats.values()){

    if(
     h.kind==='paddock'&&
     this.ring(h).some(
      p=>p.x===x&&p.y===y
     )
    )return fail(
     'Remove the paddock habitat first'
    );

   }

  }

  this.town.remove(item.building.id);

  return {ok:true};

 }

 gardenPlant(d){

  return [
   'Trees','Plants','Gardens'
  ].includes(d?.category);

 }

 // ==========================================
 // CUSTOM ANIMAL HABITATS
 // ==========================================

 habitatPreview(kind,a,b=a){

  if(![
   'paddock','meadow','garden','pond'
  ].includes(kind))
   return fail('Unknown habitat');

  const cells=this.rect(a,b);

  if(!cells.length)
   return fail('Choose valid habitat tiles');

  const h={
   kind,
   x:Math.min(a.x,b.x),
   y:Math.min(a.y,b.y),
   width:Math.abs(a.x-b.x)+1,
   height:Math.abs(a.y-b.y)+1
  };

  if(cells.length<4)
   return {
    ...fail('Habitat needs at least four tiles'),
    cells
   };

  for(const p of cells){

   const k=this.town.key(p.x,p.y);

   const surface=this.town.getTerrain(p.x,p.y);

   const planted=
    kind==='garden'&&
    this.gardenPlant(
     this.itemAt(p.x,p.y)?.type
    );

   if(
    this.habitatAt(p.x,p.y)||
    (
     this.town.occupied.has(k)&&
     !planted
    )||
    this.transport?.get(p.x,p.y)
   )return {
    ...fail('Habitat must use clear, unoccupied tiles'),
    cells
   };

   if(
    kind==='pond'
     ?surface!=='water'
     :!['grass','soil'].includes(surface)
   )return {
    ...fail(
     kind==='pond'
      ?'Pond habitat needs water'
      :'Land habitat needs grass or soil'
    ),
    cells
   };

  }

  if(kind==='paddock'){

   const ring=this.ring(h);

   if(!ring.every(
    p=>this.itemAt(p.x,p.y)?.type.fence
   ))return {
    ...fail(
     'Surround the paddock with a complete fence ring'
    ),
    cells
   };

   if(!ring.some(
    p=>this.itemAt(p.x,p.y)?.type.id==='farmGate'
   ))return {
    ...fail(
     'Include a farm gate in the fence ring'
    ),
    cells
   };

  }

  return {
   ok:true,
   cells,
   habitat:h,
   cost:0
  };

 }

 createHabitat(kind,a,b=a){

  const p=this.habitatPreview(kind,a,b);

  if(!p.ok)return p;

  const h={
   id:this.nextHabitat++,
   ...p.habitat
  };

  this.habitats.set(h.id,h);

  return {ok:true,habitat:h};

 }

 clearAnimals(id){

  for(const [key,a] of this.animals){

   if(a.habitat===id)
    this.animals.delete(key);

  }

 }

 removeHabitat(id){

  if(!this.habitats.has(id))
   return fail('Habitat not found');

  if([...this.animals.values()].some(
   a=>a.habitat===id
  ))return fail('Remove animals first');

  this.habitats.delete(id);

  return {ok:true};

 }

 // ==========================================
 // ANIMAL PLACEMENT
 // ==========================================

 validAnimalTile(h,x,y){

  if(
   x<h.x||y<h.y||
   x>=h.x+h.width||
   y>=h.y+h.height
  )return false;

  const planted=
   h.kind==='garden'&&
   this.gardenPlant(
    this.itemAt(x,y)?.type
   );

  if(
   (
    this.town.occupied.has(
     this.town.key(x,y)
    )&&!planted
   )||
   this.transport?.get(x,y)
  )return false;

  const s=this.town.getTerrain(x,y);

  return h.kind==='pond'
   ?s==='water'
   :['grass','soil'].includes(s);

 }

 addAnimals(id,type,count=1){

  const h=this.habitats.get(id);
  const d=ANIMALS[type];

  if(
   !h||
   !own(ANIMALS,type)||
   d.habitat!==h.kind
  )return fail(
   'Animal needs a matching habitat'
  );

  if(
   !Number.isSafeInteger(count)||
   count<1||count>100
  )return fail('Invalid animal quantity');

  const all=[...this.animals.values()];

  const occupied=new Set(
   all.map(a=>this.town.key(a.x,a.y))
  );

  const free=this.rect(
   {x:h.x,y:h.y},
   {
    x:h.x+h.width-1,
    y:h.y+h.height-1
   }
  ).filter(
   p=>this.validAnimalTile(h,p.x,p.y)&&
   !occupied.has(this.town.key(p.x,p.y))
  );

  const capacity=Math.max(
   1,
   Math.floor(
    h.width*h.height/
    (h.kind==='paddock'?4:2)
   )
  );

  if(
   all.filter(a=>a.habitat===id).length+
    count>capacity||
   free.length<count
  )return fail('Habitat is full');

  const cost=d.cost*count;

  if(this.town.cash<cost)
   return fail('Insufficient funds');

  for(let i=0;i<count;i++){

   const a={
    id:this.nextAnimal++,
    habitat:id,
    type,
    x:free[i].x,
    y:free[i].y,
    status:'Resting'
   };

   this.animals.set(a.id,a);

  }

  this.town.cash-=cost;

  return {ok:true,cost};

 }

 // ==========================================
 // DECORATIVE ANIMAL MOVEMENT
 // ==========================================

 step(random=Math.random){

  const occupied=new Set(
   [...this.animals.values()].map(
    a=>this.town.key(a.x,a.y)
   )
  );

  for(const a of this.animals.values()){

   const h=this.habitats.get(a.habitat);

   if(!h)continue;

   const options=DIRS.map(
    ([dx,dy])=>({
     x:a.x+dx,
     y:a.y+dy
    })
   ).filter(
    p=>this.validAnimalTile(h,p.x,p.y)&&
    !occupied.has(
     this.town.key(p.x,p.y)
    )
   );

   if(options.length&&random()<.6){

    const next=options[
     Math.min(
      options.length-1,
      Math.floor(random()*options.length)
     )
    ];

    occupied.delete(
     this.town.key(a.x,a.y)
    );

    a.x=next.x;
    a.y=next.y;

    occupied.add(
     this.town.key(a.x,a.y)
    );

    a.status=
     h.kind==='pond'
      ?'Swimming'
      :h.kind==='garden'
       ?'Fluttering'
       :'Wandering';

   }else{

    a.status=
     h.kind==='paddock'
      ?'Grazing'
      :h.kind==='pond'
       ?'Floating'
       :'Resting';

   }

  }

 }

 // ==========================================
 // LOCAL BEAUTY & HAPPINESS POTENTIAL
 // ==========================================

 beautyAt(x,y,radius=5){

  let score=0;

  for(const b of this.town.buildings.values()){

   const d=ITEMS[
    b.type.startsWith('land_')
     ?b.type.slice(5)
     :''
   ];

   if(
    d?.beauty&&
    Math.abs(b.x-x)+Math.abs(b.y-y)<=radius
   )score+=d.beauty;

  }

  return Math.min(10,score);

 }

}

window.TownLandscaping=TownLandscaping;
window.TownLandscapeItems=ITEMS;
window.TownDecorativeAnimals=ANIMALS;

})();
