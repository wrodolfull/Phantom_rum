import type * as T from "three";
import type {AccessoryId,HeroId} from "../shop/catalog";
import {heroById} from "../shop/catalog";
import type {ChaseObstacleKind} from "../game/modes";
import {CHASE_REGIONS,chaseRegionIndex,type RegionIndex} from "./chaseRegions";

/**
 * Phantom Run 3D art direction: Spooky Arcade.
 * All assets are procedural low-poly geometry, no external textures/assets.
 * Material count and mesh density are deliberately bounded for mobile WebGL.
 */
export const SPOOKY={
  night:0x191933,
  mist:0x423d70,
  moon:0xf2e7c9,
  moonlight:0xd7d1ff,
  skyBlue:0xa9c7ff,
  road:0x4f536b,
  stone:0x68708b,
  vegetation:0x2f4e52,
  trees:0x375c66,
  rune:0xaa7cff,
  glow:0x7cf1ff,
  essence:0xffd46b
} as const;

export type MovingArt={mesh:T.Object3D;z:number;span:number;styles?:T.Group[]};
export type GhostArt={
  model:T.Group;
  bodyMaterial:T.MeshStandardMaterial;
  color:number;
  halo:T.Object3D;
};
export type ChaseEnvironment={
  scenery:MovingArt[];
  paving:MovingArt[];
  laneMarks:MovingArt[];
  moon:T.Object3D;
  mist:T.Object3D;
  region:RegionIndex;
  elapsed:number;
  sky:T.Color;
  fogColor:T.Color;
  moonLight:T.DirectionalLight;
  rimLight:T.DirectionalLight;
  tileMaterials:T.MeshStandardMaterial[];
  regionColors:{sky:T.Color;fog:T.Color;stone:T.Color;accent:T.Color;moonlight:T.Color}[];
};
type ThreeApi=typeof import("three");

