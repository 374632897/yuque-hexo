## yuque to hexo

用于将语雀文档同步到 hexo

### 使用

#### 安装

```bash
yarn add yuque-to-hexo
```

#### token

前往[语雀](https://www.yuque.com/settings/tokens) 生成token，并在项目目录下新建`.token`文件，将token存入。

**注意：申请token时请申请只具有读取权限的token，存放到本地后记得将.token加入.gitignore中**

#### 同步

在package.json中添加以下内容，然后执行命令`yarn sync`即可。

```json
"scripts": {
  "sync": "y2hsync",
  "start": "hexo server",
  "build": "hexo g"
},
```

#### 选项
通过在package.json中指定 yuqueToHexo，可以传递对应的选项。

```json
{
  "yuqueToHexo": {
    "more": "100",
    "include": "",
    "onlyPublic": false,
  },
}
```

* more 表示在摘要中只显示文章的前多少字，剩余的将会在用户选择查看更多时展示。
* include 可以是一个使用","分割的字符串，或者一个数组，手动指定你希望从语雀同步的文档。其中的每一项表示文档的slug。
* onlyPublic 表示只同步公开的文档
