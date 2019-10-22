# Ledgerium Token Faucet

## Prerequisites
### NodeJS
Confirm you have NodeJS installed by running `node -v`, output should look like:

```
v11.1.0
```

[Download NodeJS](https://nodejs.org/en/)

### Node Package Manager (NPM)
Confirm you have NPM installed by running `npm -v`, output should look like:

```
v6.8.0
```

[Download NPM](https://www.npmjs.com/get-npm)

### Redis
Confirm you have Redis installed and running by `redis-cli ping`, output should look like:

```
PONG
```

[Download Redis](https://redis.io/download)

### Docker (optional)
Confirm you have Docker installed and running by `docker -v`, output should look like:

```
Docker version 18.09.2, build 6247962
```

[Download Docker](https://www.docker.com/get-started)


# Download and Setup
Clone this repository to your computer
```
git clone https://github.com/ledgerium-io/ledgeriumfaucet.git
```

Navigate into the `ledgeriumfaucet` directory
```
cd ledgeriumfaucet
```

Create the `.env` file

* Linux/MacOX
```
touch .env
```
* Windows
```
echo.>.env
```
Open the `.env` file in any text editor and insert the following
```
CAPTCHA_SECRET=6LeIxAcTAAAAAGG-vFI1TnRWxMZNFuojJ4WifJWe
REDIS_URL=redis://127.0.0.1:6379
NODE_URL=http://125.254.27.14:8545
REDIS_EXPIRE_SECONDS=60
REQUEST_LIMIT=3
```


* `GOOGLE_CAPTCHA_SECRET` -> Google Captcha secret key, the one above is public for local testing only

* `REDIS_URL` -> Use 'redis' if using in docker, or a url if running locally

* `NODE_URL` -> Ledgerium node address and port

* `REDIS_EXPIRE_SECONDS` -> Limit (in seconds) how long a user must wait to receive more XLG

* `REQUEST_LIMIT` -> Limit how many tokens a user can request per limit time cycle



Install the package dependencies using NPM
```
npm install
```

# Usage

## Locally

Run the faucet
```
node index [private key]
```
Example:
```
node index 29cf428305336e251c117394b0a327b55604230affb888885d871763cf7fe43d
```

## Docker Container (optional)

```
docker-compose up -d
```
