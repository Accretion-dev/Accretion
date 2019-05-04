import mongodb from 'mongodb'
import yaml from 'node-yaml'
let WebSocketServer = require('ws').Server
const randomWords = require('random-words')
const randomint = require('random-int')

const MAXINT = 99999
const MINDATE = Number(new Date('2018-01-01'))
const MAXDATE = Number(new Date('2020-01-01'))
const MAXARRAY = 5

function randomDate() {
  let num = randomint(MINDATE, MAXDATE)
  return new Date(num)
}
function randomInt() {
  return randomint(MAXINT*2) - MAXINT
}
function randomMix() {
  let flag = randomint(2)
  if (flag===0) {
    return randomInt()
  } else if (flag===1) {
    return randomWords()
  } else {
    return randomDate()
  }
}

function randomData(level) {
  let result = {
    string: randomWords(),
    string2: randomWords(),
    strings: [...Array(randomint(7)).keys()].map(_ => randomWords()).join(' '),
    number: randomInt(),
    date: randomDate(),
    bool: randomint(1),
  }
  if (level >= 0) {
    let complex = {
      array_number: [...Array(randomint(7)).keys()].map(_ => randomInt()),
      array_string: [...Array(randomint(7)).keys()].map(_ => randomWords()),
      array_date: [...Array(randomint(7)).keys()].map(_ => randomDate()),
      array_mix: [...Array(randomint(7)).keys()].map(_ => randomMix()),
      object: randomData(level-1),
      array_object: [...Array(randomint(3)).keys()].map(_ => randomData(level-1)),
    }
    result = Object.assign(result, complex)
  }
  return result
}


console.log('restart')
//const wss = new WebSocketServer({ port: 8888 })

let databaseConfig = yaml.readSync('../configs/mongod.yml')
let {bindIp: ip, port} = databaseConfig.net

let d = global.d = {}


async function init() {
  d.conn = await mongodb.connect(`mongodb://${ip}:${port}`, { useNewUrlParser: true })
  d.database = d.conn.db('test')
  d.dq = d.database.collection('query')
  let exists = await d.dq.countDocuments()
  await d.dq.deleteMany({})
  if (!exists) {
    console.log('gen random data')
    try {
      await d.dq.dropIndex('TextIndex')
    } catch (e) { }
    try {
      await d.dq.createIndex(
        {
          string: "text",
          string2: "text",
          strings: "text",
          string_array: "text"
        },
        {
          weights: {
            strings: 5,
            string: 4,
            string2: 3,
          },
          name: "TextIndex"
        }
      )
    } catch (e) { }
    let count = 99999
    for (let i=0; i<count; i++) {
      let data = randomData(2)
      await d.dq.insertOne(data)
    }
    console.log('done')
  } else {
    console.log('use exists random data, count:', exists)
  }
}

async function main() {
  await init()
}

main()
