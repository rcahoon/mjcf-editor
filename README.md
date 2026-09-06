# MJCF Editor

A browser-based graphical editor for MuJoCo MJCF robot description files, aimed at FIRST Robotics Competition teams. Runs entirely client-side — no backend, no accounts.

## Features

- Hierarchical tree view of a robot's bodies, joints, geoms, sites, actuators, and sensors.
- Live 3D preview (visual meshes, primitives, joint axes) built with react-three-fiber.
- In-3D editing: drag a body/site with the transform gizmo, or edit properties as typed fields — both write to the same document, so they stay in sync.
- A per-joint pose-preview slider (visual only, not a physics simulation).
- Actuator and sensor panels with joint/site target pickers instead of free-typed names.
- Import a bare `.xml`/`.mjcf` file, or a folder/`.zip` bundling the model with its referenced meshes.
- Export standards-compliant, flattened MJCF that loads in real MuJoCo.
- A small FRC mechanism palette (Arm, Elevator) — reusable, parameterized subtrees you can insert repeatedly with automatic name-namespacing, so two instances never collide.

## Getting started

```bash
npm install
npm run dev      # start the dev server
npm run test     # run the core-logic test suite (Vitest)
npm run build    # production build
```

## Architecture

- `src/core/` — framework-agnostic MJCF parsing/serialization, the typed data model, rotation math, and the mechanism/prefab system. No React or Three imports; unit-tested directly.
- `src/state/` — the zustand store and the mutation functions ("actions") UI code calls to edit the document.
- `src/components/` — the tree view, 3D viewport, property panels, mechanism palette, and import/export UI.

The MJCF document is parsed into two layers that share object references: a generic XML tree (preserves anything this editor doesn't specifically model) and a typed overlay (bodies/joints/geoms/actuators/sensors) whose fields write straight through to the same underlying XML nodes. Because of that shared-reference structure, the document is mutated in place rather than replaced immutably — see the `revision` counter in `src/state/store.ts`.

## Known limitations (by design, for this initial version)

- Mechanism instances are edited only through their param dialog; once inserted, their internal MJCF isn't hand-editable as raw XML. Exporting always fully flattens instances into plain MJCF, so files always load in real MuJoCo — but re-importing an exported file yields a plain body tree, not a live instance.
- No physics simulation — the pose-preview slider is a visual forward-kinematics check on one joint at a time, not a solver.
- Visual vs. collision geom classification is heuristic (`contype`/`conaffinity` based), matching common convention but not a hard MJCF rule.
- Tendons, equality constraints, and `<default>` classes are preserved on export but don't have dedicated editing UI yet.
- The mechanism palette currently ships two templates (Arm, Elevator); the registry (`src/core/mechanisms/registry.ts`) is designed so more (swerve module, intake, etc.) can be added as focused follow-ups.
