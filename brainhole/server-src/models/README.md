# Design of the brainhole database
The Brainhole is a database system based on mongodb. It provides
* several kinds of metadatas (tags, catalogues, metadatas, relations, fathers, children) for entries
* api functions to add, modify and delete entries which keeps the cross-reference information
* a plugin system to add metadatas automatically

## Models
There are three kinds of models in the database
* `InternalModels`:
  * IDs
  * Historys
  * Users
  * Plugins
  * ...

  These models are used by internal functions, we should not modify them manually.
* `TopModels`:
  * Article
  * Website
  * Book
  * ...

  Top level models that we want to manage using the brainhole database system.
* `MetadataModels`:
  * Tag
  * Catalogue
  * Metadata
  * Relation

  These models are metadatas cited by `TopModels`.

We only care about the `TopModels` and `MetadataModels`.

## Model structures
### Basic propertis
* `TopModels`:
  * should contain basic special properties for entries of this kind, examples:
```
// 1. model Article
{ title: "article title", abstract: "article abstract", ...}
// 2. model Book
{ title: "book title", author: "book author", ISBN: "book ISBN"...}
// 3. model Website
{ url: "website URL", title: "website title", ...}
...
```
* `MetadataModels`:
  * contain basic properties for each metadata
```
// four Metadata models:
// 1. model Tag
{ name: "tag name" }
// 2. model Catalogue
{ name: "catalogue name" }
// 3. model Relation
{ name: "relation name", symmetric: "whether this relation is sysmetric" }
// 4. model Metadata
{ name: "metadata name", format: "metadata data format" }
```
### Extra properties
* each `Top model` and `Metadata model` contains these extra properties
```
{
  id: 'unique and increasing id for this entry',
  createdAt: 'create time',
  modifiedAt: 'last modify time',
  comment: 'other comment information for this entry',
  origin:['see the origin properties'],
}
```
### Metadata properties
* we have 6 extra metadata properties for a entry
  * tags: tags of a entry
  * catalogues: catalogues that this entry belongs to
  * relations: relations that this entry have with other entries
  * metadatas: other custom metadatas for this entry
  * fathers: fathers of this entry
  * children: children of this entry
* `TopModels` have **tags** and **catalogues**
  * properties:
    `{tag_id: 'id of the Tag', tag_name: 'name of the Tag'}`
    `{catalogue_id: 'id of the Tag', catalogue_name: 'name of the Tag'}`
  * constrains:
    1. the `Tag` and `Catalogue` entry have reference infomation of that `TopModels` entry in the 'r' properties
* `TopModels` have **metadatas**
  * properties: `{ metadata_id: 'id of the Metadata', metadata_name: 'name of the Metadata', value: 'value of the Metadata' } `
  * constrains:
    1. the `Metadata` entry have reference infomation of that `TopModels` entry in the 'r' properties
* `TopModels` and `Tag` have **relations**
  * properties: `{ relation_id: 'id of the Relation', relation_name: 'name of the Relation', from_id, to_id } `
  * constrains:
    1. the `Relation` entry have reference infomation of that entry in the 'r' properties
    2. if we have a relation A => B, it should be recorded in both A and B
* `TopModels`, `Tag` and `Catalogue` have **fathers** and **childrens**
  * properties: `{ id: 'id of the father or the children' } `
  * constrains:
    1. if entry A is a father of B, B should be a child of A.
* extra properties:
  * all the tags, catalogues, relations, metadatas, fathers and children also have the `origin` properties, see detail below
  * tags, catalogues, relations and metadatas have `id` properties to count the number of that metadata
  * tags, catalogues, relations and metadatas have extra properties `comment`, `createdAt` and `modifiedAt`
