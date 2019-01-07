# Accretion
一体化的知识、信息、日程、时间和事件管理系统，主要包括以下几个模块

* Brainhole: 系统的后端
* Horizon: 系统前端，用于数据的查询和展示
* Inflow: 配套的爬虫系统，用于信息收集
* Lightcone: 时间、日程管理系统，同时用于所有数据在时间轴上的可视化

# 文件结构
* design: 系统设计笔记和特性开发管理
* brainhole: brainhole后端的开发目录
* config.js: 项目整体参数配置文件
* database, data: 储存数据库和数据文件的默认目录，可在config.js中更改
* dev-scripts: 项目开发、运行、调试相关脚本
* makefile: 项目开发、运行、调试相关命令
* package.json: 仅仅安装了babel相关依赖，用来进行js语法转换

# 开发环境
* 前端和后端部分采用ES2015+ 语法，为了兼容性，使用babel进行转换
* 使用concurrently和nodemon自动监视相关文件夹，实现热重载
* 后端部分可在chrome://inspect中通过12345端口来debug(可通过.inspect-port.txt文件调整)
    * 入口文件中我们有 `var d = global.d = {}`
    * 则可以在任何文件中令 `d.x = x`
    * 于是我们可以在chrome的console中使用`d.x`对x进行浏览和debug
# 程序开发与运行
* 依赖安装
```
npm i
cd brainhole; npm i
```
* 运行各个组件
  1. make database
      * 根据configs/config.js中的信息运行数据库
  2. make brainhole-watch
      * 打开babel, 监视相应源代码目录, 进行语法转换
  3. make brainhole-dev
      * 监视brainhole/server目录(此文件由babel对brainhole/server-src进行语法转换得到)
      * 运行入口文件index.js
* 使用`make tmux`可以在tmux中一次性运行上述组件(推荐)
* 打开http://127.0.0.1:3000
* debug
  * 打开chrome, 输入chrome://inspect
    * Discover network targets => Configure
      * 增加 127.0.0.1:12345
    * 现在可以看到运行着的后端
    * 打开控制台, 全局变量d中记录着需要debug的东西

# 更新注意事项
目前项目处于设计、开发的初级阶段，master分支可能长期不更新。对项目进度感兴趣的同学请移步develop分支。
