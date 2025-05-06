/*  life‑music.js  ─ strict / loose 判定切替版 (ES5)  */
autowatch = 1;
inlets  = 2;          // 0:bang, 1:matrixctrl list/cell
outlets = 10;         // 0–8:MIDI, 9:draw

/* --- const / state ------------------------------------ */
var COLS=64, ROWS=64, generation=0;
var grid=randomGrid(), manual=createZeroGrid(), used=createZeroGrid();

/* --- scales ------------------------------------------- */
var scales={
  major:[0,2,4,5,7,9,11],
  minor:[0,2,3,5,7,8,10],
  pentatonic:[0,3,5,7,10]
};

/* --- pattern list ------------------------------------- */
var patterns=[

/* outlet0 – Block  (Still‑life) */
{ name:"Block", root:36, vel:110, ch:1, len:100, int:1, jit:10, prob:0.3,
  isolated:true,
  coords:[[[0,0],[1,0],[0,1],[1,1]]] },

/* outlet1 – Blinker (oscillator) */
{ name:"Blinker", root:38, vel:100, ch:2, len:120, int:1, jit:15, prob:1.0,
  isolated:false,
  coords:[[[0,0],[1,0],[2,0]],[[1,-1],[1,0],[1,1]]] },

/* outlet2 – Beehive (Still) */
{ name:"Beehive", root:42, vel:95, ch:3, len:140, int:1, jit:20, prob:0.6,
  isolated:true,
  coords:[[[1,0],[2,0],[0,1],[3,1],[1,2],[2,2]]] },

/* outlet3 – Glider (spaceship) */
{ name:"Glider", root:65, vel:80, ch:4, len:180, int:2, jit:30, prob:0.8,
  isolated:false, scale:scales.minor,
  coords:[[[1,0],[2,1],[0,2],[1,2],[2,2]]] },

/* outlet4 – Loaf (Still) */
{ name:"Loaf", root:60, vel:75, ch:5, len:300, int:1, jit:25, prob:0.5,
  isolated:true, scale:scales.major,
  coords:[[[1,0],[2,0],[0,1],[3,1],[1,2],[3,2],[2,3]]] },

/* outlet5 – LWSS (spaceship, 4 phase) */
{ name:"LWSS", root:64, vel:90, ch:6, len:240, int:2, jit:40, prob:0.7,
  isolated:false, scale:scales.major,
  coords:[
   [[0,1],[1,1],[4,1],[0,2],[4,2],[4,3],[0,3],[1,3],[2,3],[3,3]],
   [[1,0],[4,0],[1,1],[5,1],[4,2],[5,2],[1,3],[2,3],[3,3],[4,3]],
   [[0,1],[0,2],[0,3],[1,0],[2,0],[3,0],[4,1],[4,2],[4,3],[3,4]],
   [[0,1],[1,4],[2,4],[3,4],[4,3],[4,2],[4,1],[3,0],[2,0],[1,0]]
  ] },

/* outlet6 – MWSS (spaceship, 4 phase) */
{ name:"MWSS", root:72, vel:95, ch:7, len:220, int:2, jit:50, prob:0.6,
  isolated:false, scale:scales.pentatonic,
  coords:[
   [[0,1],[1,1],[4,1],[0,2],[4,2],[4,3],[0,3],[1,3],[2,3],[3,3]],
   [[1,0],[4,0],[1,1],[5,1],[4,2],[5,2],[1,3],[2,3],[3,3],[4,3]],
   [[1,0],[2,0],[3,0],[0,1],[0,2],[0,3],[4,1],[4,2],[4,3],[1,4],[2,4],[3,4]],
   [[0,1],[0,4],[1,0],[2,0],[3,0],[4,1],[4,4],[3,4],[2,4],[1,4]]
  ] },

/* outlet7 – Beacon (oscillator, 多様化) */
{ name:"Beacon", root:60, vel:80, ch:8, len:60, int:2, jit:40, prob:0.75,
  isolated:false, scales:[scales.major,scales.minor,scales.pentatonic],
  coords:[
    [[0,0],[1,0],[0,1],[1,1]], [[2,2],[3,2],[2,3],[3,3]],
    [[0,0],[0,1],[1,0],[1,1]], [[2,2],[2,3],[3,2],[3,3]]
  ] },

/* outlet8 – Boat (Still) */
{ name:"Boat", root:84, vel:100, ch:9, len:400, int:3, jit:60, prob:0.4,
  isolated:true, scale:scales.minor,
  coords:[[[0,0],[1,0],[0,1],[2,1],[1,2]]] }
];

/* --- helpers ------------------------------------------- */
function createZeroGrid(){var g=[],y,x;for(y=0;y<ROWS;y++){g[y]=[];for(x=0;x<COLS;x++)g[y][x]=0;}return g;}
function randomGrid(){var g=[],y,x;for(y=0;y<ROWS;y++){g[y]=[];for(x=0;x<COLS;x++)g[y][x]=(Math.random()<0.15)?1:0;}return g;}
function valid(x,y){return x>=0&&x<COLS&&y>=0&&y<ROWS;}
function countN(y,x){var n=0,dy,dx,yy,xx;for(dy=-1;dy<=1;dy++)for(dx=-1;dx<=1;dx++)if(dx||dy){yy=(y+dy+ROWS)%ROWS;xx=(x+dx+COLS)%COLS;n+=grid[yy][xx];}return n;}

