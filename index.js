const { json, send } = require('micro')
const { parse } = require('url')
const logger = require('./lib/log')
const validateReq = require('./lib/validate-req')
const runScript = require('./lib/run-script')

module.exports = async (req, res) => {
  const hooks = require('./scripts')
  const { pathname } = await parse(req.url, false) // gets url path

  if (pathname === '/ping') return send(res, 200, 'pong')

  let payload
  /**
  {
    "push_data": {
      "pushed_at": 1583307775,
      "images": [],
      "tag": "latest",
      "pusher": "wangtran1990"
    },
    "callback_url": "https://registry.hub.docker.com/u/wangtran1990/docker_with_sailsjs/hook/2bcdh3i0gbfb14cbaf4be5bi0dc0aj3ea/",
    "repository": {
      "status": "Active",
      "description": "",
      "is_trusted": false,
      "full_description": "xxx",
      "repo_url": "https://hub.docker.com/r/wangtran1990/docker_with_sailsjs",
      "owner": "wangtran1990",
      "is_official": false,
      "is_private": false,
      "name": "docker_with_sailsjs",
      "namespace": "wangtran1990",
      "star_count": 0,
      "comment_count": 0,
      "date_created": 1583049024,
      "dockerfile": "FROM node\n\nENV APP_PATH /venv\n\nWORKDIR $APP_PATH\n\nCOPY start.sh /venv\n\nCOPY source /venv\n\nRUN chmod a+x /venv/*\n\nRUN npm install pm2 -g --silent\n\nRUN npm install --silent\n\nENV NODE_ENV=staging\n\nENTRYPOINT [\"/venv/start.sh\"]\n\nEXPOSE 1400",
      "repo_name": "wangtran1990/docker_with_sailsjs"
    }
  }
  */
  try {
    payload = await json(req) // gets payload
    logger('debug', `Payload from docker hub:\n ${JSON.stringify(payload, null, 2)}`)
  } catch (e) {
    logger('err', 'Missing JSON payload')
    return send(res, 400, 'Missing JSON payload')
  }

  logger('debug', `Requesting ${pathname}`)

  try {
    await validateReq({ pathname, payload, hooks }) // validates token and payload
  } catch (e) {
    logger('err', e.message)
    return send(res, 400, e.message)
  }
  // everything is on it's right place...
  send(res, 204) // sends 'no content' to client
  logger('debug', `Payload from docker hub:\n ${JSON.stringify(payload, null, 2)} \nRunning hook on repo: ${payload.repository.repo_name}`)
  const hook = hooks(payload.repository.repo_name, payload.push_data.tag)

  try {
    const result = await runScript(hook, payload) // runs script
    logger('debug', `${result}\nFinished running hook "${hook}" for repository "${payload.repository.repo_name}"`)
  } catch (e) {
    logger('err', e)
  }
}
