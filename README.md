## yuque to hexo

用于将语雀文档同步到 hexo

### 使用

#### 安装

```bash
yarn add yuque-to-hexo
```

#### token

前往[语雀](https://www.yuque.com/settings/tokens) 生成token，并在项目目录下新建`.token`文件，将token存入。

#### 同步

在package.json中添加以下内容，然后执行命令`yarn sync`即可。

```json
"scripts": {
  "sync": "y2hsync",
  "start": "hexo server",
  "build": "hexo g"
},
```
