# THE MOLE — 3D browser prototype (v0.2)

A stylized, low-poly social-horror exploration prototype built with Three.js and Vite.

## Run it
1. Install Node.js (18+ recommended).
2. Extract this ZIP.
3. Open a terminal in the extracted folder.
4. Run `npm install`
5. Run `npm run dev`
6. Open the local address Vite prints (usually `http://localhost:5173`).

## Controls
- W A S D: move
- Shift: run
- E: interact with nearby door or passenger
- C: cycle isometric / third-person / first-person camera
- On mobile: use the on-screen directional pad
- Buttons: house map and practice meeting

## What's new in v0.2
- Connected multi-room haunted-house layout with furniture, windows, lighting and exterior trees.
- Low-poly, animated Bitmoji-inspired passenger avatars with name labels.
- Walk/run animation, NPC idle movement, interactive front door and passenger conversations.
- Three camera modes, responsive layout and basic touch movement.

## Important
This is a local browser prototype, not a hosted public website. It currently runs as a single-player demo. Online multiplayer, real friend accounts, persistent profiles, full role assignment, and advanced AI are not implemented yet. Deploy the project folder to a web host (for example, a static hosting service) after building with `npm run build`.


## v0.3 gameplay upgrade
- A round assigns one hidden Mole, one Detective, one Doctor and Citizens.
- Your role is revealed privately at the start.
- The Detective can investigate; the Doctor can protect; the Mole gets a secret action.
- Emergency meetings let the group vote out a passenger.
- The demo checks simple win conditions and lets you restart.
- This is still a local single-player simulation: NPC conversations and votes are scripted, not real online players.


## v0.4 social lobby upgrade
- Passenger count is generated each round (5–9 total including you), not locked to one bus capacity.
- Passenger list shows who is still in the house.
- Local chat panel accepts player messages and displays scripted passenger messages.
- The round role deck scales with the passenger count.
- Win checking now stops the round correctly when a side wins.

## Still not online multiplayer
Chat and passengers in this build are local simulation features. Real accounts, friend requests, matchmaking and live multiplayer require a hosted server and database, which are not included in this ZIP.

- Improved night-turn resolution so the Mole action, Doctor protection and Detective investigation all resolve in the same round flow.
