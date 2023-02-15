import core from '@actions/core'
import getLighthouseReport from './getLighthouseReport.js'

async function run() {
  try {
    const badgeStyle = core.getInput('badgeStyle')
    const commitAuthor = core.getInput('commitAuthor')
    const commitMessage = core.getInput('commitMessage')
    const mdName = core.getInput('mdName')
    const url = core.getInput('url')
    core.info(`Getting Lighthouse report for ${url}...`)

    console.log('Getting Lighthouse report')
    await getLighthouseReport({ url, badgeStyle, mdName })
    core.info(new Date().toTimeString())
    core.setOutput('time', new Date().toTimeString())
  } catch (error) {
    console.log('Error:')
    console.log(error.message)
    core.setFailed(error.message)
  }
}

run()
