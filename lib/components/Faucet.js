const logger = require('../logger');

class Faucet {

  constructor(web3) {
    this.web3             = web3.web3Http
    this.privateKey       = "0x"+ process.argv[2]
    this.publicKey        = ''
    this.init()
  }

  init() {
    try {
      const decryptedAccount = this.web3.eth.accounts.privateKeyToAccount(this.privateKey)
      this.publicKey = decryptedAccount.address
    } catch (error) {
      logger.error(`Error decrypting account: ${error.message}`)
    }
  }

  timeout() {
    return new Promise((resolve, reject) => {
      setTimeout(()=>{
          resolve('timeout')
      }, 20000)
    })
  }

  async sendTransaction(address, amount) {
    return new Promise( async(resolve, reject) => {
      try {
        const data = await this.generateTransactionParams(address, amount)
        const {nonce, transactionParams} = data
        const signedTransaction = await this.signTransaction(transactionParams, this.privateKey)
        const receipt = await this.sendTransactionAndRaceTimeout(signedTransaction)

        if(receipt === 'timeout') {
          logger.debug(`Timedout waiting for transaction receipt`);
          const transactionHash = await this.resolveTimedOutSetTransaction(nonce);
          resolve({type: 'hash', data: transactionHash});
        } else {
          logger.debug(`Got transaction receipt, hash ${receipt.transactionHash}`);
          resolve({type: 'receipt', data: receipt});
        }
      } catch (error) {
        reject(error);
      }
    })
  }

  generateTransactionParams(address, amount) {
    return new Promise((resolve, reject) => {
      Promise.all([
        this.web3.eth.getGasPrice(),
        this.web3.eth.getBalance(this.publicKey),
        this.getNonce(this.publicKey)
      ])
      .then(data => {
        const gasPrice = data[0]
        const balance = data[1]
        const nonce = data[2]
        if(balance <= 0) return reject('Faucet out of funds, please contract an administrator to add more funds')
        const transactionParams = {
          nonce,
          gasPrice: this.web3.utils.toHex(gasPrice),
          gasLimit: '0x47b760',
          to: address,
          value: this.web3.utils.toHex(this.web3.utils.toWei(amount.toString(), "ether")),
          data: ''
        }
        resolve({transactionParams, nonce});
      })
      .catch(reject)
    })
  }

  signTransaction(transactionParams) {
    return new Promise((resolve, reject) => {
      this.web3.eth.accounts.signTransaction(transactionParams, this.privateKey)
        .then(resolve)
        .then(reject)
    })
  }

  sendTransactionAndRaceTimeout(signedTransaction) {
    return new Promise((resolve, reject) => {
      Promise.race([
        this.sendSignedTransaction(signedTransaction),
        this.timeout()
        ])
        .then(resolve)
        .catch(reject)
    })
  }

  sendSignedTransaction(signedTransaction) {
    return new Promise((resolve, reject) => {
      this.web3.eth.sendSignedTransaction(signedTransaction.rawTransaction)
        .then(resolve)
        .catch(reject)
    })
  }

  resolveTimedOutSetTransaction(nonce) {
    return new Promise((resolve, reject) => {
      logger.debug('Resolving timed out transaction');
      this.getPendingHash(nonce)
      .then(hash => {
        logger.debug(`Found transaction hash: ${hash}`)
        return resolve(hash);
      })
      .catch(error => {
        logger.debug(`Error finding transaction hash for nonce: ${nonce}`)
        return resolve('nullPending');
      })
    })
  }

  getPendingHash(nonce) {
    return new Promise((resolve, reject) => {
      this.web3.eth.txpool.content()
        .then(txpool => {
          if(txpool.pending) {
            if(txpool.pending[this.publicKey]) {
              if(txpool.pending[this.publicKey][`${nonce}`]) {
                let pendingTransaction = txpool.pending[this.publicKey][`${nonce}`];
                resolve(pendingTransaction.hash);
              } else {
                reject(`No pending transaction found for ${this.publicKey} at nonce ${nonce}`);
              }

            } else {
              reject(`No pending transaction found for ${this.publicKey}`);
            }
          } else {
            reject('No pending transactions found');
          }
        })
        .catch(reject)
    })
  }

  getCoinbase() {
    return new Promise( (resolve, reject) => {
      this.web3.eth.getCoinbase()
        .then(resovle)
        .catch(reject)
    })
  }

  getTransaction(hash) {
    return new Promise((resolve, reject) => {
      this.web3.eth.getTransaction(hash)
        .then(resovle)
        .catch(reject)
    })
  }

  getBalance(address) {
    return new Promise((resolve, reject) => {
      this.web3.eth.getBalance(address)
        .then(resolve)
        .catch(reject)
    })
  }

  getBlock(number) {
    return new Promise( (resolve, reject) => {
      this.web3.eth.getBlock(number)
        .then(resovle)
        .catch(reject)
    })
  }

  getLatestBlock() {
    return new Promise( (resolve, reject) => {
      this.web3.eth.getBlock('latest')
        .then(resovle)
        .catch(reject)
    })
  }

  getNonce(address) {
    return new Promise((resolve, reject) => {
      Promise.all([
        this.web3.eth.txpool.content(),
        this.web3.eth.getTransactionCount(address, 'pending')
      ])
        .then(data => {
          const txpool = data[0];
          let transactionCount = data[1];
          if(txpool.pending) {
            if(txpool.pending[address]) {
              const pendingNonces = Object.keys(txpool.pending[address])
              transactionCount = parseInt(pendingNonces[pendingNonces.length-1], 10)+1
            }
          }
          logger.debug(`Nounce: ${transactionCount}`);
          resolve(transactionCount);
        })
        .catch(reject)
    })
  }


}

module.exports = Faucet;
