import { readFile, writeFile } from 'node:fs/promises'

async function run() {
  console.log('Action lanzada')
  console.log(env.TEST_VAR)
  // const file = await readFile('./src/file.md', 'utf-8')
  // console.log(file)
}

run()