``` javascript
// A full example to show the metadatas that different Models could have
// Relation
[
  { id: 1, name: 'translation', symmetric: true
    r: { Tag: ['5-1','6-1','5-2','7-2','6-3','7-3'], } },
  { id: 2, name: 'citation', reverse_name: 'reference', symmetric: false
    r: { Article: ['2-1', '3-1'], } },
  { id: 3, name: 'disambiguation', reverse_name: 'cited', symmetric: false
    r: { Tag: ['8-4', '9-4', '8-5', '10-5'], } },
]
// Metadata
[
  { id: 1, name: 'rating', comment: 'my rating for some entries, range is 0~10',
    format: 'Int', r:{Article: ['1-1', '2-2', '3-3']} }
]
// Tag
[
  // Tags that have fathers and children
  {id: 1, name: 'science', children:[{id:2}, {id:3}, {id:4}], r: {Article: []},
  {id: 2, name: 'astronomy', fathers:[{id: 1}], r: {Article: ['1-1']},
  {id: 3, name: 'physics', fathers:[{id: 1}], r: {Article: []},
  {id: 4, name: 'math', fathers:[{id: 1}], r: {Article: []},
  // Tags that have relations
  { id: 5, name: 'good',
    relations: [
      {id: 1, relation_id: 1, relation_name: 'translaton', from_id: 5, to_id: 6, from_model: 'Tag', to_model: 'Tag' }
      {id: 2, relation_id: 1, relation_name: 'translaton', from_id: 5, to_id: 7, from_model: 'Tag', to_model: 'Tag' }
    ], r: {Article: []}, },
  { id: 6, name: '好',
    relations: [
      {id: 1, relation_id: 1, relation_name: 'translaton', from_id: 5, to_id: 6, from_model: 'Tag', to_model: 'Tag' }
      {id: 3, relation_id: 1, relation_name: 'translaton', from_id: 6, to_id: 7, from_model: 'Tag', to_model: 'Tag' }
    ], r: {Article: []}, },
  { id: 7, name: 'bon',
    relations: [
      {id: 2, relation_id: 1, relation_name: 'translaton', from_id: 5, to_id: 7, from_model: 'Tag', to_model: 'Tag' }
      {id: 3, relation_id: 1, relation_name: 'translaton', from_id: 6, to_id: 7, from_model: 'Tag', to_model: 'Tag' }
    ], r: {Article: []}, },
  { id: 8, name: 'CS',
    relations: [
      {id: 4, relation_id: 3, relation_name: 'disambiguation', from_id: 8, to_id: 9, from_model: 'Tag', to_model: 'Tag' }
      {id: 5, relation_id: 3, relation_name: 'disambiguation', from_id: 8, to_id: 10, from_model: 'Tag', to_model: 'Tag' }
    ], r: {Article: []}, },
  { id: 9, name: 'computer science',
    relations: [
      {id: 4, relation_id: 1, relation_name: 'disambiguation', from_id: 8, to_id: 9, from_model: 'Tag', to_model: 'Tag' }
    ], r: {Article: []}, },
  { id: 10, name: 'CS(FPS Game)',
    relations: [
      {id: 5, relation_id: 1, relation_name: 'disambiguation', from_id: 8, to_id: 10, from_model: 'Tag', to_model: 'Tag' }
    ], r: {Article: ['2-2', '3-3']}, },
]
// Catalogue
[
  // Catalogues that have fathers and children
  {id: 1, name: '1', children:[{id:2}, {id:3}, {id:4}], r: {Article: []}},
  {id: 2, name: '1.1', children:[{id:5}, {id:6}], fathers:[{id:1}], r: {Article: []}},
  {id: 3, name: '1.2', fathers:[{id:1}], r: {Article: []}},
  {id: 4, name: '1.3', fathers:[{id:1}], r: {Article: []}},
  {id: 5, name: '1.1.1', fathers:[{id:2}], r: {Article: []}},
  {id: 6, name: '1.1.2', fathers:[{id:2}], r: {Article: []}},
  {id: 7, name: 'reading', r: {Article: ['1-1']}},
  {id: 8, name: 'aboug games', r: {Article: ['2-2', '3-3']}},
]
// Article
[
  // Articles with catalogues, tags, metadatas and relations
  { id: 1,
    title:'A Second Source of Repeating Fast Radio Bursts',
    tags: [ {id: 1, tag_id: 2, tag_name: 'astronomy'} ],
    catalogues: [ {id: 1, catalogue_id: 7, catalogue_name: 'reading'} ],
    metadatas: [ {id: 1, metadata_id: 1, metadata_name: 'rating', value: 10} ], },
  { id: 2,
    title:'How to play CS (part 1)',
    tags: [ {id: 2, tag_id: 10, tag_name: 'CS(FPS Game)', } ],
    catalogues: [ {id: 2, catalogue_id: 8, catalogue_name: 'about games'} ],
    metadatas: [ {id: 2, metadata_id: 1, metadata_name: 'rating', value: 8} ],
    relations: [ {id: 1, relation_id: 2, relation_name: 'citation', from_id: 2, to_id: 3, from_model: 'Article', to_model: 'Article' } ] },
  { id: 3,
    title:'How to play CS (part 2)',
    tags: [ {id: 3, tag_id: 10, tag_name: 'CS(FPS Game)', } ],
    catalogues: [ {id: 3, catalogue_id: 8, catalogue_name: 'about games'} ],
    metadatas: [ {id: 3, metadata_id: 1, metadata_name: 'rating', value: 6} ],
    relations: [ {id: 1, relation_id: 2, relation_name: 'citation', from_id: 2, to_id: 3, from_model: 'Article', to_model: 'Article' } ] }
]
```
### origin properties
* all the `TopModels`, `MetadataModels` and all metadata properties(tags, catalogues...) have the `origin` properties, it recored who add this entry or metadata properties.
``` javascript
// example of origin properties (we only show the Article model entries and omit other related Model entries)
// Article
[
  {
    title: 'Some news blabla...',
    origin:[{id: 'news-crawler'}], // it means this article is added by the news-crawler
    tags:[
      {id: 1, tag_id: 1, tag_name: 'news', origin:[{id: 'news-crawler'}]}, // this tag is also added by the news-crawler
      // after i read this news, i find it to be a bad news, and manually add this tag
      {id: 2, tag_id: 2, tag_name: 'bad news', origin:[{id: 'manual'}]},
    ]
  },
  {
    title: 'parallel programming in python',
    origin:[{id: 'manual'}], // I manually add this article
    tags:[
       // this tag is auto added by some plugins, then i manually confirm it.
      {id: 3, tag_id: 3, tag_name: 'python', origin:[{id: 'auto'}, {id: 'manual'}]},
    ]
  },
]
```
## API
* we have many constrains between different entries, examples:
  * if we add(delete) the `Tag` 'good' from `Article` 'A', we should also add(delete) the reverse reference information in Tag.r properties.
  * if we add(delete) 'B' to be the father of 'A', we should also add(delete) 'A' to be the child of 'B'
  * if we add(delete) an relations 'A' => 'B', we should record(remove) it in both 'A' and 'B'
