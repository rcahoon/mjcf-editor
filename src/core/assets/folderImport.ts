import type { FileMap } from './resolveAssets'
import type { ImportedModelFiles } from './zipImport'

interface FileWithRelativePath extends File {
  webkitRelativePath: string
}

export async function importFolderFiles(fileList: FileList): Promise<ImportedModelFiles> {
  const files: FileMap = new Map()
  let xmlPath: string | undefined
  let xmlFile: File | undefined
  for (const file of Array.from(fileList)) {
    const relPath = (file as FileWithRelativePath).webkitRelativePath || file.name
    files.set(relPath, file)
    if (!xmlPath && /\.(xml|mjcf)$/i.test(file.name)) {
      xmlPath = relPath
      xmlFile = file
    }
  }
  if (!xmlPath || !xmlFile) {
    throw new Error('Folder does not contain an .xml/.mjcf model file')
  }
  const xmlText = await xmlFile.text()
  return { files, xmlText, xmlPath }
}
