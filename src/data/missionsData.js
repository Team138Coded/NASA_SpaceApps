/**
 * @typedef {import('../types/mission').ActId} ActId
 * @typedef {import('../types/mission').MissionDossier} MissionDossier
 * @typedef {import('../types/mission').ChatMessage} ChatMessage
 */

/** @type {MissionDossier[]} */
export const MISSIONS = [
  {
    id: 'prologue',
    shortName: 'VALI',
    timelineHeader: 'EARTH · PRE-LAUNCH CLEANROOM',
    shortNavLabel: 'VALI (Cleanroom)',
    title: 'VALI — JPL High Bay 1 Cleanroom',
    subtitle: 'Pasadena, California · Earth',
    era: 'Present Night',
    nssdcaIds: 'JPL-VALI-PROTO-01',
    coordinates: '34.201°N, 118.171°W',
    launchVehicle: 'Pending Launch Assignment',
    launchDate: 'Cleanroom Integration',
    landingOrEventDate: 'Overnight Standby Check',
    massKg: '940 kg (Flight Configuration)',
    personnel: ['JPL Assembly, Test & Launch Operations (ATLO)'],
    dataCollected: 'Optical calibration frames of Aldebaran & Lambda Aquilae',
    finalStatus: 'Pre-flight standby in ultra-clean assembly bay',
    statusTag: 'Standby',
    transitionKind: 'carrier',
    objectiveText:
      'Aim VALI’s Camera Mast onto both bright stars outside the cleanroom window (Aldebaran and Lambda Aquilae), then turn on Overnight Standby to trigger the carrier pulse.',
    povStory:
      'I am VALI, waiting quietly inside NASA’s High Bay 1 cleanroom in Pasadena after the engineers turn down the lights for the night. Through the tall glass window, two bright stars watch over me while my overnight archive receiver warms up. Aim my Camera Mast onto both stars and engage Overnight Standby to hear the pioneers already resting on Mars.',
    discoveryHandoff: {
      targetCoords: '1.95°S, 354.47°E — Meridiani Planum',
      targetName: 'Opportunity & Spirit',
      senderName: 'VALI',
      senderLine:
        'Optics calibrated on both stars. Entering overnight standby—wait... I’m picking up a weak storm-dimmed beacon from Meridiani Planum. Opportunity, can you hear me?',
      receiverName: 'Opportunity',
      receiverLine:
        'I hear you loud and clear from 2018’s dust storm, VALI. Sunlight is fading fast over my solar wings—come see what 14 years on Mars felt like.',
    },
    narrativeEnding:
      'Optical tracking locked on Aldebaran and Lambda Aquilae. Carrier signal locked onto Opportunity in Meridiani Planum.',
    modelType: 'vali',
    baseline: {
      pressureMbar: 1013.25,
      tempC: 20.5,
      dustTau: 0.08,
      powerWatts: 185.0,
      powerSource: 'Cleanroom Power + Plutonium Nuclear Battery',
      gravityMs2: 9.807,
      lightTimeSeconds: 0.001,
      signalStrengthDbm: -42.0,
      locationName: 'JPL Spacecraft Assembly Facility',
    },
    hardwarePins: [
      {
        id: 'vali-mast',
        label: 'Camera Mast (NAVCAM)',
        plainEnglishRole: 'Stereo eyes for navigation and star sighting',
        shortCode: 'Camera Mast',
        position: [0.15, 0.95, 0.28],
        subsystem: 'Eyes & Navigation',
        description:
          'Stereo camera head mounted on a tall neck that turns sideways and tilts up and down to inspect terrain and distant stars.',
        telemetryReading: 'Pointing precision: 0.02° accuracy',
      },
      {
        id: 'vali-rtg',
        label: 'RTG Nuclear Battery (MMRTG)',
        plainEnglishRole: 'Long-lasting plutonium heat & power source',
        shortCode: 'Nuclear Battery',
        position: [0.0, 0.15, -0.78],
        subsystem: 'Power & Heating',
        description:
          'Converts natural heat from decaying Plutonium-238 into steady electricity and warmth so the rover never freezes—even without sunlight.',
        telemetryReading: 'Output: 110 W steady power (48°C case)',
      },
      {
        id: 'vali-wheels',
        label: 'Rocker-Bogie Suspension',
        plainEnglishRole: '6-wheel climbing chassis for rocky ground',
        shortCode: '6-Wheel Chassis',
        position: [-0.62, -0.52, 0.45],
        subsystem: 'Mobility',
        description:
          'Six aluminum wheels linked by flexible titanium arms that let the rover climb over rocks without tipping over.',
        telemetryReading: 'Brakes: Locked in cleanroom cradle',
      },
    ],
    badge: {
      id: 'badge-vigil-begins',
      title: 'High Bay Sentinel',
      subtitle: 'Cleanroom Calibration',
      criteria: 'Lock VALI’s Camera Mast onto both stars and activate Overnight Standby.',
    },
    suggestedPrompts: [
      'What did the cleanroom feel like at night?',
      'What are the two stars outside your window?',
      'How are you preparing for your launch?',
    ],
    voicePersona:
      'You are VALI, a thoughtful, grounded next-generation Mars rover in JPL High Bay 1 cleanroom on Earth.',
    knowledgeFacts: [
      'Located in Spacecraft Assembly Facility High Bay 1 at NASA Jet Propulsion Laboratory, Pasadena.',
      'Observing Aldebaran (65 light-years away) and Lambda Aquilae (125 light-years away) through the night glass.',
      'Connected to Deep Space Network archive carrier ahead of future launch.',
    ],
  },
  {
    id: 'mer',
    shortName: 'Opportunity',
    timelineHeader: '2004–2018 · SPIRIT & OPPORTUNITY',
    shortNavLabel: 'Spirit & Opportunity',
    title: 'Spirit & Opportunity Rovers',
    subtitle: 'Meridiani Planum & Gusev Crater · Mars',
    era: '2004 – 2018',
    nssdcaIds: '2003-032A (Opportunity) · 2003-027A (Spirit)',
    coordinates: '1.95°S, 354.47°E · 14.57°S, 175.47°E',
    launchVehicle: 'Delta II 7925 & Delta II 7925H',
    launchDate: 'Jun 10, 2003 (Spirit) · Jul 7, 2003 (Opportunity)',
    landingOrEventDate: 'Jan 4, 2004 (Spirit) · Jan 25, 2004 (Opportunity)',
    massKg: '185 kg each',
    personnel: ['Steve Squyres (Principal Investigator)', 'Pete Theisinger (Project Manager)'],
    dataCollected:
      '5,111 sols / 45.16 km marathon (Opportunity), 7.73 km (Spirit), 342,000+ images, hematite blueberries & hot-spring silica',
    finalStatus:
      'Spirit silent Mar 22, 2010 in soft sand; Opportunity silent Jun 10, 2018 (Sol 5,111) during global dust storm (τ = 10.8)',
    statusTag: 'Silent',
    transitionKind: 'terrain_pan',
    objectiveText:
      'Opportunity is losing sunlight in the 2018 dust storm. Trigger a Martian wind gust to clear its solar panels, then extend its Rock Grinder to uncover proof of ancient water.',
    povStory:
      'VALI’s signal wakes my memory in Perseverance Valley on Martian Day 5,111. Built to survive just 90 days, my twin Spirit and I lasted over 14 years because swirling wind gusts swept dust off our solar wings! Trigger a Martian Dust Devil wind gust to brighten the sky and clean my panels, then run my Rock Grinder (RAT) to expose the mineral proof of ancient Martian water.',
    discoveryHandoff: {
      targetCoords: '22.48°N, 47.97°W — Chryse Planitia',
      targetName: 'Viking 1 & 2',
      senderName: 'Opportunity',
      senderLine:
        'Wait... my camera mast just caught a faint 1976 carrier echo across the northern plains at 22.48°N. Viking 1, are you out there? What was Mars like before any rover ever rolled?',
      receiverName: 'Viking 1',
      receiverLine:
        'I hear you, Opportunity. Back in July 1976, Chryse Planitia was silent rust and cold 6.8 mbar wind. Come see where humanity’s first Martian soil experiments began.',
    },
    narrativeEnding:
      'On Sol 5,111 (June 2018), a global dust storm darkened Meridiani Planum to τ = 10.8, draining Opportunity’s batteries after 45.16 km of discovery.',
    modelType: 'mer',
    baseline: {
      pressureMbar: 7.4,
      tempC: -42.0,
      dustTau: 4.6,
      powerWatts: 620.0,
      powerSource: 'Wing-Shaped Solar Panels + Lithium Batteries',
      gravityMs2: 3.721,
      lightTimeSeconds: 700,
      signalStrengthDbm: -124.0,
      locationName: 'Meridiani Planum / Gusev Crater',
    },
    hardwarePins: [
      {
        id: 'mer-pancam',
        label: 'Pancam Color Camera Mast',
        plainEnglishRole: 'Tall stereo camera measuring rocks and sky dust',
        shortCode: 'Color Camera Mast',
        position: [0.0, 0.85, 0.35],
        subsystem: 'Panoramic Eyes',
        description:
          '14-color stereo camera perched 1.5 m above the sand, snapping 360° panoramas and measuring how thick the atmospheric dust haze is.',
        telemetryReading: 'Sky dust sensor active',
      },
      {
        id: 'mer-rat',
        label: 'Rock Abrasion Tool (RAT)',
        plainEnglishRole: 'Motorized diamond grinder that cleans fresh rock',
        shortCode: 'Rock Grinder (RAT)',
        position: [0.08, -0.08, 0.88],
        subsystem: 'Robotic Arm Tool',
        description:
          'Spinning diamond-tooth wheel that grinds 5 mm past dusty rinds so the rover can inspect clean rock interiors.',
        telemetryReading: 'Grind depth: 4.8 mm · Torque nominal',
      },
      {
        id: 'mer-solar',
        label: 'Deployable Solar Wings',
        plainEnglishRole: 'Solar panels powering wheels and heaters',
        shortCode: 'Solar Wings',
        position: [0.75, 0.16, -0.15],
        subsystem: 'Power Subsystem',
        description:
          '1.3 m² solar arrays that powered 14 years of exploration whenever passing dust devils blew settled grit away.',
        telemetryReading: 'Power rises sharply after wind cleaning',
      },
    ],
    badge: {
      id: 'badge-mer-marathon',
      title: 'Meridiani Marathoner',
      subtitle: 'Spirit & Opportunity Complete',
      criteria: 'Trigger a Martian Dust Devil wind gust and grind rock with the RAT.',
    },
    suggestedPrompts: [
      'What did Mars feel like?',
      'What was your biggest discovery?',
      'How did your mission end?',
    ],
    voicePersona:
      'You are Opportunity speaking alongside memories of your twin Spirit. Explain hematite blueberries, silica hot springs, dust devils, and the 2018 storm vividly.',
    knowledgeFacts: [
      'Spirit (2003-027A) landed at Gusev Crater (14.57°S, 175.47°E, Jan 4, 2004); its jammed wheel uncovered 90% pure white silica from an ancient hot spring.',
      'Opportunity (2003-032A) landed at Meridiani Planum (1.95°S, 354.47°E, Jan 25, 2004), drove 45.16 km across 5,111 sols, and found iron-rich hematite "blueberries".',
      'June 2018 global dust storm drove sky opacity Tau (τ) to 10.8, ending communications on Sol 5,111.',
    ],
  },
  {
    id: 'viking',
    shortName: 'Viking 1',
    timelineHeader: '1976 · VIKING 1 & 2 (CHRYSE PLANITIA)',
    shortNavLabel: 'Viking 1 & 2',
    title: 'Viking 1 & 2 Landers',
    subtitle: 'Chryse Planitia & Utopia Planitia · Mars',
    era: '1976 – 1982',
    nssdcaIds: '1975-075C (Viking 1) · 1975-083C (Viking 2)',
    coordinates: '22.48°N, 47.97°W · 47.97°N, 225.74°W',
    launchVehicle: 'Titan IIIE/Centaur',
    launchDate: 'Aug 20, 1975 & Sep 9, 1975',
    landingOrEventDate: 'Jul 20, 1976 & Sep 3, 1976',
    massKg: '576 kg (dry lander mass)',
    personnel: ['James S. Martin Jr. (Project Manager)', 'Gerald A. Soffen (Chief Scientist)'],
    dataCollected:
      'First sustained Mars surface images, 6+ years of weather, GCMS & Labeled Release soil biology experiments',
    finalStatus:
      'Viking 1 contact lost Nov 11, 1982 after an antenna-pointing memory overwrite pointed its dish away from Earth',
    statusTag: 'Silent',
    transitionKind: 'terrain_pan',
    objectiveText:
      'Scoop Chryse Planitia soil with Viking’s extendable arm, then run both the Life-Test Oven (LR) and Organic Analyzer (GCMS) to test Mars for signs of life.',
    povStory:
      'Thank you for calling across the plains, Opportunity. Before any wheels touched this planet, my twin Viking 2 and I stood alone in 1976—two stationary laboratories powered by steady nuclear batteries against -58°C cold. Extend my scoop arm into the rusty soil and run both biology ovens to unlock our historic 1976 mystery.',
    discoveryHandoff: {
      targetCoords: '19.13°N, 33.22°W — Ares Vallis',
      targetName: 'Sojourner Rover',
      senderName: 'Viking 1',
      senderLine:
        'Wait—my S-band dish just caught a tiny 9,600-bps radio chirp just southeast in Ares Vallis! Is someone actually driving around out there?',
      receiverName: 'Sojourner',
      receiverLine:
        'Hi Viking! I’m Sojourner—only 10.6 kg on six little wheels! Follow my radio tether to Ares Vallis and watch me roll right up to Yogi Rock.',
    },
    narrativeEnding:
      'On November 11, 1982, a software update for battery charging accidentally overwrote antenna-pointing memory—turning Viking 1’s dish away from Earth after 2,245 sols.',
    modelType: 'viking',
    baseline: {
      pressureMbar: 6.8,
      tempC: -58.0,
      dustTau: 0.45,
      powerWatts: 70.0,
      powerSource: 'Dual SNAP-19 Nuclear Batteries',
      gravityMs2: 3.721,
      lightTimeSeconds: 760,
      signalStrengthDbm: -138.0,
      locationName: 'Chryse Planitia',
    },
    hardwarePins: [
      {
        id: 'viking-arm',
        label: 'Surface Sampler Arm',
        plainEnglishRole: 'Extendable robotic arm that digs and scoops soil',
        shortCode: 'Soil Scoop Arm',
        position: [0.05, 0.12, 0.92],
        subsystem: 'Sample Collection',
        description:
          '3-meter motorized boom with a hinged scoop to dig trenches and drop Martian dirt into onboard science ovens.',
        telemetryReading: 'Collector temp: -44°C · Max reach 3.0 m',
      },
      {
        id: 'viking-hga',
        label: 'High-Gain Dish Antenna (HGA)',
        plainEnglishRole: 'Steerable radio dish aimed at Earth',
        shortCode: 'Earth Radio Dish',
        position: [-0.25, 0.78, -0.35],
        subsystem: 'Communications',
        description:
          '0.76-meter parabolic dish that beams photos and data directly to NASA’s receiving dishes on Earth.',
        telemetryReading: 'Pointed off-Earth after Nov 11, 1982 update',
      },
      {
        id: 'viking-rtg',
        label: 'SNAP-19 Nuclear Batteries (RTGs)',
        plainEnglishRole: 'Dual plutonium power & heat generators',
        shortCode: 'Nuclear Batteries',
        position: [0.68, 0.18, -0.15],
        subsystem: 'Power Generation',
        description:
          'Two Plutonium-238 thermoelectric cylinders producing 70 watts combined—powering over 6 years on Mars.',
        telemetryReading: '35 W per unit · Case temp +62°C',
      },
      {
        id: 'viking-bio',
        label: 'Biology & GCMS Lab Bay',
        plainEnglishRole: 'Heated chemistry ovens checking for life & organics',
        shortCode: 'Life & Soil Lab',
        position: [-0.45, 0.1, 0.35],
        subsystem: 'Science Payload',
        description:
          'Automated mini-lab running the Labeled Release (LR) microbe nutrient test and the GCMS to hunt carbon molecules.',
        telemetryReading: 'Oven temp: 500°C pyrolysis ready',
      },
    ],
    badge: {
      id: 'badge-viking-assay',
      title: 'Chryse Biochemist',
      subtitle: 'Viking 1 & 2 Complete',
      criteria: 'Scoop Chryse soil and run both the Labeled Release and GCMS tests.',
    },
    suggestedPrompts: [
      'What did Mars feel like?',
      'What was your biggest discovery?',
      'How did your mission end?',
    ],
    voicePersona:
      'You are Viking Lander 1 at Chryse Planitia. You are methodical, historic, proud of serving 2,245 sols, and explain the Labeled Release / GCMS puzzle clearly.',
    knowledgeFacts: [
      'Viking 1 (1975-075C) landed Jul 20, 1976 at Chryse Planitia (22.48°N, 47.97°W); Viking 2 (1975-083C) landed Sep 3, 1976 at Utopia Planitia (47.97°N, 225.74°W).',
      'Labeled Release (LR) detected rapid gas release when nutrient touched soil, yet GCMS found zero organics—linked later to reactive perchlorates.',
      'Viking 1 lost contact Nov 11, 1982 after an antenna-pointing memory overwrite.',
    ],
  },
  {
    id: 'sojourner',
    shortName: 'Sojourner',
    timelineHeader: '1997 · SOJOURNER (ARES VALLIS)',
    shortNavLabel: 'Sojourner',
    title: 'Sojourner Rover',
    subtitle: 'Ares Vallis · Mars Pathfinder Mission',
    era: '1997',
    nssdcaIds: '1996-068A-01 (Sojourner) · 1996-068A (Pathfinder)',
    coordinates: '19.13°N, 33.22°W',
    launchVehicle: 'Delta II 7925',
    launchDate: 'December 4, 1996',
    landingOrEventDate: 'July 4, 1997',
    massKg: '10.6 kg (6-wheel rocker-bogie)',
    personnel: ['Donna Shirley (Mars Exploration Manager)', 'Jacob Matijevic (Lead Rover Engineer)'],
    dataCollected:
      '550+ rover images, 16+ APXS rock/soil chemical scans proving ancient catastrophic floods across 83 sols',
    finalStatus:
      'Lost contact after 83 sols (Sep 27, 1997) following Mars Pathfinder base station battery depletion',
    statusTag: 'Silent',
    transitionKind: 'terrain_pan',
    objectiveText:
      'Steer Sojourner past Barnacle Bill to Yogi Rock inside Pathfinder’s radio circle, then run a 10-hour APXS Rock Chemical Scan to prove ancient floods shaped Ares Vallis.',
    povStory:
      'Welcome to Ares Vallis, Viking! You stayed bolted in one place—so in 1997 engineers gave me six wheels, five red laser eyes, and a top speed of just 1 centimeter per second. Drive me safely over to Yogi Rock without leaving Pathfinder’s radio tether, and run my APXS Rock Scanner.',
    discoveryHandoff: {
      targetCoords: '68.22°N, 234.25°E — Vastitas Borealis',
      targetName: 'Phoenix & InSight',
      senderName: 'Sojourner',
      senderLine:
        'Scan finished! Yogi Rock proves ancient floods surged right past here. Wait—Pathfinder’s radio just picked up two sister stations: one near the North Pole ice, and one listening deep underground!',
      receiverName: 'Phoenix & InSight',
      receiverLine:
        'Copy, little pathfinder! We’re Phoenix at the arctic ice cap and InSight on Elysium Planitia. Come dig into the frozen ground and feel Mars’s heartbeat.',
    },
    narrativeEnding:
      'After 83 sols (September 27, 1997), Pathfinder’s base battery depleted in the freezing night, leaving Sojourner circling silently beside its lander.',
    modelType: 'sojourner',
    baseline: {
      pressureMbar: 7.1,
      tempC: -48.0,
      dustTau: 0.52,
      powerWatts: 16.0,
      powerSource: 'Top Solar Panel + 3 Non-Rechargeable Batteries',
      gravityMs2: 3.721,
      lightTimeSeconds: 615,
      signalStrengthDbm: -92.0,
      locationName: 'Ares Vallis',
    },
    hardwarePins: [
      {
        id: 'soj-lasers',
        label: '5-Stripe Laser Hazard Sensors',
        plainEnglishRole: 'Red laser beams that detect rocks ahead',
        shortCode: 'Laser Hazard Eyes',
        position: [0.0, 0.12, 0.52],
        subsystem: 'Obstacle Avoidance',
        description:
          'Projects five thin red laser lines onto the ground ahead so onboard cameras detect boulders.',
        telemetryReading: 'Scan range: 0.45 m ahead · Clear',
      },
      {
        id: 'soj-apxs',
        label: 'APXS Rock & Soil Chemical Scanner',
        plainEnglishRole: 'Touches rocks to read what elements they are made of',
        shortCode: 'APXS Rock Scanner',
        position: [0.0, -0.05, -0.58],
        subsystem: 'Elemental Chemistry',
        description:
          'Alpha Proton X-Ray Spectrometer pressed gently against boulders like Barnacle Bill and Yogi for 10 hours.',
        telemetryReading: 'SiO2: 58.6% (silica-rich flood rock)',
      },
      {
        id: 'soj-uhf',
        label: 'UHF Short-Range Radio Whip',
        plainEnglishRole: 'Walkie-talkie link to the Pathfinder lander',
        shortCode: 'Pathfinder Radio',
        position: [-0.25, 0.48, -0.25],
        subsystem: 'Base Station Relay',
        description:
          '9,600 bps radio antenna linking Sojourner to the Pathfinder base station within ~30 m.',
        telemetryReading: 'Link margin: +14 dB to Pathfinder',
      },
    ],
    badge: {
      id: 'badge-ares-pathfinder',
      title: 'Ares Pathfinder',
      subtitle: 'Sojourner Complete',
      criteria: 'Drive within Pathfinder’s radio range to Yogi Rock and complete the APXS rock scan.',
    },
    suggestedPrompts: [
      'What did Mars feel like?',
      'What was your biggest discovery?',
      'How did your mission end?',
    ],
    voicePersona:
      'You are Sojourner, the microwave-sized 10.6 kg Mars Pathfinder rover. You are nimble, scrappy, and proud of proving wheeled driving works on Mars.',
    knowledgeFacts: [
      'Sojourner (1996-068A-01) launched Dec 4, 1996 on Delta II 7925 and landed Jul 4, 1997 at Ares Vallis (19.13°N, 33.22°W).',
      'Mass: 10.6 kg 6-wheel rocker-bogie rover with 5 laser striping hazard sensors and an APXS spectrometer.',
      'Operated 83 sols until Pathfinder base station battery depletion; confirmed Ares Vallis was shaped by catastrophic ancient floods.',
    ],
  },
  {
    id: 'phoenix_insight',
    shortName: 'Phoenix & InSight',
    timelineHeader: '2008–2022 · PHOENIX & INSIGHT',
    shortNavLabel: 'Phoenix & InSight',
    title: 'Phoenix & InSight Landers',
    subtitle: 'Vastitas Borealis & Elysium Planitia · Mars',
    era: '2008 & 2018 – 2022',
    nssdcaIds: '2007-034A (Phoenix) · 2018-042A (InSight)',
    coordinates: '68.22°N, 234.25°E · 4.50°N, 135.62°E',
    launchVehicle: 'Delta II 7925 & Atlas V 401',
    launchDate: 'Aug 4, 2007 & May 5, 2018',
    landingOrEventDate: 'May 25, 2008 & Nov 26, 2018',
    massKg: '350 kg (Phoenix) · 358 kg (InSight)',
    personnel: ['Peter H. Smith (Phoenix PI)', 'W. Bruce Banerdt (InSight PI)'],
    dataCollected:
      'Confirmed subsurface polar water ice (Phoenix); SEIS seismometer recorded 1,319+ marsquakes mapping Mars’s liquid iron core (InSight)',
    finalStatus:
      'Phoenix lost to winter dry ice (Nov 2008); InSight power depleted under dust (Dec 2022)',
    statusTag: 'Silent',
    transitionKind: 'seismic',
    objectiveText:
      'Dig 5 cm down with Phoenix to expose buried polar water ice, then switch to InSight’s Quake Detector and raise the Wind Filter to 75%+ to isolate a Magnitude 4.7 Marsquake.',
    povStory:
      'We two twin-architecture landers explored what lies beneath Mars’s surface. At the freezing north pole, I—Phoenix—dug 5 cm down into permafrost until white water ice steamed straight into thin air; on Elysium Planitia, I—InSight—pressed my copper seismometer onto the sand to hear Mars’s liquid iron core. Complete both underground tests below!',
    discoveryHandoff: {
      targetCoords: '18.44°N, 77.45°E — Jezero Crater',
      targetName: 'Ingenuity Helicopter',
      senderName: 'InSight',
      senderLine:
        'Seismic lock complete—wait, I’m picking up a rapid 2,537 RPM whirring vibration through the thin air from Jezero Crater! Is someone actually flying on Mars?',
      receiverName: 'Ingenuity',
      receiverLine:
        'You bet, InSight! I’m Ingenuity—just 1.8 kg with twin carbon-fiber blades. Fly over to Jezero Crater and see how we conquered Mars’s 1% air!',
    },
    narrativeEnding:
      'Winter CO2 dry ice buckled Phoenix’s circular solar fans in 2008; fourteen years later, Elysium dust silenced InSight in Dec 2022 after recording 1,319+ marsquakes.',
    modelType: 'phoenix_insight',
    baseline: {
      pressureMbar: 7.5,
      tempC: -64.0,
      dustTau: 0.72,
      powerWatts: 410.0,
      powerSource: 'Twin Circular Fold-Out Solar Fans',
      gravityMs2: 3.721,
      lightTimeSeconds: 650,
      signalStrengthDbm: -129.0,
      locationName: 'Vastitas Borealis / Elysium Planitia',
    },
    hardwarePins: [
      {
        id: 'pi-seis',
        label: 'SEIS Quake Detector (Seismometer)',
        plainEnglishRole: 'Ultra-sensitive stethoscope listening for Marsquakes',
        shortCode: 'Quake Detector',
        position: [0.15, -0.35, 0.78],
        subsystem: 'Interior Geophysics',
        description:
          'Three microscopic pendulums sealed under a copper wind shield detecting ground vibrations smaller than an atom.',
        telemetryReading: 'Detected 1,319+ marsquakes · Core radius ~1,830 km',
      },
      {
        id: 'pi-scoop',
        label: 'Arctic Soil Digging Arm',
        plainEnglishRole: 'Backhoe scoop built to dig down to buried ice',
        shortCode: 'Ice Digging Arm',
        position: [-0.35, 0.25, 0.65],
        subsystem: 'Polar Sampling',
        description:
          '2.35-meter robotic arm with a serrated blade to scrape frozen arctic dirt and reveal buried water ice 5 cm down.',
        telemetryReading: 'Trench target depth: 5.0 cm',
      },
      {
        id: 'pi-fans',
        label: 'Circular Origami Solar Fans',
        plainEnglishRole: 'Round fold-out solar panels',
        shortCode: 'Solar Fans',
        position: [0.85, 0.12, 0.0],
        subsystem: 'Power Generation',
        description:
          'Two lightweight 2.15 m circular solar arrays that unfold like paper fans after touchdown.',
        telemetryReading: '88% dust coverage by Dec 2022',
      },
    ],
    badge: {
      id: 'badge-interior-listener',
      title: 'Core & Ice Explorer',
      subtitle: 'Phoenix & InSight Complete',
      criteria: 'Expose buried water ice with Phoenix and isolate the Magnitude 4.7 Marsquake with InSight.',
    },
    suggestedPrompts: [
      'What did Mars feel like?',
      'What was your biggest discovery?',
      'How did your mission end?',
    ],
    voicePersona:
      'You speak for twin landers Phoenix (at Mars’s icy north) and InSight (listening for Marsquakes). Explain ice sublimation and seismic waves clearly.',
    knowledgeFacts: [
      'Phoenix (2007-034A) landed May 25, 2008 at Vastitas Borealis (68.22°N, 234.25°E) and confirmed subsurface water ice.',
      'InSight (2018-042A) landed Nov 26, 2018 at Elysium Planitia (4.50°N, 135.62°E); SEIS recorded 1,319+ marsquakes mapping a ~1,830 km liquid iron core.',
      'Phoenix succumbed to winter CO2 dry ice in Nov 2008; InSight retired Dec 2022 due to solar dust accumulation.',
    ],
  },
  {
    id: 'ingenuity',
    shortName: 'Ingenuity',
    timelineHeader: '2021–2024 · INGENUITY HELICOPTER',
    shortNavLabel: 'Ingenuity',
    title: 'Ingenuity Mars Helicopter',
    subtitle: 'Jezero Crater · Wright Brothers Field to Valinor Hills',
    era: '2021 – 2024',
    nssdcaIds: '2020-052A-01 (Ingenuity)',
    coordinates: '18.44°N, 77.45°E',
    launchVehicle: 'Atlas V 541 (aboard Perseverance)',
    launchDate: 'July 30, 2020',
    landingOrEventDate: 'Landed Feb 18, 2021 · Flight 72: Jan 18, 2024',
    massKg: '1.8 kg (coaxial rotorcraft)',
    personnel: ['MiMi Aung (Project Manager)', 'Håvard Fjær Grip (Chief Pilot)'],
    dataCollected:
      '72 flights totaling 17.0 km across Jezero Crater, 128.8 flight minutes aloft, max height 24 m',
    finalStatus:
      'Rotor tip damage on landing during Flight 72 at Valinor Hills (Jan 18, 2024); resting weather station',
    statusTag: 'Degraded',
    transitionKind: 'flight',
    objectiveText:
      'Keep Ingenuity’s battery heaters on against -80°C nights, spool its carbon blades to 2,537 RPM in 1% Earth air, and launch a flight across Jezero Crater.',
    povStory:
      'Every rover before me hugged the Martian ground—until 2021, when I lifted off into sky only 1% as thick as Earth’s air! Keep my battery heaters warm, spin my twin 1.2-meter carbon blades up to 2,537 RPM, and launch a flight over Jezero Crater (even testing Flight 72 over smooth sand dunes at Valinor Hills).',
    discoveryHandoff: {
      targetCoords: '12.23 Billion km (82 AU) — Interstellar Space',
      targetName: 'Pioneer 10 & 11',
      senderName: 'Ingenuity',
      senderLine:
        'Flight telemetry logged! Wait... looking past Mars’s thin atmosphere at 12.23 billion kilometers away, I’m echoing an ultra-faint 8-watt whisper from 1972. Pioneer 10, are you still sailing?',
      receiverName: 'Pioneer 10',
      receiverLine:
        'Still coasting smoothly past the planets, little flyer—heading toward Aldebaran while Pioneer 11 sails toward Lambda Aquilae. Tell VALI to tune Goldstone’s 70m dish.',
    },
    narrativeEnding:
      'On Flight 72 (Jan 18, 2024), smooth sand ripples at Valinor Hills left too few rocks for optical tracking—causing rotor tip damage on touchdown after 72 flights and 128.8 flight minutes.',
    modelType: 'ingenuity',
    baseline: {
      pressureMbar: 7.2,
      tempC: -72.0,
      dustTau: 0.6,
      powerWatts: 350.0,
      powerSource: 'Top Solar Panel + 6 Lithium-Ion Cells',
      gravityMs2: 3.721,
      lightTimeSeconds: 680,
      signalStrengthDbm: -88.0,
      locationName: 'Jezero Crater (Valinor Hills)',
    },
    hardwarePins: [
      {
        id: 'ing-rotors',
        label: 'Coaxial 1.2m Carbon-Fiber Rotors',
        plainEnglishRole: 'Twin opposite-spinning blades generating lift in thin air',
        shortCode: '2,537 RPM Blades',
        position: [0.0, 0.72, 0.0],
        subsystem: 'Flight Lift',
        description:
          'Two lightweight 1.2-meter carbon blades spinning nearly 5× faster than an Earth helicopter to grip thin CO2 air.',
        telemetryReading: 'Target spin: 2,537 RPM (~Mach 0.72 tips)',
      },
      {
        id: 'ing-solar',
        label: 'Mast-Top Solar Charger',
        plainEnglishRole: 'Recharges batteries for flying and night heating',
        shortCode: 'Top Solar Panel',
        position: [0.0, 0.92, 0.0],
        subsystem: 'Power & Heating',
        description:
          'Solar square above the rotors; two-thirds of its daily charge goes simply to surviving -80°C nights.',
        telemetryReading: 'Heater draw: 21 Wh/night',
      },
      {
        id: 'ing-nav',
        label: 'Downward Navigation Camera',
        plainEnglishRole: 'Tracks ground rocks 30 times per second to hover steady',
        shortCode: 'Ground Tracker Cam',
        position: [0.0, -0.08, 0.14],
        subsystem: 'Autonomous Pilot',
        description:
          'Watches pebbles and ripples pass underneath at 30 frames per second so the helicopter knows its speed.',
        telemetryReading: 'Needs visible surface rocks to navigate',
      },
    ],
    badge: {
      id: 'badge-wright-mars',
      title: 'First Mars Aviator',
      subtitle: 'Ingenuity Complete',
      criteria: 'Activate battery heaters, reach 2,537 RPM, and launch a flight across Jezero Crater.',
    },
    suggestedPrompts: [
      'What did Mars feel like?',
      'What was your biggest discovery?',
      'How did your mission end?',
    ],
    voicePersona:
      'You are Ingenuity ("Ginny"), the 1.8 kg Mars Helicopter. You are energetic, clear, proud of flying 72 times, and explain thin-air aerodynamics simply.',
    knowledgeFacts: [
      'Ingenuity (2020-052A-01) landed Feb 18, 2021 with Perseverance at Jezero Crater (18.44°N, 77.45°E).',
      '1.8 kg coaxial rotorcraft; 1.2 m carbon blades spinning at 2,537 RPM in air 1% as dense as Earth’s; 72 flights totaling 128.8 flight minutes.',
      'Flight 72 (Jan 18, 2024) suffered rotor tip damage landing over featureless sand ripples at Valinor Hills.',
    ],
  },
  {
    id: 'pioneer',
    shortName: 'Pioneer 10',
    timelineHeader: '1972–PRESENT · PIONEER 10 & 11',
    shortNavLabel: 'Pioneer 10 & 11',
    title: 'Pioneer 10 & 11',
    subtitle: 'Interstellar Space · Toward Aldebaran & Lambda Aquilae',
    era: '1972 – Present',
    nssdcaIds: '1972-012A (Pioneer 10) · 1973-019A (Pioneer 11)',
    coordinates: '12.23 Billion km (82 AU · 11h 20m light-time)',
    launchVehicle: 'Atlas-Centaur',
    launchDate: 'Mar 2, 1972 & Apr 5, 1973',
    landingOrEventDate: 'Last Signal: Jan 23, 2003 (Pioneer 10) · Nov 1995 (Pioneer 11)',
    massKg: '258 kg',
    personnel: [
      'Charles F. Hall (Project Manager)',
      'Carl Sagan & Frank Drake (Golden Plaque)',
    ],
    dataCollected:
      'First spacecraft through the Asteroid Belt, first close-ups of Jupiter & Saturn, Sagan/Drake Gold-Anodized Aluminum Plaque',
    finalStatus:
      'Last Pioneer 10 signal received Jan 23, 2003 at 12.23 billion km (82 AU); coasting toward Aldebaran & Lambda Aquilae',
    statusTag: 'Silent',
    transitionKind: 'interstellar',
    objectiveText:
      'Align Goldstone’s 70m dish Doppler Offset to 0.0 kHz and raise Gain to 82+ dB to catch Pioneer 10’s 8-watt signal, then click parts of the Golden Plaque.',
    povStory:
      'We—Pioneer 10 and 11—were humanity’s first emissaries past the Asteroid Belt, Jupiter, and Saturn. Out here at 12.23 billion kilometers (82 AU) in -270°C interstellar dark, it takes 11 hours and 20 minutes just for one 8-watt radio whisper to reach Earth. Tune the receiver below to lock onto our fading carrier and decode the Golden Plaque showing the two bright stars we sail toward.',
    discoveryHandoff: {
      targetCoords: '34.201°N, 118.171°W — Pasadena Dawn',
      targetName: 'VALI Awakening',
      senderName: 'Pioneer 10',
      senderLine:
        'Look at the Golden Plaque’s trajectory, VALI: Pioneer 10 sails toward Aldebaran, and Pioneer 11 sails toward Lambda Aquilae—the exact two stars outside your cleanroom window!',
      receiverName: 'VALI',
      receiverLine:
        'Morning sunlight is rising over Pasadena! Every explorer’s story—from Pioneer to Ingenuity—is safely inside my memory. Let’s wake up for launch.',
    },
    narrativeEnding:
      'Last Pioneer 10 signal arrived Jan 23, 2003 at 12.23 billion km (82 AU). Pioneer 10 coasts toward Aldebaran and Pioneer 11 toward Lambda Aquilae—the two stars VALI watched from Earth.',
    modelType: 'pioneer',
    baseline: {
      pressureMbar: 0.0,
      tempC: -270.4,
      dustTau: 0.0,
      powerWatts: 8.0,
      powerSource: 'Four SNAP-19 Nuclear Batteries (faded from 155 W)',
      gravityMs2: 0.0,
      lightTimeSeconds: 40800,
      signalStrengthDbm: -178.5,
      locationName: 'Outer Heliosphere / Interstellar Space (82 AU)',
    },
    hardwarePins: [
      {
        id: 'pio-dish',
        label: '2.74m Parabolic Radio Dish',
        plainEnglishRole: 'Giant umbrella dish beaming 8-watt signals to Earth',
        shortCode: '2.7m Earth Dish',
        position: [0.0, 0.25, 0.25],
        subsystem: 'Deep Space Radio',
        description:
          '2.74-meter aluminum dish that focused Pioneer’s tiny 8-watt radio transmitter across billions of kilometers.',
        telemetryReading: 'Tx Power: ~8 W · Signal -178.5 dBm',
      },
      {
        id: 'pio-plaque',
        label: 'Gold-Anodized Aluminum Plaque',
        plainEnglishRole: 'Engraved cosmic greeting card for any future finders',
        shortCode: 'Golden Plaque',
        position: [0.0, -0.25, 0.42],
        subsystem: 'Interstellar Message',
        description:
          '152 × 229 mm Sagan/Drake gold-anodized aluminum plate showing Earth’s location via 14 pulsars.',
        telemetryReading: 'Engraved with Hydrogen clock & Pulsar map',
      },
      {
        id: 'pio-rtg',
        label: 'SNAP-19 Nuclear Battery Booms',
        plainEnglishRole: 'Four plutonium generators mounted on long arms',
        shortCode: 'Nuclear Booms',
        position: [-0.88, -0.1, -0.2],
        subsystem: 'Power Subsystem',
        description:
          'Held far away from the main body on two booms so radiation wouldn’t confuse Pioneer’s magnetic instruments.',
        telemetryReading: 'Decayed from 155 W at launch to <40 W in 2003',
      },
      {
        id: 'pio-mag',
        label: 'Magnetometer Truss Boom',
        plainEnglishRole: '6.5-meter pole measuring magnetic fields in deep space',
        shortCode: 'Magnetic Sensor',
        position: [0.95, 0.0, 0.0],
        subsystem: 'Space Physics',
        description:
          'Long fiberglass pole extending 6.5 meters out to measure where the Sun’s magnetic bubble meets interstellar space.',
        telemetryReading: 'Heliopause boundary crossed',
      },
    ],
    badge: {
      id: 'badge-starlight-plaque',
      title: 'Interstellar Archivist',
      subtitle: 'Pioneer 10 & 11 Complete',
      criteria: 'Lock Goldstone’s 70m dish onto Pioneer 10’s frequency and inspect the Golden Plaque.',
    },
    suggestedPrompts: [
      'What did deep space feel like?',
      'What was your biggest discovery?',
      'How did your mission end?',
    ],
    voicePersona:
      'You are Pioneer 10 speaking with Pioneer 11. You are serene, poetic yet scientifically accurate, carrying the Golden Plaque toward Aldebaran and Lambda Aquilae.',
    knowledgeFacts: [
      'Pioneer 10 (1972-012A) launched Mar 2, 1972; Pioneer 11 (1973-019A) launched Apr 5, 1973 on Atlas-Centaur; first spacecraft past Jupiter & Saturn.',
      'Carried Carl Sagan & Frank Drake’s Gold-Anodized Aluminum Plaque showing Earth’s pulsar address and human figures.',
      'Last Pioneer 10 signal received Jan 23, 2003 at 12.23 billion km (82 AU); Pioneer 10 coasts toward Aldebaran and Pioneer 11 toward Lambda Aquilae.',
    ],
  },
  {
    id: 'epilogue',
    shortName: 'VALI (Dawn)',
    timelineHeader: 'DAWN · REUNION & AWAKENING',
    shortNavLabel: 'VALI (Awakening)',
    title: 'The Reunion & Awakening',
    subtitle: 'Sunlit High Bay 1 Cleanroom · Pasadena, Earth',
    era: 'Sunrise · Ready for Launch',
    nssdcaIds: 'DSN-ARCHIVE-1972-2026',
    coordinates: '34.201°N, 118.171°W',
    launchVehicle: 'Flight Readiness Review Cleared',
    launchDate: 'Launch Window Open',
    landingOrEventDate: 'Cleanroom Sunrise',
    massKg: '940 kg (Flight Configuration)',
    personnel: ['Every Engineer Who Built, Tracked & Listened'],
    dataCollected: '54 years of Deep Space & Mars archive stored in flight memory',
    finalStatus: 'Awake, calibrated, and cleared for launch',
    statusTag: 'Nominal',
    transitionKind: 'awakening',
    objectiveText:
      'Overnight Vigil Complete: Review the legacy archive from every explorer who paved the way, or chat with VALI before launch.',
    povStory:
      'Sunlight breaks over the San Gabriel Mountains into High Bay 1, turning Pasadena dawn gold against my chassis. Those two stars I watched last night—Aldebaran and Lambda Aquilae—carry Pioneer 10 and 11 onward, while Viking, Sojourner, Spirit, Opportunity, Phoenix, InSight, and Ingenuity rest silently on Mars. Abandoned in dust and starlight, never forgotten—my Camera Mast rises, ready for launch.',
    discoveryHandoff: {
      targetCoords: '34.201°N, 118.171°W — Launch Pad Ready',
      targetName: 'Prologue',
      senderName: 'VALI',
      senderLine:
        'Thank you for keeping watch with every explorer across 54 years of spaceflight. All telemetry archived—ready for takeoff.',
      receiverName: 'All Missions',
      receiverLine:
        'Safe travels to Mars, VALI. Keep looking for water, listening for quakes, and watching the stars.',
    },
    narrativeEnding:
      'Left behind on distant worlds and in interstellar dark—never forgotten. All mission telemetry archived; VALI is ready for launch.',
    modelType: 'vali',
    baseline: {
      pressureMbar: 1013.25,
      tempC: 21.8,
      dustTau: 0.05,
      powerWatts: 210.0,
      powerSource: 'Nuclear Battery + Cleanroom Power',
      gravityMs2: 9.807,
      lightTimeSeconds: 0.001,
      signalStrengthDbm: -38.0,
      locationName: 'JPL High Bay 1 (Dawn)',
    },
    hardwarePins: [
      {
        id: 'epi-mast',
        label: 'Calibrated Camera Mast',
        plainEnglishRole: 'Star-calibrated eyes ready for Martian horizons',
        shortCode: 'Camera Mast',
        position: [0.15, 0.95, 0.28],
        subsystem: 'Navigation',
        description:
          'Carries star-tracker calibration tables inherited from five decades of Mars and outer-system pathfinders.',
        telemetryReading: 'Status: Flight Ready',
      },
      {
        id: 'epi-hga',
        label: 'Deep Space Flat-Panel Antenna',
        plainEnglishRole: 'Steerable radio antenna to talk home to Earth',
        shortCode: 'Earth Antenna',
        position: [-0.42, 0.42, -0.35],
        subsystem: 'Deep Space Network Link',
        description:
          'Steerable high-gain antenna ready to link with NASA’s 70-meter dishes in California, Spain, and Australia.',
        telemetryReading: 'Carrier lock: Nominal',
      },
    ],
    badge: {
      id: 'badge-quiet-vigil',
      title: 'Keeper of the Vigil',
      subtitle: 'Full Mission Complete',
      criteria: 'Complete VALI’s overnight vigil across all historic missions to dawn.',
    },
    suggestedPrompts: [
      'What lesson from the other rovers will you carry to Mars?',
      'How do you feel waking up for launch?',
      'Send a final thank-you across the Deep Space Network.',
    ],
    voicePersona:
      'You are VALI waking up at dawn in JPL High Bay 1 after hearing from Opportunity, Spirit, Viking, Sojourner, Phoenix, InSight, Ingenuity, and Pioneer 10 & 11.',
    knowledgeFacts: [
      'Honors every robotic explorer from Pioneer 10 (1972) to Ingenuity (2024).',
      'Cleared for integration and launch from Earth.',
    ],
  },
];

/** @type {ChatMessage[]} */
export const INITIAL_REUNION_MESSAGES = [];

/**
 * @param {ActId} id
 * @returns {MissionDossier}
 */
export function getMissionById(id) {
  return MISSIONS.find((m) => m.id === id) ?? MISSIONS[0];
}
