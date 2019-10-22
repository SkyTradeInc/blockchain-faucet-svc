const express   = require('express');
const router    = express.Router();
const logger    = require('../logger');
const axios     = require('axios');

const Web3      = require('../components/Web3');
const Redis     = require('../components/Redis');
const Faucet    = require('../components/Faucet');

const web3      = new Web3();
const redis     = new Redis();
const faucet    = new Faucet(web3);

// Response Payloads \\

const successResponse = (response, message = null, data = null) => {
  response.status(200).send({
    success: true,
    timestamp: Date.now(),
    message,
    data
  })
};

const errorResponse = (response, message, status = 403) => {
  response.status(status).send({
    success: false,
    timestamp: Date.now(),
    message
  })
};

// Middleware \\

const nodeStatus = (request, response, next) => {
  if(!web3.connected) return errorResponse(response, 'Internal Server Error: Cannot establish a connection to the Ledgerium node');
  logger.debug(`(1/6) Ledgerium connected`);
  return next();
};

const redisStatus = (request, response, next) => {
  if(!redis.connected) return errorResponse(response, 'Internal Server Error: Cannot establish a connection with the database');
  logger.debug(`(2/6) Redis connected`);
  return next();
};

const validateReCaptcha = (request, response, next) => {
  const { reCaptcha } = request.body;
  if(!reCaptcha) return errorResponse(response, 'Invalid reCaptcha');
  axios.get(`https://www.google.com/recaptcha/api/siteverify?secret=${process.env.GOOGLE_CAPTCHA_SECRET}&response=${reCaptcha}`)
  .then(google => {
    if(!google.data.success) return errorResponse(response, 'Invalid reCaptcha');
    logger.debug(`(3/6) Passed reCaptcha`);
    next();
  })
  .catch(error => {
    logger.error(error);
    return errorResponse(response, `ReCaptcha error: ${error.message || error}`);
  })
};

const validateAddress = (request, response, next) => {
  const { address } = request.body;
  if(!address) return errorResponse(response, 'You need to provide an address')
  if(!web3.isAddress(address)) return errorResponse(response, 'Provided address is not a valid Ledgerium address');
  logger.debug(`(4/6) Address ${address} is valid`);
  return next();
};

const validateAmount = (request, response, next) => {
  const { amount } = request.body;
  if(!amount) return errorResponse(response, 'You need to provide a amount');
  if(amount != "1" || amount != "2" || amount != "3")(response, 'Provided amount is not a valid, valid amounts are 1, 2 or 3');
  logger.debug(`(5/6) Amount ${amount} is valid`);
  return next();
};

const checkLimit = (request, response, next) => {
  const { address, amount } = request.body;
  redis.checkLimit(address, amount)
    .then(pass => {
      logger.debug(`(6/6) Address ${address} is not over limit`);
      next();
    })
    .catch(error => {
      logger.error(error.message || error);
      return errorResponse(response, `Limit error: ${error.message || error}`);
    })
};

// Routes \\

router.get('/ping', (request, response) => {
  return successResponse(response, 'pong');
})

router.get('/q', (request, response) => {
  return successResponse(response, 'Request limit', {limit: redis.limit});
})

router.get('/balance/:address', (request, response) => {
  const { address } = request.params;
  if(!address) return errorResponse(response, 'You need to provide an address');
  if(!web3.isAddress(address)) return errorResponse(response, 'Invalid Ledgerium address');
  faucet.getBalance(address)
    .then(balance => {
      return successResponse(response, `Balance for address ${address}`, {balance})
    })
    .catch(error => {
      logger.error(error.message || error)
      return errorResponse(response, `Error fetching balance: ${error.message || error}`);
    })
})

router.get('/transaction/:hash', (request, response) => {
  const { hash } = request.params;
  if(!hash) return errorResponse(response, 'You need to provide a hash');
  faucet.getTransaction(hash)
    .then(transaction => {
      return successResponse(response, `Transaction for hash ${hash}`, {transaction});
    })
    .catch(error => {
      logger.error(error.message || error);
      return errorResponse(response, `Error fetching balance: ${error.message || error}`);
    })
})

router.post('/', nodeStatus, redisStatus, validateReCaptcha, validateAddress, validateAmount, checkLimit, (request, response) => {
  const { address, amount } = request.body;
  faucet.sendTransaction(address, amount)
    .then(receipt => {
      return successResponse(response, `Receipt for faucet request`, {receipt});
    })
    .catch(error => {
      logger.error(error.message || error);
      return errorResponse(response, `Error sending transaction: ${error.message || error}`);
    })
})

module.exports = router;
