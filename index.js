const core = require("@actions/core");
const github = require("@actions/github");
const createBranch = require("./create-branch");

async function run() {
  try {
    const sourceBranch = core.getInput("SOURCE_BRANCH", { required: true });
    const targetBranchPattern = core.getInput("TARGET_BRANCH_STARS_WITH", {
      required: true,
    });
    const githubToken = core.getInput("GITHUB_TOKEN", { required: true });

    const {
      payload: { repository },
    } = github.context;

    const octokit = new github.GitHub(githubToken);
    const { data: targetBranches } = await octokit.git.listMatchingRefs({
      owner: repository.owner.login,
      repo: repository.name,
      ref: `heads/${targetBranchPattern}`,
    });

    for (let branchData of targetBranches) {
      const branch = branchData.ref.replace("refs/heads/", "");
      console.log(`Making a pull request for ${branch} from ${sourceBranch}.`);
      // part of test
      const { data: currentPulls } = await octokit.pulls.list({
        owner: repository.owner.login,
        repo: repository.name,
      });

      // create new branch from SOURCE_BRANCH and PR between new branch and target branch
      const context = github.context;
      const newBranch = `${sourceBranch}-to-${branch}`;

      const currentPull = currentPulls.find((pull) => {
        console.log(pull.head.ref, pull.base.ref);
        return pull.head.ref === newBranch && pull.base.ref === branch;
      });

      if (!currentPull) {
        await createBranch(octokit, context, newBranch);

        const { data: pullRequest } = await octokit.pulls.create({
          owner: repository.owner.login,
          repo: repository.name,
          head: newBranch,
          base: branch,
          title: `sync: ${sourceBranch} to ${branch}`,
          body: `sync-branches: syncing ${branch} with ${sourceBranch}`,
          draft: false,
        });

        console.log(
          `Pull request (${pullRequest.number}) successful! You can view it here: ${pullRequest.url}.`
        );

        core.setOutput("PULL_REQUEST_URL", pullRequest.url.toString());
        core.setOutput("PULL_REQUEST_NUMBER", pullRequest.number.toString());
      } else {
        // If PR exists update PR branch with sourceBranch
        console.log(
          `There is already a pull request (${currentPull.number}) to ${branch} from ${newBranch}.\n`
        );
        console.log("Updating PR branch...");

        await octokit.repos.merge({
          owner: repository.owner.login,
          repo: repository.name,
          base: newBranch,
          head: context.sha,
        });

        console.log("PR branch updated\n");
        console.log(`You can view it here: ${currentPull.url}`);

        core.setOutput("PULL_REQUEST_URL", currentPull.url.toString());
        core.setOutput("PULL_REQUEST_NUMBER", currentPull.number.toString());
      }
    }
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
