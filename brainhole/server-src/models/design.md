# accertion design
* every model have flags:
  struct of flags: {
    in_trush: { createdAt: Date },
    debug: { comment: 'just for debug'}
  }
* many model have metadats:
  struct of metadatas: [
    {
      metadata: {
        _id: ...,
        name: ...,
        type: ...,
        format: ...,
        flags: ...,
        ....
      },
      value: '',
      flags: {...}
    }
  ]
* many model have tags:
* many model have catalogues:
* many model have relations:
