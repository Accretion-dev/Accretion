# Accretion
一体化的知识、信息、日程、时间和事件管理系统，主要包括以下几个模块

* Brainhole: 系统的后端
* Horizon: 系统前端，用于数据的查询和展示
* Inflow: 配套的爬虫系统，用于信息收集
* Lightcone: 时间、日程管理系统，同时用于所有数据在时间轴上的可视化

# 文件结构
* design: 系统设计笔记和特性开发管理
* brainhole: brainhole后端的开发目录
* database, data: 储存数据库和数据文件的默认目录，可在config.js中更改
* dev-scripts: 项目开发、运行、调试相关脚本
* makefile: 项目开发、运行、调试相关命令
* package.json: 仅仅安装了babel相关依赖，用来进行js语法转换

# 程序开发与运行
## 开发环境搭建
* 依赖安装
```
npm i
cd brainhole; npm i
```
* 运行各个组件
  1. make database
      * 根据brainhole/configs/config.js中的信息运行数据库
  2. make brainhole-watch
      * 监视源码, 生成单元测试文件brainhole/final-test.js
  3. make brainhole-dev
      * 运行入口文件brainhole/server/index.js
  4. make brainhole-test-inspect
      * 监视源码,运行单元测试文件brainhole/final-test.js
* 使用`make tmux`可以在tmux中一次性运行上述组件(推荐)
* 打开http://127.0.0.1:3000
* debug
  * 打开chrome, 输入chrome://inspect
    * Discover network targets => Configure
      * 增加 127.0.0.1:12345
    * 现在可以看到运行着的后端和单元测试模块,可直接在源码中添加debugger进行debug
    * 打开控制台, 全局变量d中记录着需要debug的东西

# 项目开发进展:
  项目还在开发初期. 后端数据库部分写完了, 还剩web部分, 前端正在编写...

* 程序最终会是跨平台的, windos, linux 和mac都支持
* 目前我的开发环境为linux, 所以所有的开发配置脚本都是基于linux平台的
* 对于windows用户,肯定会做最大程度的封装,到时候鼠标双击一下就可以运行

预计开发时长: 半年以上(因为是个人的业余项目)

项目设计思路: https://zhuanlan.zhihu.com/p/57614943

项目Teleram讨论群: https://t.me/accretionDevOffTopic

# 更新注意事项
目前项目处于设计、开发的初级阶段，master分支可能长期不更新。对项目进度感兴趣的同学请移步develop分支。
