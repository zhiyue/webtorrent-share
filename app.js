/*
 * app.js
 * Copyright (C) 2016 Binux <roy@binux.me>
 *
 * Distributed under terms of the MIT license.
 */
(function(){
  'use strict';

  var Xvfb = require('xvfb')
  var xvfb = new Xvfb()
  xvfb.startSync()
  
  var os = require('os')
  var fs = require('fs')
  var path = require('path')
  var glob = require('glob')
  var WebTorrent = require('webtorrent-hybrid')
  var argv = require('minimist')(process.argv.slice(2));

  // env check
  //if (!!!WebTorrent.WEBRTC_SUPPORT) {
    //console.error('no webrtc support');
    //process.exit(1);
  //}

  var config = JSON.parse(fs.readFileSync('config.json'))
  if (argv['_'] && argv['_'].length)
    config.glob = argv['_'][0]
  for (var k in argv)
    config[k] = argv[k]

  var client = new WebTorrent({
    dht: config.dht,
    tracker: config.tracker,
  })
  console.log(config)

  // seeding
  glob(config.glob, function(er, files) {
    if (er) {
      console.error(er);
      process.exit(1);
    }

    //files = files.slice(0, 1)
    files.forEach(function(file) {
      if (fs.statSync(file).isFile()) {
        client.seed(file, function (torrent) {
          console.log(`seeding ${file} ${torrent.infoHash}`)
        })
      }
    })
  })

  var express = require('express')
  var app = express()

  app.use(express.static('./'))
  app.get('/client', function(req, res) {
    var files = []
    client.torrents.forEach(function(torrent) {
      files.push({
        name: torrent.files[0].name,
        length: torrent.files[0].length,
        magnetURI: torrent.magnetURI,
        infoHash: torrent.infoHash,
        uploaded: torrent.uploaded,
        uploadSpeed: torrent.uploadSpeed,
        numPeers: torrent.numPeers
      })
    })

    res.json({
      files: files,
      uploadSpeed: client.uploadSpeed,
    })
  })

  app.get('/config', function(req, res) {
    res.json(config)
  })

  app.listen(config.port, function() {
    console.log(`listening on port ${config.port}`)
  })
})();