function standard(THREE:ThreeApi,color:number,extra:Record<string,unknown>={}):T.MeshStandardMaterial{
  return new THREE.MeshStandardMaterial({
    color,roughness:.93,flatShading:true,...extra
  });
}
function basic(THREE:ThreeApi,color:number,alpha=1):T.MeshBasicMaterial {
  return new THREE.MeshBasicMaterial({
    color,transparent:alpha<1,opacity:alpha,depthWrite:alpha>=1
  });
}
function createBox(THREE:ThreeApi,w:number,h:number,d:number,mat:T.Material):T.Mesh{
  return new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);
}
function createStone(THREE:ThreeApi,variant=0):T.Group {
  const group=new THREE.Group();
  const stone=standard(THREE,[0x787c9f,0x68728e,0x8790ab][variant%3]);
  const shadow=standard(THREE,0x3d486a);
  const moss=standard(THREE,0x47747a);
  const height=.94+(variant%4)*.12;
  const face=createBox(THREE,.95,height,.4,stone);
  face.position.y=height/2;group.add(face);
  const cap=new THREE.Mesh(
    new THREE.SphereGeometry(.48,10,6,0,Math.PI*2,0,Math.PI/2),stone);
  cap.position.y=height-.06;cap.scale.set(1,.55,.5);group.add(cap);
  const plaque=createBox(THREE,.43,.08,.025,shadow);
  plaque.position.set(0,height*.58,.216);group.add(plaque);
  const line=createBox(THREE,.035,.22,.03,shadow);
  line.position.set(-.13,height*.72,.225);line.rotation.z=.27;group.add(line);
  const patch=createBox(THREE,.26,.085,.07,moss);
  patch.position.set(-.23,.11,.27);patch.rotation.z=-.22;group.add(patch);
  return group;
}
function createCypress(THREE:ThreeApi,variant:number):T.Group{
  const group=new THREE.Group();
  const bark=standard(THREE,0x34405b);
  const leaf=standard(THREE,variant%2?0x355960:0x2f4e52);
  const trunk=new THREE.Mesh(new THREE.CylinderGeometry(.12,.21,2.2,5),bark);
  trunk.position.y=1;group.add(trunk);
  for(let i=0;i<3;i++){
    const crown=new THREE.Mesh(new THREE.ConeGeometry(1.05-i*.17,1.9,6),leaf);
    crown.position.y=1.85+i*.84;
    crown.rotation.y=(i+variant)*.28;
    group.add(crown);
  }
  return group;
}
function createLantern(THREE:ThreeApi):T.Group{
  const g=new THREE.Group();
  const metal=standard(THREE,0x313452);
  const glass=basic(THREE,0xffd891);
  const shaft=new THREE.Mesh(new THREE.CylinderGeometry(.055,.09,2.2,6),metal);
  shaft.position.y=1.1;g.add(shaft);
  const lamp=createBox(THREE,.38,.43,.38,metal);
  lamp.position.y=2.16;g.add(lamp);
  for(const x of [-.16,.16]){
    const face=createBox(THREE,.055,.28,.35,glass);
    face.position.set(x,2.17,0);g.add(face);
  }
  const cap=new THREE.Mesh(new THREE.ConeGeometry(.33,.26,6),metal);
  cap.position.y=2.52;g.add(cap);
  return g;
}
function createMausoleum(THREE:ThreeApi):T.Group{
  const g=new THREE.Group();
  const blocks=standard(THREE,0x555a7d);
  const trim=standard(THREE,0x8580a5);
  const body=createBox(THREE,2.7,1.9,2.1,blocks);
  body.position.y=1;g.add(body);
  const roof=new THREE.Mesh(new THREE.ConeGeometry(2.07,.92,4),trim);
  roof.position.y=2.28;roof.rotation.y=Math.PI/4;g.add(roof);
  const entrance=createBox(THREE,.92,1.52,.09,basic(THREE,0x1b2445));
  entrance.position.set(0,.76,1.12);g.add(entrance);
  for(const x of [-1.04,1.04]){
    const pillar=createBox(THREE,.24,1.83,.22,trim);
    pillar.position.set(x,.95,1.14);g.add(pillar);
  }
  return g;
}
function createFence(THREE:ThreeApi):T.Group{
  const g=new THREE.Group(),mat=standard(THREE,0x48506a);
  for(const x of [-1.8,-.6,.6,1.8]){
    const post=createBox(THREE,.13,.92,.13,mat);
    post.position.set(x,.47,0);g.add(post);
    const tip=new THREE.Mesh(new THREE.ConeGeometry(.12,.25,4),mat);
    tip.position.set(x,1.07,0);g.add(tip);
  }
  for(const y of [.29,.67]){
    const rail=createBox(THREE,3.8,.085,.1,mat);
    rail.position.y=y;g.add(rail);
  }
  return g;
}
function sideProp(THREE:ThreeApi,index:number):T.Group{
  if(index%13===0)return createMausoleum(THREE);
  if(index%7===0)return createLantern(THREE);
  if(index%6===0)return createCypress(THREE,index);
  if(index%5===0)return createFence(THREE);
  return createStone(THREE,index);
}

