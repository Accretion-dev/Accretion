import os
import sys
import os.path as path
import numpy as np
import json
import warnings
import copy
import inflection
import pprint
p = pprint.pprint
import logging
import itertools
import time
import datetime
import pytz

clc_data = []
with open(os.path.join(__rootDir__, 'clc.txt')) as f:
    for eachline in f:
        code0, code1, text = eachline.split(',')
        clc_data.append([int(code0), int(code1), text[1:-2]])

def test_0_add_metadata_and_relation_name(self):
    g = {'user': 'accretion'}
    #for modelName in MetaDataTodoNames:
        #addMetaDataName(modelName, 'some'+sf,  format='format_bigint', **g)
        #addMetaDataName(modelName, 'rank'+sf,  format='format_int', **g)
        #addMetaDataName(modelName, 'color'+sf, format='format_text', **g)
        #addMetaDataName(modelName, 'url'+sf, format='format_text', **g)
        #addMetaDataName(modelName, 'author'+sf, format='format_text', **g)
        #addMetaDataName(modelName, 'time'+sf, format='format_time', **g)
        #addMetaDataName(modelName, 'editable'+sf, format='format_bool', **g)
        #addMetaDataName(modelName, 'binary_file'+sf, format='format_binary', **g)
    def p(modelName, data, d):
        for eachdata in data:
            name = eachdata['name']
            d[name] = addMetaDataName(modelName, name+sf, format=eachdata['format'], **g)
    data = [
        {'name': 'some',        'format': 'format_bigint'},
        {'name': 'rank',        'format': 'format_int'},
        {'name': 'color',       'format': 'format_text'},
        {'name': 'url',         'format': 'format_text'},
        {'name': 'author',      'format': 'format_text'},
        {'name': 'time',        'format': 'format_time'},
        {'name': 'editable',    'format': 'format_bool'},
        {'name': 'binary_file', 'format': 'format_binary'},
    ];
    self.data['metadataname'] = {}
    for modelName in MetaDataTodoNames:
        d = {}
        p(modelName, data, d)
        self.data['metadataname'][modelName] = d

    #addRelationName('Article', '相同观点'+sf, symmetrical=True, **g)
    #addRelationName('Article', '相反观点'+sf, symmetrical=True, **g)
    #addRelationName('Article', '相关'+sf, symmetrical=True, **g)
    #addRelationName('Article', '进阶'+sf, symmetrical=True, reverse_name='被进阶'+sf, **g)
    #addRelationName('Tag', '同义词'+sf, symmetrical=True, **g)
    #addRelationName('Tag', '反义词'+sf, symmetrical=True, **g)
    #addRelationName('Tag', '歧义相关'+sf, symmetrical=True, **g)
    #addRelationName('Tag', '翻译'+sf, symmetrical=True, **g)
    #addRelationName('Tag', '缩写'+sf, reverse_name='被缩写'+sf, symmetrical=False, **g)
    #addRelationName('Tag', '联想'+sf, symmetrical=True, **g)
    #addRelationName('Tag', '引申'+sf, symmetrical=True, reverse_name='被引申'+sf, **g)

    d = {}
    def p(data, d):
        for eachdata in data:
            model = eachdata.pop('model')
            name = eachdata.pop('name')
            if eachdata.get('reverse_name'):
                eachdata['reverse_name'] += sf
            d[name] = addRelationName(model, name+sf, **eachdata, **g)
    data = [
        {'model':'Article', 'name': '相同观点', 'symmetrical':True},
        {'model':'Article', 'name': '相反观点', 'symmetrical':True},
        {'model':'Article', 'name': '相关',     'symmetrical':True},
        {'model':'Article', 'name': '进阶',     'symmetrical':False, 'reverse_name':'被进阶'},
        {'model':'Tag',     'name': '同义词',   'symmetrical':True},
        {'model':'Tag',     'name': '反义词',   'symmetrical':True},
        {'model':'Tag',     'name': '歧义相关', 'symmetrical':True},
        {'model':'Tag',     'name': '翻译',     'symmetrical':True},
        {'model':'Tag',     'name': '缩写',     'symmetrical':False, 'reverse_name':'被缩写'},
        {'model':'Tag',     'name': '联想',     'symmetrical':True},
        {'model':'Tag',     'name': '引申',     'symmetrical':True, 'reverse_name':'被引申'},
    ]; p(data, d)
    self.data['relationname'] = d
    # add test catalogue
