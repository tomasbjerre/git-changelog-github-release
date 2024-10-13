import * as core from '@actions/core'
import { context, getOctokit } from '@actions/github'
import { spawnSync } from 'child_process'

function gitChangelogCommandLine(userArgs: string[]) {
  const { stdout, stderr, status } = spawnSync(
    'java',
    ['-jar', __dirname + '/cli.jar', ...userArgs],
    { encoding: 'utf-8' }
  )
  console.log(`stdout: ${stdout}`)
  console.log(`stderr: ${stderr}`)
  console.log(`status: ${status}`)
  if (!status) {
    return stdout
  }
  throw Error(
    `Error (${status}) from git-changelog-command-line:\n\n${userArgs}\n\n${stderr}\n\n`
  )
}

export async function run(): Promise<void> {
  try {
    /**
     * Auth
     */
    const token = process.env.GITHUB_TOKEN ?? process.env.GITHUB_OAUTH2TOKEN
    if (!token) {
      throw new Error(`No token specified`)
    }
    const { owner, repo } = context.repo

    /**
     * Config
     */
    const draft = core.getInput('draft', { required: false }) === 'true'

    const template = core.getInput('template')
    console.log(`Using template:\n\n${template}\n\n`)

    /**
     * Gather details on release
     */
    const highestVersion = gitChangelogCommandLine(['--print-highest-version'])
    console.log(`highestVersion: ${highestVersion}`)

    const highestVersionTag = gitChangelogCommandLine([
      '--print-highest-version-tag'
    ])
    console.log(`highestVersionTag: ${highestVersionTag}`)

    let currentVersion = gitChangelogCommandLine([
      '--patch-version-pattern',
      '^fix.*',
      '--print-current-version'
    ])
    console.log(`Rendered currentVersion:\n\n${currentVersion}\n\n`)

    if (highestVersionTag) {
      if (currentVersion === highestVersion) {
        console.log(`No changes made that can be released`)
        return
      } else {
        console.log(
          `Changes detected and a new ${currentVersion} release can be made`
        )
      }
    } else {
      console.log(
        `This is the first version in the repo, using 0.0.1 as version`
      )
      currentVersion = '0.0.1'
    }

    const description = gitChangelogCommandLine([
      '-std',
      '--template-content',
      template
    ])
    console.log(`Rendered description:\n\n${description}\n\n`)

    /**
     * Remove any previous draft
     */
    const latestRelease = await getOctokit(token).rest.repos.listReleases({
      owner,
      repo
    })
    latestRelease.data.forEach(release => {
      if (!release.draft) {
        return
      }
      console.log(
        `Removing previous draft (${release.id}):\n\n${release.body_text}\n\n`
      )
      getOctokit(token).rest.repos.deleteRelease({
        owner,
        repo,
        release_id: release.id
      })
    })

    /**
     * Create the release
     */
    const createReleaseResponse = await getOctokit(
      token
    ).rest.repos.createRelease({
      owner,
      repo,
      tag_name: currentVersion,
      name: currentVersion,
      body: description,
      draft,
      prerelease: false,
      target_commitish: context.sha
    })

    const {
      data: { id: releaseId, html_url: htmlUrl, upload_url: uploadUrl }
    } = createReleaseResponse

    core.setOutput('id', releaseId)
    core.setOutput('html_url', htmlUrl)
    core.setOutput('upload_url', uploadUrl)
    core.setOutput('version', currentVersion)
    core.setOutput('description', description)
  } catch (error) {
    const msg = `Unable to create release. Perhaps the token does not have write-permission, change it in the repo settings '/settings/actions'.`
    console.log(msg)
    if (error instanceof Error) core.setFailed(`${msg} ${error.message}`)
  }
}
