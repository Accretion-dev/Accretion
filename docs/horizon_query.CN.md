# Horizon检索子系统
## 简介
* Horizon(视界): 物理学名词,指可观测的时空的边界. 是Accretion向用户展现信息的子系统.
* Horizon大致包括两个子系统:
  * 浏览子系统: 向用户展示储存的信息,提供人性化的UI来编辑数据和元数据.
  * 检索子系统: 使用自定义语法,方便用户快速,准确的找到想要的信息.

浏览子系统还没来得及开发, 本文主要讲检索子系统的设计和实现,最后放上实际使用的demo视频.

## mongodb数据储存
Accretion中数据以documents的形式储存在mongodb数据库中,具体的数据结构和API设计见[模型设计](./model-structures.md)

* 此文中的查询例子假设储存的信息具有以下结构, Number, String, Date表示此字段的类型
* 此文中的查询列子均是对Article数据的查询
```javascript
// Tag(标签)的数据库结构
Tag = {
  id:Number,   // 标签的序号
  name:String, // 标签的名称
}
// Tag(元数据)的数据库结构
Metadata = {
  id:Number,   // 元数据的序号
  name:String, // 元数据的名称
}

// Article(文章)的数据库结构
Article = {
  id: Number,  // 文章序号
  title: String,  // 文章标题
  ctime: Date, // 创建时间
  mtime: Date, // 最后修改时间
  content: String, // 文章主体
  flags: Object, // 文章的一些状态标志
  tags:[{ // 文章标签, 其内容是一个数组, 每个数组元素对应一个标签
    id: Number,        // 文章-标签 对儿的序号
    tag_id: Number,    // 标签的序号
    tag_name: Number,  // 标签的名称
    atime: Date,       // 标签的添加时间
    comment: String,   // 对于此标签的注释
  }],
  metadata:[{ // 文章元数据, 其内容是一个数组, 每个数组元素对应一个元数据
    id: Number,        // 文章-元数据 对儿的序号
    tag_id: Number,    // 元数据的序号
    tag_name: Number,  // 元数据的名称
    atime: Date,       // 元数据的添加时间
    value: Object,     // 元数据的值,其具体类型未知
    comment: String,   // 对于此元数据的注释
  }],
}
```
## Mongodb的查询例子
Mongodb本身提供了强大的查询语法,简介如下
``` javascript
// id = 233
{id: 233}
// 比较运算符($gt:>, $gte:>=, $lt:<, $lte:<=)
// id > 233
{id: {$gt: 233}}
// 简单逻辑$and
// id > 233 and id < 2333 (以下两个查询等价)
{$and:[
  {id:{$gt: 233}},
  {id:{$lt: 2333}},
]}
{id: {$gt: 233, $lt:2333}}
// 复杂逻辑$and, $or
// id=233 or (id>233 and id<2333)
{$or:[
  {id: 233},
  {$and:[
    {id:{$gt: 233}},
    {id:{$lt: 2333}},
  ]}
]}
// 支持日期的比较
{ctime:{$gt: '2018-01-01T12:00:00+08:00', $lt: '2019-01-01T12:00:00+08:00'}}
// 集合运算符($in:包含于,$nin:不包含于)
// id in [233,234,235] (等价于 233<= id <= 235)
{id:{$in:[233, 234, 235]}}
// 对于字符类型字段支持正则表达式(两个/之间的内容为正则表达式)
{content: /a good day.$/}
// $in也支持正则表达式
{comment: {$in: ['good', 'bad', /^[fF]ine/]}}
// 嵌套(nested)信息的查询
{'tags.tag_id': 123} // 存在一个标签id为123的标签
{'tags.tag_name': 'astronomy'} // 存在一个标签名为astronomy的标签
{'tags.ctime': {$gt: '2018-01-01'}} // 存在一个标签, 它的添加时间晚于2018-01-01
// 如果查询语句是字典,则进行精确匹配查询(查询内容要完全一致才能匹配上)
{tags:{
  tag_name: 'astronomy'
}} // 这个查询不会匹配到任何结果,即使某篇文章有astronomy的标签.因为我们的数据必然还有更多更多字段,而这个查询要求tags的内容为{tag_name:'astronomy'}
// 嵌套结构多条件匹配
{tags:{$elemMatch:{
  tag_name: 'astronomy',
  ctime: {$gte: '2018-01-01'},
}}}// 文章有一个2018-01-01之后添加的astronomy标签
// $text搜索
// 定义数据库的时候,可以指定一些字段加入$text索引,则可对这些字段进行全文搜索
// Article中 title, tags.tag_name, metadatas.metadata_name, comment加入了$text索引
// 以下查询匹配title, tags.tag_name, metadatas.metadata_name, comment字段中包含good不包含bad的所有文章
{$text:{$search: "good -bad"}}
```

## Horizon查询语法
#### 为什么要定义新的语法?
* mongodb查询语法对机器解析友好: 天然是json
* 但对手工输入不友好: 太长,需多加关注括号的匹配,反复嵌套的结构容易产生输入错误
* 对人工理解不友好,对单行输入不友好: json必须进行pretty print后才易于人的快速理解,但这必须占用多行的空间

新的查询语法应该尽可能简洁,对(单行)输入友好,同时(几乎)保留完整的mongodb查询功能. 查询语句最终会编译为有效的mongodb查询语句, 供mongodb进行查询
#### Horizon查询语法的改进
1. and, or逻辑关系输入的简化(`$and`的优先级大于`$or`, 可以用括号改变优先级)
  * `A B` => `{$and:[A, B]}`
  * `A && B` => `{$and:[A, B]}`
  * `A || B` => `{$or:[A, B]}`
  * `A B || C && D` => `{$or:[{$and:[A,B]}, {$and:[C,D]}]}`
  * `A (B || C) && D` => `{$and:[A, {$or:[B,C]}, D]}`