def test_11_add_catalogue_name_clc(self):
    if 'Catalogue' in self.exclude:
        return
    sf = self.debug_suffix
    g = {'user': 'accretion', 'type':'catalogue_article'}
    addMetaDataName("Catalogue", '中图法代码'+sf, format='format_int', user=g['user'])
    objs = {}
    objs[0] = addCatalogue('中图法分类'+sf, **g)
    for eachdata in clc_data:
        code, pcode, name = eachdata
        objs[code] = addCatalogue(
                         name+sf,
                         metadatas=[ { 'name':"中图法代码"+sf, 'value':code} ],
                         family=[{'father': objs[pcode]}],
                         **g
                     )
def test_10_add_catalogue_name(self):
    sf = self.debug_suffix
    g = {'user': 'accretion'}
    self.data['catalogue'] = {}
    if 'Catalogue' in self.exclude:
        for ctype in ['catalogue_article', 'catalogue_website']:
            catalogues = Catalogue.objects.filter(type__name=ctype,
                                                  user__username=g['user'])
            d = {}
            for each in catalogues:
                name = each.name.split(sf)[0]
                d[name] = each
            self.data['catalogue'][ctype] = d
            return
    for ctype in ['catalogue_article', 'catalogue_website']:
        d = {}
        def p(data, d):
            for eachdata in data:
                name = eachdata['name']
                eachdata['name'] += sf
                if 'comment' not in eachdata:
                    eachdata['comment'] = '这是{}的注释'.format(eachdata['name'])
                if 'description' not in eachdata:
                    eachdata['description'] = '这是{}的描述'.format(eachdata['name'])
                eachdata['type'] = ctype
                eachdata.update(g)
                if 'metadata' in eachdata:
                    for eachm in eachdata['metadata']:
                        eachm['name'] += sf
                if 'metadatas' in eachdata:
                    for eachm in eachdata['metadatas']:
                        eachm['name'] += sf
                if 'family' in eachdata:
                    for eachf in eachdata['family']:
                        for eachkey in eachf:
                            eachf[eachkey] = d[eachf[eachkey]]
                result = addCatalogue(**eachdata)
                if name not in d:
                    d[name] = result
        data = [
            {'name': '简单分类', 'metadata': [{'name': 'color', 'value': 'green'}]},
            {'name': '来源', 'metadata': [{'name': 'color', 'value': 'blue'}]},
            {'name': 'Learning'},
            {'name': '二次元', 'family':[{'father':'简单分类'}]},
            {'name': '理科', 'family':[{'father':'简单分类'}]},
            {'name': '文科', 'family':[{'father':'简单分类'}]},
            {'name': '工科', 'family':[{'father':'简单分类'}]},
            {'name': '艺术', 'family':[{'father':'简单分类'}]},
            {'name': '玄学', 'family':[{'father':'简单分类'}]},
            {'name': '管理学', 'family':[{'father':'简单分类'}]},
            {"name": "不科学", 'family':[{'father':'简单分类'}],
             'flags':[{'name': 'in_trash', 'comment':'init rash'}, 'debug']},
            {"name":"计算机", 'family':[{'father':'理科'}, {'father':'Learning'}]},
            {"name":"编程语言", 'family':[{'father':'计算机'}]},
            {"name":"python",
             'family':[{'father':'编程语言'},{'father':'Learning'}]},
            {"name":"go", 'family':[{'father':'编程语言'},{'father':'Learning'}]},
            {"name":"c", 'family':[{'father':'编程语言'}]},
            {"name":"c++", 'family':[{'father':'编程语言'}]},
            {"name":"数学",   'family':[{'father':'理科'}]},
            {"name":"物理",   'family':[{'father':'理科'}]},
            {"name":"天文",   'family':[{'father':'理科'}]},
            {"name":"天文八卦", 'family':[{'father':'天文'}, {'father':'不科学'}]},
            {"name":"语言学", 'family':[{'father':'文科'}]},
            {"name":"音乐",   'family':[{'father':'艺术'}]},
            {"name":"绘画",   'family':[{'father':'艺术'}]},
            {"name":"电影",   'family':[{'father':'艺术'}]},
            {"name":"动画",   'family':[{'father':'艺术'}]},
            {"name":"耳机",   'family':[{'father':'玄学'}]},
            {"name":"番剧",   'family':[{'father':'二次元'}]},
            {"name":"音乐",   'family':[{'father':'二次元'}]},
            {"name":"绘画",   'family':[{'father':'二次元'}]},
            {"name":"门户", 'family':[{'father':'来源'}]},
            {"name":"自媒体", 'family':[{'father':'来源'}]},
            {"name":"果壳", 'family':[{'father':'门户'}],
             'metadata': [{'name':'url', 'value':'https://www.guokr.com/'}]
            },
            {"name":"github", 'family':[{'father':'门户'}],
             'metadata': [{'name':'url', 'value':'https://github.com/'}]
            },
            {"name":"知乎", 'family':[{'father':'门户'}],
             'metadata': [{'name':'url', 'value':'https://zhihu.com/'}]
            },
            {"name":"腾讯", 'family':[{'father':'门户'}],
             'metadata': [{'name':'url', 'value':'https://www.qq.com/'}]
            },
            {"name":"网易", 'family':[{'father':'门户'}],
             'metadata': [{'name':'url', 'value':'https://www.163.com/'}]
            },
            {"name":"天文八卦学", 'family':[{'father':'自媒体'}],
             'metadata': [{'name':'url', 'value':'weichat://astrobagualogy'}]
            },
        ]; p(data, d)
        self.data['catalogue'][ctype] = d
