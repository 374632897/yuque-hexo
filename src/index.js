const chalk = require('chalk')
const {
  getNamespace,
  getDocs,
  getDoc,
  writeToFile,
  syncDoc,
} = require('./util')

let cnt = 0;
const tasks = []
const failures = []

const sync = async () => {
  const namespace = await getNamespace()
  const docs = await getDocs(namespace)

  for (const doc of docs) {
    const task = syncDoc({ namespace, slug: doc.slug, title: doc.title })
    tasks.push(task)
    task.then(() => {
      cnt++;
    }, e => {
      failures.push(e.title)
    })
  }
  for (const task of tasks) {
    await task;
  }
}

(async () => {
  try {
    await sync()
  } catch(e) {}

  let message = '';
  if (tasks.length === cnt) {
    message = chalk.green(`所有 ${tasks.length} 篇文档文档已同步完成`)
  } else {
    message = chalk.yellow(`本次成功同步 ${cnt} 篇文档，${tasks.length - cnt} 篇同步失败；失败文档列表如下：\n`)
    message += failures.map(item => chalk.cyan(item)).join('\n')
  }
  console.log(message)
})()
