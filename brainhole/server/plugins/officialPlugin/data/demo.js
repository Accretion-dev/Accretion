export default {
  name: 'demo',
  description: 'some demo data',
  data: [
    {model: "Relation", data: [
      {name: 'simular', symmetric: true},
      {name: 'translation', symmetric: true},
      {name: 'disambiguation', symmetric: false},
      {name: 'some-relation', symmetric: false},
    ]},
    {model: "Tag", data: [
      // test simular
      {name: 'good',
       relations: [
        {relation: {name: 'simular'}, other:{name: 'nice'}},
       ],
      },
      {name: 'nice', relations: [
        {relation: {name: 'simular'}, other:{name: 'great'}},
      ]},
      {name: 'great',
       relations: [
         {relation: {name: 'simular'}, other:{name: 'fine'}},
       ],
      },
      {name: 'fine'},

      // test translation
      {name: 'foo(en)', relations:[
        {relation: {name: 'translation'}, other:{name: 'foo(zh)'}},
      ]},
      {name: 'foo(zh)', relations:[
        {relation: {name: 'translation'}, other:{name: 'foo(jp)'}},
      ]},
      {name: 'foo(jp)', relations:[
        {relation: {name: 'translation'}, other:{name: 'foo(fr)'}},
      ]},
      {name: 'foo(fr)', fathers: [{name: 'bar(fr)'}]},

      {name: 'bar(en)', relations:[
        {relation: {name: 'translation'}, other:{name: 'bar(zh)'}},
      ]},
      {name: 'bar(zh)', relations:[
        {relation: {name: 'translation'}, other:{name: 'bar(jp)'}},
      ]},
      {name: 'bar(jp)'},
      {name: 'bar(fr)'},
      {name: 'barbar(fr)', children:[{name: 'bar(fr)'}]},

      {name: 'abcd', relations:[
        {relation: {name: 'disambiguation'}, to:{name: 'a'}},
        {relation: {name: 'disambiguation'}, to:{name: 'b'}},
        {relation: {name: 'disambiguation'}, to:{name: 'c'}},
        {relation: {name: 'disambiguation'}, to:{name: 'd'}},
      ]},
      {name: 'a'}, {name: 'b'}, {name:'c'}, {name: 'd'},

      {name: 'xyz', relations:[
        {relation: {name: 'disambiguation'}, to:{name: 'x'}},
        {relation: {name: 'disambiguation'}, to:{name: 'y'}},
        {relation: {name: 'disambiguation'}, to:{name: 'z'}},
      ]},
      {name: 'x'}, {name: 'y'}, {name: 'z'},

      {name: '1', children:[{name: '1.1'},{name: '1.2'},{name: '1.3'}]},
      {name: '1.1', children:[{name:'1.1.1'}]},
      {name: '1.1.1', children:[{name:'1.1.1.1'}]},
      {name: '1.1.1.1', children:[{name:'1.1.1.1.1'}]},
      {name: '1.1.1.1.1', fathers:[{name:'1.1.1'}]},
      {name: '1.2', children:[{name:'1.2.1'},{name:'1.2.2'}]},
      {name: '1.2.1'},
      {name: '1.2.2', children:[{name:'1.2.2.1'}]},
      {name: '1.2.2.1'},
      {name: '1.3', children:[{name:'1.3.1'}]},
      {name: '1.3.1', children:[{name:'1.3.1.1'},{name:'1.3.1.2'}]},
      {name: '1.3.1.1'},
      {name: '1.3.1.2'},
    ]},
    {model: "Article", data: [
      {title: '1', tags:[
        {tag: {name:'1.2.2.1'}},
        {tag: {name:'1.3.1'}},
        {tag: {name:'1.1.1.1.1'}},
        {tag: {name:'1.1.1'}},
        {tag:{name: 'good'}}, {tag:{name: 'great'}},
      ]},
      {title: '2', tags: [
        {tag: {name:'1.3.1.2'}},
        {tag: {name:'1.2'}},
        {tag:{name: 'fine'}},
      ]},
      {title: '3', tags: [
        {tag: {name:'1.3.1.2'}},
        {tag: {name:'1.2.2'}},
        {tag:{name: 'foo(en)'}},
      ]},
      {title: '4', tags: [
        {tag: {name:'1.1.1.1'}},
        {tag:{name: 'bar(zh)'}},
      ]},
      {title: '5', tags: [
        {tag: {name:'1.2.1'}},
        {tag: {name:'1.3.1.1'}},
        {tag:{name: 'a'}}, {tag:{name: 'b'}},
      ]},
      {title: '6', tags: [
        {tag: {name:'1.3.1.2'}},
        {tag:{name: 'x'}},
      ]},
    ]},
  ]
}
