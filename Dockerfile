FROM mhart/alpine-node:8

RUN apk add --no-cache --virtual .build-deps \
        git \
        bash \
        vim \
        python \
        make \
        g++

RUN mkdir -p /ledgerium \
    && cd /ledgerium \
    && git clone -b master https://github.com/ledgerium/ledgeriumfaucet.git

# to be removed in the future
WORKDIR /ledgerium/ledgeriumfaucet/
RUN npm install

ENTRYPOINT ["tail", "-f", "/dev/null"]