# about api
## about origin
```
query:
  we use findOne to process the query, so if query match more than one, only the first one will be changed
  should use frontend to avoid duplicated entry
flags:
  +
    entry: true or false # whether a new entry is added
    origin: origins added
  -
    entry: true or false # whether the entry is deleted
    origin: origins deleted
```
## about output of *API
```
  +
    return the extracted data
      e.g.
        data:   [{relation:{name:...}, to:{id:...}}]
        output: [{relation:{name:...}, to:{id:...}, relation_id:..., to_id:...}]
  *
    return the extracted data
  -
    return the deleted data
```
