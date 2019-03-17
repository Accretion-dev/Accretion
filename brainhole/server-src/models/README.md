# about api
## about origin
```
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
