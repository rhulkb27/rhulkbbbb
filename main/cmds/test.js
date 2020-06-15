// const Enmap = require("enmap");
// const test = new Enmap({name: "test"});
//
// test.set("kek", {})
// test.observe('kek')
// test.destroy()

const data = require('../utility/data')

// console.log(data.enmap.get(1037870425));
// data.enmap.set('link', {})
//

function test() {
  const idList = [1031838820, 1028074488, 1023637668, 1034164076, 1036358248]
  const usernameList = ['SageLiev', 'Nightlock_', 'Shadow_Storm419', 'Maxitaxi55555', 'rhulkb27']
  const update = require('./graph')

  data.enmap.set('ids', idList)
  data.enmap.set('usernames', usernameList)

  console.log(data.enmap.get('ids'))


  idList.forEach(function(entry) {
    update.initId(entry)
  })
}
exports.test = test
