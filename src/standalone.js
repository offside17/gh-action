import getLighthouseReport from './getLighthouseReport.js'

async function run() {
  console.log('Getting Lighthouse report')
  await getLighthouseReport({
    url: 'https://octagon-api.com',
    badgeStyle: 'plastic',
    mdName: 'README.md',
  })
}

run()
