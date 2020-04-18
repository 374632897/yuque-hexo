/* eslint-disable node/no-deprecated-api */
/* eslint-disable no-mixed-operators */
const path = require('path')
const chalk = require('chalk')
const client = require('./client')

const getPkg = exports.getPkg = () => {
  return require(path.resolve('./package.json'))
}

const getConfigs = exports.getConfigs = () => {
  return getPkg().yuqueToHexo || {}
}

exports.getInclude = () => {
  let include = getConfigs().include
  if (!include) return {}
  if (typeof include === 'string') {
    include = include.split(',')
  }
  if (!Array.isArray(include)) {
    include = [include]
  }
  const ret = include.reduce((acc, cur) => {
    acc[cur.trim()] = true
    return acc
  }, {})
  return {
    enableInclude: include.length > 1,
    include: ret
  }
}

const cached = (fn) => {
  let result = null
  return async function (...args) {
    return result || (result = await fn(...args))
  }
}

const getUser = exports.getUser = cached(async () => client.users.get())

const isOnlyPublic = getConfigs().onlyPublic === true

const isPublic = item => item.public === 1
// const isPublished = item => typeof item.published_at === 'string'

const getNamespaces = exports.getNamespaces = cached(async () => {
  const user = await getUser()
  const list = await client.repos.list({
    type: 'all',
    user: user.login,
    offset: 20
  })
  return isOnlyPublic ? list.filter(isPublic) : list
})

exports.getNamespace = async () => {
  const namespace = getConfigs().namespace
  if (namespace) return namespace

  const inquirer = require('inquirer')
  let namespaces = await getNamespaces()

  namespaces = namespaces.map(item => ({
    name: [item.name, item.description].filter(Boolean).join(' - '),
    namespace: item.namespace,
    value: item.namespace
  }))

  const result = await inquirer.prompt([{
    type: 'list',
    name: 'namespace',
    message: '请选择一个命名空间（仓库）',
    choices: namespaces,
    filter (str) {
      return namespaces.filter(
        item => item.name.indexOf(str) > -1 || item.value.indexOf(str) > -1
      )
    }
  }])
  return result.namespace[0].value
}

exports.getDocs = async (namespace) => {
  // return [ { namespace, slug } ]
  const result = await client.docs.list({ namespace })
  if (!isOnlyPublic) return result
}

const getDoc = exports.getDoc = async ({ namespace, slug }) => {
  const result = await client.docs.get({
    namespace,
    slug,
    data: { raw: 1 }
  })
  return {
    title: result.title,
    md: result.body_draft,
    createDate: result.created_at.replace('T', ' ').slice(0, -5),
    tag: result.book && result.book.name || '',
    raw: result
  }
}

const url = require('url')

const imgAttrs = {
  decoding: true,
  height: true,
  sizes: true,
  width: true,
  align: true,
  border: true,
  hspace: true,
  longdesc: true
}
const replaceImage = doc => doc.replace(/!\[[\s\S]*?\]\(([\s\S]*?)\)/g, (s, matched) => {
  const { hash } = url.parse(matched)

  const attrs = (hash && hash.slice(1).split('&').map(item => {
    const [attrName] = item.split('=')
    if (imgAttrs[attrName]) return item
    return false
  }).filter(Boolean).join(' ')
    .replace(/style=none/g, '')
    .replace(/lake_card=[\s\S]*?/g, '')) || ''

  return `<img ${attrs} src="${matched.replace(hash, '')}" style="margin: 0 10px 0 0;" referrerpolicy="no-referrer" />`
})

const replaceBreak = (str) => str.replace(/<br \/>/g, '\n')

const replaceAnchor = str => str.replace(/<a name=/g, '\n<a name=')

const replaceCheckbox = str => str.replace(/- \[ \] /g, '- [ ]  ')

const max = getConfigs.more || 100

const reg = new RegExp(`[\\s\\S]{${max}}[\\s\\S]*?\\n`)

const insertMore = str => str.replace(reg, s => s + '\n<!-- more --> \n')

const compose = (...args) => input => {
  return args.reduce((acc, cur) => {
    return cur(acc)
  }, input)
}
const transformer = compose(
  replaceAnchor,
  replaceBreak,
  replaceAnchor,
  replaceImage,
  replaceCheckbox,
  insertMore
)

const transformMarkdown = str => transformer(str)

const getHexoMarkdownContent = doc => `\
---
title: ${doc.title}
date: ${doc.createDate}
tags: ${doc.tag}
---
${transformMarkdown(doc.md)}
`
const sourcePath = path.join(process.cwd(), 'source/_posts')

const writeToFile = exports.writeToFile = async (doc) => {
  const { promisify } = require('util')

  const writeFile = promisify(require('fs').writeFile)

  const title = doc.title.replace(/(\/|\/)/g, ' & ')

  const filename = path.join(sourcePath, `${title}.md`)
  const content = getHexoMarkdownContent(doc)
  await writeFile(filename, content)
  console.log(chalk.green(`【${title}】 已添加`))
}

exports.syncDoc = async ({ namespace, slug, title }) => {
  try {
    const doc = await getDoc({ namespace, slug })
    await writeToFile(doc)
  } catch (e) {
    const error = new Error(`同步文档 ${title} 时发生错误，${e.message}`)
    error.title = title
    throw error
  }
}

if (require.main === module) {
  (async function () {
    // const result = await getDocs('cxxc/cx');
    // console.log(result)
    // try {
    //   await syncDoc({ namespace: 'cxxc/cx', slug: 'gtztfv', title: '2019.12.22（关键词：字符集/defer）.md' })
    // } catch(e) {
    //   console.log(e)
    // }
    console.log(exports.getInclude())
  })()
}
