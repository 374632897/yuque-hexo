const SDK = require('@yuque/sdk');

const getToken = () => {
  if (process.env.hasOwnProperty('TOKEN')) {
    return process.env.TOKEN;
  }
  const fs = require('fs')
  const path = require('path')
  let tokenPath
  try {
    tokenPath = path.resolve('./.token')
    return fs.readFileSync(tokenPath).toString('utf-8').trim().replace(/\n/g, '')
  } catch(e) {
    const chalk = require('chalk')
    console.log(chalk.red('缺少语雀的token!!!'))
    console.log(chalk.yellow('可以前往 https://www.yuque.com/settings/tokens/ 生成相应 token 并复制'))
    console.log(chalk.yellow('然后执行 "clippaste > .token" （建议）, 或者在调用命令时执行 TOKEN=${token}'))
    process.exit(0)
  }
}

const token = getToken()

const client = new SDK({
  token,
  userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.163 Safari/537.36'
});

module.exports = client;
