import {ramp} from './drawing.mjs';
// Each object is given a complete short: establishment, change, consequence.
// Camera, geometry, music and editorial subtitles share this score.
export const LIFE_SHOTS=[
 {id:0,name:'联系',start:141,end:162,p:[146,151],q:[154,158],scale:2.7,pitch:.23,yaw:-.11,bpm:88,key:57,voice:'felt',color:'#665342',line:[154,160,'屏幕越来越亮，回音越来越少。']},
 {id:1,name:'读书与工作',start:162,end:180,p:[166,169],q:[173,176],scale:2.9,pitch:.26,yaw:.10,bpm:100,key:57,voice:'pluck',color:'#3d504e',line:[173,178.5,'曾经翻过的书，变成熬过的夜。']},
 {id:2,name:'住处',start:180,end:198,p:[184,187],q:[191,194],scale:2.6,pitch:.17,yaw:-.17,bpm:80,key:53,voice:'felt',color:'#554d42',line:[191,196.5,'住得越来越高，窗外越来越远。']},
 {id:3,name:'通勤',start:198,end:216,p:[202,205],q:[209,212],scale:2.8,pitch:.29,yaw:.14,bpm:112,key:52,voice:'marimba',color:'#304954',line:[209,214.5,'换了更快的车，仍走相似的路。']},
 {id:4,name:'相伴',start:216,end:239,p:[221,225],q:[231,235],scale:3.05,pitch:.37,yaw:-.09,bpm:76,key:50,voice:'felt',color:'#4c5043',line:[231,237.5,'另一只杯子，慢慢凉了。']},
 {id:5,name:'成长',start:239,end:259,p:[244,248],q:[252,256],scale:2.75,pitch:.20,yaw:.08,bpm:84,key:53,voice:'pluck',color:'#445449',line:[251.5,257.5,'刻痕还在，人已不住在这里。']},
 {id:6,name:'身体',start:259,end:279,p:[264,268],q:[272,276],scale:2.95,pitch:.34,yaw:-.08,bpm:68,key:50,voice:'felt',color:'#354b4a',line:[271.5,277.5,'身体记住了，所有走过的路。']},
 {id:7,name:'生日',start:279,end:297,p:[283,286],q:[290,294],scale:3.1,pitch:.36,yaw:.09,bpm:72,key:57,voice:'marimba',color:'#594539',line:[289.5,295.5,'后来，连生日也变得安静。']},
 {id:8,name:'远行',start:297,end:315,p:[301,305],q:[309,312],scale:2.8,pitch:.22,yaw:-.15,bpm:64,key:52,voice:'felt',color:'#354753',line:[308.5,314,'行李已经收好，去处还没有。']}
];
export const phaseFor=(id,t)=>{const s=LIFE_SHOTS[id];return {p:ramp(...s.p,t),q:ramp(...s.q,t)};};
export const RELEASE_START=315,ENDING_START=326;
