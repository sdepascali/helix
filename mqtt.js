const mqtt = require('mqtt')
const amqp = require('./amqp')
const {processor} = require('./utils')

async function connect(){
  try {
    const client = await init.apply(this, arguments)
    console.log('[MQTT] connected')
    return {mqttClient:client}
  } catch(e) {
    throw e
  }  
}

function init() {
  return new Promise(function(resolve, reject) {

    const {MQTT_URL, MQTT_USERNAME, MQTT_PASSWORD, MQTT_TOPICS} = process.env

    if(!MQTT_URL) return Promise.resolve(null) // ok to skip 

    const config = {}
    if(MQTT_USERNAME) config.username = MQTT_USERNAME
    if(MQTT_PASSWORD) config.password = MQTT_PASSWORD
    const client = mqtt.connect(MQTT_URL, config)

    const topics = MQTT_TOPICS ? MQTT_TOPICS.split(' ') : '#'
    client.on('connect', () => {

      topics.forEach(topic => client.subscribe(topic) )

      client.on('message', (topic, payload) => {
        let m = null
        try{m=JSON.parse(payload)}
        catch(e){console.log("NOT JSON")}
        if(!m) return

        const msg = processor.makeId(m,topic)

        console.log("mqtt receive",JSON.stringify(msg))
        amqp.publish(new Buffer(JSON.stringify(msg)))
      })

      client.on('error',function(err){reject(err)})

      // console.log('pub now')
      // client.publish('iota-mam',JSON.stringify({
      //   hi:'hi'
      // }))

      resolve(client)
    })
  })
}




module.exports = {connect}
