# database auery syntax examples
## input type
* \<string\>: string inside quotes. e.g., `"blabla"`, `'foo bar'`
* \<simpleString\>: string without space (so no need to have quotes). e.g, `foo`, `bar`, `fobar2333`

## index

the last sevel strings(may be extracted from second level) will be compiled into a text search
```
db.articles.createIndex( { subject: "text" } )
db.articles.find({ $text: { $search: "coffee" } })
db.stores.find(
   { $text: { $search: "java coffee shop" } },
   { score: { $meta: "textScore" } }
).sort( { score: { $meta: "textScore" } } )
```
* $text|search
  * extract word with: ""
  * not include operation: -


## struct design
```
# Article
{
  model: 'Article',
  description: 'root structure of database',
  searchKeys: ['title', 'comment', 'abstract'], // generate by $text index
  fields: {

  },
}

```
## autocomplete data
* Tag.name
* Metadata.name
* Relation.name
* Catalogues.name
* TopModel.namekeys


## examples

#### simple query with no keywords
* will query for
  * $text|search (need the parser to be smart)
* autocomplete:
  * search: \<searchKeys\>
  * exact match:
    * `<namekeys>:<input>`
    * `tags:<input>`
    * `metadatas:<input>`
    * `relations:<input>`
    * `catalogues:<input>`
* examples:
  * `python`, `'python parallel'`, `'good for you'`
