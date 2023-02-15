import core from '@actions/core'
import getLighthouseReport from './getLighthouseReport.js'
import path from 'node:path'

async function run() {
  try {
    const badgeStyle = core.getInput('badgeStyle')
    const mdName = core.getInput('mdName')
    const url = core.getInput('url')
    core.info(`Getting Lighthouse report for ${url}...`)

    const workspacePath = process.env.GITHUB_WORKSPACE
    const mdFilePath = workspacePath ? path.join(workspacePath, mdName) : mdName

    console.log('Getting Lighthouse report')
    await getLighthouseReport({ url, badgeStyle, mdName: mdFilePath })
    core.info(new Date().toTimeString())
    core.setOutput('time', new Date().toTimeString())
  } catch (error) {
    console.log('Error:')
    console.log(error.message)
    core.setFailed(error.message)
  }
}

run()