/* isolated match */
function coordOn(a,dx,dy){for(var k=0;k<a.length;k++)if(a[k][0]==dx&&a[k][1]==dy)return true;return false;}
function strictIsolatedMatch(a,x0,y0){
  var i,dx,dy,xx,yy,minX=99,minY=99,maxX=-99,maxY=-99;
  for(i=0;i<a.length;i++){
    dx=a[i][0];dy=a[i][1];xx=x0+dx;yy=y0+dy;
    if(!valid(xx,yy)||!grid[yy][xx])return false;
    if(dx<minX)minX=dx;if(dy<minY)minY=dy;if(dx>maxX)maxX=dx;if(dy>maxY)maxY=dy;
  }
  for(yy=y0+minY;yy<=y0+maxY;yy++)for(xx=x0+minX;xx<=x0+maxX;xx++)
    if(grid[yy][xx]&&!coordOn(a,xx-x0,yy-y0))return false;
  for(yy=y0+minY-1;yy<=y0+maxY+1;yy++)for(xx=x0+minX-1;xx<=x0+maxX+1;xx++){
    if(!valid(xx,yy))continue;
    if(xx>=x0+minX&&xx<=x0+maxX&&yy>=y0+minY&&yy<=y0+maxY)continue;
    if(grid[yy][xx])return false;
  }
  return true;
}
/* core match (外周無視) */
function strictCoreMatch(a,x0,y0){
  var i,xx,yy;
  for(i=0;i<a.length;i++){
    xx=x0+a[i][0];yy=y0+a[i][1];
    if(!valid(xx,yy)||!grid[yy][xx])return false;
  }
  return true;
}
function markUsed(a,x0,y0){for(var i=0;i<a.length;i++){var xx=x0+a[i][0],yy=y0+a[i][1];if(valid(xx,yy))used[yy][xx]=1;}}

/* --- playPattern --------------------------------------- */
function playPattern(pat,outIdx){
  if(pat.name==="Beacon"){
    var scs=pat.scales||[scales.major],sc=scs[Math.floor(Math.random()*scs.length)];
    var n=1+Math.floor(Math.random()*4),k;for(k=0;k<n;k++){
      var pitch=pat.root+sc[Math.floor(Math.random()*sc.length)]+12*Math.floor(Math.random()*2);
      var vel =50+Math.floor(Math.random()*78);
      var off =pat.len+Math.random()*pat.jit;
      outlet(outIdx,pitch,vel,pat.ch);
      new Task(function(p,o){outlet(o,p,0);},this,pitch,outIdx).schedule(off);
    }return;
  }
  var notes=[],i,pitch,vel,off,sc;
  if(pat.name==="Block"||pat.name==="Blinker"||pat.name==="Beehive") notes=[pat.root];
  else{ sc=pat.scale||scales.major; for(i=0;i<3;i++)notes[i]=pat.root+sc[Math.floor(Math.random()*sc.length)]; }
  for(i=0;i<notes.length;i++){
    pitch=notes[i];
    vel=pat.vel*(0.5+Math.random()*0.5);
    vel=Math.max(1,Math.min(127,Math.floor(vel)));
    outlet(outIdx,pitch,vel,pat.ch);
    off=pat.len+Math.random()*pat.jit;
    new Task(function(p,o){outlet(o,p,0);},this,pitch,outIdx).schedule(off);
  }
}

/* --- main tick ----------------------------------------- */
function bang(){
  var y,x;
  generation++;

  /* seed manual */
  for(y=0;y<ROWS;y++)for(x=0;x<COLS;x++) if(manual[y][x]) grid[y][x]=1;

  /* next generation */
  var next=createZeroGrid(),n;
  for(y=0;y<ROWS;y++)for(x=0;x<COLS;x++){ n=countN(y,x); next[y][x]=(n===3||(grid[y][x]&&n===2))?1:0; }
  for(y=0;y<ROWS;y++)for(x=0;x<COLS;x++) if(manual[y][x]) next[y][x]=1;
  grid=next;
  used=createZeroGrid();

  /* draw */
  outlet(9,"clear");
  for(y=0;y<ROWS;y++)for(x=0;x<COLS;x++) if(grid[y][x]) outlet(9,"set",x,y,1);

  /* detect & play */
  var pi,pat,yy,xx,ci;
  for(pi=0;pi<patterns.length;pi++){
    pat=patterns[pi];
    if(pat.prob&&Math.random()>pat.prob)continue;
    if(generation%pat.int)continue;
    var done=false;
    for(yy=0;yy<ROWS&&!done;yy++){
      for(xx=0;xx<COLS&&!done;xx++){
        if(!grid[yy][xx]||used[yy][xx])continue;
        var matchFn=pat.isolated?strictIsolatedMatch:strictCoreMatch;
        for(ci=0;ci<pat.coords.length&&!done;ci++){
          if(matchFn(pat.coords[ci],xx,yy)){ playPattern(pat,pi); markUsed(pat.coords[ci],xx,yy); done=true; }
        }
      }
    }
  }
}

/* --- click handler (toggle/momentary) ------------------- */
function handleClick(x,y,v){ if(valid(x,y)&&v){ manual[y][x]=1-manual[y][x]; grid[y][x]=manual[y][x]; outlet(9,"set",x,y,manual[y][x]); }}
function list(x,y,v){handleClick(x,y,v);}
function cell(x,y,v){handleClick(x,y,v);}

/* --- utilities ----------------------------------------- */
function clear(){ grid=createZeroGrid(); manual=createZeroGrid(); outlet(9,"clear"); }
function random(){ grid=randomGrid(); manual=createZeroGrid(); }

/* ------------------------------------------------------- */