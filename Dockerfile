FROM mhart/alpine-node:8
RUN apk add --no-cache --virtual .build-deps \
       git \
       bash \
       vim \
       python \
       make \
       g++
RUN mkdir -p /ledgerium
WORKDIR /ledgerium
COPY package.json /ledgerium/
RUN npm install
COPY . /ledgerium/
ENTRYPOINT [“tail”, “-f”, “/dev/null”]
