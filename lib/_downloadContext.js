var events = require('events')
var path = require('path')
var util = require('util')

'use strict'

var FileToDownload = function () {
  this.name = ''
  this.relativePath = ''
  this.size = 0
  this.complete = 0
}

FileToDownload.prototype.isComplete = function () {
  return this.complete >= this.size
}

var FolderToDownload = function () {
  this.name = ''
  this.relativePath = ''
  this.explored = false
}

var DownloadContext = function (source, destination) {
  this.files = []
  this.folders = []
  this.source = source
  if (typeof destination === 'function') {
    this.destination = destination
  } else {
    this.destination = function (relativePath) {
      return path.normalize(path.join(destination, relativePath))
    }
  }
}

DownloadContext.prototype.constructor = DownloadContext
util.inherits(DownloadContext, events.EventEmitter)

DownloadContext.prototype.clean = function () {
  this.files = []
  this.folders = []
}

DownloadContext.prototype.addFile = function (source, size) {
  var file = new FileToDownload()
  file.name = path.basename(source)
  file.relativePath = path.relative(this.source, source)
  file.size = size
  this.files.push(file)
  return file
}

DownloadContext.prototype.addFolder = function (source) {
  var folder = new FolderToDownload()
  folder.name = path.basename(source)
  folder.relativePath = path.relative(this.source, source)
  folder.explored = false
  this.folders.push(folder)
  return folder
}

DownloadContext.prototype.getTotalSize = function () {
  return this.files.reduce(function (total, file) {
    return total + file.size
  }, 0)
}

DownloadContext.prototype.getDownloadedSize = function () {
  return this.files.reduce(function (total, file) {
    return total + file.complete
  }, 0)
}

DownloadContext.prototype.getNotDownloadedFiles = function () {
  return this.files.filter(function (file) {
    return !file.isComplete()
  })
}

DownloadContext.prototype.getDownloadedFiles = function () {
  return this.files.filter(function (file) {
    return file.isComplete()
  })
}

DownloadContext.prototype.getNotExploredFolders = function () {
  return this.folders.filter(function (folder) {
    return !folder.explored
  })
}

DownloadContext.prototype.getExploredFolders = function () {
  return this.folders.filter(function (folder) {
    return folder.explored
  })
}

DownloadContext.prototype.getFileSourcePath = function (file) {
  return path.join(this.source, file.relativePath)
}

DownloadContext.prototype.getFileDestinationPath = function (file) {
  if (file.relativePath === '') {
    return this.destination(file.name, 'file', file)
  } else {
    return this.destination(file.relativePath, 'file', file)
  }
}

DownloadContext.prototype.getFolderSourcePath = function (folder) {
  return path.join(this.source, folder.relativePath)
}

DownloadContext.prototype.getFolderDestinationPath = function (folder) {
  return this.destination(folder.relativePath, 'folder', folder)
}

DownloadContext.instantiate = function (source, destination) {
  return new DownloadContext(source, destination)
}

module.exports = DownloadContext
