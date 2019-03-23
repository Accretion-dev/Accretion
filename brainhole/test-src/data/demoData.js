  let data = [
    {model: "Relation", data: [
      // a is xxx of b, a xxx b
      {name: 'translation', symmetric: true},
      {name: 'prev', reverse_name: 'next', symmetric: false},
      {name: 'cite', reverse_name: 'cited', symmetric: false},
      {name: 'related', symmetric: true},
      {name: 'synonym', symmetric: true},
      {name: 'clarify', reverse_name:'confuse', symmetric: false},
      {name: 'abbr', reverse_name:'abbreviated', symmetric: false},
      {name: 'agree', reverse_name:'agginst', symmetric: false},
    ]},
    {model: "Metadata", data: [
      {name: 'rank'},
      {name: 'url'},
      {name: 'color'},
    ]},
    {model: "Catalogue", data: [
      {name: 'sources', children:[ {name: 'personal'}, {name: 'portal'} ] },
      {name: 'personal', children:[ {name: 'chaping'}, {name: 'astrobagualogy'}, {name: 'mozhou'}] },
      {name: 'portal', children:[ {name: 'zhihu'}, {name: 'arxiv'}, {name: 'guokr'} ] },
      {name: 'zhihu', metadatas: [{metadata: {name: 'url'}, value: 'zhihu.com'}]},
      {name: 'goukr', metadatas: [{metadata: {name: 'url'}, value: 'www.guokr.com'}]},
      {name: 'arxiv', metadatas: [{metadata: {name: 'url'}, value: 'arxiv.org'}]},
      {name: 'chaping'},
      {name: 'astrobagualogy'},
      {name: 'mozhou'},

      {name: 'working'},
      {name: 'learning'},
      {name: 'News'},
      {name: 'Entertainment news', fathers:[{name: 'news'}]},
      {name: 'Tech news', fathers:[{name: 'news'}]},
      {name: 'Science news', fathers:[{name: 'news'}]},

      {name: 'subject',
       children:[ {name: 'liberal'}, {name: 'technique'}, {name: 'bagualogy'},
                  {name: 'science'}, {name: 'arts'}, ]},
      {name: 'liberal'},
      {name: 'essay', fathers:[{name: 'liberal'}]},
      {name: 'history', fathers:[{name: 'liberal'}]},
      {name: 'technique'},
      {name: 'bagualogy'},
      {name: 'science',
       children:[ {name: 'math'}, {name: 'computer'},
                  {name: 'physics'}, {name: 'astronomy'}, ]},
      {name: 'math'},
      {name: 'computer'},
      {name: 'physics'},
      {name: 'astronomy'},
      {name: 'arts', children: [ {name: 'movie'}, {name: 'music'}, ]},
      {name: 'movie'},
      {name: 'music'},
    ]},
    {model: "Tag", data: [
      {name: 'computer science'},
      {name: 'cs', relations: [
        {relation: {name: 'clarify'}, from:{name: 'cs(computer science)'}},
        {relation: {name: 'clarify'}, from:{name: 'cs(game)'}},
      ]}
      {name: 'cs(computer science)',
       relations:[ {relation: {name: 'abbr'}, to:{name: 'computer science'}}, ] },
      {name: 'cs(game)'},

      {name: 'fishing', relations: [
        {relation: {name: 'clarify'}, from:{name: 'fishing(sport)'}},
        {relation: {name: 'clarify'}, from:{name: 'fishing(swindle)'}},
      ]},
      {name: 'fishing(sport)'},
      {name: 'fishing(swindle)'},

      {name: 'language', relations: [
        {relation: {name: 'clarify'}, from:{name: 'language(cs)'}},
        {relation: {name: 'clarify'}, from:{name: 'language(raw)'}},
      ]},
      {name: 'language(cs)',
        children: [ {name: 'python'}, {name: 'c'}, {name: 'go'}, {name: 'javascript'}, ]},
      {name: 'language(raw)',
        children: [ {name: 'chinese'}, {name: 'english'}, {name: 'japanese'} ]}, },
      {name: 'chinese'},
      {name: 'english'},
      {name: 'japanese'},

      {name: 'diangu', relations: [
        {relation: {name: 'synonym'}, from:{name: 'geng'}},
      ]},
      {name: 'geng'},

      {name: 'python'},
      {name: 'c'},
      {name: 'go'},
      {name: 'javascript'},

      {name: 'astronomy', relations: [ {relation: {name: 'translation'}, from:{name: 'tianwen'}}, ]},
      {name: 'tianwen'},

      {name: '18X', children:[{name: 'sex'}, {name: 'violence'}]},
      {name: 'sex'},
      {name: 'violence'},

      {name: 'programming'},
      {name: 'IT'},
      {name: 'news'},
      {name: 'windows'},
      {name: 'linux', children:[ {name: 'ubuntu'}, {name: 'gentoo'}, {name: 'arch'}, ]},
      {name: 'ubuntu'},
      {name: 'gentoo'},
      {name: 'arch'},
      {name: 'OSX'},
    ]},
    {model: "Article", data: [

    ]},
  ]
export default data
