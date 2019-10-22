const web3    = require('web3')
const logger  = require('../logger')

class Web3 {
    constructor() {
      this.host       = process.env.WEB3_HTTP || 'http://toorak01.ledgerium.io:8545/'
      this.connected  = false
      this.web3Http   = new web3(new web3.providers.HttpProvider(this.host));

      this.web3Http.eth.extend({
        property: 'txpool',
        methods: [{
          name: 'content',
          call: 'txpool_content'
        },{
          name: 'inspect',
          call: 'txpool_inspect'
        },{
          name: 'status',
          call: 'txpool_status'
        }]
      })
      this.isListening()
    }

    isListening() {
      this.web3Http.eth.net.isListening()
        .then(connected => {
          this.connected = true;
          logger.info('Connected to Ledgerium node')
        })
        .catch(error => {
          logger.error(`Error connecting to Ledgerium node: ${error.message || error}`)
        })
    }

    isAddress(address) {
      return this.web3Http.utils.isAddress(address)
    }
}

module.exports = Web3;
