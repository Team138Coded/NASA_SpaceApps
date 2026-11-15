import { ActId } from '../types/mission';
import { Mood } from './audio';

export type Vehicle = 'rover' | 'arm' | 'heli' | 'probe';
export type Skin = 'vali' | 'opportunity' | 'sojourner' | 'viking' | 'insight' | 'ingenuity' | 'pioneer';
export type Scene = 'cleanroom' | 'mars' | 'space';

export type ObjectiveKind =
  | 'scan' // rover: stop near x, hold E
  | 'reach' // rover: drive past x
  | 'dig' | 'observe' | 'pickup' | 'place' | 'deliver' | 'listen' // arm
  | 'climb' | 'land' // heli
  | 'gate' | 'transmit'; // probe

export interface Objective {
  kind: ObjectiveKind;
  x: number;
  y?: number; // probe gates / arm deck spots (relative to ground)
  label: string;
  verb: string;
  hold: number; // seconds of hold-E
  fact: string;
  ice?: boolean;
}

export interface LevelDef {
  id: ActId;
  code: string;
  name: string;
  place: string;
  year: string;
  vehicle: Vehicle;
  skin: Skin;
  scene: Scene;
  mood: Mood;
  length: number;
  seed: number;
  terrainAmp: number;
  terrainRough: number;
  gravity: number; // world px/s^2 equivalent
  maxSpeed: number;
  solar: boolean; // false = RTG, steady power
  drain: number;
  dustDevils?: number;
  stormFrom?: number; // x where the storm starts
  tether?: { x: number; range: number };
  asteroids?: [number, number]; // x range of the belt
  planet?: { x: number; y: number; r: number }; // gravity well (Jupiter)
  landerX?: number;
  hoppers?: { x: number; label: string }[];
  palette: {
    skyTop: string;
    skyBottom: string;
    far: string;
    mid: string;
    ground: string;
    groundDeep: string;
    rim: string;
    haze: string;
    sun: string;
  };
  par: number; // seconds for the time star
  controls: string[];
  objectives: Objective[];
}

const MARS = {
  skyTop: '#2a1a24',
  skyBottom: '#c98a5e',
  far: '#9a5a3e',
  mid: '#7a4029',
  ground: '#a2552f',
  groundDeep: '#3d1a10',
  rim: '#e6a273',
  haze: 'rgba(214,148,98,0.35)',
  sun: '#dfe8ff',
};

