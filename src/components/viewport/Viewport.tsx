import { useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { Grid, OrbitControls } from '@react-three/drei'
import { useEditorStore } from '../../state/store'
import { SceneRoot } from './SceneRoot'
import { SelectionGizmo } from './SelectionGizmo'

export function Viewport() {
  const document = useEditorStore((s) => s.document)
  const select = useEditorStore((s) => s.select)
  const [orbitEnabled, setOrbitEnabled] = useState(true)

  return (
    <div className="h-full w-full bg-neutral-900">
      <Canvas
        shadows
        camera={{ position: [1.2, 1.2, 1.0], fov: 50, up: [0, 0, 1] }}
        onPointerMissed={() => select(null)}
      >
        <color attach="background" args={['#1a1b1f']} />
        <hemisphereLight intensity={0.6} groundColor="#222" />
        <directionalLight position={[2, 2, 3]} intensity={1.1} castShadow />
        <Grid
          args={[10, 10]}
          rotation={[Math.PI / 2, 0, 0]}
          cellColor="#3f3f46"
          sectionColor="#52525b"
          fadeDistance={15}
          infiniteGrid
        />
        {document && <SceneRoot doc={document} />}
        {document && <SelectionGizmo onDraggingChange={(dragging) => setOrbitEnabled(!dragging)} />}
        <OrbitControls makeDefault enabled={orbitEnabled} target={[0, 0, 0.2]} />
      </Canvas>
    </div>
  )
}
