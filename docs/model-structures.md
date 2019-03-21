为了更好的使用Accretion, 用户需要深入了解它的储存结构.

复杂的知识网络需要有复杂的体系来组织, 如果你不能够耐下心来阅读以下章节,证明你的知识体系复杂程度尚不需要由Accretion来组织(否则让你头大的应该是你尚未整理好的知识体系而不是这套管理系统),请移步其他笔记类软件.

# 基本概念
* 元数据: 数据的数据. 举例:

    一篇文章:文章本体是数据,文章的标题, 标签, 分类目录, 添加时间, 作者等信息为元数据

    一张图片:图片二进制数据为数据, 图片拍摄信息,作者,标签等为元数据
* 注释: 下文的代码块中, 每行//之后的内容为注释
* 数组: 常见的数据结构, 表示一组数据, 数据的类型可以相同也可以不同
* 字典: 一种常见的数据结构, 以 键:键值 对儿为基本结构. 键一般为字符, 键值可以为字符,数字,数组等,或者为另外一个字典. 一般表示为大括号中以逗号分隔的 键:键值 对儿.
  举例: 一篇文章可以用如下字典来储存
```
{ // 这是一个注释,别忘了
  title: '个人知识管理系统的设计',
  tags: ['知识管理','mongodb','nodejs'], // 这个键值是一个数组
  author: 'Fmajor',
  content: '文章内容长长长长长...',
  createdAt: '2018-01-01T00:00:00',
  modifiedAt: '2018-02-01T00:00:00',
}
```
我们注意到,上面字典储存了一篇文章,其内容(数据)只占用了一个键, 其余键均为文章的元数据. 这些元数据都是我们今后搜索这篇文章的依据.

# 储存结构设计理念
* 使用mongodb, 以字典的形式储存数据及其元数据
* 提供基本的元数据
* 提供接口,方便用户创建新的元数据
* 保证元数据之间的一致性(重要!)

这些理念将在下面具体实例中有所体现

# Accretion数据类型
Accretion中大致将数据分为以下两类

## 目标数据类
与我们需要管理的知识直接对应的类型, 举例: `Article`, `Website`, `Book`等
  他们有自己特有的字段, 例如
```
{ // 这是Article一般应有的字段
  title:"标题",
  author:"作者",
  content:"内容",
},
{ // 这是Website一般应有的字段
  title:"标题",
  url:"地址",
},
{ // 这是Book一般应有的字段
  title:"标题",
  author:"作者",
  editor:"编辑",
  ISBN:"国际标准书号",
  pdf:"本地pdf地址,如果有的话",
}
```
  除了这些字段外, 系统自动为所有数据类添加
```
{
  comment: '注释',
  createdAt: '创建时间',
  modifiedAt: '修改时间',
}
```
这些额外的通用元数据
用户可以通过插件系统方便的添加自定义目标数据类(比如`File`, `Food`, `Animal`...)

## 元数据类
几个基本的通用类元数据
* `Tag`: 标签, 基本结构为
```
{
  name: '标签名', // 不可重复
  display_name: '显示标签名', // 可以重复
  description: '标签介绍'
}
// 举例(4个标签)
{ name: '天文' },
{ name: '钓鱼', display_name: '钓鱼',  description: '消歧义', },
{
  name: '钓鱼(运动)', display_name: '钓鱼',
  description: '使用工具从水体中获得鱼类',
},
{
  name: '钓鱼(欺骗行为)', display_name: '钓鱼',
  description: 故意散播巧妙伪装的错误信息, 引人上当, 以达到娱乐或嘲讽的目的(文中有明显的信息供人甄别,只要稍作思考就可以判断出消息的真假,类似但不同于真假难辨的不实信息)',
}
```
* `Catalogue`: 分类目录, 基本结构为
```
{
  name: '目录名称', // 可以重复
  description: '标签介绍'
}
// 举例(3个目录)
{ name: '天文' },
{ name: '地理' },
{ name: '待整理', description: '待整理的知识' },
```
* `Metadata`: 元数据, 基本结构为
```
{
  name: '元数据名称', // 不可重复
  format: '元数据数据格式',
  description: '描述'
}
// 举例(3个元数据)
{ name: '星级', format: '0~10的整数', description: '对内容的快速评分' },
{
  name: '坐标', format: '经纬度二维数据',
  description: '跟此内容相关的坐标信息'
},
{
  name: 'deadline', format: '时间',
  description: '此内容需要在这个时间之前整理好'
}
```
* `Relation`: 关系, 基本结构为
```
{
  name: '关系名称', // 不可重复
  rev_name: '逆向关系名称',
  symmetric: '是否为对称关系',
  description: '描述'
}
// 举例
{
  name: '后文', rev_name: '前文', symmetric: false,
  description: '这篇文章是那一篇的后续之作'
},
{
  name: '翻译', symmetric: true,
  description: '这两个内容互为翻译关系'
},
{
  name: '引用', rev_name: '被引用',
  symmetric: false,
}
```
* 除了这些基本结构, `Tag`, `Catalogue`, `Metadata`, `Relation` 也拥有自动添加的comment, createdAt, modifiedAt 等这些基本元数据

