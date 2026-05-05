#!/usr/bin/env node

/**
 * Node.js background removal script using RMBG SDK
 * Usage: node remove-bg-node.js <input> [options]
 */

const { rmbg, createBriaaiModel, createModnetModel, createU2netpModel } = require('rmbg')
const { readFileSync, writeFileSync, existsSync } = require('fs')
const { basename, extname } = require('path')

// Parse command line arguments
const args = process.argv.slice(2)

if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
  console.log(`
Background Removal using RMBG SDK

Usage: node remove-bg-node.js <input> [options]

Arguments:
  input               Input image file path (required)

Options:
  -o, --output <path>     Output file path (default: auto-generated)
  -m, --model <name>      Model: briaai, modnet, u2netp (default: modnet)
  -r, --resolution <n>    Max resolution in pixels (default: 2048)
  -p, --progress          Show progress information
  -h, --help              Show this help message

Examples:
  node remove-bg-node.js photo.jpg
  node remove-bg-node.js photo.jpg -m briaai -o output.png
  node remove-bg-node.js photo.jpg -r 4096 -p
`)
  process.exit(0)
}

// Parse options
const input = args[0]
let output = null
let model = 'modnet'
let maxResolution = 2048
let showProgress = false

for (let i = 1; i < args.length; i++) {
  const arg = args[i]
  if (arg === '-o' || arg === '--output') {
    output = args[++i]
  } else if (arg === '-m' || arg === '--model') {
    model = args[++i]
  } else if (arg === '-r' || arg === '--resolution') {
    maxResolution = parseInt(args[++i], 10)
  } else if (arg === '-p' || arg === '--progress') {
    showProgress = true
  }
}

// Validate input
if (!input) {
  console.error('Error: Input file is required')
  process.exit(1)
}

if (!existsSync(input)) {
  console.error(`Error: Input file '${input}' not found`)
  process.exit(1)
}

// Generate output filename if not provided
if (!output) {
  const name = basename(input, extname(input))
  output = `${name}-no-bg.png`
}

// Select model
let modelInstance
switch (model.toLowerCase()) {
  case 'briaai':
    modelInstance = createBriaaiModel()
    break
  case 'u2netp':
    modelInstance = createU2netpModel()
    break
  case 'modnet':
  default:
    modelInstance = createModnetModel()
    break
}

// Display configuration
console.log('Background Removal Configuration:')
console.log(`  Input:      ${input}`)
console.log(`  Model:      ${model}`)
console.log(`  Output:     ${output}`)
console.log(`  Resolution: ${maxResolution}`)
console.log('')

// Remove background
async function removeBackground() {
  try {
    console.log('Processing...')
    const startTime = Date.now()

    const options = {
      model: modelInstance,
      maxResolution,
      output
    }

    if (showProgress) {
      options.onProgress = (progress, download, process) => {
        const percent = Math.round(progress * 100)
        const downloadPercent = Math.round(download * 100)
        const processPercent = Math.round(process * 100)

        process.stdout.write(
          `\rProgress: ${percent}% | Download: ${downloadPercent}% | Process: ${processPercent}%`
        )
      }
    }

    await rmbg(input, options)

    const duration = ((Date.now() - startTime) / 1000).toFixed(2)

    if (showProgress) {
      console.log('') // New line after progress
    }

    console.log('✓ Background removed successfully')
    console.log(`  Output: ${output}`)
    console.log(`  Duration: ${duration}s`)

    // Display file sizes
    const inputStats = require('fs').statSync(input)
    const outputStats = require('fs').statSync(output)

    console.log('')
    console.log('File sizes:')
    console.log(`  Input:  ${formatBytes(inputStats.size)}`)
    console.log(`  Output: ${formatBytes(outputStats.size)}`)
  } catch (error) {
    console.error('✗ Background removal failed:', error.message)
    process.exit(1)
  }
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
}

// Run
removeBackground()