2. 字典输入简化(去掉花括号)
  * `title: 'good title'` => `{title: 'good title'}`
  * `$and: [ $and: [A,B], $or:[C,D] ]`=> `{$and: [{$and:[A,B]}, {$or:[C,D]}]}`
3. 只含一个条目的嵌套字典输入简化
  * `number|gt: 10` => `{number:{$gt: 10}}`
  * `number|in: [1,2,3]` => `{number:{$in: [1,2,3]}}`
4. 简化`$in`的输入: 如果value是个数组,而他的key并没有以`$`开头,那么自动将其包装为`$in:[]`
  * `number: [1,2,3]` => `{number:{$in: [1,2,3]}}`
  * `title: [foo,/bar/]` => `{title:{$in: ['foo',/bar/]}}`
5. 简单字符的输入不需要引号, 复杂的或者含空格的字符才需要引号, 如果输入可以解析为数字,则为数字
  * `tags.tag_name: haha` => `{'tags.tag_name': 'haha'}`
  * `tags.tag_name|in: [foo, bar, 'foo bar', '\'foo\tbar\\']` =>
    `{'tags.tag_name': {$in: ['foo', 'bar', 'foo bar', "'foo\tbar\\"]}}`
  * `tags:{$gt: 123, $lt:123asd}` => `{tags: {$gt: 123, $lt: '123asd'}}`
6. 放在末尾的若干字符会合并,使用`$text`做全文搜索,放在逻辑最顶端,与其他查询部分呈and关系. 具体的搜索字段见源代码. 对于Article的索引字段,见上面`Mongodb查询语法`章节的最后部分
  * `python 'parallel programming' -node` =>
    `{$text:{$search: 'python "parallel programming" -node'}}`
  * `tags.tag_name: astronomy title:/astronomy/ blackhole mass` =>
    ```
      {$and:[
        {'tags.tag_name': 'astronomy'},
        {title: /astronomy/},
        {$text:{$search:'blackhole mass'}}
      ]}
    ```
  * `tags.tag_name: astronomy || title:/astronomy/ blackhole mass` =>
    ```
      {$and:[
        {$or:[
          {'tags.tag_name': 'astronomy'},
          {title: /astronomy/},
        ]},
        {$text:{$search:'blackhole mass'}}
      ]}
    ```
7. 对于`metadatas`,`tags`,`catalogues`,`relations`这四个nested object array的直接搜索编译为对其中name的搜索, 除非后面的操作符为`$el`, `$elemMatch`或`$len`
  * `metadatas: /good/` => `metadatas.metadatas_name: /good/`
  * `metadatas|in: [/good/]` => `metadatas.metadatas_name: {$in:[/good/]}`
  * `metadatas: [/good/]` => `metadatas.metadatas_name: {$in:[/good/]}`
  * `metadatas: {gt: 'foo'}` => `metadatas.metadata_name: {$gt:'foo'}`
  * `metadatas|el: {metadata_name: 'foo'}` => `metadatas: {$el:{metadata_name: 'foo'}}`
8. 提供快速的关于数组长度数据的搜索
  * `tags|len|gt: 5 tags|len|lt:10` =>
    ```
    // 这个数组供aggregate查询函数使用
    [
      {$addFields: {tags_length: "$tags"}},
      {$match: { $and:[
        tags_length:{$gt: 5},
        tags_length:{$lt: 10},
      ]}}
    ]
    ```
9. Horizon语法还实现了一个超级直观的日期过滤器(搜索的字段格式必须是日期, 且搜索逻辑在`$elemMatch`之外)
  * `date: '>2018-10-10T12:00:00'`: date大于当地时间`2018-10-10T12:00:00`
  * `date: '<2018-10-10T12:00:00+08:00'`: date小于`2018-10-10T12:00:00+08:00`
  * 这里的日期需要符合ISO格式
  * `date: '>2018-10-10T12 <2018-10-11T00 || (>2019 && <2020)'`: 日期过滤器也支持任意逻辑组合
  * `date: 'in:year:2000'`: date在2000年
  * `date: 'in:2001 in:month:03'`: date在2000年3月
  * `date: 'in:2002 in:day:20'`: date在2002年某个月的20号
  * `date: 'in:2004 in:02-29'`: date在2004年的2月29号
  * `date: 'in:2019 in:weekday:3'`: date在2019年的某个周三
  * `date: 'in:2019-01 >=weekday:3 <weekday:5'`: date在2019年1月份的周三或周四
  * `date: 'in:2008-08-08'`: date在2008-08-08这一天
  * `date: 'in:2010-10'`: date在2010年的10月份
  * `date: 'in:201012'`: date在2010年的12月份
  * `date: '>06-06 <=06-11'`: date在6月7号到六月11号之间
  * `date: 'in:2018 >=10 <18'`: date在2018年的某一天, 10点到17点之间
  * `date: '>-3d <-1d'`: date在过去3天之内,1天之外
  * `date: '>-30h <-10h'`: date在过去30小时之内,10小时之外
  * 负时间支持的单位有'y年','M月','d日','h小时','m分钟','s秒'
10. 将`$elemMatch`简化为`$el`
  * `tags|el:{tag_name:astronomy, ctime|lt:'2019-01-01'}` =>
    `{tags:{$elemMatch:{tag_name:'astronomy', ctime:{$lt:'2019-01-01'}}}}`
11. 在输入查询语句的过程中提供动态的自动补全功能,让用户快速输入以及实时了解自己可以在此字段下搜索什么
12. 实时的搜索结构高亮显示
## 演示视频
...制作中
