#!/usr/bin/env node
// I'm writing this in JavaScript because I am impossibly optimistic about performance?
'use strict'
const Git = require('nodegit')

// Return a new object with the combined or overwritten properties
const clone = (dest, src) => Object.assign({}, dest, src)

function getRepo (opts, callback) {
  Git.Repository.discover('.', 0, '') // start_path, across_fs, ceiling_dirs
  .then((buf) => {
    Git.Repository.open(buf)
    .then((repo) => {
      callback(null, clone(opts, {repo: repo}))
    }).catch(callback)
  }).catch(callback)
}

function list_remotes (opts, callback) {
  opts.repo.getRemotes()
  .then((names) => {
    return Promise.all(names.map((n) => opts.repo.getRemote(n)))
  })
  .then((remote_ary) => {
    let remotes = []
    let remote = {}
    for (let r of remote_ary) {
      let rem = {
        name: r.name(),
        url: r.url(),
        pushurl: r.pushurl(),
        branches: [],
        branch: {}
      }
      remotes.push(rem.name)
      remote[rem.name] = rem
    }
    callback(null, clone(opts, {remote: remote}))
    // TODO: move all the remote refs to their respective remote object.
  })
  .catch((err) => {
    console.log(err) // what to do...
    callback(err)
  })
}

function list_refs (opts, callback) {
  opts.repo.getReferences(Git.Reference.TYPE.OID)
  .then((refs) => {
    let references = {
      branches: [],
      branch: {},
      tags: [],
      tag: {}
    }
    opts = clone(opts, references)
    for (let ref of refs) {
      let r = {
        shorthand: ref.shorthand(),
        name: ref.name(),
        target: ref.target().tostrS()
      }
      if (ref.isBranch()) {
        opts.branches.push(r.shorthand)
        opts.branch[r.shorthand] = r
      } else if (ref.isTag()) {
        opts.tags.push(r.shorthand)
        opts.tag[r.shorthand] = r
      } else if (ref.isRemote()) {
        // Put branch on correct remote
        let tmp = r.shorthand.split('/')
        let remote = tmp[0]
        let branchname = tmp.slice(1).join('/')
        // ignore orphaned remote branches
        if (opts.remote[remote]) {
          opts.remote[remote].branches.push(branchname)
          opts.remote[remote].branch[branchname] = r
        }
      }
      // Unimplemented Reference Types:
      // symbolic refs: (isSymbolic() and its antonym isConcrete())
      //   appear to exist purely as a hack for HEAD so we'll
      //   ignore that possibility.
      //   source: http://stackoverflow.com/a/5000668/2168416
      // notes: (isNote()) is indeed a git feature,
      //   but I have yet to hear of ANYONE who uses them.
      //   Pushing and pulling notes is not turned on by default, for one.
      //   source: https://git-scm.com/2010/08/25/notes.html
      //   At one point, Github displayed them, but that was removed by late 2014.
      //   source: https://github.com/blog/707-git-notes-display
    }
    // TODO: Get upstream settings for this branch
    /*
    repo.config()
    .then((config) => {
      config.getStringBuf('branch.master.remote')
      .then((buf) => {
        console.log(buf)
    */
    callback(null, clone(opts, references))
  })
  .catch((err) => {
    console.log(err) // what to do...
    callback(err)
  })
}

function list_files (opts, callback) {
  opts.repo.getStatus()
  .then((statuses) => {
    let paths = {}
    let status = {
      new: [],
      modified: [],
      deleted: [],
      renamed: [],
      typechange: [],
      ignored: [],
      conflicted: []
    }
    let stage = {
      new: [],
      modified: [],
      deleted: [],
      renamed: [],
      typechange: []
    }
    for (let f of statuses) {
      let path = f.path()
      let state = f.status()
      paths[path] = state
      for (let key of Object.keys(status)) {
        if (state.indexOf('WT_' + key.toUpperCase()) > -1) {
          status[key].push(path)
        }
        if (state.indexOf(key.toUpperCase()) > -1) {
          status[key].push(path)
        }
      }
      for (let key of Object.keys(stage)) {
        if (state.indexOf('INDEX_' + key.toUpperCase()) > -1) {
          stage[key].push(path)
        }
      }
    }
    callback(null, clone(opts, {status: status, stage: stage, paths: paths}))
  })
  .catch((err) => {
    console.log(err)
    callback(err)
  })
}

module.exports.info = (opts, callback) => {
  getRepo(opts, (err, opts) => {
    if (err) return callback(err)
    list_remotes(opts, (err, opts) => {
      if (err) return callback(err)
      list_refs(opts, (err, opts) => {
        if (err) return callback(err)
        list_files(opts, (err, opts) => {
          if (err) return callback(err)
          delete opts.repo
          callback(null, opts)
        })
      })
    })
  })
}

if (!module.parent) {
  module.exports.info({}, (err, info) => {
    if (err) return console.log('Error: ' + err)
    console.log(info)
  })
}
