import { readFile, writeFile } from 'node:fs/promises'

async function run() {
  const file = await readFile('./src/file.md', 'utf-8')
  console.log(file)
}

run()
