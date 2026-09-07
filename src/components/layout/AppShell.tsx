import { useEffect, useState } from 'react'
import { Group, Panel, Separator } from 'react-resizable-panels'
import clsx from 'clsx'
import { registerBuiltinMechanisms } from '../../core/mechanisms/templates'
import { useEditorStore } from '../../state/store'
import { parseMjcfString } from '../../core/mjcf/parseMjcf'
import { SAMPLE_FIXTURES } from '../../core/mjcf/sampleFixtures'
import { Toolbar } from './Toolbar'
import { HierarchyTree } from '../tree/HierarchyTree'
import { MechanismPalette } from '../mechanisms/MechanismPalette'
import { ModelSettingsPanel } from '../settings/ModelSettingsPanel'
import { Viewport } from '../viewport/Viewport'
import { PropertyPanel } from '../properties/PropertyPanel'
import { ValidationPanel } from '../importExport/ValidationPanel'

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      className={clsx(
        'flex-1 border-b-2 px-2 py-1.5 text-xs',
        active ? 'border-sky-500 text-neutral-100' : 'border-transparent text-neutral-500 hover:text-neutral-300',
      )}
      onClick={onClick}
    >
      {children}
    </button>
  )
}

export function AppShell() {
  const document = useEditorStore((s) => s.document)
  const loadDocument = useEditorStore((s) => s.loadDocument)
  const [leftTab, setLeftTab] = useState<'tree' | 'palette' | 'settings'>('tree')

  useEffect(() => {
    registerBuiltinMechanisms()
    const demo = SAMPLE_FIXTURES[0]
    loadDocument(parseMjcfString(demo.xml), demo.label)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="flex h-screen w-screen flex-col bg-neutral-950 text-neutral-100">
      <Toolbar />
      <div className="flex-1 overflow-hidden">
        <Group orientation="horizontal" id="main-layout">
          <Panel id="left" defaultSize="20%" minSize="12%">
            <div className="flex h-full flex-col border-r border-neutral-800">
              <div className="flex border-b border-neutral-800">
                <TabButton active={leftTab === 'tree'} onClick={() => setLeftTab('tree')}>
                  Hierarchy
                </TabButton>
                <TabButton active={leftTab === 'palette'} onClick={() => setLeftTab('palette')}>
                  Palette
                </TabButton>
                <TabButton active={leftTab === 'settings'} onClick={() => setLeftTab('settings')}>
                  Settings
                </TabButton>
              </div>
              <div className="flex-1 overflow-y-auto">
                {leftTab === 'tree' && <HierarchyTree />}
                {leftTab === 'palette' && <MechanismPalette />}
                {leftTab === 'settings' && <ModelSettingsPanel />}
              </div>
            </div>
          </Panel>
          <Separator className="w-1 bg-neutral-800 hover:bg-sky-600" />
          <Panel id="center" defaultSize="55%" minSize="20%">
            <Viewport />
          </Panel>
          <Separator className="w-1 bg-neutral-800 hover:bg-sky-600" />
          <Panel id="right" defaultSize="25%" minSize="16%">
            <div className="flex h-full flex-col border-l border-neutral-800">
              <div className="flex-1 overflow-y-auto">
                <PropertyPanel />
              </div>
              <ValidationPanel />
            </div>
          </Panel>
        </Group>
      </div>
      {!document && <div className="p-3 text-xs text-neutral-500">Loading…</div>}
    </div>
  )
}
