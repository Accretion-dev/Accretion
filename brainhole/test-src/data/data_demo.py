import os
import sys
import os.path as path
import numpy as np
import json
import warnings
import copy
import pprint
p = pprint.pprint
import logging
import itertools
import time
import datetime

clc_data = []
with open(os.path.join(os.path.dirname(__file__), 'clc.txt')) as f:
    for eachline in f:
        code0, code1, text = eachline.split(',')
        clc_data.append([int(code0), int(code1), text[1:-2]])

Metadata = [
    {'name': 'rank', 'format': 'intervalInt'},
    {'name': 'color', 'format': 'color'},
    {'name': 'url', 'format': 'url'},
    {'name': 'author', 'format': 'string'},
    {'name': 'time', 'format': 'time'},
    {'name': 'editable', 'format': 'boolean'},
    {'name': 'image', 'format': 'video'},
    {'name': 'debug', 'format': 'boolean'},
]

Relation = [
    {'name': '相同观点', 'symmetrical':True,  'type':'article', 'flags': {'debug': True}},
    {'name': '相反观点', 'symmetrical':True,  'type':'article', 'flags': {'debug': True}},
    {'name': '相关',     'symmetrical':True, 'type':'article'},
    {'name': '进阶',     'symmetrical':False, 'reverse_name':'被进阶', 'type': 'article'},
    {'name': '引用',     'symmetrical':False, 'reverse_name':'被引用', 'type': 'cross'},
    {'name': '同义词',   'symmetrical':True, 'type': 'tag'},
    {'name': '反义词',   'symmetrical':True, 'type': 'tag'},
    {'name': '歧义',     'symmetrical':True, 'type': 'tag'},
    {'name': '翻译',     'symmetrical':True, 'type': 'tag'},
    {'name': '缩写',     'symmetrical':False, 'reverse_name':'被缩写', 'type': 'tag'},
    {'name': '引申',     'symmetrical':True, 'reverse_name':'被引申', 'type': 'tag'},
]

# construct clc
Catalogue = [
    { 'name': "中图法分类" },
]
nameMap = { 0: "中图法分类" }
for eachdata in clc_data:
    code, pcode, name = eachdata
    nameMap[code] = name
    Catalogue.append({
      'name': name,
      'fathers': [
        {'name': nameMap[pcode]}
      ]
    })