function createTwistedTree(THREE:ThreeApi,variant:number):T.Group {
  const group=new THREE.Group();
  const wood=standard(THREE,0x33374f);
  const leaves=standard(THREE,variant%2?0x426b70:0x326167);
  const segments=[
    {x:0,y:1.03,angle:.18},
    {x:.32,y:2.22,angle:-.48},
    {x:-.16,y:3.14,angle:.28}
  ];
  for(let i=0;i<segments.length;i++){
    const p=segments[i];
    const trunk=new THREE.Mesh(new THREE.CylinderGeometry(.12-i*.035,.28-i*.06,2.06-i*.3,6),wood);
    trunk.position.set(p.x,p.y,0);
    trunk.rotation.z=p.angle;
    group.add(trunk);
  }
  for(const dir of [-1,1]){
    const limb=new THREE.Mesh(new THREE.CylinderGeometry(.055,.11,2.2,5),wood);
    limb.position.set(dir*.92,3.01,.05);
    limb.rotation.z=dir*.95;group.add(limb);
    const tuft=new THREE.Mesh(new THREE.IcosahedronGeometry(.72,0),leaves);
    tuft.scale.set(1.1,.68,.75);
    tuft.position.set(dir*1.68,3.57,-.12);group.add(tuft);
  }
  return group;
}
function createMoonlitWillow(THREE:ThreeApi,variant:number):T.Group{
  const group=new THREE.Group();
  const wood=standard(THREE,0x40465d);
  const leaf=standard(THREE,variant%2?0x38736c:0x4b8077);
  const trunk=new THREE.Mesh(new THREE.CylinderGeometry(.19,.32,2.5,7),wood);
  trunk.position.y=1.2;trunk.rotation.z=.16;group.add(trunk);
  const canopy=new THREE.Mesh(new THREE.IcosahedronGeometry(1.53,0),leaf);
  canopy.position.set(.36,3.03,0);
  canopy.scale.set(1.35,.64,1.04);group.add(canopy);
  for(let i=0;i<5;i++){
    const vine=new THREE.Mesh(new THREE.ConeGeometry(.22,1.35+(i%2)*.4,5),leaf);
    vine.position.set(-.9+i*.51,2.13-(i%2)*.24,.04*(i%3));
    vine.rotation.z=Math.sin(i+variant)*.15;
    group.add(vine);
  }
  return group;
}
function createRunePillar(THREE:ThreeApi,variant:number):T.Group{
  const group=new THREE.Group();
  const slate=standard(THREE,0x777493);
  const inset=basic(THREE,0xcdb2ff,.95);
  const base=createBox(THREE,.96,.26,.91,slate);
  base.position.y=.13;group.add(base);
  const shaft=new THREE.Mesh(new THREE.CylinderGeometry(.29,.41,2.75,5),slate);
  shaft.position.y=1.57;group.add(shaft);
  const crown=new THREE.Mesh(new THREE.ConeGeometry(.56,.68,5),slate);
  crown.position.y=3.24;group.add(crown);
  for(let i=0;i<3;i++){
    const rune=new THREE.Mesh(new THREE.TorusGeometry(.14,.032,4,7),inset);
    rune.position.set(.08,1.07+i*.57,.4);
    rune.rotation.z=i*.7+variant*.12;group.add(rune);
  }
  return group;
}
function createBrokenGate(THREE:ThreeApi,variant:number):T.Group{
  const g=new THREE.Group();
  const stone=standard(THREE,variant%2?0x70728c:0x636480);
  for(const side of [-1,1]){
    const col=createBox(THREE,.47,2.2,.68,stone);
    col.position.set(side*1.18,1.1,0);
    col.rotation.z=side*(.07+(variant%3)*.04);g.add(col);
    const cap=createBox(THREE,.63,.2,.84,stone);
    cap.position.set(side*1.18,2.3,0);g.add(cap);
  }
  const fracture=createBox(THREE,1.4,.36,.7,stone);
  fracture.position.set(-.51,2.56,0);fracture.rotation.z=-.19;g.add(fracture);
  return g;
}
function createLostLanternCluster(THREE:ThreeApi,variant:number):T.Group{
  const g=new THREE.Group();
  const base=standard(THREE,0x3f5263);
  const light=basic(THREE,variant%2?0x88f3df:0xb6bfff,.85);
  for(let i=0;i<3;i++){
    const x=(i-1)*.57;
    const mushroom=new THREE.Mesh(new THREE.CylinderGeometry(.04,.075,.49+(i%2)*.21,5),base);
    mushroom.position.set(x,.27+(i%2)*.1,.1);g.add(mushroom);
    const cap=new THREE.Mesh(new THREE.SphereGeometry(.21+(i%2)*.065,7,5),light);
    cap.position.set(x,.55+(i%2)*.2,.1);cap.scale.y=.5;g.add(cap);
  }
  return g;
}
function createMemorial(THREE:ThreeApi,variant:number):T.Group{
  const g=new THREE.Group();
  const stone=standard(THREE,0x8c829d);
  const base=createBox(THREE,1.65,.24,1.2,stone);
  base.position.y=.12;g.add(base);
  const plinth=createBox(THREE,.95,.54,.84,stone);
  plinth.position.y=.5;g.add(plinth);
  const memorial=new THREE.Mesh(new THREE.CylinderGeometry(.23,.31,1.83,6),stone);
  memorial.position.y=1.66;g.add(memorial);
  const top=new THREE.Mesh(new THREE.IcosahedronGeometry(.43,0),
    standard(THREE,variant%2?0xc6abbf:0xaec1d6));
  top.position.y=2.66;g.add(top);
  return g;
}
function createRegionProp(THREE:ThreeApi,index:number,region:RegionIndex):T.Group{
  if(region===0)return sideProp(THREE,index);
  if(region===1){
    if(index%6===0)return createMoonlitWillow(THREE,index);
    if(index%5===0)return createTwistedTree(THREE,index);
    if(index%4===0)return createLostLanternCluster(THREE,index);
    if(index%3===0)return createLantern(THREE);
    return createCypress(THREE,index);
  }
  if(index%7===0)return createMausoleum(THREE);
  if(index%5===0)return createBrokenGate(THREE,index);
  if(index%4===0)return createRunePillar(THREE,index);
  if(index%3===0)return createMemorial(THREE,index);
  return createStone(THREE,index);
}

