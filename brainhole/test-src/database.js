import debugSettings from '../server/debug-settings'
import mongodb from 'mongodb'
import yaml from 'node-yaml'
let WebSocketServer = require('ws').Server

d = global.d

let databaseConfig = yaml.readSync('../configs/mongod.yml')
let {bindIp: ip, port} = databaseConfig.net

async function init() {
  d.conn = await mongodb.connect(`mongodb://${ip}:${port}`, { useNewUrlParser: true })
  d.database = d.conn.db('test')
  console.log(`connect to mongodb://${ip}:${port}`)
}

async function testNormalArray() {
  let collection = d.col = d.database.collection('normalArray')
  await collection.deleteMany({})
  let values = [
    { array: ["0"] },
    { array: ["1"] },
    { array: ["1","2"] },
    { array: ["1","2","3"] },
    { array: ["1","2","3","4"] },
    { array: ["4"] },
    { array: ["5"] },
  ]
  await collection.insertMany(values)
  let result = await collection.aggregate([
    {
      $match: {
        //array: {$not: {$in: ["1","3","2"]}},
        //array: {$all: ["1","3","2"]},
        $or: [
          {array: {$gte:"4", $lte:"5"}},
          {array: {$regex: "0"}},
        ]
      }
    }
  ]).toArray()
  console.log(JSON.stringify(result, null, null))
}
async function testNestedArray() {
  let collection = d.col = d.database.collection('nestedArray')
  await collection.deleteMany({})
  let values = [
    { array: ["0"] },
    { array: ["1"] },
    { array: ["1","2"] },
    { array: ["1","2","3"] },
    { array: ["1","2","3","4"] },
    { array: ["4"] },
    { array: ["5"] },
  ]
  values = values.map(_=> ({array: _.array.map(__=>({value: __}))}))
  values[5].array[0].flags = {}
  values[5].array[0].flags.in_trash = true
  values[6].array[0].metadatas = [
    {flags: {in_trash: true}}
  ]
  await collection.insertMany(values)
  let result = await collection.aggregate([
    {
      $match: {
        array: {
          $elemMatch: {
            $and: [
              { value: { $gte:"4"} },
              { value: { $lte:"5"} },
            ]
          }
        },
      }
    }
  ]).toArray()
  console.log('level 1 test:', JSON.stringify(result, null, null))
  result = await collection.aggregate([
    {
      $match: {
        array: {
          $elemMatch: {
            $and: [
              { 'flags.in_trash': true },
            ]
          }
        },
      }
    }
  ]).toArray()
  console.log('level 2 test:', JSON.stringify(result, null, null))
  result = await collection.aggregate([
    {
      $match: {
        array: {
          $elemMatch: {
            $and: [
              { metadatas: {
                $elemMatch: {
                  $and: [
                    {'flags.in_trash': true }
                  ]
                }
              } },
            ]
          }
        },
      }
    }
  ]).toArray()
  console.log('level 3 test:', JSON.stringify(result, null, null))
}
async function testLookUp() {
  console.log('begin test lookup')
  let collection = d.col = d.database.collection('user')
  await collection.deleteMany({})
  let values = [
    { username: 'user1', id: 1},
    { username: 'user2', id: 2},
    { username: 'user3', id: 3},
  ]
  await collection.insertMany(values)
  collection = d.col = d.database.collection('metadata')
  await collection.deleteMany({})
  values = [
    { name: 'metadata1', id: 1},
    { name: 'metadata2', id: 2},
    { name: 'metadata3', id: 3},
  ]
  await collection.insertMany(values)
  collection = d.col = d.database.collection('tag')
  await collection.deleteMany({})
  values = [
    { name: 'tag1', id: 1},
    { name: 'tag2', id: 2},
    { name: 'tag3', id: 3},
  ]
  await collection.insertMany(values)
  collection = d.col = d.database.collection('article')
  await collection.deleteMany({})
  values = [
    { title: 'article1', id: 1, user_id: 1, tags: [ ]},
    { title: 'article2', id: 2, user_id: 2, tags: [
      {tag_id: 1, metadatas: [
        {metadata_id:1, value:1, }
      ]},
    ]},
    { title: 'article3', id: 3, user_id: 3, tags: [
      {tag_id: 1, metadatas: [
        {metadata_id:1, value:1, }
      ]},
      {tag_id: 2, metadatas: [
        {metadata_id:2, value:2, }
      ]},
      {tag_id: 3 }
    ]},
  ]
  await collection.insertMany(values)
  let result = await collection.aggregate([
    // for user_id
    {
      $lookup: {
        from: 'user',
        localField: 'user_id',
        foreignField: 'id',
        as: 'user',
      }
    },
    { $unwind: '$user', },
    // for tags
    { $unwind: {path: '$tags', preserveNullAndEmptyArrays: true}, },
    { $unwind: {path:'$tags.metadatas', preserveNullAndEmptyArrays: true}, },
    {
      $lookup: {
        from: 'metadata',
        localField: 'tags.metadatas.metadata_id',
        foreignField: 'id',
        as: 'tags.metadatas.metadata',
      }
    },
    { $unwind: {path:'$tags.metadatas.metadata', preserveNullAndEmptyArrays: true}, },
    {
      $lookup: {
        from: 'tag',
        localField: 'tags.tag_id',
        foreignField: 'id',
        as: 'tags.tag',
      }
    },
    { $unwind: {path:'$tags.tag', preserveNullAndEmptyArrays: true}, },
    // still need debug....
    //{ $group: {
    //  _id: {_id: "$_id", tag_id: "$tags.tag_id"},
    //  tag_metadatas: {$push: "$tags.metadatas"},
    //  _full: {$first: "$$ROOT"}
    //}},
    //{ $addFields: {
    //  '_full.tags.metadatas': {$cond: {
    //    if: {$eq:["$tag_metadatas.length", 0]},
    //    then: [],
    //    //else: "$tag_metadatas",
    //    else: "$tag_metadatas",
    //  }},
    //}},
    //{$replaceRoot: {newRoot: "$_full"}},

    //{ $group: {
    //  _id: "$_id",
    //  tags: {$push: "$tags"},
    //  _full: {$first: "$$ROOT"}
    //}},
    //{ $addFields: {
    //  '_full.tags': {$cond: {
    //    if: { $eq:["$tags.length", 0] },
    //    then: [],
    //    else: "$tags"
    //  }},
    //}},
    //{$replaceRoot: {newRoot: "$_full"}},

    {
      $project: {
        _id: 0,
        "user._id": 0,
        "tags._id": 0,
        "tags.tag._id": 0,
        "tags.metadatas._id": 0,
      }
    },
    // match
    {
      $match: {
      }
    },
    { $sort: {title:1}}
  ]).toArray()
  console.log('test user look raw data:', JSON.stringify(result, null, 2))
}

async function main() {
  await init()
  await testNormalArray()
  await testNestedArray()
  await testLookUp()
}

main()
