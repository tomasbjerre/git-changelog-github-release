import * as core from '@actions/core'
import * as github from '@actions/github'

export async function run(): Promise<void> {
  try {
    const ms: string = core.getInput('milliseconds')
    const template = core.getInput('template')
    console.log(`Using template:\n\n${template}\n\n`)
  } catch (error) {
    if (error instanceof Error) core.setFailed(error.message)
  }
}
