# useful mongod commands or demo
* copy from https://docs.mongodb.com/
## commands
```mongod
db.collection.aggregate()
db.collection.countDocuments()
db.collection.distinct()
db.collection.find()

db.collection.deleteMany()
db.collection.deleteOne()
db.collection.remove()
db.collection.findOneAndDelete()
db.collection.findOneAndReplace()
db.collection.findOneAndUpdate()
db.collection.insertMany()
db.collection.insertOne()
db.collection.insert()
db.collection.save()

db.collection.updateOne()
db.collection.updateMany()
db.collection.replaceOne()
db.collection.update()

db.collection.bulkWrite()

# transaction
Session.startTransaction()
Session.commitTransaction()
Session.abortTransaction()
```
## query command
```
# normal query
{ <field1>: <value1>, ... }
{ <field1>: { <operator1>: <value1> }, ... }
{ $or: [{...}, {...}] }
# for nested
{ <field1>: {<subfield1>: ..., <subfield2>: ...}}
{ "<field1.subfield1>": ...}
# for array (field is a array)
{ <field>: ['value1', 'value2'] } # exactly match
{ <field>: { $all:['value1', 'value2']} } # contain all
{ <field>: "value" } # contain value
{ <field>: {$op1: ..., $op2: ...} } # at least one entry match at least one op (like $or)
{ <field>: { $elemMatch: {$op1: ..., $op2: ...}} } # at least one entry match all op (like $and)
{ <field.index>: {...} } # positin index match .... (index start from 0)
## array ops
  $size : value
```
## operators
```
# math (used in project)
  $abs
  $add
  $ceil
  $divide
  $exp
  $floor
  $ln
  $log
  $log10
  $mod
  $multiply
  $pow
  $sqrt
  $subtract
  $trunc
# array
  $arrayElemAt
  $arrayToObject
  $concatArrays
  $filter
  $in
  $indexOfArray
  $isArray
  $map
  $objectToArray
  $range
  $reduce
  $reverseArray
  $size
  $slice
  $zip
# bool
  $and
  $not
  $or
# compare
  $cmp
  $eq
  $gt
  $lt
  $lte
  $ne
# date
  $dateFromParts
  $dateFromString
  $dateToParts
  $dateToString
  $dayOfMonth
  $dayOfWeek
  $dayOfYear
  $hour
  $isoDayOfWeek
  $isoWeek
  $isoWeekYear
  $millisecond
  $minute
  $month
  $second
  $toDate
  $week
  $year
  $add
  $sub
# string
  $concat
  $dateFromString
  $dateToString
  $indexOfBytes
  $indexOfCP
  $ltrim
  $rtrim
  $split
  $strLenBytes
  $strLenCP
  $strcasecmp
  $substr
  $substrBytes
  $substrCP
  $toLower
  $toString
  $trim
  $toUpper
# for group
  $addToSet
  $avg
  $first
  $last
  $max
  $mergeObjects
  $min
  $push
  $stdDevPop
  $stdDevSamp
  $sum
```
## aggreation stages
```
# stages
  $addFields
  $count
  $currentOp
  $limit
  $lookup
  $project
  $skip
  $sort
  $match
  $group
```
## "JOIN" operation
```
db.post.aggregate([
  { "$lookup": {
    "localField": "tags.tag_id",
    "from": "user",
    "foreignField": "_id",
    "as": "tags.tag"
  } },
  { "$unwind": "$tags.tag" },
])
```
## live operations
```
db.aggregate( [
   { $currentOp : { allUsers: true, idleSessions: true } },
   { $match : { active: false, txnNumber : { $exists: true } } }
] )

# return fields
  $currentOp.host
  $currentOp.shard
  $currentOp.desc
  $currentOp.connectionId
  $currentOp.client
  $currentOp.client_s
  $currentOp.clientMetadata
  $currentOp.appName
  $currentOp.active
  $currentOp.currentOpTime
  $currentOp.opid
  $currentOp.secs_running
  $currentOp.microsecs_running
  $currentOp.lsid
  $currentOp.txnNumber
  $currentOp.op
  $currentOp.ns
  $currentOp.command
  $currentOp.originatingCommand
  $currentOp.planSummary
  $currentOp.numYields
  $currentOp.locks
  $currentOp.waitingForLock
  $currentOp.msg
  $currentOp.progress
  $currentOp.progress.done
  $currentOp.progress.total
  $currentOp.killPending
  $currentOp.lockStats

db.killOp($currentOp.opid)

```


## project
```
project({<field1>: 1, <field2>: 1}) # only include
project({<field1>: 0, <field2>: 0}) # only exclude
project({<field1>: 1, <field2>: 1, _id: 0}) # only include and remove _id
project({<field1>: 1, <field2>: 1, <field3.subfield>: 1}) # extract subfield
project({<field1.subfield>: 0}) # only exclude subfield
project({<arrayfield1>: { $slice: -1 }}) # only return one entry for arrayfield1
```

## transaction demo
``` javascript
async function commitWithRetry(session) {
  try {
    await session.commitTransaction();
    console.log('Transaction committed.');
  } catch (error) {
    if (
      error.errorLabels &&
      error.errorLabels.indexOf('UnknownTransactionCommitResult') >= 0
    ) {
      console.log('UnknownTransactionCommitResult, retrying commit operation ...');
      await commitWithRetry(session);
    } else {
      console.log('Error during commit ...');
      throw error;
    }
  }
}
async function runTransactionWithRetry(txnFunc, client, session) {
  try {
    await txnFunc(client, session);
  } catch (error) {
    console.log('Transaction aborted. Caught exception during transaction.');

    // If transient error, retry the whole transaction
    if (error.errorLabels && error.errorLabels.indexOf('TransientTransactionError') >= 0) {
      console.log('TransientTransactionError, retrying transaction ...');
      await runTransactionWithRetry(txnFunc, client, session);
    } else {
      throw error;
    }
  }
}
async function updateEmployeeInfo(client, session) {
  session.startTransaction({
    readConcern: { level: 'snapshot' },
    writeConcern: { w: 'majority' }
  });

  const employeesCollection = client.db('hr').collection('employees');
  const eventsCollection = client.db('reporting').collection('events');

  await employeesCollection.updateOne(
    { employee: 3 },
    { $set: { status: 'Inactive' } },
    { session }
  );
  await eventsCollection.insertOne(
    {
      employee: 3,
      status: { new: 'Inactive', old: 'Active' }
    },
    { session }
  );

  try {
    await commitWithRetry(session);
  } catch (error) {
    await session.abortTransaction();
    throw error;
  }
}
return client.withSession(session =>
  runTransactionWithRetry(updateEmployeeInfo, client, session)
);
```
## auto increase id
``` javascript
// https://stackoverflow.com/questions/8384029/auto-increment-in-mongodb-to-store-sequence-of-unique-user-id
db.createCollection("counters")
db.counters.insert({_id:"tid",sequence_value:0})
function getNextSequenceValue(sequenceName){
  var sequenceDocument = db.counters.findAndModify({
    query:{_id: sequenceName },
    update: {$inc:{sequence_value:1}},
    new:true
    });
    return sequenceDocument.sequence_value;
  }
  db.products.insert({
 "_id":getNextSequenceValue("tid"),
 "product":"Samsung",
 "category":"mobiles"
   })
db.prodcuts.find()


```