# 元数据组织
除了comment, createdAt, modifiedAt这三个通用的元数据,我们还提供
* tags
* catalogues
* relations
* metadatas
* fathers
* children

这些元数据, 他们之中
* tags, catalogues, relations, metadatas 为引用类元数据(因为这类元数据需要引用一个`元数据类`的数据)
* fathers, children为非引用类元数据

下面分类说明

## fathers and children
* 所有`目标数据类`和`Tag`,`Catalogue`有额外拥有fathers和children元数据, 举例
```
// 4篇构成父子关系的文章(其标题蕴含了他们的父子关系)
{ id: 1, title: '1', children: [ {id: 2}, {id: 3}, ], fathers: [ ] },
{ id: 2, title: '1.1', children: [ {id: 4}, ], fathers: [ {id: 1} ] },
{ id: 3, title: '1.2', children: [ ], fathers: [ { id: 1 } ] },
{ id: 4, title: '1.1.1', children: [ ], fathers: [ { id: 2 } ] },
// 4个构成父子关系的分类目录
{ id: 1, title: '课程', children: [ { id: 2 }, { id: 3} ], fathers: [ ]}
{ id: 2, title: '天文', children: [ { id: 5 } ], fathers: [ { id: 1 } ]}
{ id: 3, title: '数学', children: [ { id: 4 } ], fathers: [ { id: 1 } ]}
{ id: 4, title: '统计学', children: [ { id: 6} ], fathers: [ { id: 3 } ]}
{ id: 5, title: '球面天文学', children: [ ], fathers: [ { id: 2 } ]}
{ id: 6, title: '贝叶斯统计学', children: [ ], fathers: [ { id: 4 } ]}
```
* 一致性要求(由API自动确保): 添加(删除)一个数据为另一数据的father(child)时, 必须添加(删除)另一个数据为这个数据的child(father).
## tags and catalogues
* 所有`目标数据类`都有额外的tags和catalogues元数据, 举例
```
// 这是几个已经存在的标签
{ id: 1, name: '天文',
  r:{Article: ['1-1', '2-3', '3-7', '4-10']}},
{ id: 2, name: '钓鱼', display_name: '钓鱼', description: '消歧义',
  r:{Article: ['2-5']},
  children: [ {id: 3}, {id: 4} ], },
{ id: 3, name: '钓鱼(运动)', display_name: '钓鱼',
  description: '使用工具从水体中获得鱼类',
  fathers: [ {id: 2} ], },
{ id: 4, name: '钓鱼(欺骗行为)', display_name: '钓鱼',
  description: '故意散播巧妙伪装的错误信息, 引人上当, 以达到娱乐或嘲讽的目的(文中有明显的信息供人甄别,只要稍作思考就可以判断出消息的真假,类似但不同于真假难辨的不实信息)',
  r:{Article: ['2-6']},
  fathers: [ {id: 2} ], },
{ id: 5, name: '不实信息',
  r:{Article: ['3-9']}, },
{ id: 6, name: 'astronomy'
  r:{Article: ['1-2', '2-4', '3-8', '4-11']},
},
// 这是几个已经存在的分类目录
{ id: 1, name: '天文发现', r:{Article: ['1-1', '2-3', '3-5', '4-7']}}
{ id: 2, name: '文章爬虫', r:{Article: ['4-8']}}
{ id: 3, name: '公众号爬虫', r:{Article: ['1-2', '2-4', '3-6']} }
{ id: 4, name: '待读文章', r:{Article: ['4-9']} }
// 这是几篇文章,被放在了这些分类目录中,加上了一些标签
{ id: 1, title: '中国科学家宇宙考古发现大反常',
  catalogues: [ {catalogue_id: 1, id:1}, {catalogue_id: 3, id:2} ],
  tags: [ {tag_id: 1, id:1}, {tag_id: 6, id:2} ], },
{ id: 2, title: '英国科学家接收到神秘信号,强度很高,可能来自外星种族?(手动滑稽)',
  catalogues: [ {catalogue_id: 1, id:3}, {catalogue_id: 3, id:4} ],
  tags: [ {tag_id: 1, id:3}, {tag_id: 6, id:4},
          {tag_id: 2, id:5}, {tag_id: 4, id:6} ], },
{ id: 3, title: '英国科学家接收到神秘信号,强度很高,可能来自外星种族?',
  catalogues: [ {catalogue_id: 1, id:5}, {catalogue_id: 3, id:6} ],
  tags: [ {tag_id: 1, id:7}, {tag_id: 6, id:8}, {tag_id: 5, id:9} ], },
{ id: 4, title: 'A Second Source of Repeating Fast Radio Bursts',
  catalogues: [ {catalogue_id: 1, id:7}, {catalogue_id: 2, id:8},
                {catalogue_id: 4, id:9} ],
  tags: [ {tag_id: 1, id:10}, {tag_id: 6, id:11} ], },
```
tags数组中每个元素的tag_id为这个数据添加的`Tag`的id, 而数组中每个元素的id(称为tags_id)则表明这是系统中存在的第多少个Article-tag 关系对儿, catalogs数组同理

