#!/usr/bin/env node
'use strict'
const Path = require('upath')
const pkg = require(__dirname + '/package.json')
const Git = require('nodegit')
// Use https://github.com/thisconnect/nodegit-kit as a reference
const vorpal = require('vorpal')()
const glob = require('glob')

let WorkingRepo = null

vorpal
.command('version')
.description('Outputs version of g')
.alias('v', 'ver')
.action(function version (args, done) {
  this.log(pkg.version)
  done()
})

vorpal
.command('add [globs...]')
.description('Add an untracked file')
.alias('+')
.autocomplete({data: untrackedFiles})
.action(function add (args, done) {
  if (args.globs === undefined) {
    this.log('You must specify at least one file or directory to add. Maybe \'*\' ?')
    return done()
  }
  globs(args.globs, (err, matches) => {
    if (err) {
      this.log('Error! ' + err.message)
      return done()
    }
    this.log(matches)
    return done()
  })
})

vorpal
.command('rm [globs...]')
.description('Remove a tracked file')
.alias('remove', '-')
.action(function rm (args, done) {
  this.log(args.globs)
  done()
})

function untrackedFiles (input, callback) {
  globs(input + '*', (err, matches) => {
    if (err) {
      return callback()
    } else {
      // TODO: Optimize this to make it less laggy.
      // Can we do a repo-wide status and compliment it with fs.watch?
      filterByStatus(Git.Status.STATUS.WT_NEW, matches, callback)
    }
  })
}

function filterByStatus (status, paths, callback) {
  let files = paths.filter((path) => Git.Status.file(WorkingRepo, relativePath(path)) === status)
  callback(files)
}

let relativePath = (path) => Path.relative(Path.join(WorkingRepo.path(), '..'), Path.resolve(path))

function globs (patterns, callback) {
  if (typeof patterns === 'string') {
    return glob(patterns, callback)
  } else if (patterns.length === 1) {
    return glob(patterns[0], callback)
  } else if (patterns.length > 1) {
    return glob('{' + patterns.join(',') + '}', callback)
  }
}

function getRepo (callback) {
  Git.Repository.discover('.', 0, '') // start_path, across_fs, ceiling_dirs
  .then((buf) => {
    Git.Repository.open(buf)
    .then((repo) => {
      callback(null, repo)
    }).catch(callback)
  }).catch(callback)
}

function getHead (repo, callback) {
  repo.head()
  .then((ref) => {
    callback(null, ref.shorthand())
  }).catch(callback)
}

if (!module.parent) {
  getRepo((err, repo) => {
    if (err) return vorpal.log('Error: ' + err)
    WorkingRepo = repo
    vorpal.log(Path.join(WorkingRepo.path(), '..'))
    getHead(repo, (err, head) => {
      if (err) return vorpal.log('Error: ' + err)
      vorpal.delimiter(head + '>')
      vorpal.show()
    })
  })
}
