import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const repoRoot = dirname(fileURLToPath(import.meta.url))
const frontendBin = (cmd) => resolve(repoRoot, 'frontend', 'node_modules', '.bin', cmd)

const eslint = frontendBin('eslint')
const prettier = frontendBin('prettier')

const quote = (paths) => paths.map((p) => JSON.stringify(p)).join(' ')

const clangFormat = `uvx --from 'clang-format==18.1.8' clang-format -i`

export default {
  'src/**/*.{c,cc,cpp,h,hpp}': (paths) => `${clangFormat} ${quote(paths)}`,
  'test/**/*.{c,cc,cpp,h,hpp}': (paths) => `${clangFormat} ${quote(paths)}`,
  'frontend/**/*.{ts,tsx,js,jsx,mjs,cjs}': (paths) => [
    `${eslint} --fix ${quote(paths)}`,
    `${prettier} --write ${quote(paths)}`,
  ],
  'frontend/**/*.{json,jsonc,css,scss,html,md,yml,yaml}': (paths) => `${prettier} --write ${quote(paths)}`,
  '*.{json,md,yml,yaml}': (paths) => `${prettier} --write ${quote(paths)}`,
}
