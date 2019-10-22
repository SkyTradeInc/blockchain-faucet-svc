const redis   = require('redis');
const logger  = require('../logger');

class Redis {
    constructor() {
      this.client = redis.createClient(process.env.REDIS_URL)
      this.connected = false
      this.limit = parseInt(process.env.REQUEST_LIMIT || 3)
      this.expiry = parseInt(process.env.REDIS_EXPIRE_SECONDS) * 1000 || 86400000
      this.listen()
    }

    listen() {
      const self = this
      this.client.on('connect', () => {
          logger.info('Connected to Redis');
          self.connected = true;
      });

      this.client.on('error', err => {
          logger.error(`Error connecting to Redis: ${err}`);
          self.connected = false;
      });
    }

    checkLimit(address, amount) {
      const self = this
      return new Promise ((resolve, reject) => {
        this.client.get(address.toLowerCase(), function(error, result) {
          if(error) return reject(error);
          if(!result) {
            self.client.set(address.toLowerCase(), JSON.stringify({address: address.toLowerCase(), amount: amount, timestamp: Date.now()}), 'EX', self.expiry)
            return resolve()
          }
          try {
            result = JSON.parse(result)
            if(result.address !== address.toLowerCase(address)) return resolve();
            if(result.amount === self.limit) return reject('You have reached the 24 hour limit.');
            if(result.amount+amount > self.limit) return reject(`Requesting ${amount} would put you over the 24 hour limit. Requests: ${result.amount}/${self.limit}. Limit expires in ${self.timeLeft(result.timestamp)}`);

            self.client.set(address.toLowerCase(), JSON.stringify({address: address.toLowerCase(), amount: result.amount+amount, timestamp: Date.now()}), 'EX', self.expiry)

            return resolve();
          } catch (error) {
            logger.error(error.message || error)
            reject(error.message || error)
          }
        })
      })
    }

    secondsToString(uptime) {
      if(uptime > 86400) {
        uptime = uptime/86400;
        return (uptime.toFixed(3) + " days");
      } else if (uptime > 3600) {
        uptime = uptime/3600;
        return (uptime.toFixed(2) + " hours")
      } else if (uptime > 60) {
        uptime = uptime/60;
        return (uptime.toFixed(2) + " minutes")
      } else {
        return(uptime.toFixed(0) + " seconds")
      }
    }

    timeLeft(timestamp) {
      const timeNeeded = this.expiry
      const timePassed = (Date.now() - timestamp)
      const timeLeft = timeNeeded - timePassed
      return this.secondsToString(timeLeft/1000)
    }

}

module.exports = Redis;