def test_20_add_tag(self):
    sf = self.debug_suffix
    g = {'user': 'accretion'}
    self.data['tag'] = {}
    if 'Tag' in self.exclude:
        for ctype in ['tag_article', 'tag_website']:
            tags = Tag.objects.filter(type__name=ctype, user__username=g['user'])
            d = {}
            for each in tags:
                name = each.name.split(sf)[0]
                d[name] = each
            self.data['tag'][ctype] = d
            return
    for ctype in ['tag_article', 'tag_website']:
        d = {}
        def p(data, d):
            for eachdata in data:
                name = eachdata['name']
                eachdata['name'] += sf
                if 'comment' not in eachdata:
                    eachdata['comment'] = '这是{}的注释'.format(eachdata['name'])
                if 'description' not in eachdata:
                    eachdata['description'] = '这是{}的描述'.format(eachdata['name'])
                eachdata['type'] = ctype
                eachdata.update(g)
                if 'metadata' in eachdata:
                    for eachm in eachdata['metadata']:
                        eachm['name'] += sf
                if 'metadatas' in eachdata:
                    for eachm in eachdata['metadatas']:
                        eachm['name'] += sf
                if 'family' in eachdata:
                    for eachf in eachdata['family']:
                        if 'father' in eachf:
                            eachf['father'] = d[ eachf['father'] ]
                        if 'children' in eachf:
                            eachf['children'] = d[ eachf['children'] ]
                if 'relation' in eachdata:
                    for eachr in eachdata['relation']:
                        if 'from' in eachr:
                            eachr['from'] = d[eachr['from']]
                        if 'to' in eachr:
                            eachr['to'] = d[eachr['to']]
                        eachr['name'] += sf
                result = addTag(**eachdata)
                if name not in d:
                    d[name] = result
        data = [
            {'name': '编程语言'},
            {'name': '装饰器', 'description':'一种语法糖'},
            {'name': '正则表达式', 'description':'一种搜索标记语法'},
            {'name': 'python', 'family':[{'father': '编程语言'}]},
            {'name': 'c', 'family':[{'father': '编程语言'}]},
            {'name': 'go', 'family':[{'father': '编程语言'}]},
            {'name': '计算机科学'}, {'name': '物理'}, {'name': '数学'},
            {'name': '天文学'}, {'name':'音乐'}, {'name': '二次元'},
            {'name': '活动星系核', 'family':[{'father': '天文学'}]},
            {'name': 'AGN', 'relation':[{'name':'翻译', 'from':'活动星系核'}]},
            {'name': '正能量', 'description':'社会的光明面，心灵鸡汤'},
            {'name': '负能量',
             'description':'社会的黑暗面，心灵毒药',
             'relation':[{'name': '反义词', 'from': '正能量', 'comment':'test comment'}]},
            {'name': '18X', 'description': '少儿不宜'},
            {'name': '性', 'family':[{'father':'18X'}]},
            {'name': '暴力', 'family':[{'father':'18X'}]},
            {'name': '电影'}, {'name': '梗', 'description':'典故的现代用语'},
            {'name': '典故', 'description':'梗的古代用语',
             'relation': [{'name':'同义词', 'to':'梗'}]},
            {'name': 'CS', 'description':'消歧义'},
            {'name': 'CS:游戏', 'display_name': 'CS',
             'description':'第一人称设计游戏',
             'family':[{'father':'CS'}]},
            {'name': 'CS:学科', 'display_name': 'CS',
             'description':'计算机科学',
             'family':[{'father':'CS'}],
             'relation': [
                {'name':"缩写", 'from':'计算机科学'}]},
            {'name': '钓鱼', 'description':'消歧义'},
            {'name': '钓鱼:运动', 'display_name':'钓鱼',
             'description':'从水域中获得鱼类',
             'family':[{'father':'钓鱼'}]
             },
            {'name': '钓鱼:欺骗行为', 'display_name':'钓鱼',
             'description':'故意散播虚假消息，引人上当',
             'family':[{'father':'钓鱼'}]
             },
            {'name': '炸鱼', 'description':'消歧义'},
            {'name': '炸鱼:通常意义', 'display_name':'炸鱼',
             'description':'使用爆炸物大规模杀死水中的生物',
             'family':[{'father':'炸鱼'}]
            },
            {'name': '炸鱼:欺骗行为', 'display_name':'炸鱼',
            'description':'见tag: 钓鱼:欺骗行为，威力更大',
             'family':[{'father':'炸鱼'}]
            },
        ]; p(data, d)
        self.data['tag'][ctype] = d
