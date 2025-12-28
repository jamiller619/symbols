import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { transform } from '@svgr/core'
import { execa } from 'execa'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const appRoot = path.resolve(__dirname, '..')
const svgDir = path.resolve(appRoot, 'src/sf-symbols')
const componentsDir = path.resolve(appRoot, 'dist/components')
const relative = (targetPath: string) => path.relative(appRoot, targetPath)

async function main() {
  await ensureSvgIcons()
  await buildReactComponents()
  await formatComponents()
}

async function ensureSvgIcons() {
  const svgPathState = await detectSvgDir()

  if (svgPathState === 'directory') {
    console.log(
      `Skipping SF Symbols SVG generation; directory already exists at ${relative(svgDir)}`,
    )
    return
  }

  if (svgPathState === 'file') {
    throw new Error(
      `${relative(svgDir)} exists but is not a directory. Remove it so icons can be generated.`,
    )
  }

  console.log('Generating SF Symbols SVGs...')

  await execa('yarn', ['sf-symbols-svg', '-o', relative(svgDir)], {
    cwd: appRoot,
    stdio: 'inherit',
  })
}

async function buildReactComponents() {
  const svgPathState = await detectSvgDir()

  if (svgPathState !== 'directory') {
    throw new Error(
      `SVG icon directory not found at ${relative(svgDir)}. Generation may have failed.`,
    )
  }

  const entries = await fs.readdir(svgDir, { withFileTypes: true })
  const svgFiles = entries.filter(
    (entry) => entry.isFile() && entry.name.endsWith('.svg'),
  )

  if (svgFiles.length === 0) {
    console.log(
      `No SVG icons found in ${relative(svgDir)}; nothing to transform.`,
    )
    return
  }

  await fs.rm(componentsDir, { recursive: true, force: true })
  await fs.mkdir(componentsDir, { recursive: true })

  console.log(`Transforming ${svgFiles.length} icon(s) to React components...`)

  for (const svg of svgFiles) {
    const svgPath = path.join(svgDir, svg.name)
    const svgContent = await fs.readFile(svgPath, 'utf8')
    const componentName = toComponentName(svg.name)

    const componentSource = await transform(
      svgContent,
      {
        icon: true,
        typescript: true,
        jsxRuntime: 'automatic',
        prettier: false,
        plugins: ['@svgr/plugin-jsx'],
      },
      { componentName },
    )

    const componentPath = path.join(componentsDir, `${componentName}.tsx`)
    await fs.writeFile(componentPath, componentSource, 'utf8')
  }

  console.log(
    `Generated ${svgFiles.length} component(s) in ${relative(componentsDir)}.`,
  )
}

async function formatComponents() {
  try {
    const stats = await fs.stat(componentsDir)
    if (!stats.isDirectory()) {
      console.log(
        `Skipping Prettier; ${relative(componentsDir)} exists but is not a directory.`,
      )
      return
    }
  } catch (error: unknown) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      console.log(
        `Skipping Prettier; components directory missing at ${relative(componentsDir)}.`,
      )
      return
    }

    throw error
  }

  console.log('Formatting generated components with Prettier...')

  await execa('yarn', ['prettier', '--write', relative(componentsDir)], {
    cwd: appRoot,
    stdio: 'inherit',
  })
}

function toComponentName(fileName: string) {
  const base = fileName.replace(/\.svg$/i, '')
  const parts = base.split(/[^a-zA-Z0-9]+/).filter(Boolean)

  const name = parts
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('')

  const safeName = name || 'Icon'
  return /^[A-Za-z]/.test(safeName) ? `${safeName}Icon` : `Icon${safeName}`
}

async function detectSvgDir(): Promise<'missing' | 'directory' | 'file'> {
  try {
    const stats = await fs.stat(svgDir)

    if (stats.isDirectory()) return 'directory'
    if (stats.isFile()) return 'file'
  } catch (error: unknown) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return 'missing'
    }

    throw error
  }

  return 'missing'
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