/**
 * Add stylized atmospheric depth, moon and moving masonry. The paving only
 * changes appearance; collision lanes stay at [-2.4, 0, 2.4].
 */
export function createChaseEnvironment(THREE:ThreeApi,world:T.Scene):ChaseEnvironment{
  world.background=new THREE.Color(SPOOKY.night);
  world.fog=new THREE.FogExp2(SPOOKY.mist,.012);
  const ambience=new THREE.HemisphereLight(0xc8cbff,0x304354,2.0);
  world.add(ambience);
  const moonlight=new THREE.DirectionalLight(SPOOKY.moonlight,2.5);
  moonlight.position.set(-9,18,-25);world.add(moonlight);
  const rimlight=new THREE.DirectionalLight(0x6bd8ef,1.1);
  rimlight.position.set(7,8,10);world.add(rimlight);
  const regionColors=CHASE_REGIONS.map(region=>({
    sky:new THREE.Color(region.sky),fog:new THREE.Color(region.fog),
    stone:new THREE.Color(region.stone),accent:new THREE.Color(region.accent),
    moonlight:new THREE.Color(region.moonlight)
  }));

  const moon=new THREE.Group();
  const face=new THREE.Mesh(new THREE.SphereGeometry(4.5,20,13),
    new THREE.MeshBasicMaterial({color:SPOOKY.moon,fog:false}));
  moon.add(face);
  const glow=new THREE.Mesh(new THREE.SphereGeometry(6.3,16,12),
    new THREE.MeshBasicMaterial({
      color:0xc7c9ff,transparent:true,opacity:.11,
      depthWrite:false,fog:false,side:THREE.BackSide
    }));
  moon.add(glow);
  moon.position.set(-23,23,-81);world.add(moon);

  // Mountains sit beyond gameplay fog. Very low poly silhouettes.
  const hills=standard(THREE,0x343c61);
  for(let i=0;i<14;i++){
    const height=7+(i*7%13);
    const hill=new THREE.Mesh(new THREE.ConeGeometry(8+(i%3),height,5),hills);
    hill.position.set((i-7)*11,2,-91-(i%3)*7);
    hill.rotation.y=i*.7;world.add(hill);
  }
  const starGeometry=new THREE.BufferGeometry();
  const positions:number[]=[];
  for(let i=0;i<80;i++){
    const n=(i*47)%83;
    positions.push(-55+(n*1.38),14+(i*17%36),-69-(i%7)*5);
  }
  starGeometry.setAttribute("position",new THREE.Float32BufferAttribute(positions,3));
  world.add(new THREE.Points(starGeometry,new THREE.PointsMaterial({
    color:0xd4d9ff,size:.27,sizeAttenuation:true,transparent:true,
    opacity:.79,fog:false
  })));

  const ground=standard(THREE,0x283a49);
  const shoulder=createBox(THREE,19,.13,132,ground);
  shoulder.position.set(0,-.25,-29);world.add(shoulder);
  const road=createBox(THREE,7.45,.18,132,standard(THREE,0x333d5b));
  road.position.set(0,-.115,-29);world.add(road);

  const curbs=standard(THREE,0x9190ae);
  for(const x of [-3.77,3.77]){
    const curb=createBox(THREE,.24,.22,132,curbs);
    curb.position.set(x,-.045,-29);world.add(curb);
  }

  const tileGeometry=new THREE.BoxGeometry(2.38,.1,4.15);
  const tileMaterials=[
    standard(THREE,0x5b607d),standard(THREE,0x565d79),
    standard(THREE,0x636784),standard(THREE,0x555a75)
  ];
  const laneMarks:MovingArt[]=[];
  const paving:MovingArt[]=[];
  for(let i=0;i<19;i++){
    for(let lane=0;lane<3;lane++){
      const tile=new THREE.Mesh(tileGeometry,tileMaterials[(i*7+lane)%4]);
      const z=-i*4.8;
      tile.position.set((lane-1)*2.42,-.008,z);
      world.add(tile);
      paving.push({mesh:tile,z,span:91.2});
    }
  }
  // Pale separations remain readable over detailed stonework.
  const markMaterial=basic(THREE,0xb7b0d0,.85);
  const markerGeo=new THREE.BoxGeometry(.07,.018,1.2);
  for(const x of [-1.2,1.2]){
    for(let i=0;i<28;i++){
      const mark=new THREE.Mesh(markerGeo,markMaterial);
      const z=-i*3.2;
      mark.position.set(x,.058,z);
      world.add(mark);
      laneMarks.push({mesh:mark,z,span:89.6});
    }
  }

  const scenery:MovingArt[]=[];
  for(const side of [-1,1]){
    for(let i=0;i<13;i++){
      const variant=i+(side===-1?3:9);
      // Three designs per prop are built once; only one is visible. When
      // the prop wraps behind the camera, switch its design to the new region.
      // This avoids scene replacement/pop-in right at the region threshold.
      const model=new THREE.Group();
      const styles=([0,1,2] as RegionIndex[]).map(region=>{
        const group=createRegionProp(THREE,variant,region);
        group.visible=region===0;model.add(group);return group;
      });
      const z=-i*8.6-(side+1)*3.5;
      model.position.set(side*(5.1+(i%3)*1.12),0,z);
      model.rotation.y=(i%5)*.3;
      world.add(model);
      scenery.push({mesh:model,z,span:111.8,styles});
    }
  }
  // Low, thin fog strip near the horizon, without postprocessing.
  const mist=new THREE.Mesh(new THREE.PlaneGeometry(100,11),
    new THREE.MeshBasicMaterial({
      color:0xa09bca,transparent:true,opacity:.075,
      depthWrite:false,side:THREE.DoubleSide
    }));
  mist.position.set(0,3,-64);world.add(mist);
  return {scenery,paving,laneMarks,moon,mist,
    region:0,elapsed:0,
    sky:world.background as T.Color,
    fogColor:(world.fog as T.FogExp2).color,
    moonLight:moonlight,rimLight:rimlight,
    tileMaterials,regionColors
  };
}