在一个`Tag`中的r属性记录了tags数组的反向引用数据, `r:{Article:['2-3']}`的意思为,这个`Tag`在id为2的`Article`中被添加到了tags中, 那个tags_id为3(请参考上面的实例自行理解)

* 一致性要求(由API自动确保): 在一个数据上添加(删除)某标签后,自动在对应标签的'r'属性下添加(删除)反向引用数据.
## metadatas
* 所有`目标数据类`都有额外的metadatas元数据, 举例
```
// 这是几个已经存在的metadata
{ name: '星级', format: '0~10的整数', description: '对内容的快速评分',
  r:{Article:['1-1', '2-3', '3-5', '4-7']},
},
{ name: '暂时编不出来了', format: 'string', description: '某个假想中的元数据',
  r:{Article:['1-2', '2-4', '3-6', '4-8']},
},
// 这是几篇文章,加上了一些元数据
{ id: 1, title: '中国科学家宇宙考古发现大反常',
  metadatas: [
    {metadata_id: 1, value: 10, id:1}, // 这是一篇好文章
    {metadata_id: 2, value:'blabla', id:2},
]},
{ id: 2, title: '英国科学家接收到神秘信号,强度很高,可能来自外星种族?(手动滑稽)',
  metadatas: [
    {metadata_id: 1, value: 8, id:3}, // 这是一篇滑稽文章,效果不错
    {metadata_id: 2, value:'blabla', id:4},
]},
{ id: 3, title: '英国科学家接收到神秘信号,强度很高,可能来自外星种族?',
  metadatas: [
    {metadata_id: 1, value: 0, id:5}, // 造谣文章
    {metadata_id: 2, value:'blabla', id:6},
]},
{ id: 4, title: 'A Second Source of Repeating Fast Radio Bursts',
  metadatas: [
    {metadata_id: 1, value: 10, id:7}, // nature原文,高分待读
    {metadata_id: 2, value:'blabla', id:8},
]},
```
metadatas数组中每个元素的metadata_id为这个数据添加的`Metadata`的id, 而数组中每个元素的id(称为metadatas_id)则表明这是系统中存在的第多少个Article-metadata 关系对儿

在一个`Metadata`中的r属性记录了metadatas数组的反向引用数据, `r:{Article:['2-3']}`的意思为,这个`Metadata`在id为2的`Article`中被添加到了metadatas中, 那个metadatas_id为3(请参考上面的实例自行理解)

