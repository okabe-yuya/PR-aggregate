const { Octokit } = require('@octokit/core');
const fs = require('fs')

const DELIMITER = "SPLIT"
const SPLITE_LINE = "NEXTLINE"

const initSetup = () => require('dotenv').config();
const getAccessToken = () => process.env.GITHUB_ACCESS_TOKEN || '';
const getOwner = () => process.env.GITHUB_OWNER_NAME || '';
const getRepo = () => process.env.GITHUB_REPO_NAME || '';
const getComments = async (octokit) => await _getComments(octokit, 1, [], 0);
const _getComments = async (octokit, page, accum, beforeLength) => {
  console.info(`*** Call page number ${page} to githubAPI`)
  const { data, status } = await octokit.request('GET /repos/{owner}/{repo}/pulls/comments', {
    owner: getOwner(),
    repo: getRepo(),
    state: 'all',
    sort: 'created',
    direction: 'desc',
    per_page: 100,
    page: page,
  })
  const next = accum.concat(data);
  if (data === []) return accum;
  if (status !== 200) return accum;
  if (next.length === beforeLength) return accum;
  return await _getComments(octokit, page + 1, next, accum.length);
}
const extractFields= (comments) => comments.map((comment) => {
  return { body: comment.body, createdAt: comment.created_at, writtenBy: comment.user.login }
});
const createTxt = (path, data) => fs.writeFileSync(path, data);
const toTxtFormat = (extracted) =>
  extracted.map((ext => `${ext.body}${DELIMITER}${ext.writtenBy}${DELIMITER}${ext.createdAt}`)).join(`${SPLITE_LINE}\n`);

const main = async () => {
  initSetup();
  const octokit = new Octokit({ auth: getAccessToken() });
  const comments = await getComments(octokit);
  const extracted = extractFields(comments);
  createTxt('./comments.txt', toTxtFormat(extracted));
};

main();