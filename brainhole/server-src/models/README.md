# about api
## about origin
```
flags:
  +
    addNonExists
    addExists:
      addNothing, addOrigin
  -
    deleteEntry
    deleteOrigin
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