* 一致性要求(由API自动确保): 在一个数据上添加(删除)某Metadata后,自动在对应Metadata的'r'属性下添加(删除)反向引用数据.
## relations
* 所有`目标数据类`和`Tag`都有额外的relations元数据, 举例
```
// 这是几个已经存在的关系
{ id:1, name: '翻译', symmetric: true
  r:{Tag: ['1-1', '6-1']}
},
{ id:2, name: '消歧义', rev_name: '被消歧义', symmetric: false
  r:{Tag: ['2-2', '3-2', '2-3', '4-3']}
},
{ id:3, name: '引用', rev_name: '被引用', symmetric: false
  r:{Article: ['2-1', '4-1']}
},
// 这是几个已经存在的标签(这一张讲relations,所以精简数据省略掉了Tag的r属性)
{ id: 1, name: '天文',
  relations: [
    // 此关系表名id:1 于 id:6 两个tag互为翻译关系
    {id: 1, relation_id: 1, from_id: 1, to_id:6, from_model:'Tag', to_model: "Tag"}
  ]
},
{ id: 2, name: '钓鱼', display_name: '钓鱼', description: '消歧义',
  relations: [
    // 此处定义了两个消歧义的关系
    {id: 2, relation_id:2, from_id:3, to_id: 2, from_model:'Tag', to_model: 'Tag'}
    {id: 3, relation_id:2, from_id:4, to_id: 2, from_model:'Tag', to_model: 'Tag'}
  ],
  children: [ {id: 3}, {id: 4} ], },
{ id: 3, name: '钓鱼(运动)', display_name: '钓鱼',
  description: '使用工具从水体中获得鱼类',
  relations: [
    {id: 2, relation_id:2, from_id:3, to_id: 2, from_model:'Tag', to_model: 'Tag'}
  ],
  fathers: [ {id: 2} ], },
{ id: 4, name: '钓鱼(欺骗行为)', display_name: '钓鱼',
  description: '故意散播巧妙伪装的错误信息, 引人上当, 以达到娱乐或嘲讽的目的(文中有明显的信息供人甄别,只要稍作思考就可以判断出消息的真假,类似但不同于真假难辨的不实信息)',
  relations: [
    {id: 3, relation_id:2, from_id:4, to_id: 2, from_model:'Tag', to_model: 'Tag'}
  ],
  fathers: [ {id: 2} ], },
{ id: 5, name: '不实信息', },
{ id: 6, name: 'astronomy',
  relations: [
    // 此关系表名id:1 于 id:6 两个tag互为翻译关系
    {id: 1, relation_id: 1, from_id: 1, to_id:6, from_model:'Tag', to_model: "Tag"}
  ]
},
// 这是几篇文章,被放在了这些分类目录中,加上了一些标签
{ id: 1, title: '中国科学家宇宙考古发现大反常',
  tags: [ {tag_id: 1, id:1}, {tag_id: 6, id:2} ], },
{ id: 2, title: '英国科学家接收到神秘信号,强度很高,可能来自外星种族?(手动滑稽)',
  relations: [
    // 这个relation代表这篇文章引用了id:4的文章
    {id: 1, relation_id: 3, from_id: 4, to_id:2, from_model:'Article', to_model: "Article"}
  ],
  tags: [ {tag_id: 1, id:3}, {tag_id: 6, id:4},
          {tag_id: 2, id:5}, {tag_id: 4, id:6} ], },
{ id: 3, title: '英国科学家接收到神秘信号,强度很高,可能来自外星种族?',
  tags: [ {tag_id: 1, id:7}, {tag_id: 6, id:8}, {tag_id: 5, id:9} ], },
{ id: 4, title: 'A Second Source of Repeating Fast Radio Bursts',
  relations: [
    // 这个relation代表这篇文章被id:2的文章引用了
    {id: 1, relation_id: 3, from_id: 4, to_id:2, from_model:'Article', to_model: "Article"}
  ],
  tags: [ {tag_id: 1, id:10}, {tag_id: 6, id:11} ], },
```
relations数组中每个元素的relation_id为这个数据添加的`Relation`的id, 而数组中每个元素的id(称为relations_id)则表明这是系统中存在的第多少个Article-relation 或者 Tag-relation 关系对儿, from_id,from_model 和 to_id,to_model定义了关系双方

在一个`Relation`中的r属性记录了relations数组的反向引用数据, `r:{Tag:['2-3']}`的意思为,这个`Relation`在id为2的`Tag`中被添加到了relations中, 那个relations_id为3(请参考上面的实例自行理解)

* 一致性要求(由API自动确保): 在一个数据上添加(删除)某Relation,自动在对应Metadata的'r'属性下添加(删除)反向引用数据, 同时关系双方的relations中这条信息也要保持一致.