def test_30_add_article(self):
    sf = self.debug_suffix
    g = {'user': 'accretion'}
    d = {}
    def p(data, d):
        for eachdata in data:
            name = eachdata['name']
            eachdata['name'] += sf
            if 'comment' not in eachdata:
                eachdata['comment'] = '这是{}的注释'.format(eachdata['name'])
            eachdata.update(g)
            if 'metadata' in eachdata:
                for eachm in eachdata['metadata']:
                    eachm['name'] += sf
            if 'metadatas' in eachdata:
                for eachm in eachdata['metadatas']:
                    eachm['name'] += sf
            if 'family' in eachdata:
                for eachf in eachdata['family']:
                    if 'father' in eachf:
                        eachf['father'] = d[ eachf['father'] ]
                    if 'children' in eachf:
                        eachf['children'] = d[ eachf['children'] ]
            if 'relation' in eachdata:
                for eachr in eachdata['relation']:
                    if 'from' in eachr:
                        eachr['from'] = d[eachr['from']]
                    if 'to' in eachr:
                        eachr['to'] = d[eachr['to']]
                    eachr['name'] += sf
            result = addArticle(**eachdata)
            if name not in d:
                d[name] = result
    t = self.data['tag']['tag_article']
    c = self.data['catalogue']['catalogue_article']
    data = [
        {'name': 'python基本语法',
         'tags': [{'id':t['python'].pk}],
         'catalogues': [{'id':c['python'].pk}, {'id':c['Learning'].pk}],
        },
        {'name': 'python装饰器',
         'tags': [{'id':t['python'].pk}, {'id':t['装饰器'].pk}],
         'catalogues': [{'id':c['python'].pk}, {'id':c['Learning'].pk}],
        },
        {'name': 'python元编程',
         'tags': [{'id':t['python'].pk}],
         'catalogues': [{'id':c['python'].pk}, {'id':c['Learning'].pk}],
         'relation':[{'name': '相关', 'from': 'python装饰器', 'comment':'test comment'}]
        },
        {'name': 'web文章: 3分钟学会python',
         'family':[{'father':'python基本语法'}],
         'tags': [{'id':t['python'].pk}],
         'catalogues': [{'id':c['python'].pk}, {'id':c['玄学'].pk}],
         'metadatas': [
             {'name': 'rank', 'value':0},
         ]
        },
        {'name': 'web文章: 初识python',
         'family':[{'father':'python基本语法'}],
         'tags': [{'id':t['python'].pk}],
         'catalogues': [{'id':c['python'].pk}],
         'relation':[
             {'name': '进阶', 'from': 'python基本语法', 'comment':'test comment'},
             {'name': '进阶', 'to': 'web文章: 3分钟学会python', 'comment':'test comment'},
         ]
        },
        {'name': 'web文章: 21天python',
         'family':[{'father':'python基本语法'}],
         'tags': [{'id':t['python'].pk}]},
        {'name': '正则表达式',
         'tags': [{'id':t['正则表达式'].pk}]},
        {'name': '正则表达式总结',
         'family':[{'father':'正则表达式'}],
         'tags': [{'id':t['正则表达式'].pk}]},
        {'name': '正则表达式基本语法',
         'family':[{'father':'正则表达式总结'}]},
        {'name': 'web文章: 30分钟学会正则表达式',
         'family':[{'father':'正则表达式'}],
         'metadatas': [
             {'name': 'rank', 'value':10},
         ]
        },
    ]; p(data, d)

