此文是个人知识管理系统Accretion的设计说明书(非使用说明书),来自项目github仓库的[doc文件](https://github.com/Accretion-dev/Accretion/blob/develop/doc/designing-a-personal-knowledgebase.CN.md), 项目正处于开发的初期阶段,此文内容随时可能改变.

目录:
1. 核心概念及其衍生讨论
2. 什么是个人知识管理系统
3. 为什么需要个人知识管理系统
4. 现有知识管理系统的不足
5. 一个理想的个人知识管理系统
6. Accretion的更多特性

# 核心概念及其衍生讨论
* 元数据(Metadata): 描述数据的数据。
    举例:
    1. 你和一个人打电话,你们电话的内容为数据,打电话的时间、时长为元数据.
    2. 博客系统中,博文为数据,博文的标题、添加时间、最后修改时间、标签、分类目录等为元数据.
    3. 一张数字照片是数据,它的拍摄地点、拍摄时间、光圈、快门、ISO等为元数据.
* 爬虫: 从互联网上自动收集信息的程序.
* Accretion: 吸积, 天文学名字,指代由于引力相互作用,各种天体向自身聚积周围物质的现象. 这是作者为自己设计的个人知识管理系统所起的名字,非常的形象.
* 知识: <<现代汉语词典>>定义: 人类的认识成果。
    * 此文中对知识定义为: 一个人已知或者将来可能会去检索的数据或者元数据.
    * 知识依照其记忆重要性可大致分为(此为本人随意的定义):
        1. 一类知识: 本人熟知的知识,可以凭借记忆获取其全部内容的信息. 举例: 常用汉字读音,本职工作相关知识,考试前刚背下来的重点等. 
        2. 二类知识: 本人熟悉的信息,记得其部分内容或者某些元数据,可以凭借良好的检索系统再次找到此信息. 举例: 曾经看过的某篇关于python的技术博文, 学过但是学完后从未使用过的某个知识点, 某特定类型表情包, 某活动照片数据. 你的绝大多数可用知识可以归为这一类.
        3. 三类知识: 本人不熟悉的信息,几乎完全忘记其内容甚至元数据,想去检索却又无从下手的信息.此类知识只能随缘去找了,也许某一天会突然想起,或者看到其他信息而联想到此信息.但无论如何,你回想起此信息的可能性是存在的. 举例: 很久之前你的所见所闻
        4. 四类知识: 本人从未了解过的信息.
    (注:这些知识仅仅代表信息本身,不含其中的演绎成分.一个科研人员可以通过对已有知识的推理演绎而产生新的知识,这是另外的话题了.)
        * 一类和二类的知识为一个人的可用知识. 三类和四类为不可用知识.
        * 这几种知识之间可以相互转化: 四类知识可以转化为前三类的知识(百度一下), 一类或者二类的知识可能会淡忘为三类知识(考试前夕,教科书内容会变为一类知识,考试过后则可能会迅速变为三类知识.)
        * 一个人的一类知识总量十分有限(记忆力超群者除外), 绝大部分可用知识都为二类知识. 把所有知识都从二类变为一类固然很好,但是会耗费一个人很大的精力,也没有必要. 例如: 你一般不会去背诵一个产品的详细使用说明书.
    * 知识依照其内容重要性可大致分为:
        1. 有用知识: 本人需要或者希望获取的知识.
        2. 无用知识: 本人知道不知道都无所谓的知识.
        3. 归档知识: 曾经有用,后来无用的知识(但是可能会再次变得有用).
        * 一类知识绝大多数为有用知识(例外: 小学的时候你违反规定被迫背诵的学生守则, 学生守则会短期成为一类无用知识)
        * 二类,三类和四类知识的内容重要性比较随机.
    * 知识依照其表现形式可大致分为:
        1. 文本知识: 知识本身内容可打印的文本信息. 举例: 古诗文
        2. 数据知识: 本身难以或者不易被记忆的知识. 举例: 照片(你不可能记住一个数字照片的二进制字符,只可能记住描述它的元数据)
        3. 元数据知识: 其他知识的元数据. 元数据知识一般是可以且易于记忆的.
        * 一类知识中有很多是二类知识的元数据, 这就够了. 不需要花费很多不必要的精力去记忆二类知识使之成为一类知识,仅仅记住他们的元数据即可.
* 良好的检索体验: 使用尽可能少、简单的操作或输入,获取尽可能小的搜索集合, 下面举例说明
    * 浏览器书签给人带来不好的搜索体验,因为你能控制的检索用元数据只有书签夹的目录和书签的标题, 例如你已经收集了100+关于python编程的教程,并把他们放到了python文件夹下,你想找到某一篇含python并行编程内容的文章(文章标题中并没有并行两个字),那么你只能打开书签栏的python文件夹,一个个的点开所有文章去寻找
        * 这个场景下你需要的操作是: 点开收藏夹下的python目录, 你获取的搜索集合是: 100+个需要点开确认的文章, 检索体验: 差
    * onenote笔记本: 搜索栏可以对笔记的标题,添加时间和全文进行搜索, 同样假设你收集了100+篇关于python编程的文章
        * 这个场景下你需要的操作是: 在搜索栏中输入python 并行, 你获取的搜索集合是: 30+篇文章,其中有很多文中只是恰好出现了并行这个词语,但是文章并没有详细介绍python并行编程的内容, 检索体验: 良
    * 某笔记软件: 你收集了100+篇关于python编程的文章, 并且为他们都加上了合适的标签
        * 这个场景下你需要的操作是: 在搜索栏中输入python 并行对文章标签进行搜索, 你获取的搜索集合是: 5篇文章,你迅速的从中找到了你想找的那一篇, 检索体验: 优
    * 但是优秀的搜索体验是有前提的: 足够充分的元数据. 元数据可能是知识管理系统自动添加的(比如创建时间), 也有可能是用户自行添加的
# 什么是个人知识管理系统
* 个人知识管理系统(Personal Knowledge Management System, PKMS)是一个管理个人知识的系统
* 它应该提供如下三个核心功能(子系统):
    * 知识的获取: 从信息源快速获取知识全部信息, 并自动或手动为其添加一些元数据
    * 知识的整理: 方便的为储存的知识增加额外的元数据, 修改知识本身和其现有元数据
    * 知识的索引: 使用片段或者元数据快速找到已经获取的知识
* 它所管理的知识类型为一二三四类有用知识或者归档知识:
    * 一类知识本来无需放入其中,但其存在变为二类或者三类知识的可能性,所以还是放进去比较好
    * 二类有用和归档知识最适合放入其中,你知道这个知识之后(可能)会很有用,但现在并不想花费额外的精力将其转化为一类知识,只在想用的时候可以快速找到它就可以了
    * 你主动放入的知识必然是一类或者二类的知识,但是PKMS可能会有爬虫系统进行自动的信息搜集(RSS订阅源, 微信公众号爬虫等). 爬虫系统应该收集有用知识, 过滤掉无用知识
    * 三类有用知识可能来源于一二类知识或者爬虫系统
    * 三类归档知识一般来源于一二类知识
    * 四类有用知识一般来源于爬虫系统
* 广义上来说, 任何人都已经拥有了自己的一套PKMS, 它可能是几个课堂笔记本, 几个电脑程序或移动端APP, 一套工作流程(workflow), 一些自己为自己定下的行为准则(每天写日记等). 本文中的PKMS特指一组特别设计的可以协同工作以实现上述三个核心功能, 从而对计算机上储存的知识进行管理的应用程序.

# 为什么需要个人知识管理系统?
* 这是一个信息爆炸的时代. 所谓爆炸,既表现在其指数级增长的量上,也体现在其高度碎片化的展现形式上
* 各种组织, 个人和公司通过不同的工具和手段向民众广播或者推送五花八门的信息,抢夺他们的记忆力和注意力资源,而同时我们也会主动的花费精力去进行信息获取. 但是一个人的这些资源终归是有限的
    * 花很多时间在无用知识上必然会造成有用知识的匮乏,甚至遗忘. 使用PKMS的知识获取子系统可以一定程度上优化信息来源, 提升有用知识的获取效率.
    * 主动获取知识的时候, 好用的PKMS知识获取子系统可以大大缩短知识获取的时间,让我们腾出精力来做更重要的事情,同时自动为知识增加元数据,方便之后的信息检索
* 我们不可能也没必要把所有知识都转换为一类知识, 但是我们可以很容易的将许多知识的元数据牢记,使他们成为二类知识. 一个好用的PKMS索引子系统可以大大加快我们搜索二类知识的速度.
* PKMS的知识整理子系统可以帮助我们更容易的进行知识搜索(通过增加额外的元数据). 同时在整理知识的过程中, 不同的知识之间会产生联系,使得知识织成网状,形成体系,加强我们对其印象,更加便于记忆.
* 我们需要一个精心设计的PKMS程序实现个人知识库的持久化和统一化管理, 其他的知识管理系统有着明显的缺陷, 例如
    * 手写笔记: 容易丢失, 不容易添加新的元数据, 不容易实现检索, 不容易实现同一管理
    * 很多笔记类软件:
        * 数据量足够大时,不容易实现快速而精确的检索
        * 不同软件之间无法很好的协同工作
        * 可以管理的知识类型受限(只能管理文章类型的知识)
        * 在线类笔记有潜在的用户隐私隐患
        * 离线类笔记本多设备共享比较困难
        * ...

总之, 一个好用的PKMS可以增加我们信息获取,检索的速度,同时加深我们对于这些知识(或其元数据)的记忆, 充分利用我们有限的记忆力和注意力资源. PKMS中逐渐增多的知识会相互联系,形成一个个知识体系. 成体系的知识会比碎片化的知识有用的多.

# 现有知识管理系统的不足
* 知识获取模块
    * 收集信息的过程麻烦,不准确或缺少元数据
        * 比如这个典型的应用场景: 我们通过搜索引擎搜索某些内容, 点开了一大堆标签, 快速浏览其中内容, 把其中看起来靠谱的内容快速收集起来,之后再做整理,形成相对系统的知识, 可能的解决方案有:
            * 浏览器书签: 可以做到快速添加,但是缺少添加更多元数据的手段
            * 很多笔记类软件的浏览器插件:
                * 对于简单的页面可做到快速添加, 也可自行添加标签等元数据
                    * 但是如果你的标签云比较大,为每一个新页面添加完整的标签集合也是很困难的,你总是会遗漏掉一些必要的标签
                * 不能很好的处理复杂的页面(不准确,麻烦)
                    1. 缺少相关的css和js,造成排版混乱,公式缺失等
                    2. 页面中含有很多广告或其他无用信息,不能自动去除他们
                    * 作为替代的解决方案, 可以
                    1. 复制粘贴有用的部分, 自己重新排版或者格式化
                    2. 补全相关css或js
                    3. 截屏获取(这也是很多插件的解决方案)
                    * 第一种方法只能处理纯文本或简单富文本知识, 对于更复杂的信息无能为力. 额外的排版增添了额外的麻烦
                    * 第二种方法过于麻烦,除非可以自动化
                    * 第三种方法使得文章全文搜索不可用,造成元数据的丢失,且大大增加了储存占用空间
    * 没有方便的自动收集接口
        * 大多数知识管理软件只能靠人手动添加新条目,没有良好的接口添加一些自动化脚本,例如RSS订阅.微信公众号文章爬虫等
* 知识整理模块
    * 可以管理的知识类型受限:
        目前主要的知识管理软件仅能管理单一类型的知识,例如:
        * 文件管理程序: 仅能管理磁盘文件
        * 电子书管理程序: 仅能管理磁盘上的电子书
        * 笔记类管理程序: 仅能管理放入数据库中的文章和笔记
        * API文档管理程序: 收集管理API文档和编程代码片段
        * 多媒体管理程序: 管理图片,视频等多媒体数据
        * .....
    
        这些不同软件之间一般没有合适的接口来协同工作,数据导入导出也都很麻烦
        有的时候我们想要拥有一个统一的框架来储存和搜索所有的个人知识, 这会给我们带来很多额外的便利
        * 不同类型之间的数据也可以相互引用,添加关系, 方便知识成为体系
        * 所有知识都放在一起,方便管理. (软件多了就有额外的配置需求, 而且有的时候也搞不清楚东西究竟放在那里了)
        * 不用在各种软件中切换来切换去, 提高整理知识的效率
    * 可以添加的元数据受限:
        * 一般笔记类软件最多支持添加个标签,除此之外没有办法自由添加其他元数据
* 知识检索模块
    * 仅能支持简单的搜索逻辑,无法充分利用所有的元数据
        * 绝大多数知识管理软件仅仅提供了一个搜索框,可以对文章标题,标签,分类目录,时间,全文等进行简单逻辑的搜索, 但有的时候这是不够的,例如
            * 我依稀记得去年暑假看了一篇关于python的很有意思的文章,现在想再找出来看看:
            搜索逻辑: Articl: tags=python and create_time.year=2018 and create_time.month in [7,8]
            * 我想找到去年我手动评过分数的高分文章来复习一下内容
            搜索逻辑: Article: metadatas.[name=rank and value>8]
            * 我记得某篇python文章当时我非常仔细的整理了,添加了十几个tag,但是现在都想不起来了
            搜索逻辑: Article: tags=python and size(tags) > 10
            * 现在有时间了,来整理下过年之后这段时间里我的爬虫们都爬了些啥吧
            搜索逻辑: Article: source in ['rss', 'spider'] and create_time>2019-01-01T00:00:00
            * 现在有时间了,来整理下之前收集的没有怎么仔细看过的文章吧
            搜索逻辑: Article: flags.read=false

        如此等等, 这些查询需要合适的数据库后端和数据储存结构来做支持.
# 一个理想的个人知识管理系统
一个理想的个人知识管理系统应该具有以下特性

* 知识获取模块
    * 手动收集资源时
        * 尽可能多的自动获取元数据
            * 例如自动记录添加时间, 信息来源(url), 自动获取网页标题作为标题
            * 对标题进行分词, 对正文进行词频统计, 自动为文章添加标签, 或给出推荐的标签, 用户只需点击确认而不用手动输入
            * 对于特定格式的网页(知乎等), 允许用户添加自定义模板,实现元数据(标签,作者,点赞数等)和数据的自动提取(只提取问题和答案,其余的广告啥的自动忽略)
        * 操作简单,快速:
            * 一个人的注意力资源是有限的, 我们不愿意在重复性较强的行为上花过多的时间
            * 提供一个良好的UI
                * 已经存在的标签,元数据属性名称的自动补全
                    * 中文基于拼音首字母的自动补全
            * 在不进行额外操作的情况下(比如手动增加新的标签, 修改默认标题), 保存一篇文章的时间应该控制在10秒中之内
    * 提供自动收集数据的API:
        * 收集资源自动加上source='xxx'的表示收集来源的元数据
        * 用户可以方便把已经存在的爬虫接入此系统
    * 提供移动端收集接口:
        * 把链接发给Telegram和微信机器人, 自动收集链接内容
* 知识整理模块
    * 可以为知识添加任意自定义元数据, 作为之后搜索的依据, 例如
        * 我自己给文章打的分数
        * 这个文章在搜索列表中应该是什么颜色的
        * 这篇知乎文章在收集时候的点赞数
        * 这篇论文在收集时候的引用数
        * ...
    * 可以为知识库中所有类型的知识添加交叉引用
        * 例如自己写的日记: 今天聚会真高兴, 引用处填写存放聚会照片和视频的文件夹地址
        * 写一篇论文所引用的其他文章
    * 支持多种不同类型数据的储存,包括但不限于
        * 文章: 网页,纯文本,富文本,标记文本等
        * 网页: 网站URL,相比网页收藏夹的优势是可以添加任意元数据
        * 多媒体: 图片, 照片, 视频等, 自动提取它们的元数据用于检索
        * 文献: 单独列出来,因为文献相对于一般文章的元数据更为丰富
        * 电子书: 书籍类也单独列出来,理由如上
        * 代码片段: 写过程序的都知道这是什么
        * ....
        * 用户自定义类型: 提供自动以类型模板供用户自由扩展
    * 良好的UI:
        * 内容编辑器:
            * 支持纯文本,富文本,源代码,渲染页面之间的灵活切换,使得用户可以准确(修改源代码)和方便(直接修改富文本甚至渲染结果)的来修改知识内容
            * 方便的多媒体嵌入方案
            * 多种标记语言的支持和渲染: Markdown, MultiMarkdown, reStructuredText, HTML, Tex等
        * 元数据,标签,引用侧边栏:
            * 各种自动补全
    * 导出和分享系统:
        * 将文章导出为PDF, HTML等格式,便于于其他人共享
* 知识搜索系统:
    * 提供强大的搜索语法来实现复杂逻辑的搜索
    * 良好的UI:
        * 自动列出和补全可搜索的关键字,让用户知道自己可以怎么去搜索,可以用那些元数据去搜索
        * 进行复杂逻辑的搜索的时候, 对于其中的已完成部分进行预查询, 对预查询的结构进行分析, 其内容作为后续输入的自动补全内容
        * 可视化搜索逻辑
    * 总只,只要知识在此系统中,即使是三类知识也想办法能给你找出来!
* 系统安全特性:
    * 此系统应该运行于全盘加密的安全的个人电脑或服务器上
        * 知识有可以公开的与不适合公开的部分
            * 可以公开的知识(这些知识可以帮助你找工作,交朋友等):
                * 个人所学的专业知识
                * 个人业余爱好知识
                * 个人所掌握的其他有用技能的知识
            * 不适合公开的知识举例:
                * 慢性病/遗传病/传染病相关信息: 会引起各种歧视。但是本人还是需要这部分知识来进行治疗、维持健康
                * 各种取向: 会引起各种歧视。但是本人还是需要这部分知识来更好地了解自己
                * 信仰: 有些信仰在那个人所处的环境中不适合公开, 甚至要严格保密, 否则后果严重
                * 18X相关
                * 其他各种你懂的和你不懂的
                    * 每个人一生中接触到的知识甚至知识类型都是有限的
                    * 有些东西在你接触前是完全无法想象的, 所谓打开了新世界的大门
                * ...

            我们有时候需要收集不适合公开的知识, 有一些知识对我们来说也很重要, 甚至是必不可少的
      * 一个人的知识结构可以很大程度的反映这个人的喜好、性格、世界观等, 可以说是最私密的信息
        * 有些知识,一旦泄漏出来,会给当事人带来很多麻烦
            * 近几年, 各种大小公司的数据泄漏事件层出不穷, 其中多为内鬼所致
            * 不要相信任何公司和机构, 他们无法保证你的数据不被泄漏
        * 整个知识管理系统, 应该作为自己的个人隐私, 放置在自己完全可控、安全的环境中
    * 仅向本地提供服务:
        * 参考上一条和安全特性和知识搜索系统的特性, 我们即给用户提供了非常自由的查询接口, 又要保证服务器本身的安全, 但这两条特性几乎是互斥的: 一个自由的查询系统必然包含了很多的注入漏洞. 如果尝试对这些漏洞进行修补,其开发工作量甚至会大约业务程序本身, 所以我们的系统将只向本地提供服务,供用户一个人使用. 其他人不能在公网上接触到此系统.
        * 这样也会简化系统本身的开发工作, 使得系统更容易维护和升级
* 多终端, 跨平台
    * 一个好的知识管理系统, 应该可以部署到多种不同的平台上, 同时为不同平台提供兼容的用户终端
        * 目前来说, HTML和JS的网页应用程序可以提供最大的兼容性
    * 上面的系统安全特性限定了我们的系统不能接触公网, 所以多终端只能通过VPN或者SSH隧道来实现. 而且系统服务器必须有公网IP或者配置了动态域名
* (可选)统计信息和可视化:
    * 例如自动生成年终报告,看看这一年中都学到了些什么..
* 开源,模块化
    * 根据系统的安全特性, 我们不应轻易相信任何人, 只相信看得见的code. 系统应当是开源的
    * 系统应当尽可能的模块化, 方便其他开发者为其添加新的特性

Accretion 将满足所有上述的特性

# Accretion 的其他特性
* 标签系统:
    * 关系子系统:
        * 可以为任何两个标签之间添加一个关系, 例如
            * 翻译关系:
                Galaxy <==> 星系 互为翻译关系
                从逻辑上来说, 这两个标签应该等价. 一篇文章如果添加了Galaxy标签,则应自动为其添加星系的标签.
            * 同义词关系: 类似翻译关系
            * 祖先关系(待讨论): 一篇文章添加了一个标签,则应自动添加其祖先标签
            * ...
        * 为特定关系添加相应的自动处理函数, 完成上述自动添加相关标签的工作
    * 黑名单子系统:
        * 在收集文章的时候,对于哪些非标题党文章,其标题中一般就包含了足够多的标签, 我们只需要对标题简单分词后就可以作为标签了. 例如:
            * <<python如何正确地编写并行程序>>
                * 自动分词结果: python, 如何, 正确地, 编写, 并行, 程序
                * 其中有效的标签只有python和并行, 其他词语通常也不会作为标签
            * <<个人知识管理系统Accretion的特性介绍>>
                * 自动分词结果: 个人, 知识, 管理, 系统, 知识管理系统, Accretion, 的, 特性, 介绍
                * 其中有效的标签有知识管理系统和Accretion, 其他词语或者无意义,或者概念太宽泛,不适合作为标签

        这时候就要配合知识搜索子系统中的UI了:
        * 知识搜索系统会直接对标题分词, 剔除被加入标签黑名单中的标签, 把其余词语作为标签直接添加
        * 鼠标移动到自动添加的标签后, 会弹出几个选项
            * 确认标签: 将此标签的属性从自动添加的变为手动添加的
            * 删除标签: 移除此标签
            * 加入黑名单: 移除此标签并把它加入黑名单

        在刚开始使用此系统的时候, 会有很多无用的标签, 你只需动动鼠标点几下就可以把他们加入黑名单了. 在使用一段时间后,几乎所有的无意义词语都会被你加入标签黑名单, 这个时候标题分词结果作为标签就很准确了, 可以为你节省大量时间.
* 关系系统:
    * 除了标签外, 可以为任何两个知识之间添加一个关系, 例如
        * 后继关系: 第二篇文章是第一篇文章的后继
        * 对立关系: 两篇文章对同一事物持对立观点
        * 分组关系: 这是一个比较复杂的关系, 定义为如果A与B有此关系,B与C有此关系,那么A与C自动添加此关系
    * 每个关系都可以添加相应的自动处理函数,完成上述自动添加关系的工作
* 以上两系统进一步提升了系统的自动化程度,在特定情况下可以为用户节省不少的时间
* 带有关系子系统和黑名单子系统系统的标签系统可以一定程度上解决所谓"标签爆炸"的情况:
    * 在使用一段时间后,你的标签系统会变得丰富起来,这个时候再为新加入的知识添加完整的标签有有点挑战用户的耐心了.
    * 标题分词系统可以快速为文章添加大致准确的标签
    * 关系子系统可以让你在只手动添加几个种子标签的情况下,利用标签之间的关系,自动添加其他相关的标签,大大减少了用户的工作量
* 更多fancy的特性....

### 参考文献
1. [Designing a Personal Knowledgebase](http://www.acuriousmix.com/2014/09/03/designing-a-personal-knowledgebase/)