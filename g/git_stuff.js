#!/usr/bin/env node
// I'm writing this in JavaScript because I am impossibly optimistic about performance?
'use strict'
const Git = require('nodegit')
const watt = require('watt')
// Use https://github.com/thisconnect/nodegit-kit as a reference

// Return a new object with the combined or overwritten properties
const extend = (dest, src) => Object.assign({}, dest, src)

const getRepo = watt(function * (opts, next) {
  let buf = yield Git.Repository.discover('.', 0, '', next) // start_path, across_fs, ceiling_dirs
  let repo = yield Git.Repository.open(buf, next)
  let ref = yield repo.head(next)
  let root = {
    repo: repo,
    head: ref.shorthand(),
    local_path: repo.workdir()
  }
  return extend(opts, root)
})

const list_remotes = watt(function * (opts, next) {
  let names = yield opts.repo.getRemotes(next)
  let remote_ary = yield Promise.all(names.map((n) => opts.repo.getRemote(n)))
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
  return extend(opts, {remote: remote})
  // TODO: move all the remote refs to their respective remote object.
})

const list_refs = watt(function * (opts, next) {
  let refs = yield opts.repo.getReferences(Git.Reference.TYPE.OID, next)
  let references = {
    branches: [],
    branch: {},
    tags: [],
    tag: {}
  }
  opts = extend(opts, references)
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
  return extend(opts, references)
})

function list_status (opts, callback) {
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
    callback(null, extend(opts, {status: status, stage: stage, paths: paths}))
  })
  .catch((err) => {
    console.log(err)
    callback(err)
  })
}

// NOTE: this is depth first recursion, with some async weirdness.
const ls_tree = watt(function * (commit, next) {
  let tree = yield commit.getTree(next)
  let mtree = {}
  mtree.path = tree.path()
  mtree.files = []
  mtree.directories = []
  for (let entry of tree.entries()) {
    let mentry = {}
    mentry.path = entry.path()
    mentry.sha = entry.sha()
    if (entry.isFile()) {
      mtree.files.push(mentry)
    } else if (entry.isDirectory()) {
      // recurse
      ls_tree(entry, next.parallel())
    }
  }
  mtree.directories = yield next.sync()
  return mtree
})

const list_root_tree = watt(function * (opts, next) {
  let commit = yield opts.repo.getHeadCommit(next)
  let mtree = yield ls_tree(commit)
  return extend(opts, {tree: mtree})
})

module.exports.info = watt(function * (opts, next) {
  opts = yield getRepo(opts, next)
  opts = yield list_remotes(opts, next)
  opts = yield list_refs(opts, next)
  opts = yield list_status(opts, next)
  opts = yield list_root_tree(opts, next)
  delete opts.repo
  return opts
})

if (!module.parent) {
  module.exports.info({}, (err, info) => {
    if (err) return console.log('Error: ' + err)
    console.log(info)
    console.log(JSON.stringify(info.tree, null, 2))
  })
}
