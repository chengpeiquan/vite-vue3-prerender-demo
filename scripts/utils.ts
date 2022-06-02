import { resolve as _resolve } from 'path'

export function resolve(p: string) {
  return _resolve(__dirname, `../${p}`)
}