data = [
    {
        'name': '简单分类',
        'metadatas': [ {'metadata': {'name': 'color'}, 'value': 'green', 'commont': '显示为绿色'} ]
    },
    {
        'name': '来源',
        'metadatas': [ {'metadata': {'name': 'color'}, 'value': 'blue', 'commont': '显示为蓝色'} ],
        'description': '按照信息来源分类的目录'
    },
    {'name': 'Learning', 'description': '用来暂存东西的目录'},
    {'name': '二次元', 'fathers':[{'name':'简单分类'}]},
    {'name': '理科', 'fathers':[{'name':'简单分类'}]},
    {'name': '文科', 'fathers':[{'name':'简单分类'}]},
    {'name': '工科', 'fathers':[{'name':'简单分类'}]},
    {'name': '艺术', 'fathers':[{'name':'简单分类'}]},
    {'name': '玄学', 'fathers':[{'name':'简单分类'}]},
    {'name': '管理学', 'fathers':[{'name':'简单分类'}]},
    {"name": "不科学", 'fathers':[{'name':'简单分类'}],
     'flags':{'in_trash': True, 'debug': True}},
    {"name":"计算机", 'fathers':[{'name':'理科'}, {'name':'Learning'}]},
    {"name":"编程语言", 'fathers':[{'name':'计算机'}]},
    {"name":"python",
     'fathers':[{'name':'编程语言'}, {'name':'Learning'}]},
    {"name":"go", 'fathers':[{'name':'编程语言'},{'name':'Learning'}]},
    {"name":"c",  'fathers':[{'name':'编程语言'}]},
    {"name":"c++", 'fathers':[{'name':'编程语言'}]},
    {"name":"数学",   'fathers':[{'name':'理科'}]},
    {"name":"物理",   'fathers':[{'name':'理科'}]},
    {"name":"天文",   'fathers':[{'name':'理科'}]},
    {"name":"天文八卦", 'fathers':[{'name':'天文'}, {'name':'不科学'}]},
    {"name":"语言学", 'fathers':[{'name':'文科'}]},
    {"name":"音乐",   'fathers':[{'name':'艺术'}]},
    {"name":"绘画",   'fathers':[{'name':'艺术'}]},
    {"name":"电影",   'fathers':[{'name':'艺术'}]},
    {"name":"动画",   'fathers':[{'name':'艺术'}]},
    {"name":"耳机",   'fathers':[{'name':'玄学'}]},
    {"name":"debug技术",   'fathers':[{'name':'玄学'}, {'name':'计算机'}]},
    {"name":"番剧",   'fathers':[{'name':'二次元'}]},
    {"name":"音乐",   'fathers':[{'name':'二次元'}]},
    {"name":"绘画",   'fathers':[{'name':'二次元'}]},
    {"name":"门户", 'fathers':[{'name':'来源'}]},
    {"name":"自媒体", 'fathers':[{'name':'来源'}]},
    {"name":"果壳", 'fathers':[{'father':'门户'}],
     'metadatas': [
        {
            'metadata': {'name':'url'},
            'value':'https://www.guokr.com/'
        }
    ]
    },
    {"name":"github", 'fathers':[{'name':'门户'}],
     'metadatas': [
        {
            'metadata': {'name':'url'},
            'value':'https://www.github.com/'
        }
     ]
    },
    {"name":"知乎", 'fathers':[{'nmae':'门户'}],
     'metadatas': [
        {
            'metadata': {'name':'url'},
            'value':'https://www.zhihu.com/'
        }
     ]
    },
    {"name":"腾讯", 'fathers':[{'name':'门户'}],
     'metadatas': [
        {
            'metadata': {'name':'url'},
            'value':'https://www.qq.com/'
        }
     ]
    },
    {"name":"网易", 'fathers':[{'name':'门户'}],
     'metadatas': [
        {
            'metadata': {'name':'url'},
            'value':'https://www.163.com/'
        }
     ]
    },
    {"name":"天文八卦学", 'fathers':[{'name':'自媒体'}],
     'metadatas': [
        {
            'metadata': {'name':'url'},
            'value':'weichat://astrobagualogy'
        }
     ]
    },
]
Catalogue.extend(data)

Tag = [
    {'name': '编程语言'},
    {'name': '装饰器', 'description':'一种语法糖'},
    {'name': '正则表达式', 'description':'一种搜索标记语法'},
    {'name': 'python', 'fathers':[{'name': '编程语言'}]},
    {'name': 'c', 'fathers':[{'name': '编程语言'}]},
    {'name': 'go', 'fathers':[{'name': '编程语言'}]},
    {'name': '计算机科学'}, {'name': '物理'}, {'name': '数学'},
    {'name': '天文学'}, {'name':'音乐'}, {'name': '二次元'},
    {'name': '活动星系核', 'fathers':[{'name': '天文学'}]},
    {'name': 'AGN', 'relations':[
        {'relation':{'name':'翻译'}, 'from':{'name':'活动星系核'}, 'fromModel':'Tag' }
    ]},
    {'name': '正能量', 'description':'社会的光明面，心灵鸡汤'},
    {'name': '负能量',
     'description':'社会的黑暗面，心灵毒药',
     'relations':[
         { 'relation': {'name': '反义词'}, 'from': {'name':'正能量'}, 'fromModel':'Tag', 'comment':'test comment' }
    ]},
    {'name': '18X', 'description': '少儿不宜'},
    {'name': '性', 'fathers':[{'name':'18X'}]},
    {'name': '暴力', 'fathers':[{'name':'18X'}]},
    {'name': '电影'},
    {'name': '梗', 'description':'典故的现代用语'},
    {'name': '典故', 'description':'梗的古代用语',
     'relations': [
         { 'relation':{'name':'同义词'}, 'to': {'name':'梗'}, 'toModel':'Tag'}
    ]},
    {'name': 'CS', 'description':'消歧义'},
    {'name': 'CS:游戏', 'display_name': 'CS',
     'description':'第一人称设计游戏',
     'fathers':[{'name':'CS'}]},
    {'name': 'CS:学科', 'display_name': 'CS',
     'description':'计算机科学',
     'fathers':[{'name':'CS'}],
     'relations': [
         {'relation': {'name':"缩写"}, 'from':{'name':'计算机科学'}, 'fromModel': 'Tag'}
    ]},
    {'name': '钓鱼', 'description':'消歧义'},
    {'name': '钓鱼:运动', 'display_name':'钓鱼',
     'description':'从水域中获得鱼类',
     'fathers':[{'name':'钓鱼'}]
     },
    {'name': '钓鱼:欺骗行为', 'display_name':'钓鱼',
     'description':'故意散播虚假消息，引人上当',
     'fathers':[{'name':'钓鱼'}]
     },
    {'name': '炸鱼', 'description':'消歧义'},
    {'name': '炸鱼:通常意义', 'display_name':'炸鱼',
     'description':'使用爆炸物大规模杀死水中的生物',
     'fathers':[{'name':'炸鱼'}],
     },
    {'name': '炸鱼:欺骗行为', 'display_name':'炸鱼',
    'description':'见tag: 钓鱼:欺骗行为，威力更大',
     'fathers':[{'name':'炸鱼'}],
     'relations': [
         { 'relation':{'name':'同义词'}, 'to': {'name':'钓鱼:欺骗行为'}, 'toModel':'Tag'}
    ]},
]


