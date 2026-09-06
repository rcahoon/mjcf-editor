import { OBJLoader, STLLoader } from 'three-stdlib'
import type { BufferGeometry, Mesh } from 'three'

const cache = new Map<string, Promise<BufferGeometry>>()

/** Loads an STL or OBJ mesh (by blob URL) into a three.js BufferGeometry,
 * cached by URL so repeated instances of the same mesh asset share one load. */
export function loadMeshGeometry(url: string, filename?: string): Promise<BufferGeometry> {
  const cached = cache.get(url)
  if (cached) return cached

  const isObj = /\.obj$/i.test(filename ?? url)
  const promise = new Promise<BufferGeometry>((resolve, reject) => {
    if (isObj) {
      new OBJLoader().load(
        url,
        (group) => {
          const mesh = group.children.find((c): c is Mesh => (c as Mesh).isMesh === true)
          if (mesh) resolve(mesh.geometry as BufferGeometry)
          else reject(new Error('OBJ file contained no mesh'))
        },
        undefined,
        reject,
      )
    } else {
      new STLLoader().load(url, (geometry) => resolve(geometry), undefined, reject)
    }
  })
  cache.set(url, promise)
  return promise
}
