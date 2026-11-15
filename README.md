# Sol Zero

An interactive, story-driven space simulation built for the **NASA Space Apps Challenge 2026** (*Abandoned but Not Forgotten*).

**Sol Zero** invites students and curious explorers to step inside the real physics, engineering, and stories of the NASA rovers, landers, helicopters, and deep-space probes left behind on Mars and beyond—turning archived mission data into a playable journey.

---

## The Story

Inside a quiet cleanroom at NASA's Jet Propulsion Laboratory in Pasadena, **VALI**—a newly built scout rover awaiting launch—looks out the observation window at two steady points of light in the night sky. When VALI enters overnight standby mode, its radio telemetry traces a carrier signal across 225 million kilometers to Mars.

From there, you experience the mission logs of humanity's trailblazing machines in order:
1. **JPL Cleanroom (VALI):** Align VALI's optical mast with the two stars outside the window and initiate an overnight Deep Space Network radio pulse.
2. **Meridiani Planum & Gusev Crater (Spirit & Opportunity):** Manage dust storm opacity, trigger passing dust devils to clear solar arrays, and grind Martian bedrock to uncover mineral proof of ancient water.
3. **Chryse & Utopia Planitia (Viking 1 & 2):** Extend the 1976 sampling arm into Martian soil to run heated biology experiments and experience the antenna command error that silenced Viking 1.
4. **Ares Vallis (Sojourner):** Navigate around ancient floodplain boulders at one centimeter per second using five laser hazard sensors while staying within radio range of Mars Pathfinder.
5. **Vastitas Borealis & Elysium Planitia (Phoenix & InSight):** Dig into arctic frost to watch water-ice sublimate in Mars's thin atmosphere, and filter Martian wind noise to detect the tremors of marsquakes.
6. **Jezero Crater (Ingenuity):** Warm the batteries against minus-eighty-degree nights and spin carbon-fiber blades at 2,537 RPM to fly in air one percent as dense as Earth's across 72 flights.
7. **Interstellar Space (Pioneer 10 & 11):** Tune a 70-meter Deep Space Network dish to lock onto Pioneer 10's 8-watt whisper over 12 billion kilometers away—discovering that the two stars VALI saw from Earth are the Pioneer probes drifting among the stars.
8. **Deep Space Reunion:** Listen in as all the explorers encourage VALI before morning sunlight breaks over Pasadena and VALI powers up ready for launch.

---

## Key Features

- **Playable Planetary Physics:** Real Martian atmospheric pressure, dust opacity ($\tau$), temperature extremes, rotor RPM, and deep-space signal attenuation.
- **Organic Rover-to-Rover Transitions:** Completing an explorer's objective triggers a real-time radio conversation with the next spacecraft before smoothly panning to its landing site.
- **3D Hardware Inspector & NASA NSSDCA Dossier:** Inspect spacecraft instruments and explore verified mission coordinates, launch vehicles, and telemetry sourced from the [NASA Space Science Data Coordinated Archive (NSSDCA)](https://nssdc.gsfc.nasa.gov/nmc/dataset/query.action).
- **1-on-1 Spacecraft Comms:** Open the floating comms drawer in any stage to ask the active rover or probe questions directly.
- **Cloud Persistence:** Powered by Supabase to save session progress, telemetry states, storylines, and rover conversations.

---

## Tech Stack

- **Frontend:** React, Vite, Tailwind CSS, Lucide Icons
- **Backend & Database:** Node.js, Supabase (`@supabase/supabase-js`)
- **AI Comms:** Google Gemini API
- **Scientific Reference Data:** NASA NSSDCA Master Catalog

---

## Running Locally

### 1. Clone the Repository
```bash
git clone [https://github.com/YOUR_USERNAME/NASA_SpaceApps.git](https://github.com/YOUR_USERNAME/NASA_SpaceApps.git)
cd NASA_SpaceApps
2. Install Dependencies
Bash
npm install
3. Configure Environment Variables
Copy .env.example into a new file named .env in the root folder and fill in your keys:

Code snippet
VITE_GEMINI_API_KEY="your_gemini_api_key"
VITE_SUPABASE_URL="your_supabase_project_url"
VITE_SUPABASE_ANON_KEY="your_supabase_anon_key"
4. Set Up Supabase (Optional for Cloud Sync)
Run the SQL script in supabase_schema.sql inside your Supabase SQL Editor to create the missions, rover_pov_storylines, stage_transitions, rover_chats, and session_progress tables. (The app includes built-in fallback data so it still runs smoothly offline.)

5. Start the App
Bash
npm run dev
Open http://localhost:3000 (or the local port printed in your terminal) in your browser.

Project Structure
Plaintext
├── src/
│   ├── components/
│   │   ├── stages/
│   │   │   ├── Prologue.jsx      # VALI in JPL High Bay 1
│   │   │   ├── Act1.jsx          # Spirit & Opportunity
│   │   │   ├── Act2.jsx          # Viking 1 & 2
│   │   │   ├── Act3.jsx          # Sojourner & Pathfinder
│   │   │   ├── Act4.jsx          # Phoenix & InSight
│   │   │   ├── Act5.jsx          # Ingenuity
│   │   │   ├── Act6.jsx          # Pioneer 10 & 11
│   │   │   └── Epilogue.jsx      # Cross-Era Reunion & Launch Readiness
│   │   ├── AppShell.jsx          # Mission timeline, objectives & transitions
│   │   ├── Spacecraft3D.jsx      # Hardware inspector & NSSDCA dossier
│   │   └── FloatingRoverChat.jsx # 1-on-1 spacecraft comms drawer
│   ├── data/
│   │   └── missionsData.js       # Verified NSSDCA metadata & dialogue scripts
│   └── lib/
│       └── supabaseClient.js     # Supabase client & data sync helpers
├── supabase_schema.sql           # Database schema & policies
└── .env.example                  # Required environment variable template
Data Attribution
All spacecraft designations, launch dates, landing coordinates, instrument specifications, and mission timelines are grounded in official records from the NASA Space Science Data Coordinated Archive (NSSDCA).