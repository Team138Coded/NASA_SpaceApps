export type ActId =
  | 'prologue'
  | 'mer'
  | 'viking'
  | 'sojourner'
  | 'phoenix_insight'
  | 'ingenuity'
  | 'pioneer'
  | 'epilogue';

export type TransitionKind =
  | 'carrier'
  | 'terrain_pan'
  | 'dust'
  | 'seismic'
  | 'flight'
  | 'interstellar'
  | 'awakening';

export interface HardwarePin {
  id: string;
  label: string;
  plainEnglishRole: string;
  shortCode: string;
  position: [number, number, number];
  subsystem: string;
  description: string;
  telemetryReading: string;
}

export interface ExplorerBadge {
  id: string;
  title: string;
  subtitle: string;
  criteria: string;
}

export interface MissionBaseline {
  pressureMbar: number;
  tempC: number;
  dustTau: number;
  powerWatts: number;
  powerSource: string;
  gravityMs2: number;
  lightTimeSeconds: number;
  signalStrengthDbm: number;
  locationName: string;
}

export interface DiscoveryHandoff {
  targetCoords: string;
  targetName: string;
  senderName: string;
  senderLine: string;
  receiverName: string;
  receiverLine: string;
}

export interface MissionDossier {
  id: ActId;
  shortName: string;
  timelineHeader: string;
  shortNavLabel: string;
  title: string;
  subtitle: string;
  era: string;
  nssdcaIds: string;
  coordinates: string;
  launchVehicle: string;
  launchDate: string;
  landingOrEventDate: string;
  massKg: string;
  personnel: string[];
  dataCollected: string;
  finalStatus: string;
  statusTag: 'Nominal' | 'Degraded' | 'Silent' | 'Standby';
  transitionKind: TransitionKind;
  objectiveText: string;
  povStory: string;
  discoveryHandoff: DiscoveryHandoff;
  narrativeEnding: string;
  modelType:
    | 'vali'
    | 'viking'
    | 'sojourner'
    | 'mer'
    | 'phoenix_insight'
    | 'ingenuity'
    | 'pioneer';
  baseline: MissionBaseline;
  hardwarePins: HardwarePin[];
  badge: ExplorerBadge;
  suggestedPrompts: string[];
  voicePersona: string;
  knowledgeFacts: string[];
}

export interface ChatMessage {
  id: string;
  sender: string;
  senderId: string;
  role: 'user' | 'spacecraft';
  text: string;
  timestamp: string;
  mode: 'direct' | 'reunion';
  missionId?: ActId;
  source?: 'gemini' | 'nssdca-archive';
}
