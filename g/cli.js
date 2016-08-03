#!/usr/bin/env node
// I'm writing this in JavaScript because I hate myself, apparently.
'use strict'
const Path = require('upath')
const pkg = require(__dirname + '/package.json')
const git = require('./git_stuff')
// Use https://github.com/thisconnect/nodegit-kit as a reference
const vorpal = require('vorpal')()
const glob = require('glob')

let repo = null

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
      let files = matches.filter((path) => repo.status.new.indexOf(relativePath(path)) > -1)
      callback(files)
    }
  })
}

let relativePath = (path) => Path.relative(repo.local_path, Path.resolve(path))

function globs (patterns, callback) {
  if (typeof patterns === 'string') {
    return glob(patterns, callback)
  } else if (patterns.length === 1) {
    return glob(patterns[0], callback)
  } else if (patterns.length > 1) {
    return glob('{' + patterns.join(',') + '}', callback)
  }
}

if (!module.parent) {
  git.info({}, (err, info) => {
    if (err) return vorpal.log(err)
    repo = info
    vorpal.log(repo)
    vorpal.delimiter(repo.head + '>')
    vorpal.show()
  })
}