Article = [
    {'title': 'python基本语法',
     'tags': [
         {'tag': {'name': 'python'}}
     ],
     'catalogues': [
         {'catalogue':{'name': 'python'}}, {'catalogue':{'name': 'Learning'}}
     ],
    },
    {'title': 'python装饰器',
     'tags': [
         {'tag': {'name':'python'}},
         {'tag': {'name':'装饰器'}},
     ],
     'catalogues': [
         {'catalogue': {'name':'python'}},
         {'catalogue': {'name':'Learning'}},
     ],
    },
    {'title': 'python元编程',
     'tags': [
         {'tag':{'name':'python'}}
     ],
     'catalogues': [
         {'catalogue':{'name':'python'}},
         {'catalogue':{'name':'Learning'}}
     ],
     'relations':[
         {'relation':{'name': '相关'}, 'from': {'title': 'python装饰器'}, 'fromModel': 'Article', 'comment':'test comment'}
     ]
    },
    {'title': 'web文章: 3分钟学会python',
     'fathers':[{'name':'python基本语法'}],
     'tags': [
         {'tag':{'name':'python'}}
     ],
     'catalogues': [
         {'catalogue':{'name':'python'}}, {'catalogue':{'name':'玄学'}}
     ],
     'metadatas': [
         {'metadata':{'name': 'rank'}, 'value':0},
     ]
    },
    {'title': 'web文章: 初识python',
     'fathers':[{'name':'python基本语法'}],
     'tags': [
         {'tag':{'name':'python'}}
     ],
     'catalogues': [
         {'catalogue':{'name':'python'}}
     ],
     'relations':[
         {'relation':{'name': '进阶'}, 'from': {'name':'python基本语法'},          'fromModel': 'Article', 'comment':'test comment'},
         {'relation':{'name': '进阶'}, 'to': {'name': 'web文章: 3分钟学会python'}, 'fromModel': 'Article', 'comment':'test comment'},
     ]
    },
    {'name': 'web文章: 21天python',
     'fathers':[{'name':'python基本语法'}],
     'tags': [{'tag':{'name':'python'}}]},
    {'name': '正则表达式',
     'tags': [{'tag':{'name':'正则表达式'}}]},
    {'name': '正则表达式总结',
     'fathers':[{'name':'正则表达式'}],
     'tags': [{'tag':{'name':'正则表达式'}}]},
    {'name': '正则表达式基本语法',
     'fathers':[{'name':'正则表达式总结'}]},
    {'name': 'web文章: 30分钟学会正则表达式',
     'fathers':[{'name':'正则表达式'}],
     'metadatas': [
         {'metadata':{'name': 'rank'}, 'value':10},
     ]
    }
]

result = {
    'Metadata': Metadata,
    'Relation': Relation,
    'Catalogue': Catalogue,
    'Tag': Tag,
    'Article': Article,
}

with open('testdata.json', 'w') as f:
    json.dump(result, f, indent=2)
