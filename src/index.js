import { readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import core from '@actions/core'

async function run() {
  const data_path = core.getInput('data_path')

  console.log('Action lanzada 1')
  console.log(process.env.GITHUB_PATH)
  console.log('Action lanzada 2')
  // const filePath = path.join()
  // const file = await readFile('./src/file.md', 'utf-8')
  // console.log(file)
}

run()