export const LEVELS: LevelDef[] = [
  {
    id: 'prologue',
    code: '00',
    name: 'High Bay Sentinel',
    place: 'JPL High Bay 1 · Pasadena',
    year: 'Tonight',
    vehicle: 'rover',
    skin: 'vali',
    scene: 'cleanroom',
    mood: 'lab',
    length: 1900,
    seed: 3,
    terrainAmp: 0,
    terrainRough: 0,
    gravity: 300,
    maxSpeed: 150,
    solar: false,
    drain: 0,
    palette: {
      skyTop: '#0a1220',
      skyBottom: '#16233a',
      far: '#1b2a44',
      mid: '#22344f',
      ground: '#c9d3e0',
      groundDeep: '#6b7a90',
      rim: '#f5f8fc',
      haze: 'rgba(120,170,230,0.10)',
      sun: '#ffffff',
    },
    par: 70,
    controls: ['A / D or ← → drive', 'Hold E to use instruments', 'Esc pause · M mute'],
    objectives: [
      { kind: 'reach', x: 420, label: 'Roll off the assembly cradle', verb: 'Drive', hold: 0, fact: 'VALI waits in High Bay 1 of JPL’s Spacecraft Assembly Facility, where Mars rovers have been built for decades.' },
      { kind: 'scan', x: 900, label: 'Sight Aldebaran through the window', verb: 'Lock Camera Mast', hold: 2, fact: 'Aldebaran is 65 light-years away. Pioneer 10 is coasting toward it right now.' },
      { kind: 'scan', x: 1250, label: 'Sight Lambda Aquilae', verb: 'Lock Camera Mast', hold: 2, fact: 'Lambda Aquilae is 125 light-years away — Pioneer 11 is headed its way.' },
      { kind: 'scan', x: 1650, label: 'Engage Overnight Standby at the DSN console', verb: 'Open archive receiver', hold: 2.5, fact: 'A faint, storm-dimmed carrier answers from Meridiani Planum. Opportunity is calling.' },
    ],
  },
  {
    id: 'mer',
    code: '01',
    name: 'Meridiani Marathon',
    place: 'Meridiani Planum · Mars',
    year: '2004 – 2018',
    vehicle: 'rover',
    skin: 'opportunity',
    scene: 'mars',
    mood: 'mars',
    length: 5200,
    seed: 11,
    terrainAmp: 55,
    terrainRough: 9,
    gravity: 140,
    maxSpeed: 130,
    solar: true,
    drain: 2.4,
    dustDevils: 5,
    stormFrom: 3600,
    palette: MARS,
    par: 120,
    controls: ['A / D or ← → drive', 'Hold E to use instruments', 'Drive into dust devils to clean your panels'],
    objectives: [
      { kind: 'scan', x: 900, label: 'Image hematite “blueberries” at Berry Bowl', verb: 'Pancam close-up', hold: 1.6, fact: 'Opportunity found iron-rich hematite spherules — “blueberries” — that formed in ancient groundwater.' },
      { kind: 'scan', x: 2100, label: 'Grind into El Capitan outcrop', verb: 'Run Rock Abrasion Tool', hold: 2.6, fact: 'The RAT ground 45 mm-wide holes into rock to expose fresh interiors for the spectrometers.' },
      { kind: 'scan', x: 3300, label: 'Survey the rim of Endeavour Crater', verb: 'Panorama', hold: 2, fact: 'Opportunity drove 45.16 km over 5,111 sols — the off-world driving record of its time.' },
      { kind: 'reach', x: 4900, label: 'Reach Perseverance Valley before the storm closes in', verb: 'Drive', hold: 0, fact: 'June 2018: the global dust storm pushed sky opacity to τ = 10.8. Opportunity’s last message: my battery is low and it’s getting dark.' },
    ],
  },
  {
    id: 'viking',
    code: '02',
    name: 'Chryse Assay',
    place: 'Chryse Planitia · Mars',
    year: '1976 – 1982',
    vehicle: 'arm',
    skin: 'viking',
    scene: 'mars',
    mood: 'mars',
    length: 1400,
    seed: 23,
    terrainAmp: 18,
    terrainRough: 5,
    gravity: 0,
    maxSpeed: 170,
    solar: false,
    drain: 0,
    landerX: 300,
    hoppers: [
      { x: 330, label: 'Biology hopper' },
    ],
    palette: { ...MARS, skyBottom: '#d39a6e', ground: '#ae6438' },
    par: 80,
    controls: ['W A S D or arrows move the sampler arm', 'Hold E to scoop / deliver', 'Esc pause · M mute'],
    objectives: [
      { kind: 'dig', x: 520, label: 'Scoop soil at “Sandy Flats”', verb: 'Scoop', hold: 1.8, fact: 'Viking 1 landed July 20, 1976 at Chryse Planitia — the first fully successful Mars landing.' },
      { kind: 'deliver', x: 330, label: 'Feed the Labeled Release experiment', verb: 'Deliver sample', hold: 1, fact: 'Labeled Release saw rapid gas release when nutrient touched the soil — a result still debated.' },
      { kind: 'dig', x: 620, label: 'Scoop beneath the rock “Badger”', verb: 'Scoop', hold: 2.2, fact: 'Digging under rocks found soil shielded from UV — but the GCMS found no organics.' },
      { kind: 'deliver', x: 330, label: 'Feed the GCMS oven', verb: 'Deliver sample', hold: 1, fact: 'Reactive perchlorates, found decades later by Phoenix, likely explain Viking’s puzzling chemistry.' },
    ],
  },
  {
    id: 'sojourner',
    code: '03',
    name: 'Ares Vallis Tether',
    place: 'Ares Vallis · Mars',
    year: '1997',
    vehicle: 'rover',
    skin: 'sojourner',
    scene: 'mars',
    mood: 'mars',
    length: 1900,
    seed: 37,
    terrainAmp: 22,
    terrainRough: 7,
    gravity: 140,
    maxSpeed: 70,
    solar: true,
    drain: 2.2,
    tether: { x: 200, range: 1300 },
    landerX: 200,
    palette: { ...MARS, skyBottom: '#c69070', far: '#a2664a' },
    par: 90,
    controls: ['A / D or ← → drive', 'Hold E to run APXS', 'Stay inside the lander’s radio range'],
    objectives: [
      { kind: 'scan', x: 560, label: 'APXS on “Barnacle Bill”', verb: 'Deploy APXS', hold: 2.2, fact: 'Sojourner, 10.6 kg, was the first wheeled vehicle on another planet (July 4, 1997).' },
      { kind: 'scan', x: 900, label: 'APXS on “Yogi”', verb: 'Deploy APXS', hold: 2.2, fact: 'Yogi’s chemistry and rounded pebbles pointed to catastrophic ancient floods in Ares Vallis.' },
      { kind: 'scan', x: 1320, label: 'APXS on “Scooby-Doo”', verb: 'Deploy APXS', hold: 2.2, fact: 'Sojourner relayed everything through the Pathfinder lander — it never ventured more than ~12 m away.' },
    ],
  },
  {
    id: 'phoenix_insight',
    code: '04',
    name: 'Ice & Quakes',
    place: 'Vastitas Borealis & Elysium · Mars',
    year: '2008 · 2018 – 2022',
    vehicle: 'arm',
    skin: 'insight',
    scene: 'mars',
    mood: 'mars',
    length: 1400,
    seed: 41,
    terrainAmp: 12,
    terrainRough: 4,
    gravity: 0,
    maxSpeed: 170,
    solar: false,
    drain: 0,
    landerX: 300,
    hoppers: [{ x: 300, label: 'SEIS on deck' }],
    palette: { ...MARS, skyTop: '#1c1a2c', skyBottom: '#b99a86', ground: '#9a6a4c', far: '#7d6152', mid: '#6b4a38', rim: '#e8c7a9' },
    par: 100,
    controls: ['W A S D or arrows move the robotic arm', 'Hold E to dig, lift and place', 'Esc pause · M mute'],
    objectives: [
      { kind: 'dig', x: 560, label: 'Phoenix: scrape the “Dodo-Goldilocks” trench', verb: 'Scrape', hold: 2.6, ice: true, fact: 'Phoenix landed at 68.22°N in 2008 and exposed bright water ice just centimetres down.' },
      { kind: 'observe', x: 560, label: 'Watch the ice sublimate', verb: 'Image trench', hold: 2.5, ice: true, fact: 'Within four sols, chunks of ice vanished straight into vapour in 0.6% Earth pressure.' },
      { kind: 'pickup', x: 290, y: -70, label: 'InSight: lift SEIS off the deck', verb: 'Grapple', hold: 1.2, fact: 'InSight’s arm placed SEIS directly on Mars — the first seismometer ever set on another planet’s ground.' },
      { kind: 'place', x: 470, label: 'Set SEIS on level ground', verb: 'Lower SEIS', hold: 1.4, fact: 'SEIS was so sensitive it could feel motions smaller than a hydrogen atom.' },
      { kind: 'listen', x: 470, label: 'Record the marsquake', verb: 'Record', hold: 3, fact: 'InSight logged 1,319 marsquakes and revealed a ~1,830 km liquid iron core.' },
    ],
  },
  {
    id: 'ingenuity',
    code: '05',
    name: 'Seventy-Two Flights',
    place: 'Jezero Crater · Mars',
    year: '2021 – 2024',
    vehicle: 'heli',
    skin: 'ingenuity',
    scene: 'mars',
    mood: 'mars',
    length: 3400,
    seed: 53,
    terrainAmp: 70,
    terrainRough: 6,
    gravity: 150,
    maxSpeed: 220,
    solar: true,
    drain: 4.5,
    palette: { ...MARS, skyTop: '#241a26', skyBottom: '#d7a07a', far: '#a8664a', ground: '#b56a40' },
    par: 110,
    controls: ['W / ↑ / Space lift', 'A / D or ← → tilt and fly', 'Land softly on each marked airfield'],
    objectives: [
      { kind: 'climb', x: 260, label: 'Flight 1: climb to 3 m and hover', verb: 'Climb', hold: 0, fact: 'April 19, 2021: the first powered, controlled flight on another planet.' },
      { kind: 'land', x: 260, label: 'Touch down on Wright Brothers Field', verb: 'Land', hold: 1, fact: 'Ingenuity’s blades spun at 2,537 RPM to bite air 1% as dense as Earth’s.' },
      { kind: 'land', x: 1500, label: 'Scout ahead: land at Airfield B', verb: 'Land', hold: 1, fact: 'A tech demo planned for five flights, it became Perseverance’s aerial scout.' },
      { kind: 'land', x: 3000, label: 'Flight 72: land at Valinor Hills — gently', verb: 'Land', hold: 1.2, fact: 'Flight 72 (Jan 18, 2024) damaged a rotor over featureless sand. 72 flights, 128.8 minutes aloft.' },
    ],
  },
  {
    id: 'pioneer',
    code: '06',
    name: 'Into the Dark',
    place: 'Asteroid Belt → Jupiter → Interstellar',
    year: '1972 – 2003',
    vehicle: 'probe',
    skin: 'pioneer',
    scene: 'space',
    mood: 'space',
    length: 6200,
    seed: 67,
    terrainAmp: 0,
    terrainRough: 0,
    gravity: 0,
    maxSpeed: 320,
    solar: false,
    drain: 0,
    asteroids: [700, 2600],
    planet: { x: 3900, y: 260, r: 230 },
    palette: {
      skyTop: '#03040a',
      skyBottom: '#0b1020',
      far: '#1a2240',
      mid: '#2a2050',
      ground: '#000',
      groundDeep: '#000',
      rim: '#fff',
      haze: 'rgba(80,120,200,0.06)',
      sun: '#fff4d6',
    },
    par: 80,
    controls: ['W A S D or arrows steer', 'Dodge the asteroid belt', 'Hold E at the end to send the last signal'],
    objectives: [
      { kind: 'gate', x: 2700, y: 0, label: 'Cross the asteroid belt', verb: 'Fly through', hold: 0, fact: 'Pioneer 10 was the first spacecraft to cross the asteroid belt (1972).' },
      { kind: 'gate', x: 3900, y: -60, label: 'Slingshot past Jupiter', verb: 'Fly through', hold: 0, fact: 'December 1973: the first close-up of Jupiter, and a gravity assist out of the Solar System.' },
      { kind: 'transmit', x: 5900, y: 0, label: 'Send the last signal home', verb: 'Transmit', hold: 3, fact: 'Last signal: January 23, 2003, from 12.23 billion km. Pioneer 10 still carries a plaque for whoever finds it.' },
    ],
  },
];

export const levelById = (id: string) => LEVELS.find((l) => l.id === id) ?? LEVELS[0];
