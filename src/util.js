const path = require('path')
const chalk = require('chalk')
const client = require('./client')

const getPkg = exports.getPkg = () => {
  return path.resolve('./package.json')
}

const getConfigs = exports.getConfigs = () => {
  return getPkg().yuqueToHexo || {}
}

const cached = (fn) => {
  let result = null;
  return async function(...args) {
    return result || (result = await fn(...args))
  }
}

const getUser = exports.getUser = cached(async () => client.users.get())

const isOnlyPublic = getConfigs().onlyPublic === true;

const isPublic = item => item.public === 1;
const isPublished = item => typeof item.published_at === 'string'

const getNamespaces = exports.getNamespaces = cached(async () => {
  const user = await getUser();
  const list = await client.repos.list({
    type: 'all',
    user: user.login,
    offset: 20,
  })
  return isOnlyPublic ? list.filter(isPublic) : list;
})

const getNamespace =exports.getNamespace = async () => {
  let namespace = getConfigs().namespace;
  if (namespace) return namespace;
  const inquirer = require('inquirer')

  const user = await getUser()
  let namespaces = await getNamespaces();

  namespaces = namespaces.map(item => ({
      name: [item.name, item.description].filter(Boolean).join(' - '),
      namespace: item.namespace,
      value: item.namespace,
    }));

  const filters = [
    namespaces.map(item => item.name).join(' '),
    namespaces.map(item => item.value).join(' ')
  ].join(' ')

  const result = await inquirer.prompt([{
    type: 'list',
    name: 'namespace',
    message: '请选择一个命名空间（仓库）',
    choices: namespaces,
    filter(str) {
      return namespaces.filter(
        item => item.name.indexOf(str) > -1 || item.value.indexOf(str) > -1
      )
    }
  }])
  return result.namespace[0].value;
}

const getDocs = exports.getDocs = async (namespace) => {
  // return [ { namespace, slug } ]
  const result = await client.docs.list({ namespace });
  if (!isOnlyPublic) return result;

}

const getDoc = exports.getDoc = async({ namespace, slug }) => {
  const result = await client.docs.get({
    namespace,
    slug,
    data: { raw: 1 },
  })
  return {
    title: result.title,
    md: result.body_draft,
    createDate: result.created_at.replace('T', ' ').slice(0, -5),
    tag: result.book && result.book.name || '',
    raw: result,
  }
}


const url = require('url')

const compose = (...args) => input => {
  return args.reduce((acc, cur) => {
    return cur(acc)
  }, input)
}
const imgAttrs = {
  decoding: true,
  height: true,
  sizes: true,
  width: true,
  align: true,
  border: true,
  hspace: true,
  longdesc: true,
}
const replaceImage = doc => doc.replace(/!\[[\s\S]*?\]\(([\s\S]*?)\)/g, (s, matched) => {
  const { hash } = url.parse(matched)

  const attrs = hash && hash.slice(1).split('&').map(item => {
    const [attrName] = item.split('=');
    if (imgAttrs[attrName]) return item;
    return false;
  }).filter(Boolean).join(' ')
    .replace(/style=none/g, '')
    .replace(/lake_card=[\s\S]*?/g, '') || ''

  return `<img ${attrs} src="${matched.replace(hash, '')}" style="margin: 0 10px 0 0;" referrerpolicy="no-referrer" />`
})

// const replaceHeader = doc => doc.replace(/(#{1,6} [\s\S]*?)/g, )
const transformMarkdown = str =>
  replaceImage(
    str.replace(/<a name=/g, '\n<a name=')
      .replace(/<br \/>/g, '\n')
      .replace(/- \[ \] /g, '- [ ]  ')
  )


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
  const { promisify } = require('util');

  const exists = promisify(require('fs').exists)
  const writeFile = promisify(require('fs').writeFile)

  // const title = doc.title.replace(/(\/|\/)/g, ' & ')
  const title = doc.title


  const filename = path.join(sourcePath, `${title}.md`)
  // await exists(filename)
  const content = getHexoMarkdownContent(doc)
  await writeFile(filename, content)
  console.log(chalk.green(`【${title}】 已添加`))
}

const syncDoc = exports.syncDoc = async ({ namespace, slug, title}) => {
  try {
    const doc = await getDoc({ namespace, slug })
    await writeToFile(doc)
  } catch(e) {
    const error = new Error(`同步文档 ${title} 时发生错误，${e.message}`)
    error.title = title;
    throw error
  }
}

if (require.main === module) {
  (async function() {
    // const result = await getDocs('cxxc/cx');
    // console.log(result)
    try {
      await syncDoc({ namespace: 'cxxc/cx', slug: 'gtztfv', title: '2019.12.22（关键词：字符集/defer）.md' })
    } catch(e) {
      console.log(e)
    }
  })()
}
