const quote = (paths) => paths.map((p) => JSON.stringify(p)).join(' ')

const clangFormat = `uv run clang-format -i`
const eslintFix = `yarn workspace flea-frontend exec eslint --fix`
const prettierWrite = `yarn workspace flea-frontend exec prettier --write`

export default {
  'src/**/*.{c,cc,cpp,h,hpp}': (paths) => `${clangFormat} ${quote(paths)}`,
  'test/**/*.{c,cc,cpp,h,hpp}': (paths) => `${clangFormat} ${quote(paths)}`,
  'frontend/**/*.{ts,tsx,js,jsx,mjs,cjs}': (paths) => [
    `${eslintFix} ${quote(paths)}`,
    `${prettierWrite} ${quote(paths)}`,
  ],
  'frontend/**/*.{json,jsonc,css,scss,html,md,yml,yaml}': (paths) => `${prettierWrite} ${quote(paths)}`,
  '*.{json,md,yml,yaml}': (paths) => `${prettierWrite} ${quote(paths)}`,
}
