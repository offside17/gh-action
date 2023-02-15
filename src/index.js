import { readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import core from '@actions/core'

async function run() {
  console.log('Action lanzada 1')
  const workspacePath = process.env.GITHUB_WORKSPACE

  const filePath = path.join(workspacePath, 'src', 'file.md')
  console.log('filePath', filePath)
  const file = await readFile(filePath, 'utf-8')
  console.log(file)
}

run()