/** Geometry shared by purchased ghost skins; cosmetic equipment stays intact. */
export function createChaseGhost(THREE:ThreeApi,hero:HeroId,accessory:AccessoryId):GhostArt{
  const look=heroById(hero);
  const color=parseInt(look.body.slice(1),16);
  const outline=parseInt(look.outline.slice(1),16);
  const bodyMaterial=standard(THREE,color,{
    transparent:true,opacity:1,roughness:.75,flatShading:false,
    emissive:0x1b2b36,emissiveIntensity:.26
  });
  const model=new THREE.Group();
  const head=new THREE.Mesh(new THREE.SphereGeometry(.58,18,12),bodyMaterial);
  head.scale.y=1.09;head.position.y=1.17;model.add(head);
  const skirt=new THREE.Mesh(new THREE.CylinderGeometry(.49,.34,.61,11,1),bodyMaterial);
  skirt.position.y=.68;model.add(skirt);
  // Curling ghost tail rather than a visible cone.
  for(let i=0;i<4;i++){
    const tip=new THREE.Mesh(new THREE.ConeGeometry(.175,.32,6),bodyMaterial);
    tip.rotation.z=Math.PI;
    tip.position.set((i-1.5)*.23,.36+((i%2)*.045),.01);
    model.add(tip);
  }
  const eyes=basic(THREE,0x232440);
  for(const x of [-.225,.225]){
    const eye=new THREE.Mesh(new THREE.SphereGeometry(.099,9,7),eyes);
    eye.scale.z=.44;
    eye.position.set(x,1.23,.559);model.add(eye);
    const shine=new THREE.Mesh(new THREE.SphereGeometry(.03,7,5),basic(THREE,0xffffff));
    shine.position.set(x-.025,1.266,.611);model.add(shine);
  }
  const blush=basic(THREE,0xf3a5c4,.82);
  for(const x of [-.36,.36]){
    const cheek=new THREE.Mesh(new THREE.SphereGeometry(.085,8,5),blush);
    cheek.scale.set(1,.37,.35);cheek.position.set(x,1.02,.46);model.add(cheek);
  }
  const mouth=new THREE.Mesh(new THREE.SphereGeometry(.06,7,6),basic(THREE,outline));
  mouth.scale.set(.85,1,.45);mouth.position.set(0,.98,.565);model.add(mouth);
  const halo=new THREE.Mesh(new THREE.TorusGeometry(.56,.045,4,17),
    basic(THREE,0x7ee5f5,.58));
  halo.rotation.x=Math.PI/2;halo.position.y=.15;model.add(halo);

  if(accessory==="hat"){
    const hat=standard(THREE,0x7854af);
    const brim=new THREE.Mesh(new THREE.CylinderGeometry(.49,.49,.11,11),hat);
    brim.position.y=1.75;model.add(brim);
    const crown=new THREE.Mesh(new THREE.CylinderGeometry(.28,.37,.49,11),hat);
    crown.position.y=1.99;model.add(crown);
    const band=new THREE.Mesh(new THREE.CylinderGeometry(.376,.376,.075,11),
      standard(THREE,0xe2c591));band.position.y=1.78;model.add(band);
  }else if(accessory==="crown"){
    const gold=standard(THREE,0xffd375,{emissive:0x55340a,emissiveIntensity:.4});
    const band=new THREE.Mesh(new THREE.CylinderGeometry(.36,.37,.18,9),gold);
    band.position.y=1.78;model.add(band);
    for(let i=0;i<5;i++){
      const point=new THREE.Mesh(new THREE.ConeGeometry(.12,.3,5),gold);
      const angle=i*Math.PI*2/5;
      point.position.set(Math.cos(angle)*.27,1.99,Math.sin(angle)*.27);
      model.add(point);
    }
  }else if(accessory==="ribbon"){
    const bow=standard(THREE,0xf385a6);
    const center=new THREE.Mesh(new THREE.SphereGeometry(.11,8,6),bow);
    center.position.set(.39,1.53,.13);model.add(center);
    for(const x of [.22,.57]){
      const flap=new THREE.Mesh(new THREE.ConeGeometry(.23,.34,5),bow);
      flap.rotation.z=x<.4?-.9:.9;flap.position.set(x,1.54,.1);
      model.add(flap);
    }
  }
  return {model,bodyMaterial,color,halo};
}
export function createChaseHunter(THREE:ThreeApi):T.Group {
  const model=new THREE.Group();
  const coat=standard(THREE,0x4b405b);
  const seams=standard(THREE,0x8b7897);
  const face=standard(THREE,0xd8b393);
  const tunic=new THREE.Mesh(new THREE.CylinderGeometry(.34,.56,1.24,9),coat);
  tunic.position.y=.96;model.add(tunic);
  const neck=new THREE.Mesh(new THREE.SphereGeometry(.32,10,7),face);
  neck.position.y=1.78;model.add(neck);
  const collar=new THREE.Mesh(new THREE.ConeGeometry(.45,.38,7),seams);
  collar.position.y=1.48;model.add(collar);
  const rim=new THREE.Mesh(new THREE.CylinderGeometry(.61,.61,.075,10),coat);
  rim.position.y=2.06;model.add(rim);
  const hat=new THREE.Mesh(new THREE.CylinderGeometry(.34,.4,.4,9),coat);
  hat.position.y=2.29;model.add(hat);
  const band=new THREE.Mesh(new THREE.CylinderGeometry(.402,.402,.06,9),seams);
  band.position.y=2.15;model.add(band);
  for(const x of [-.25,.25]){
    const boot=createBox(THREE,.24,.62,.3,standard(THREE,0x2d293e));
    boot.position.set(x,.17,0);model.add(boot);
    const arm=new THREE.Mesh(new THREE.CylinderGeometry(.12,.14,.86,7),coat);
    arm.position.set(x*1.75,1.18,-.025);arm.rotation.z=-x*.42;model.add(arm);
  }
  const lantern=new THREE.Group();
  const bulb=new THREE.Mesh(new THREE.BoxGeometry(.28,.34,.25),
    basic(THREE,0xffe4a7));
  bulb.position.y=.03;lantern.add(bulb);
  const cover=new THREE.Mesh(new THREE.ConeGeometry(.27,.16,7),seams);
  cover.position.y=.27;lantern.add(cover);
  lantern.position.set(-.79,.93,-.14);model.add(lantern);
  const light=new THREE.PointLight(0xffce85,1.7,5);
  light.position.copy(lantern.position);model.add(light);
  model.scale.setScalar(.81);
  return model;
}
export function createChaseHazard(THREE:ThreeApi,kind:ChaseObstacleKind):T.Group {
  const group=new THREE.Group();
  if(kind==="stone"){
    const stone=createStone(THREE,2);
    stone.scale.setScalar(1.12);group.add(stone);
    const warning=createBox(THREE,.7,.08,.13,basic(THREE,0xd5d0f4,.85));
    warning.position.set(0,.22,.32);group.add(warning);
  }else if(kind==="arch"){
    const blocks=standard(THREE,0x636784);
    const rim=standard(THREE,0x989bb9);
    for(const x of [-.8,.8]){
      const column=createBox(THREE,.4,2.75,.6,blocks);
      column.position.set(x,1.35,0);group.add(column);
      for(const y of [.5,1.3,2.1]){
        const stoneCourse=createBox(THREE,.47,.1,.65,rim);
        stoneCourse.position.set(x,y,0);group.add(stoneCourse);
      }
    }
    const lintel=createBox(THREE,2.17,.52,.7,rim);
    lintel.position.y=2.91;group.add(lintel);
    const warning=createBox(THREE,1.4,2.44,.1,basic(THREE,0x9e87c1,.75));
    warning.position.y=1.24;group.add(warning);
    const sigil=new THREE.Mesh(new THREE.TorusGeometry(.3,.055,5,12),
      basic(THREE,0xe4ccff,.9));
    sigil.position.set(0,2.53,.43);group.add(sigil);
  }else if(kind==="ward"){
    const rune=basic(THREE,0xd98cff,.84);
    const field=new THREE.Mesh(new THREE.PlaneGeometry(1.95,2.6),
      new THREE.MeshBasicMaterial({
        color:0x9c67e9,side:THREE.DoubleSide,transparent:true,
        opacity:.36,depthWrite:false
      }));
    field.position.y=1.34;group.add(field);
    const outer=new THREE.Mesh(new THREE.TorusGeometry(.94,.065,5,20),rune);
    outer.position.y=1.37;outer.scale.y=1.29;group.add(outer);
    const inner=new THREE.Mesh(new THREE.TorusGeometry(.52,.045,5,14),rune);
    inner.position.y=1.37;inner.rotation.z=Math.PI/4;group.add(inner);
    for(const offset of [-.65,.65]){
      const vertical=createBox(THREE,.055,1.95,.08,rune);
      vertical.position.set(offset,1.34,0);group.add(vertical);
    }
  }else{
    const color=kind==="orb"?SPOOKY.glow:SPOOKY.essence;
    const core=new THREE.Mesh(new THREE.IcosahedronGeometry(.38,0),
      new THREE.MeshBasicMaterial({color}));
    core.position.y=1.18;group.add(core);
    const inner=new THREE.Mesh(new THREE.OctahedronGeometry(.21,0),
      basic(THREE,kind==="orb"?0xf4ffff:0xfff5c6,.92));
    inner.position.y=1.18;group.add(inner);
    const halo=new THREE.Mesh(new THREE.TorusGeometry(.55,.045,4,17),
      basic(THREE,color,.55));
    halo.position.y=1.18;group.add(halo);
  }
  return group;
}
/** Recycles decorative meshes only. Never touches hazard/collision logic. */
export function updateChaseEnvironment(
  art:ChaseEnvironment,dt:number,speed=24,distancePx=8000
):RegionIndex{
  const elapsed=Number.isFinite(dt)?Math.max(0,dt):0;
  art.elapsed+=elapsed;
  art.region=chaseRegionIndex(distancePx);
  const palette=art.regionColors[art.region];
  const blend=Math.min(1,elapsed*1.6);
  art.sky.lerp(palette.sky,blend);
  art.fogColor.lerp(palette.fog,blend);
  art.moonLight.color.lerp(palette.moonlight,blend);
  art.rimLight.color.lerp(palette.accent,blend);
  for(const mat of art.tileMaterials)mat.color.lerp(palette.stone,blend*.28);
  for(const prop of [...art.scenery,...art.paving,...art.laneMarks]){
    prop.mesh.position.z+=speed*elapsed;
    if(prop.mesh.position.z>12){
      prop.mesh.position.z-=prop.span;
      if(prop.styles){
        prop.styles.forEach((g,i)=>{g.visible=i===art.region;});
      }
    }
  }
  art.mist.position.x=Math.sin(art.elapsed*.24)*1.6;
  art.mist.position.y=3+Math.sin(art.elapsed*.51)*.22;
  return art.region;
}
