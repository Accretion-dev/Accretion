// temp file to debug api
import mongoose from 'mongoose'
import testData from '../../test/data/testdata.json'
import __ from './models'
const {Models, api} = __
class test {
  constructor () {
    return this.all()
  }
  async all () {
    await this.metadata()
    await this.relation()
  }
  async metadata () {
    let result = []
    for (let d of testData.Metadata) {
      let r = await api({
        operation: 'create',
        data:d,
        model:'Metadata',
        query:null,
      })
      result.push(r)
    }
    // console.log(result)
  }
  async relation () {
    let result = []
    for (let d of testData.Relation) {
      let r = await api({
        operation: 'create',
        data:d,
        model:'Relation',
        query:null,
      })
      result.push(r)
    }
    // console.log(result)
  }
}

export default test