# hook 系统
* hook: 在满足一定条件下,程序自动触发的行为
*
通过Accretion的插件系统, 程序可以自动完成一些元数据的添加,减轻用户整理信息的负担
我们以下面两个已经实现的hook为例:
* hook[0] 互为翻译关系的连个Tag视为等效
* hook[1] 自动添加消歧义关系的Tag
请仔细阅读下面的注释
```
// 这是几个已经存在的关系(为求简洁,省掉其r属性)
{ id:1, name: '翻译', symmetric: true },
{ id:2, name: '消歧义', rev_name: '被消歧义', symmetric: false },
// 这是几个已经存在的标签(为求简洁,省掉其r属性)
{ id: 1, name: '天文',
  relations: [
    // 此关系表名id:1 于 id:6 两个tag互为翻译关系
    {id: 1, relation_id: 1, from_id: 1, to_id:6, from_model:'Tag', to_model: "Tag"}
  ]
},
{ id: 2, name: '钓鱼', display_name: '钓鱼', description: '消歧义',
  relations: [
    // 此处定义了两个消歧义的关系
    {id: 2, relation_id:2, from_id:3, to_id: 2, from_model:'Tag', to_model: 'Tag'}
    {id: 3, relation_id:2, from_id:4, to_id: 2, from_model:'Tag', to_model: 'Tag'}
  ],
  children: [ {id: 3}, {id: 4} ], },
{ id: 3, name: '钓鱼(运动)', display_name: '钓鱼',
  description: '使用工具从水体中获得鱼类',
  relations: [
    {id: 2, relation_id:2, from_id:3, to_id: 2, from_model:'Tag', to_model: 'Tag'}
  ],
  fathers: [ {id: 2} ], },
{ id: 4, name: '钓鱼(欺骗行为)', display_name: '钓鱼',
  description: '故意散播巧妙伪装的错误信息, 引人上当, 以达到娱乐或嘲讽的目的(文中有明显的信息供人甄别,只要稍作思考就可以判断出消息的真假,类似但不同于真假难辨的不实信息)',
  relations: [
    {id: 3, relation_id:2, from_id:4, to_id: 2, from_model:'Tag', to_model: 'Tag'}
  ],
  fathers: [ {id: 2} ], },
{ id: 6, name: 'astronomy',
  relations: [
    // 此关系表名id:1 于 id:6 两个tag互为翻译关系
    {id: 1, relation_id: 1, from_id: 1, to_id:6, from_model:'Tag', to_model: "Tag"}
  ]
},
// 这是几篇文章,被放在了这些分类目录中,加上了一些标签
// 在添加Tag的时候我们可以利用hook[0] 和 hook[1]减小工作量
{ id: 1, title: '中国科学家宇宙考古发现大反常',
  // 添加这篇文章的时候我仅仅手动添加了'天文(tag_id=1)'标签, 但是由于翻译关系和hook[0], 'astronomy(tag_id=6)'的标签被自动添加上了
  tags: [ {tag_id: 1, id:1}, {tag_id: 6, id:2} ], },
{ id: 2, title: '英国科学家接收到神秘信号,强度很高,可能来自外星种族?(手动滑稽)',
  // 添加这篇文章的时候我仅仅手动添加了'天文(tag_id=1)'标签, 但是由于翻译关系和hook[0], 'astronomy(tag_id=6)'的标签被自动添加上了
  // 添加这篇文章的时候我仅仅手动添加了'钓鱼(欺骗行为)(tag_id=4)'标签, 但是由于消歧义关系和hook[1], '钓鱼(tag_id=2)'的标签被自动添加上了
  tags: [ {tag_id: 1, id:3}, {tag_id: 6, id:4},
          {tag_id: 2, id:5}, {tag_id: 4, id:6} ], },
```
* 在之后修改数据的过程中,如果我们删掉那些可以触发hook的标签, 则hook会删掉之前自动添加的标签
* 由于其他机制的存在,所有的hook引起的改动是可逆的. hook可以随时开启或关闭, 开启的时候会扫描数据库自动添加相应数据或元数据. 关闭的时候会扫描数据库删掉所有自动添加的部分. 在开启状态时, 每次增删改数据如果满足hook触发条件也会自动添加或删除数据或元数据

#总结

以上为在用户视角可以进行的操作, 开发者视角会有更多的细节,参考(还没写的)dev-model-struct.md
有了基本的`目标数据类`, 配合`Tag`, `Catalogue`, `Relation`, `Metadata`, 用户可自由的增删改所有的简单元数据和
* tags
* catalogues
* relations
* metadatas
* fathers
* children
这些稍微复杂的元数据
用户的操作都会在前端的良好包装下,简单而快捷,但是用户需要理解以上举的哪些例子,知道你实际储存的东西究竟有哪些

注意到,所有这些元数据都能作为用户检索的信息. 用户在建立良好整理习惯,活用各种hook为信息添加了足够充分的元数据后,无论过去多久,这条信息都可以被轻易的检索出来,彻底告别`我曾经整理过某信息,现在死活找不到了`这种令人恼怒的情形.