* the unified API provide several logical operations
  * +: add
  * -: delete
  * *: modify
  * o: reorder

  to operate model entries and automatically satisfy all the constrains.

### api call examples
``` javascript
// document for api
/*
 @param
   model: the database model
   operation:
     be one of +-*o, means add, delete, modify and reorder
   query:
     if operation is * or -, must have this param
     if origin is not undefined, must have this param
   data:
     the actually data to add, modify, delete or reorder
   field:
     the subfield to operate
   origin:
     the origin of this operation
   meta:
     other meta data of this operation, will affect some behaviours of the api
   session:
     the mongodb transaction of this operation, if undefined, will start a new transaction

 see the call examples for detailed comments
 */
async api({
  model,
  operation,
  query,
  data,
  field,
  origin,
  meta,
  session,
})

// call examples
// * we only show the Article models and omit other Model entries
// * after each call, we show the result entry
// * the best way to learn all the details of the api is to investigate the unittest file 'test.js'.

// if origin is undefined, the origin is set to 'manual'
await globals.api({
  model: 'Article',
  operation: '+',
  data:{ title: 1 }
})
/* Article database
[
  {id: 1, title: 1, origin:[{id: manual}]}
]
*/

// will add nothing with the same origin
await globals.api({
  model: 'Article',
  operation: '+',
  data:{ title: 1 },
  origin: [{id: manual}]
})
/* Article database
[
  {id: 1, title: 1, origin:[{id: manual}]}
]
*/

// add with another origin
await globals.api({
  model: 'Article',
  operation: '+',
  data:{ title: 1 },
  query:{ title: 1},
  origin:[{id: 'auto'}]
})
/* Article database
[
  {id: 1, title: 1, origin:[{id: manual}, {id:auto}]}
]
*/

// if origin is undefined, the origin is set to 'manual'
await globals.api({
  model: 'Article',
  operation: '-',
  query:{ title: 1}
})
/* Article database
[
  {id: 1, title: 1, origin:[{id: auto}]}
]
*/

await globals.api({
  model: 'Article',
  operation: '-',
  query:{ title: 1},
  origin:[{id: 'auto'}]
})
/* Article database
[
]
*/

await globals.api({
  model: 'Article',
  operation: '+',
  data: {
    title: 2,
    tags: [
      {tag_id: 1}, // use the tag_id to add tags
    ],
    catalogues: [
      {catalogue: {id: 1}},// first query the catalogue by its id and then add it
      {catalogue: {name: 'blabla'}},// first query the catalogue by its name and then add it
    ],
    metadatas: [ // three ways to add an metadata
      {metadata_id: 1, value: 1},
      {metadata: {id: 2}, value: 2},
      {metadata: {name: 3}, value: 3},
  }
})
/* Article database
[
  {
    id: 2,
    origin: [{id: 'manual'}],
    title: 2,
    tags: [
      {id: 1, tag_id: 1, tag_name: 1, origin:[{id: 'manual'}]},
    ],
    catalogues: [
      {id: 1, catalogue_id: 1, catalogue_name: 1, origin:[{id: 'manual'}]},
      {id: 2, catalogue_id: 2, catalogue_name: 'blabla', origin:[{id: 'manual'}]},
    ],
    metadatas: [
      {id: 1, metadata_id: 1, metadata_name: 1, value: 1, origin:[{id: 'manual'}]},
      {id: 2, metadata_id: 2, metadata_name: 2, value: 2, origin:[{id: 'manual'}]},
      {id: 3, metadata_id: 3, metadata_name: 3, value: 3, origin:[{id: 'manual'}]},
    ],
  }
]
*/

// modify
await globals.api({
  model: 'Article',
  operation: '*',
  query: {title: 2},
  data: {
    comment: 'modify comment',
  }
})
/* Article database
[
  {
    id: 2,
    origin: [{id: 'manual'}],
    title: 2,
    comment: 'modify comment',
    tags: [
      {id: 1, tag_id: 1, tag_name: 1, origin:[{id: 'manual'}]},
    ],
    catalogues: [
      {id: 1, catalogue_id: 1, catalogue_name: 1, origin:[{id: 'manual'}]},
      {id: 2, catalogue_id: 2, catalogue_name: 'blabla', origin:[{id: 'manual'}]},
    ],
    metadatas: [
      {id: 1, metadata_id: 1, metadata_name: 1, value: 1, origin:[{id: 'manual'}]},
      {id: 2, metadata_id: 2, metadata_name: 2, value: 2, origin:[{id: 'manual'}]},
      {id: 3, metadata_id: 3, metadata_name: 3, value: 3, origin:[{id: 'manual'}]},
    ],
  }
]
*/

// add with fields
await globals.api({
  model: 'Article',
  operation: '+',
  query: {title: 2},
  field: 'tags',
  data: {
    tags: [
      {tag_id: 1, origin:[{id: 'auto'}]}, // overwrite the origin
      {tag_id: 2, origin:[{id: 'auto2'}]}
    ]
  }
})
/* Article database
[
  {
    id: 2,
    origin: [{id: 'manual'}],
    title: 2,
    comment: 'add new comment',
    tags: [
      {id: 1, tag_id: 1, tag_name: 1, origin:[{id: 'manual'}, {id: 'auto'}]},
      {id: 2, tag_id: 2, tag_name: 2, origin:[{id: 'auto2'}]},
    ],
    catalogues: [
      {id: 1, catalogue_id: 1, catalogue_name: 1, origin:[{id: 'manual'}]},
      {id: 2, catalogue_id: 2, catalogue_name: 'blabla', origin:[{id: 'manual'}]},
    ],
    metadatas: [
      {id: 1, metadata_id: 1, metadata_name: 1, value: 1, origin:[{id: 'manual'}]},
      {id: 2, metadata_id: 2, metadata_name: 2, value: 2, origin:[{id: 'manual'}]},
      {id: 3, metadata_id: 3, metadata_name: 3, value: 3, origin:[{id: 'manual'}]},
    ],
  }
]
*/

// delete with fields
await globals.api({
  model: 'Article',
  operation: '-',
  query: {title: 2},
  field: 'tags',
  data: {
    tags: [
      {id: 1}, // delete with the id
      {__query__:{tag_id: 2}, origin:[{id: 'auto2'}]} // delete with query, overwrite origin
    ]
  }
})
/* Article database
[
  {
    id: 2,
    origin: [{id: 'manual'}],
    title: 2,
    comment: 'add new comment',
    tags: [
      {id: 1, tag_id: 1, tag_name: 1, origin:[{id: 'auto'}]},
    ],
    catalogues: [
      {id: 1, catalogue_id: 1, catalogue_name: 1, origin:[{id: 'manual'}]},
      {id: 2, catalogue_id: 2, catalogue_name: 'blabla', origin:[{id: 'manual'}]},
    ],
    metadatas: [
      {id: 1, metadata_id: 1, metadata_name: 1, value: 1, origin:[{id: 'manual'}]},
      {id: 2, metadata_id: 2, metadata_name: 2, value: 2, origin:[{id: 'manual'}]},
      {id: 3, metadata_id: 3, metadata_name: 3, value: 3, origin:[{id: 'manual'}]},
    ],
  }
]
*/

await globals.api({
  model: 'Article',
  operation: '-',
  query: {title: 2},
  field: 'catalogues',
  data: {
    catalogues: [ // other ways to query and delete
      {__query__:{catalogue: {id: 1}}} ,
      {__query__:{catalogue: {name: 'blabla'}}} ,
    ]
  }
})
/* Article database
[
  {
    title: 2,
    comment: 'add new comment',
    tags: [
      {id: 1, tag_id: 1, tag_name: 1, origin:[{id: 'auto'}]},
    ],
    catalogues: [
    ],
    metadatas: [
      {id: 1, metadata_id: 1, metadata_name: 1, value: 1, origin:[{id: 'manual'}]},
      {id: 2, metadata_id: 2, metadata_name: 2, value: 2, origin:[{id: 'manual'}]},
      {id: 3, metadata_id: 3, metadata_name: 3, value: 3, origin:[{id: 'manual'}]},
    ],
  }
]
*/

// modify with field
await globals.api({
  model: 'Article',
  operation: '*',
  query: {title: 2},
  field: 'catalogues',
  data: {
    catalogues: [ // other ways to query and delete
      {id: 1, value: 11},
      {__query__: {metadata_id: 2}, value: 22},
      {__query__: {metadata: {id:3}}, value: 33},
    ]
  }
})
/* Article database
[
  {
    title: 2,
    comment: 'add new comment',
    tags: [
      {id: 1, tag_id: 1, tag_name: 1, origin:[{id: 'auto'}]},
    ],
    catalogues: [
    ],
    metadatas: [
      {id: 1, metadata_id: 1, metadata_name: 1, value: 11, origin:[{id: 'manual'}]},
      {id: 2, metadata_id: 2, metadata_name: 2, value: 22, origin:[{id: 'manual'}]},
      {id: 3, metadata_id: 3, metadata_name: 3, value: 33, origin:[{id: 'manual'}]},
    ],
  }
]
*/

// reorder
await globals.api({
  model: 'Article',
  operation: 'o',
  query: {title: 2},
  field: 'metadatas',
  data: {
    metadatas: [ // reorder with ids
      {id: 3}, {id: 2}, {id: 1}
    ]
  }
})
/* Article database
[
  {
    title: 2,
    comment: 'add new comment',
    tags: [
      {id: 1, tag_id: 1, tag_name: 1, origin:[{id: 'auto'}]},
    ],
    catalogues: [
    ],
    metadatas: [
      {id: 3, metadata_id: 3, metadata_name: 3, value: 33, origin:[{id: 'manual'}]},
      {id: 2, metadata_id: 2, metadata_name: 2, value: 22, origin:[{id: 'manual'}]},
      {id: 1, metadata_id: 1, metadata_name: 1, value: 11, origin:[{id: 'manual'}]},
    ],
  }
]
*/

// delete article
await globals.api({
  model: 'Article',
  operation: '-',
  query: {title: 2},
})
/* Article database
[
]
*/

// You can find more examples and results in the unittest file 'test.js'
```
