import { unzip } from 'fflate'
import type { FileMap } from './resolveAssets'

export interface ImportedModelFiles {
  files: FileMap
  xmlText: string
  xmlPath: string
}

export async function importZipFile(zipFile: File): Promise<ImportedModelFiles> {
  const buf = new Uint8Array(await zipFile.arrayBuffer())
  const unzipped = await new Promise<Record<string, Uint8Array>>((resolve, reject) => {
    unzip(buf, (err, data) => (err ? reject(err) : resolve(data)))
  })
  const files: FileMap = new Map()
  let xmlPath: string | undefined
  let xmlText: string | undefined
  for (const [path, bytes] of Object.entries(unzipped)) {
    if (path.endsWith('/')) continue
    files.set(path, new Blob([bytes as BlobPart]))
    if (!xmlPath && /\.(xml|mjcf)$/i.test(path)) {
      xmlPath = path
      xmlText = new TextDecoder().decode(bytes)
    }
  }
  if (!xmlPath || xmlText === undefined) {
    throw new Error('Zip file does not contain an .xml/.mjcf model file')
  }
  return { files, xmlText, xmlPath }
}
