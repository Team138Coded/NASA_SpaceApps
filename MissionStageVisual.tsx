import React from 'react';
import { MissionDossier } from '../types/mission';
import { EnvState } from './MarsEnvSim';

export interface StageVisualProps {
  mission: MissionDossier;
  env: EnvState;
  handoffActive: boolean;
  // Prologue
  mastAz: number;
  mastEl: number;
  lockedStars: { aldebaran: boolean; aquilae: boolean };
  // Viking
  boomReach: number;
  scoopDepth: number;
  hasSample: boolean;
  lrComplete: boolean;
  gcmsComplete: boolean;
  faultInjected: boolean;
  // Sojourner
  roverPos: { xNorm: number; y: number; angle: number };
  apxsProgress: number;
  apxsDone: boolean;
  // MER
  merSol: number;
  dustPanelLoad: number;
  dustDevilAnim: number;
  ratDone: boolean;
  activeMerSite: 'opportunity' | 'spirit';
  // Phoenix / InSight
  act4Mode: 'phoenix' | 'insight';
  trenchDepthCm: number;
  windFilter: number;
  // Ingenuity
  heaterOn: boolean;
  rotorRpm: number;
  flightNumber: 1 | 49 | 72;
  flightStatus: 'grounded' | 'flying' | 'landed' | 'strike';
  flightProgress: number;
  // Pioneer
  dsnFreqOffset: number;
  dsnGain: number;
  signalLocked: boolean;
  plaqueRegion: 'hydrogen' | 'pulsars' | 'humans' | 'trajectory';
  onSelectPlaqueRegion: (r: 'hydrogen' | 'pulsars' | 'humans' | 'trajectory') => void;
}

const HorizonRadioPing: React.FC<{ x: number; y: number; label: string }> = ({
  x,
  y,
  label,
}) => (
  <g transform={`translate(${x}, ${y})`}>
    <circle r="14" fill="none" stroke="#38BDF8" strokeWidth="1.5" opacity="0.85" />
    <circle r="28" fill="none" stroke="#38BDF8" strokeWidth="1.2" strokeDasharray="4 4" opacity="0.55" />
    <circle r="44" fill="none" stroke="#38BDF8" strokeWidth="1" strokeDasharray="3 5" opacity="0.35" />
    <line x1="0" y1="0" x2="155" y2="-45" stroke="#38BDF8" strokeWidth="1.5" strokeDasharray="5 4" />
    <rect x="60" y="-66" width="225" height="22" rx="3" fill="#070B14" stroke="#38BDF8" strokeWidth="1" />
    <text x="70" y="-51" fill="#7DD3FC" fontSize="10" fontFamily="IBM Plex Mono, monospace">
      PING: {label}
    </text>
  </g>
);

