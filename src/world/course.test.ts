import {describe,it,expect} from 'vitest';
import {BASE_SPEED,MAX_SPEED,CoursePlanner,FIRST_SEGMENT_START,
  difficulty,validateRoute,requiresIntangible,requiresPhysical,type CourseObject} from './course';

describe('difficulty progression',()=>{
  it('increases speed without exceeding the cap',()=>{
    expect(difficulty(0)).toEqual({tier:1,speed:160});
    expect(difficulty(9000).speed).toBe(MAX_SPEED);
    expect(difficulty(5000).tier).toBe(2);
    expect(difficulty(15000).tier).toBe(3);
    expect(difficulty(30000).tier).toBe(4);
    expect(difficulty(999999).speed).toBe(MAX_SPEED);
  });
});
describe('safe route validator',()=>{
  it('accepts an isolated mandatory phase followed by a recovery orb',()=>{
    const path:CourseObject[]=[{kind:'wall',x:400,width:26},{kind:'orb',x:620,width:16}];
    for(const speed of [BASE_SPEED,MAX_SPEED])
      expect(validateRoute(path,{fromX:98,energy:100,speed}).valid).toBe(true);
  });
  it('rejects a wall with no available energy and insufficient approach',()=>{
    const path:CourseObject[]=[{kind:'wall',x:140,width:26}];
    expect(validateRoute(path,{fromX:98,energy:0,speed:MAX_SPEED}).reason)
      .toContain('energia');
  });
  it('rejects impossible gaps and dangerously close state changes',()=>{
    expect(validateRoute([{kind:'gap',x:200,width:100}],
      {fromX:98,energy:100,speed:125}).reason).toContain('abismo');
    const path:CourseObject[]=[{kind:'wall',x:400,width:26},{kind:'ward',x:450,width:18}];
    expect(validateRoute(path,{fromX:98,energy:100,speed:230}).reason)
      .toContain('reação');
  });
  it('treats animated enemies as mode-dependent threats',()=>{
    for(const kind of ['bat','hunter','spikes'] as const){
      expect(requiresIntangible(kind)).toBe(true);
      expect(requiresPhysical(kind)).toBe(false);
    }
    expect(requiresPhysical('wraith')).toBe(true);
    expect(requiresIntangible('wraith')).toBe(false);
  });
  it('rejects impossible overlaps',()=>{
    const path:CourseObject[]=[{kind:'wall',x:200,width:26},{kind:'gap',x:220,width:45}];
    expect(validateRoute(path,{fromX:98,energy:100,speed:125}).valid).toBe(false);
  });
});
describe('procedural sequence',()=>{
  it('creates a validated introduction and respects tier gating',()=>{
    const p=new CoursePlanner(777);
    const intro=p.next({start:FIRST_SEGMENT_START,playerX:98,distance:0,energy:100,upcoming:[]});
    expect(intro.id).toBe('introducao');
    expect(intro.tier).toBe(1);
  });
  it('introduces bat, wraith, spikes and hunter before random mixes',()=>{
    const planner=new CoursePlanner(23);
    const all:CourseObject[]=[];
    let start=FIRST_SEGMENT_START;
    const ids:string[]=[];
    for(let i=0;i<5;i++){
      const next=planner.next({start,distance:start,playerX:98,energy:100,upcoming:all});
      ids.push(next.id);start+=next.length;all.push(...next.objects);
    }
    expect(ids).toEqual([
      "introducao","morcego-rasante","alma-perdida",
      "espinhos-no-caminho","cacador-do-cemiterio"
    ]);
  });
  it('every seeded course stays solvable on both endpoint speeds',()=>{
    for(let seed=1;seed<=120;seed++){
      const planner=new CoursePlanner(seed);
      const course:CourseObject[]=[];
      let start=FIRST_SEGMENT_START;
      for(let i=0;i<65;i++){
        const segment=planner.next({start,distance:start,playerX:98,energy:100,upcoming:course});
        course.push(...segment.objects);start+=segment.length;
        for(const speed of [BASE_SPEED,MAX_SPEED]){
          const result=validateRoute(course,{fromX:98,energy:100,speed});
          expect(result.valid, `seed=${seed} part=${i} speed=${speed} ${result.reason}`).toBe(true);
        }
      }
    }
  });
});
