import { getAttr } from '../mjcf/attrUtils'
import type { MjcfDocument } from '../mjcf/types'

export type FileMap = Map<string, File | Blob>

function joinPath(dir: string, file: string): string {
  if (!dir) return file
  const cleanDir = dir.endsWith('/') ? dir : `${dir}/`
  return `${cleanDir}${file}`
}

function findByBasename(files: FileMap, file: string): File | Blob | undefined {
  const basename = file.split('/').pop()
  if (!basename) return undefined
  for (const [path, blob] of files) {
    if (path.split('/').pop() === basename) return blob
  }
  return undefined
}

/**
 * Resolves each asset's relative `file` path against an imported file set
 * (from a folder or zip upload) into a blob URL, honoring the compiler's
 * meshdir/texturedir prefix when present. Falls back to a basename-only
 * match so a flat folder of meshes still resolves even if the MJCF's
 * relative paths include subdirectories the user didn't preserve.
 */
export function resolveAssets(doc: MjcfDocument, files: FileMap): void {
  const meshdir = getAttr(doc.compiler.xml, 'meshdir') ?? getAttr(doc.compiler.xml, 'assetdir') ?? ''
  const texturedir = getAttr(doc.compiler.xml, 'texturedir') ?? getAttr(doc.compiler.xml, 'assetdir') ?? ''
  for (const asset of doc.assets) {
    if (!asset.file) continue
    const dir = asset.kind === 'texture' ? texturedir : meshdir
    const candidate = joinPath(dir, asset.file)
    const blob = files.get(candidate) ?? files.get(asset.file) ?? findByBasename(files, asset.file)
    if (blob) {
      if (asset.resolvedUrl) URL.revokeObjectURL(asset.resolvedUrl)
      asset.resolvedUrl = URL.createObjectURL(blob)
    }
  }
}

export function revokeAssetUrls(doc: MjcfDocument): void {
  for (const asset of doc.assets) {
    if (asset.resolvedUrl) URL.revokeObjectURL(asset.resolvedUrl)
  }
}