export const MissionStageVisual: React.FC<StageVisualProps> = (props) => {
  const { mission, env, handoffActive } = props;

  if (mission.id === 'prologue' || mission.id === 'epilogue') {
    const isDawn = mission.id === 'epilogue';
    const aimX = 440 + (props.mastAz / 55) * 320;
    const aimY = 235 - (props.mastEl / 55) * 195;
    const aldX = 440 + (-24 / 55) * 320;
    const aldY = 235 - (36 / 55) * 195;
    const aquX = 440 + (26 / 55) * 320;
    const aquY = 235 - (28 / 55) * 195;
    const mastHeadX = 440 + (props.mastAz / 55) * 18;
    const mastHeadY = 212 - (props.mastEl / 55) * 10;

    return (
      <svg
        viewBox="0 0 880 390"
        className="w-full h-auto block bg-[#060A14]"
        role="img"
        aria-label="VALI inside JPL High Bay 1 cleanroom looking through the glass at Aldebaran and Lambda Aquilae"
      >
        <defs>
          <linearGradient id="cleanroomSky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={isDawn ? '#152A45' : '#03060D'} />
            <stop offset="65%" stopColor={isDawn ? '#385878' : '#0B1528'} />
            <stop offset="100%" stopColor={isDawn ? '#E07A5F' : '#13203A'} />
          </linearGradient>
          <linearGradient id="sunbeam" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={isDawn ? '#FDBA74' : '#38BDF8'} stopOpacity="0.16" />
            <stop offset="100%" stopColor={isDawn ? '#FDBA74' : '#38BDF8'} stopOpacity="0" />
          </linearGradient>
        </defs>

        <rect x="0" y="0" width="880" height="288" fill="url(#cleanroomSky)" />
        <path
          d="M0 288 L0 245 Q95 212 190 236 T380 226 T590 240 T760 218 L880 242 L880 288 Z"
          fill={isDawn ? '#1E293B' : '#091120'}
        />

        {[
          [85, 62], [142, 112], [218, 55], [352, 86], [420, 54],
          [510, 78], [670, 64], [748, 108], [815, 72], [170, 165], [705, 158],
        ].map(([sx, sy], idx) => (
          <circle
            key={idx}
            cx={sx}
            cy={sy}
            r={idx % 3 === 0 ? 1.8 : 1.1}
            fill="#E2E8F0"
            opacity={isDawn ? 0.35 : 0.75}
          />
        ))}

        {/* Aldebaran */}
        <circle
          cx={aldX}
          cy={aldY + 25}
          r={props.lockedStars.aldebaran || isDawn ? 6 : 4}
          fill="#FDBA74"
        />
        <circle
          cx={aldX}
          cy={aldY + 25}
          r="15"
          fill="none"
          stroke={props.lockedStars.aldebaran || isDawn ? '#34D399' : '#FDBA74'}
          strokeWidth="1.2"
          strokeDasharray="3 3"
        />
        <text x={aldX + 18} y={aldY + 29} fill="#FDBA74" fontSize="11" fontFamily="IBM Plex Mono, monospace">
          Aldebaran (65 ly)
        </text>

        {/* Lambda Aquilae */}
        <circle
          cx={aquX}
          cy={aquY + 25}
          r={props.lockedStars.aquilae || isDawn ? 6 : 4}
          fill="#93C5FD"
        />
        <circle
          cx={aquX}
          cy={aquY + 25}
          r="15"
          fill="none"
          stroke={props.lockedStars.aquilae || isDawn ? '#34D399' : '#93C5FD'}
          strokeWidth="1.2"
          strokeDasharray="3 3"
        />
        <text x={aquX + 18} y={aquY + 29} fill="#93C5FD" fontSize="11" fontFamily="IBM Plex Mono, monospace">
          Lambda Aquilae (125 ly)
        </text>

        <rect x="0" y="0" width="880" height="16" fill="#0F172A" />
        {[220, 440, 660].map((mx) => (
          <rect key={mx} x={mx - 3} y="0" width="6" height="288" fill="#1E293B" opacity="0.8" />
        ))}
        <polygon points="120,16 320,288 620,288 380,16" fill="url(#sunbeam)" />

        <rect x="0" y="288" width="880" height="102" fill="#0A101E" />
        <line x1="0" y1="288" x2="880" y2="288" stroke="#334155" strokeWidth="1.5" />

        {!isDawn && (
          <g>
            <line
              x1={mastHeadX}
              y1={mastHeadY + 35}
              x2={aimX}
              y2={aimY + 25}
              stroke="#38BDF8"
              strokeWidth="1.2"
              strokeDasharray="4 4"
              opacity="0.65"
            />
            <circle cx={aimX} cy={aimY + 25} r="17" fill="none" stroke="#38BDF8" strokeWidth="1.5" />
            <line x1={aimX - 24} y1={aimY + 25} x2={aimX + 24} y2={aimY + 25} stroke="#38BDF8" strokeWidth="1" />
            <line x1={aimX} y1={aimY + 1} x2={aimX} y2={aimY + 49} stroke="#38BDF8" strokeWidth="1" />
          </g>
        )}

        {/* Detailed Vector VALI Rover */}
        <g transform="translate(440, 304)">
          <ellipse cx="0" cy="40" rx="84" ry="8" fill="#04070E" opacity="0.7" />
          <path d="M-54,10 L-32,-8 L0,6 L34,-8 L56,10" fill="none" stroke="#94A3B8" strokeWidth="4" strokeLinejoin="round" />
          {[-56, 0, 56].map((wx) => (
            <g key={wx} transform={`translate(${wx}, 20)`}>
              <circle r="15" fill="#1E293B" stroke="#64748B" strokeWidth="3" />
              <circle r="6" fill="#38BDF8" opacity="0.75" />
            </g>
          ))}
          <rect x="-46" y="-26" width="92" height="32" rx="4" fill="#1E293B" stroke="#38BDF8" strokeWidth="1.5" />
          <rect x="-38" y="-20" width="76" height="18" rx="2" fill="#D97706" opacity="0.32" />
          <rect x="-74" y="-22" width="26" height="20" rx="2" fill="#334155" stroke="#E07A5F" strokeWidth="1.2" />
          <line x1="12" y1="-26" x2={mastHeadX - 440} y2={mastHeadY - 268} stroke="#CBD5E1" strokeWidth="5" />
          <g transform={`translate(${mastHeadX - 440}, ${mastHeadY - 268})`}>
            <rect x="-18" y="-11" width="36" height="20" rx="3" fill="#0F172A" stroke="#38BDF8" strokeWidth="1.8" />
            <circle cx="-7" cy="-1" r="5" fill="#020617" stroke="#38BDF8" strokeWidth="1.4" />
            <circle cx="7" cy="-1" r="5" fill="#020617" stroke="#38BDF8" strokeWidth="1.4" />
            <circle cx="-6" cy="-2" r="2" fill="#7DD3FC" />
            <circle cx="8" cy="-2" r="2" fill="#7DD3FC" />
          </g>
        </g>

        {handoffActive && !isDawn && (
          <HorizonRadioPing x={452} y={248} label={mission.discoveryHandoff.targetCoords} />
        )}

        <text x="20" y="374" fill="#94A3B8" fontSize="11" fontFamily="IBM Plex Mono, monospace">
          {isDawn
            ? 'JPL HIGH BAY 1 · DAWN SUNLIGHT · VALI CALIBRATED & FLIGHT READY'
            : `CAMERA MAST AIM: AZIMUTH ${props.mastAz}° · ELEVATION ${props.mastEl}°`}
        </text>
      </svg>
    );
  }

  if (mission.id === 'mer') {
    const stormRatio = Math.min(1, env.dustTau / 10.8);
    const sunOpacity = Math.max(0.06, 1 - stormRatio * 0.92);
    const skyTop = `rgb(${Math.round(98 * (1 - stormRatio * 0.72))}, ${Math.round(56 * (1 - stormRatio * 0.78))}, ${Math.round(46 * (1 - stormRatio * 0.8))})`;
    const skyBot = `rgb(${Math.round(176 * (1 - stormRatio * 0.65))}, ${Math.round(98 * (1 - stormRatio * 0.72))}, ${Math.round(70 * (1 - stormRatio * 0.78))})`;

    return (
      <svg
        viewBox="0 0 880 390"
        className="w-full h-auto block bg-[#1B1110]"
        role="img"
        aria-label="Spirit and Opportunity rover in Meridiani Planum with solar wings, dust devil wind gust, and Rock Grinder"
      >
        <defs>
          <linearGradient id="merSky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={skyTop} />
            <stop offset="100%" stopColor={skyBot} />
          </linearGradient>
          <linearGradient id="marsSunbeam" x1="1" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FDE68A" stopOpacity={sunOpacity * 0.35} />
            <stop offset="100%" stopColor="#FDE68A" stopOpacity="0" />
          </linearGradient>
        </defs>

        <rect x="0" y="0" width="880" height="278" fill="url(#merSky)" />
        {/* Sunbeams brightening the Martian sky */}
        <polygon points="710,82 220,278 480,278" fill="url(#marsSunbeam)" />
        <circle cx="710" cy="84" r="28" fill="#FDE68A" opacity={sunOpacity} />

        {/* Layered Martian Ridges */}
        <path d="M0 278 L0 236 Q180 208 360 232 T740 218 L880 238 L880 278 Z" fill="#5A3125" />
        <rect x="0" y="278" width="880" height="112" fill="#6E3B2C" />

        {/* Detailed MER Rover */}
        <g transform="translate(290, 272)">
          <ellipse cx="0" cy="40" rx="110" ry="9" fill="#180D0B" opacity="0.65" />
          {[-68, 0, 68].map((wx) => (
            <g key={wx} transform={`translate(${wx}, 24)`}>
              <circle r="14" fill="#1E293B" stroke="#94A3B8" strokeWidth="2.5" />
              <circle r="5" fill="#38BDF8" opacity="0.7" />
            </g>
          ))}
          <polygon points="-98,-8 -38,-22 38,-22 98,-8 72,6 -72,6" fill="#0F172A" stroke="#38BDF8" strokeWidth="1.6" />
          <polygon
            points="-94,-8 -36,-20 36,-20 94,-8 68,5 -68,5"
            fill="#C26A4A"
            opacity={props.dustPanelLoad * 0.88}
          />
          {/* PanCam turns toward horizon when detecting Viking 1 */}
          <line x1="28" y1="-20" x2="28" y2="-76" stroke="#CBD5E1" strokeWidth="4.5" />
          <g transform={`translate(28, -84) rotate(${handoffActive ? -14 : 0})`}>
            <rect x="-18" y="-8" width="38" height="16" rx="2" fill="#0F172A" stroke="#38BDF8" strokeWidth="1.5" />
            <circle cx="-6" cy="0" r="3.5" fill="#38BDF8" />
            <circle cx="8" cy="0" r="3.5" fill="#38BDF8" />
          </g>

          {/* Robotic Arm & RAT Grinder */}
          <path d="M 74 -4 L 145 -22 L 222 -6" fill="none" stroke="#CBD5E1" strokeWidth="4" strokeLinejoin="round" />
          <circle cx="226" cy="-4" r="10" fill={props.ratDone ? '#E07A5F' : '#38BDF8'} stroke="#0F172A" strokeWidth="2" />
        </g>

        {/* Swirling Martian Wind Lines / Dust Devil */}
        {props.dustDevilAnim > 0 && (
          <g transform={`translate(${210 + (18 - props.dustDevilAnim) * 14}, 230)`} opacity="0.9">
            {[0, 1, 2, 3, 4].map((ring) => (
              <ellipse
                key={ring}
                cx="0"
                cy={-ring * 26}
                rx={16 + ring * 10}
                ry="6"
                fill="none"
                stroke="#FDE68A"
                strokeWidth="2.2"
              />
            ))}
            <path d="M -80 -20 Q 0 -34 90 -18" fill="none" stroke="#BAE6FD" strokeWidth="1.6" strokeDasharray="8 6" />
            <path d="M -95 4 Q 0 -8 105 6" fill="none" stroke="#BAE6FD" strokeWidth="1.6" strokeDasharray="10 5" />
          </g>
        )}

        {/* Rock Outcrop + Sparkling Blue Hematite Blueberries or Silica */}
        <g transform="translate(615, 290)">
          <path d="M -85 18 Q -70 -46 0 -52 T 92 18 Z" fill="#4E2F26" stroke="#784B3E" strokeWidth="1.5" />
          {props.ratDone && props.activeMerSite === 'opportunity' && (
            <g>
              <circle cx="-18" cy="-16" r="20" fill="#36201A" stroke="#E07A5F" strokeWidth="1.8" />
              {[[-26, -20], [-14, -26], [-8, -11], [-21, -7], [-15, -16]].map(([bx, by], i) => (
                <g key={i}>
                  <circle cx={bx} cy={by} r="5.5" fill="#38BDF8" opacity="0.35" />
                  <circle cx={bx} cy={by} r="3.6" fill="#93C5FD" />
                </g>
              ))}
              <text x="-60" y="-60" fill="#93C5FD" fontSize="11" fontFamily="IBM Plex Mono, monospace">
                Sparkling Hematite "Blueberries" (Ancient Water!)
              </text>
            </g>
          )}
          {props.ratDone && props.activeMerSite === 'spirit' && (
            <g>
              <ellipse cx="-14" cy="-14" rx="28" ry="12" fill="#F1F5F9" />
              <text x="-65" y="-60" fill="#F1F5F9" fontSize="11" fontFamily="IBM Plex Mono, monospace">
                90% Pure White Silica (Ancient Hot Spring!)
              </text>
            </g>
          )}
        </g>

        {handoffActive && (
          <HorizonRadioPing x={318} y={188} label={mission.discoveryHandoff.targetCoords} />
        )}

        <text x="20" y="372" fill="#E2E8F0" fontSize="11.5" fontFamily="IBM Plex Mono, monospace">
          SOL {props.merSol} / 5,111 · PANEL DUST {(props.dustPanelLoad * 100).toFixed(0)}% · SKY HAZE τ = {env.dustTau.toFixed(2)}
        </text>
      </svg>
    );
  }

  if (mission.id === 'viking') {
    const scoopTipX = 248 + (props.boomReach / 100) * 185;
    const scoopTipY = 235 + (props.scoopDepth / 100) * 86;

    return (
      <svg
        viewBox="0 0 880 390"
        className="w-full h-auto block bg-[#1A1112]"
        role="img"
        aria-label="Viking 1 Lander on Chryse Planitia operating its Soil Scoop Arm and Biology Ovens"
      >
        <defs>
          <linearGradient id="vikingSky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1E1418" />
            <stop offset="65%" stopColor="#5C3228" />
            <stop offset="100%" stopColor="#8F4F3C" />
          </linearGradient>
        </defs>

        <rect x="0" y="0" width="540" height="272" fill="url(#vikingSky)" />
        <path d="M0 272 L0 230 L90 216 L190 234 L320 208 L435 228 L540 214 L540 272 Z" fill="#4B2820" />
        <rect x="0" y="272" width="540" height="118" fill="#7A3E2E" />
        <rect x="0" y="324" width="540" height="66" fill="#52261C" />
        {props.scoopDepth > 40 && (
          <path
            d={`M ${scoopTipX - 24} 272 Q ${scoopTipX} ${272 + (props.scoopDepth - 40) * 0.75} ${scoopTipX + 24} 272 Z`}
            fill="#2E140E"
          />
        )}

        <g transform="translate(150, 217)">
          <line x1="-42" y1="16" x2="-74" y2="72" stroke="#CBD5E1" strokeWidth="4.5" />
          <ellipse cx="-74" cy="74" rx="14" ry="4" fill="#94A3B8" />
          <line x1="0" y1="18" x2="0" y2="78" stroke="#CBD5E1" strokeWidth="4.5" />
          <ellipse cx="0" cy="80" rx="14" ry="4" fill="#94A3B8" />
          <line x1="42" y1="16" x2="74" y2="72" stroke="#CBD5E1" strokeWidth="4.5" />
          <ellipse cx="74" cy="74" rx="14" ry="4" fill="#94A3B8" />

          <polygon points="-56,16 -46,-12 46,-12 56,16" fill="#1E293B" stroke="#38BDF8" strokeWidth="1.5" />
          <rect x="-64" y="-10" width="20" height="22" rx="3" fill="#E2E8F0" stroke="#E07A5F" strokeWidth="1.4" />
          <rect x="44" y="-10" width="20" height="22" rx="3" fill="#E2E8F0" stroke="#E07A5F" strokeWidth="1.4" />
          <rect x="-26" y="-8" width="52" height="18" rx="2" fill="#0F172A" stroke="#38BDF8" strokeWidth="1" />
          <text x="-20" y="5" fill="#38BDF8" fontSize="9" fontFamily="IBM Plex Mono, monospace">
            LR / GCMS
          </text>

          <g transform="translate(-14, -14)">
            <line x1="0" y1="0" x2="0" y2="-28" stroke="#CBD5E1" strokeWidth="3.5" />
            <g transform={`translate(0, -32) rotate(${props.faultInjected ? -68 : -18})`}>
              <path d="M -26 0 Q 0 -18 26 0" fill="none" stroke={props.faultInjected ? '#F43F5E' : '#F8FAFC'} strokeWidth="4" />
              <line x1="0" y1="-8" x2="0" y2="-22" stroke={props.faultInjected ? '#F43F5E' : '#38BDF8'} strokeWidth="2" />
            </g>
          </g>
        </g>

        <line x1="205" y1="226" x2={scoopTipX} y2={scoopTipY} stroke="#E2E8F0" strokeWidth="5" strokeLinecap="round" />
        <circle cx="205" cy="226" r="5" fill="#38BDF8" />
        <g transform={`translate(${scoopTipX}, ${scoopTipY})`}>
          <path d="M -6 -6 L 14 -6 L 18 4 L -2 8 Z" fill={props.hasSample ? '#E07A5F' : '#38BDF8'} />
        </g>

        {handoffActive && (
          <HorizonRadioPing x={140} y={170} label={mission.discoveryHandoff.targetCoords} />
        )}

        <rect x="540" y="0" width="340" height="390" fill="#070B14" />
        <line x1="540" y1="0" x2="540" y2="390" stroke="#1E293B" strokeWidth="1.5" />
        <text x="562" y="138" fill="#E2E8F0" fontSize="12" fontWeight="600" fontFamily="IBM Plex Sans, sans-serif">
          Biology &amp; Chemistry Lab Readout
        </text>
        <text x="562" y="156" fill="#94A3B8" fontSize="10.5" fontFamily="IBM Plex Mono, monospace">
          Labeled Release Gas vs. GCMS Organics
        </text>

        <line x1="572" y1="175" x2="572" y2="325" stroke="#334155" strokeWidth="1.5" />
        <line x1="572" y1="325" x2="852" y2="325" stroke="#334155" strokeWidth="1.5" />

        {props.lrComplete ? (
          <g>
            <path d="M 572 322 C 610 245, 675 205, 848 195" fill="none" stroke="#E07A5F" strokeWidth="3" />
            <text x="586" y="192" fill="#F4A28C" fontSize="11" fontFamily="IBM Plex Mono, monospace">
              Labeled Release: Gas Detected!
            </text>
          </g>
        ) : (
          <text x="588" y="235" fill="#64748B" fontSize="11" fontFamily="IBM Plex Mono, monospace">
            Run Labeled Release Oven →
          </text>
        )}

        {props.gcmsComplete ? (
          <g>
            <line x1="572" y1="316" x2="848" y2="315" stroke="#38BDF8" strokeWidth="2.5" />
            <text x="586" y="305" fill="#38BDF8" fontSize="11" fontFamily="IBM Plex Mono, monospace">
              GCMS: 0.00 ppb Organic Molecules
            </text>
          </g>
        ) : (
          <text x="588" y="305" fill="#64748B" fontSize="11" fontFamily="IBM Plex Mono, monospace">
            Run GCMS Organic Analyzer →
          </text>
        )}

        <text x="562" y="366" fill={props.faultInjected ? '#F43F5E' : '#94A3B8'} fontSize="10.5" fontFamily="IBM Plex Mono, monospace">
          {props.faultInjected
            ? '✖ NOV 11, 1982: DISH POINTED OFF EARTH'
            : '● CHRYSE SCOOP & EARTH DISH NOMINAL'}
        </text>
      </svg>
    );
  }

  if (mission.id === 'sojourner') {
    const pfX = 115;
    const pfY = 238;
    const uhfR = 440;
    const rx = props.roverPos.xNorm * 880;
    const ry = props.roverPos.y + 32;
    const dist = Math.hypot(rx - pfX, ry - pfY);
    const inRange = dist <= uhfR;

    return (
      <svg
        viewBox="0 0 880 390"
        className="w-full h-auto block bg-[#2A1612]"
        role="img"
        aria-label="Sojourner Rover navigating Ares Vallis boulders inside Pathfinder's UHF radio circle"
      >
        <defs>
          <radialGradient id="aresGround">
            <stop offset="0%" stopColor="#4A261D" />
            <stop offset="100%" stopColor="#26130F" />
          </radialGradient>
        </defs>
        <rect x="0" y="0" width="880" height="390" fill="url(#aresGround)" />
        <path d="M 0 130 Q 240 100 520 136 T 880 122" fill="none" stroke="#6B372A" strokeWidth="1" opacity="0.45" />
        <path d="M 0 305 Q 320 275 610 318 T 880 290" fill="none" stroke="#6B372A" strokeWidth="1" opacity="0.45" />

        <circle
          cx={pfX}
          cy={pfY}
          r={uhfR}
          fill="rgba(56, 189, 248, 0.04)"
          stroke={inRange ? '#38BDF8' : '#F43F5E'}
          strokeWidth="1.5"
          strokeDasharray="6 6"
        />

        <g transform={`translate(${pfX}, ${pfY})`}>
          <polygon points="0,-28 24,18 -24,18" fill="#1E293B" stroke="#38BDF8" strokeWidth="1.8" />
          <polygon points="-24,18 -46,6 -20,-8" fill="#0F172A" stroke="#38BDF8" strokeWidth="1.2" />
          <polygon points="24,18 46,6 20,-8" fill="#0F172A" stroke="#38BDF8" strokeWidth="1.2" />
          <circle cx="0" cy="0" r="5" fill="#E07A5F" />
          <text x="-44" y="38" fill="#38BDF8" fontSize="10.5" fontFamily="IBM Plex Mono, monospace">
            Pathfinder Base
          </text>
        </g>

        {[
          { name: 'Barnacle Bill', x: 370, y: 158, r: 24, target: false },
          { name: 'Scooby Doo', x: 495, y: 278, r: 22, target: false },
          { name: 'Yogi Rock (APXS Target)', x: 695, y: 170, r: 32, target: true },
        ].map((rk) => (
          <g key={rk.name} transform={`translate(${rk.x}, ${rk.y})`}>
            <path
              d={`M ${-rk.r} 4 Q ${-rk.r * 0.7} ${-rk.r} 0 ${-rk.r * 0.9} T ${rk.r} 2 Q ${rk.r * 0.6} ${rk.r * 0.8} 0 ${rk.r * 0.85} T ${-rk.r} 4 Z`}
              fill={rk.target ? '#6A3E30' : '#4E2E25'}
              stroke={rk.target ? '#E07A5F' : '#8C5647'}
              strokeWidth={rk.target ? 2.2 : 1.2}
            />
            <text
              x={-rk.r - 12}
              y={-rk.r - 8}
              fill={rk.target ? '#F4A28C' : '#CBD5E1'}
              fontSize="11"
              fontFamily="IBM Plex Mono, monospace"
            >
              {rk.name}
            </text>
          </g>
        ))}

        <g transform={`translate(${rx}, ${ry}) rotate(${(props.roverPos.angle * 180) / Math.PI})`}>
          {[-2, -1, 0, 1, 2].map((i) => (
            <line key={i} x1="18" y1={i * 3} x2="78" y2={i * 12} stroke="#F43F5E" strokeWidth="1.5" opacity="0.75" />
          ))}
          {[-14, 0, 14].map((wx) => (
            <g key={wx}>
              <rect x={wx - 4} y="-17" width="8" height="4" rx="1" fill="#94A3B8" />
              <rect x={wx - 4} y="13" width="8" height="4" rx="1" fill="#94A3B8" />
            </g>
          ))}
          <rect x="-18" y="-12" width="36" height="24" rx="2" fill="#0F172A" stroke="#38BDF8" strokeWidth="1.6" />
          <rect x="-14" y="-9" width="28" height="18" fill="#1D4ED8" opacity="0.45" />
          <rect x="-25" y="-6" width="7" height="12" rx="1" fill="#E07A5F" />
        </g>

        {handoffActive && (
          <HorizonRadioPing x={pfX} y={pfY - 24} label={mission.discoveryHandoff.targetCoords} />
        )}

        <rect x="575" y="278" width="285" height="92" rx="4" fill="#070B14" stroke="#1E293B" />
        <text x="590" y="300" fill="#E2E8F0" fontSize="11" fontWeight="600" fontFamily="IBM Plex Mono, monospace">
          APXS Rock Chemical Scanner
        </text>
        <text x="590" y="320" fill={props.apxsDone ? '#34D399' : '#94A3B8'} fontSize="10.5" fontFamily="IBM Plex Mono, monospace">
          {props.apxsDone
            ? 'SiO₂ 58.6% · FeO 14.2% (Flood Andesite)'
            : `Scan Progress: ${props.apxsProgress}%`}
        </text>
        <rect x="590" y="334" width="250" height="8" rx="2" fill="#1E293B" />
        <rect x="590" y="334" width={props.apxsProgress * 2.5} height="8" rx="2" fill="#E07A5F" />
        <text x="590" y="358" fill="#94A3B8" fontSize="10" fontFamily="IBM Plex Mono, monospace">
          Speed: 1.0 cm/s · Radio: {inRange ? '● In Range' : '▲ Out of Range'}
        </text>
      </svg>
    );
  }

  if (mission.id === 'phoenix_insight') {
    if (props.act4Mode === 'phoenix') {
      const digDepthPx = (props.trenchDepthCm / 6) * 94;
      const iceExposed = props.trenchDepthCm >= 5;
      return (
        <svg
          viewBox="0 0 880 390"
          className="w-full h-auto block bg-[#0B1220]"
          role="img"
          aria-label="Phoenix Lander digging into arctic permafrost at Vastitas Borealis to expose water ice"
        >
          <rect x="0" y="0" width="880" height="190" fill="#131E32" />
          <rect x="0" y="190" width="880" height="75" fill="#633D30" />
          <rect x="0" y="265" width="880" height="125" fill="#BAE6FD" opacity="0.88" />
          <text x="24" y="294" fill="#0C4A6E" fontSize="11" fontWeight="600" fontFamily="IBM Plex Mono, monospace">
            5 cm Underground: Frozen Water-Ice Layer
          </text>

          <rect x="410" y="190" width="160" height={digDepthPx} fill="#0F172A" />
          {iceExposed && (
            <g>
              <rect x="422" y="260" width="136" height="12" rx="2" fill="#E0F2FE" />
              {[440, 466, 492, 518, 540].map((vx, i) => (
                <path
                  key={i}
                  d={`M ${vx} 254 Q ${vx - 8} 230 ${vx + 4} 206`}
                  fill="none"
                  stroke="#BAE6FD"
                  strokeWidth="2"
                  strokeDasharray="4 4"
                />
              ))}
              <text x="415" y="180" fill="#7DD3FC" fontSize="11" fontFamily="IBM Plex Mono, monospace">
                Water Ice Sublimating Directly to Vapor!
              </text>
            </g>
          )}

          <g transform="translate(245, 158)">
            <ellipse cx="-68" cy="4" rx="48" ry="11" fill="#0F172A" stroke="#E07A5F" strokeWidth="1.5" />
            <ellipse cx="68" cy="4" rx="48" ry="11" fill="#0F172A" stroke="#E07A5F" strokeWidth="1.5" />
            <rect x="-32" y="-12" width="64" height="22" rx="3" fill="#1E293B" stroke="#38BDF8" strokeWidth="1.5" />
            <line x1="-22" y1="10" x2="-36" y2="34" stroke="#CBD5E1" strokeWidth="3.5" />
            <line x1="22" y1="10" x2="36" y2="34" stroke="#CBD5E1" strokeWidth="3.5" />
            <path
              d={`M 26 0 L 145 -22 L ${245} ${32 + digDepthPx * 0.85}`}
              fill="none"
              stroke="#E2E8F0"
              strokeWidth="4.5"
              strokeLinejoin="round"
            />
          </g>

          {handoffActive && (
            <HorizonRadioPing x={250} y={145} label={mission.discoveryHandoff.targetCoords} />
          )}

          <text x="24" y="372" fill="#E2E8F0" fontSize="11.5" fontFamily="IBM Plex Mono, monospace">
            PHOENIX (68.22°N) · TRENCH DEPTH: {props.trenchDepthCm.toFixed(1)} cm
          </text>
        </svg>
      );
    }

    const noiseAmp = ((100 - props.windFilter) / 100) * 28;
    const wavePoints = Array.from({ length: 160 }, (_, idx) => {
      const nx = idx / 159;
      const x = 32 + nx * 510;
      const wind = Math.sin(idx * 0.8) * Math.cos(idx * 0.43) * noiseAmp;
      const pWave = Math.exp(-Math.pow((nx - 0.34) * 16, 2)) * Math.sin(idx * 1.1) * 26;
      const sWave = Math.exp(-Math.pow((nx - 0.62) * 12, 2)) * Math.sin(idx * 0.9) * 58;
      return `${x.toFixed(1)},${(235 + wind + pWave + sWave).toFixed(1)}`;
    }).join(' ');

    return (
      <svg
        viewBox="0 0 880 390"
        className="w-full h-auto block bg-[#070B14]"
        role="img"
        aria-label="InSight SEIS seismogram filtering wind noise to reveal Marsquake S1222a and Mars liquid iron core"
      >
        <text x="32" y="138" fill="#E2E8F0" fontSize="12" fontWeight="600" fontFamily="IBM Plex Mono, monospace">
          SEIS Underground Quake Detector (Elysium Planitia)
        </text>
        <line x1="32" y1="235" x2="545" y2="235" stroke="#1E293B" strokeWidth="1" />
        <polyline
          fill="none"
          stroke={props.windFilter >= 75 ? '#38BDF8' : '#E07A5F'}
          strokeWidth="2"
          points={wavePoints}
        />
        <text x="180" y="162" fill="#94A3B8" fontSize="10.5" fontFamily="IBM Plex Mono, monospace">
          P-Wave
        </text>
        <text x="305" y="152" fill="#38BDF8" fontSize="10.5" fontFamily="IBM Plex Mono, monospace">
          S-Wave (M4.7 Quake)
        </text>

        <g transform="translate(720, 225)">
          <circle r="112" fill="#8C3F2D" stroke="#E07A5F" strokeWidth="2" />
          <circle r="90" fill="#5A271C" />
          <circle r="48" fill="#F59E0B" opacity={props.windFilter >= 75 ? 0.88 : 0.35} />
          <text x="-44" y="-4" fill="#070B14" fontSize="11" fontWeight="700" fontFamily="IBM Plex Mono, monospace">
            Liquid Iron
          </text>
          <text x="-36" y="12" fill="#070B14" fontSize="10.5" fontWeight="700" fontFamily="IBM Plex Mono, monospace">
            ~1,830 km
          </text>
          <text x="-52" y="132" fill="#CBD5E1" fontSize="10.5" fontFamily="IBM Plex Mono, monospace">
            Mars Interior Cross-Section
          </text>
        </g>

        {handoffActive && (
          <HorizonRadioPing x={290} y={120} label={mission.discoveryHandoff.targetCoords} />
        )}
      </svg>
    );
  }

  if (mission.id === 'ingenuity') {
    const ix = 130 + (props.flightProgress / 100) * 620;
    const alt = props.flightStatus === 'flying' ? Math.sin((props.flightProgress / 100) * Math.PI) * 115 : 0;
    const iy = 264 - alt;
    const bladeSpan = props.rotorRpm >= 2400 ? 64 : 44;

    return (
      <svg
        viewBox="0 0 880 390"
        className="w-full h-auto block bg-[#1B1115]"
        role="img"
        aria-label="Ingenuity Mars Helicopter flying over Jezero Crater sand dunes"
      >
        <defs>
          <linearGradient id="jezeroSky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1A1219" />
            <stop offset="100%" stopColor="#5D3327" />
          </linearGradient>
        </defs>
        <rect x="0" y="0" width="880" height="288" fill="url(#jezeroSky)" />
        <path d="M0 288 L0 245 L180 225 L340 252 L520 222 L710 248 L880 232 L880 288 Z" fill="#46251D" />
        <rect x="0" y="288" width="880" height="102" fill="#703C2D" />

        {props.flightNumber !== 72 ? (
          [80, 175, 290, 410, 535, 660, 790].map((rx, i) => (
            <ellipse key={i} cx={rx} cy={312 + (i % 2) * 18} rx="12" ry="5" fill="#4E281E" />
          ))
        ) : (
          <text x="295" y="335" fill="#F4A28C" fontSize="11" fontFamily="IBM Plex Mono, monospace">
            Valinor Hills: Smooth Featureless Sand Dunes (Hard to Track!)
          </text>
        )}

        <g transform={`translate(${ix}, ${iy}) rotate(${props.flightStatus === 'strike' ? 24 : 0})`}>
          {props.flightStatus === 'flying' && (
            <polygon
              points="0,8 -38,110 38,110"
              fill={props.flightNumber === 72 ? 'rgba(244, 63, 94, 0.14)' : 'rgba(56, 189, 248, 0.16)'}
            />
          )}
          <line x1="-10" y1="12" x2="-28" y2="34" stroke="#CBD5E1" strokeWidth="2.5" />
          <line x1="10" y1="12" x2="28" y2="34" stroke="#CBD5E1" strokeWidth="2.5" />
          <rect
            x="-14"
            y="-10"
            width="28"
            height="22"
            rx="3"
            fill={props.heaterOn ? '#D97706' : '#1E293B'}
            stroke="#38BDF8"
            strokeWidth="1.5"
          />
          <line x1="0" y1="-10" x2="0" y2="-36" stroke="#E2E8F0" strokeWidth="3" />
          <ellipse
            cx="0"
            cy="-25"
            rx={bladeSpan}
            ry={props.rotorRpm >= 2000 ? 4.5 : 2.2}
            fill="rgba(56, 189, 248, 0.25)"
            stroke="#38BDF8"
            strokeWidth="1.8"
          />
          <ellipse
            cx="0"
            cy="-18"
            rx={bladeSpan * 0.92}
            ry={props.rotorRpm >= 2000 ? 4.5 : 2.2}
            fill="rgba(224, 122, 95, 0.2)"
            stroke="#E07A5F"
            strokeWidth="1.6"
          />
          <rect x="-18" y="-40" width="36" height="5" rx="1" fill="#38BDF8" />
        </g>

        {handoffActive && (
          <HorizonRadioPing x={ix} y={iy - 36} label={mission.discoveryHandoff.targetCoords} />
        )}

        <text x="20" y="372" fill="#E2E8F0" fontSize="11.5" fontFamily="IBM Plex Mono, monospace">
          FLIGHT #{props.flightNumber} · ROTOR SPEED: {props.rotorRpm} RPM · AIR DENSITY: 1% OF EARTH
        </text>
      </svg>
    );
  }

  // Pioneer 10 & 11 Interstellar Scene
  const spectrumPoints = Array.from({ length: 140 }, (_, i) => {
    const nx = i / 139;
    const x = 36 + nx * 470;
    const targetX = 0.5 + (props.dsnFreqOffset / 20) * 0.35;
    const noise = (Math.sin(i * 1.3) + Math.cos(i * 0.7)) * 8;
    const peak = Math.exp(-Math.pow((nx - targetX) * 16, 2)) * ((props.dsnGain / 100) * 105);
    return `${x.toFixed(1)},${(325 - noise - peak).toFixed(1)}`;
  }).join(' ');

  return (
    <svg
      viewBox="0 0 880 390"
      className="w-full h-auto block bg-[#050811]"
      role="img"
      aria-label="Pioneer 10 in interstellar space, Goldstone 70m signal receiver, and Golden Pioneer Plaque"
    >
      {[
        [45, 76], [115, 118], [190, 68], [275, 98], [340, 72], [435, 105], [505, 80],
        [72, 160], [160, 182], [385, 164],
      ].map(([sx, sy], i) => (
        <circle key={i} cx={sx} cy={sy} r="1.4" fill="#E2E8F0" opacity="0.65" />
      ))}
      <circle cx="465" cy="96" r="4" fill="#FDBA74" />
      <text x="405" y="114" fill="#FDBA74" fontSize="10" fontFamily="IBM Plex Mono, monospace">
        Aldebaran
      </text>

      <g transform="translate(245, 146)">
        <line x1="25" y1="0" x2="145" y2="-10" stroke="#94A3B8" strokeWidth="2.5" />
        <rect x="145" y="-14" width="10" height="8" fill="#38BDF8" />
        <line x1="-22" y1="8" x2="-112" y2="28" stroke="#94A3B8" strokeWidth="2.5" />
        <rect x="-126" y="22" width="18" height="12" rx="2" fill="#E07A5F" />
        <ellipse cx="0" cy="0" rx="52" ry="22" fill="#1E293B" stroke="#E2E8F0" strokeWidth="2.5" />
        <line x1="-32" y1="-10" x2="0" y2="-44" stroke="#CBD5E1" strokeWidth="1.5" />
        <line x1="32" y1="-10" x2="0" y2="-44" stroke="#CBD5E1" strokeWidth="1.5" />
        <circle cx="0" cy="-46" r="4.5" fill="#38BDF8" />
      </g>

      {handoffActive && (
        <HorizonRadioPing x={245} y={100} label={mission.discoveryHandoff.targetCoords} />
      )}

      <line x1="271" y1="225" x2="271" y2="345" stroke="#E07A5F" strokeDasharray="4 4" />
      <polyline
        fill="none"
        stroke={props.signalLocked ? '#34D399' : '#38BDF8'}
        strokeWidth="2"
        points={spectrumPoints}
      />
      <text x="36" y="222" fill="#94A3B8" fontSize="10.5" fontFamily="IBM Plex Mono, monospace">
        GOLDSTONE 70m RECEIVER · 2292.037 MHz · 11h 20m LIGHT DELAY
      </text>
      <text x="36" y="368" fill={props.signalLocked ? '#34D399' : '#E07A5F'} fontSize="10.5" fontFamily="IBM Plex Mono, monospace">
        {props.signalLocked
          ? '● 8-WATT SIGNAL LOCKED (-178.5 dBm)'
          : `▲ ALIGN DOPPLER OFFSET TO 0.0 kHz & GAIN >= 82 dB`}
      </text>

      {/* Interactive Golden Pioneer Plaque */}
      <g transform="translate(555, 68)">
        <rect x="0" y="0" width="302" height="296" rx="6" fill="#261D09" stroke="#F59E0B" strokeWidth="2" />
        <text x="16" y="24" fill="#FCD34D" fontSize="11" fontWeight="600" fontFamily="IBM Plex Mono, monospace">
          PIONEER GOLDEN PLAQUE (Click Parts)
        </text>
        <g
          className="cursor-pointer"
          onClick={() => props.onSelectPlaqueRegion('hydrogen')}
          opacity={props.plaqueRegion === 'hydrogen' ? 1 : 0.6}
        >
          <circle cx="52" cy="68" r="14" fill="none" stroke="#FBBF24" strokeWidth="1.6" />
          <circle cx="104" cy="68" r="14" fill="none" stroke="#FBBF24" strokeWidth="1.6" />
          <line x1="66" y1="68" x2="90" y2="68" stroke="#FBBF24" strokeWidth="1.5" />
          <text x="26" y="98" fill="#FDE68A" fontSize="9.5" fontFamily="IBM Plex Mono, monospace">
            H₂ Spin Clock
          </text>
        </g>
        <g
          className="cursor-pointer"
          onClick={() => props.onSelectPlaqueRegion('pulsars')}
          opacity={props.plaqueRegion === 'pulsars' ? 1 : 0.6}
        >
          {[0, 28, 52, 85, 118, 148, 175, 210, 248, 290, 325].map((deg, idx) => {
            const rad = (deg * Math.PI) / 180;
            const len = 36 + (idx % 3) * 14;
            return (
              <line
                key={idx}
                x1="78"
                y1="175"
                x2={78 + Math.cos(rad) * len}
                y2={175 + Math.sin(rad) * len}
                stroke="#FBBF24"
                strokeWidth="1.3"
              />
            );
          })}
          <circle cx="78" cy="175" r="4" fill="#FDE68A" />
          <text x="34" y="236" fill="#FDE68A" fontSize="9.5" fontFamily="IBM Plex Mono, monospace">
            14-Pulsar Map
          </text>
        </g>
        <g
          className="cursor-pointer"
          onClick={() => props.onSelectPlaqueRegion('humans')}
          opacity={props.plaqueRegion === 'humans' ? 1 : 0.6}
        >
          <path d="M 192 78 L 270 78 L 231 118 Z" fill="none" stroke="#FBBF24" strokeWidth="1.3" />
          <circle cx="212" cy="128" r="7" fill="none" stroke="#FBBF24" strokeWidth="1.5" />
          <line x1="212" y1="135" x2="212" y2="178" stroke="#FBBF24" strokeWidth="1.5" />
          <circle cx="246" cy="134" r="6.5" fill="none" stroke="#FBBF24" strokeWidth="1.5" />
          <line x1="246" y1="141" x2="246" y2="178" stroke="#FBBF24" strokeWidth="1.5" />
          <text x="184" y="202" fill="#FDE68A" fontSize="9.5" fontFamily="IBM Plex Mono, monospace">
            Human Scale
          </text>
        </g>
        <g
          className="cursor-pointer"
          onClick={() => props.onSelectPlaqueRegion('trajectory')}
          opacity={props.plaqueRegion === 'trajectory' ? 1 : 0.6}
        >
          {[32, 58, 84, 110, 148, 186, 224, 260].map((px, i) => (
            <circle key={i} cx={px} cy="264" r={i === 4 ? 7 : 3.5} fill="#FBBF24" />
          ))}
          <path d="M 84 264 Q 130 232 276 238" fill="none" stroke="#38BDF8" strokeWidth="1.6" />
          <text x="86" y="286" fill="#FDE68A" fontSize="9.5" fontFamily="IBM Plex Mono, monospace">
            Solar Escape Path
          </text>
        </g>
      </g>
    </svg>
  );
};
