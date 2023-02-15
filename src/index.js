import { readFile, writeFile } from 'node:fs/promises'

async function run() {
  console.log('Action lanzada 1')
  console.log(env.TEST_VAR)
  console.log('Action lanzada 2')
  // const file = await readFile('./src/file.md', 'utf-8')
  // console.log(file)
}

run()
