#!/usr/bin/env node
var sh = require('shelljs')
var Git = require('nodegit')
var program = require('commander')
var inquirer = require('inquirer')

program
    .version('0.0.1')
    .option('-i --interactive', 'Interactive mode')
    .option('-l --log', 'Show git log')
    .option('-b --branch', 'Show current branch')
    .arguments('<cmd> [files]')
    .action( (cmd, files) => {
        console.log('hi', cmd, files)
    } )
    .parse(process.argv)

if (program.interactive) {
    inquirer.prompt([
        {type: 'input', name: 'one', message: 'Hola type something:' },
        {type: 'list', name: 'two', message: 'Select a file', choices: sh.ls()}

    ], function( answers ) {
        console.log(answers)
    });
}

if (program.branch) {
    console.log('branch')
    Git.Repository.discover('.', 0, '').then( (buf) => {
        console.log(buf)
        Git.Repository.open(buf).then( (repo) => {
            repo.head().then( (ref) => {
                console.log(ref.shorthand())    
                console.log('end')
            })
        }).catch( (err) => {
            console.log('error', err)
        })
    }).catch( (err) => {
        console.log('error', err)
    })
}


if (program.log) {
  // Open the repository directory.
  Git.Repository.open("..")
  // Open the master branch.
  .then(function(repo) {
    return repo.getMasterCommit();
  })
  // Display information about commits on master.
  .then(function(firstCommitOnMaster) {
    // Create a new history event emitter.
    var history = firstCommitOnMaster.history();

    // Create a counter to only show up to 9 entries.
    var count = 0;

    // Listen for commit events from the history.
    history.on("commit", function(commit) {
      // Disregard commits past 9.
      if (++count >= 9) {
        return;
      }

      // Show the commit sha.
      console.log("commit " + commit.sha());

      // Store the author object.
      var author = commit.author();

      // Display author information.
      console.log("Author:\t" + author.name() + " <" + author.email() + ">");

      // Show the commit date.
      console.log("Date:\t" + commit.date());

      // Give some space and show the message.
      console.log("\n    " + commit.message());
    });

    // Start emitting events.
    history.start();
  });
}
