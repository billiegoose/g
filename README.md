# gitredux
###This project is nascent and in a state of flux!

This project takes inspiration from [gitless](http://gitless.com/) and [legit](https://github.com/kennethreitz/legit), and is
influenced by this [blog post](http://www.saintsjd.com/2012/01/a-better-ui-for-git/) and this [fantastic diatribe](http://stevebennett.me/2012/02/24/10-things-i-hate-about-git).
However, I feel all of these tools are either underdeveloped or too opinionated. I want a tool that gives me all the
same control as git but without the headache of its impossible to remember commands.

### Goals
* CONSISTANCY
* Fewer, more orthogonal commands
* More useful (and non-destructive) default behaviors

### Why?
I started this project because `git log --no-pager` gives an error. Apparently I wanted `git --no-pager log`. This was the last straw.
*So I decided to "fix" the git CLI.*

EDIT: Even better example of inanity of git CLI: To get the SHA reference of HEAD, do you use `git show-ref HEAD --abbrev --hash` or `git rev-parse --short HEAD`?

 * Why are they different results?
 * Why does `show-ref` use `--abbrev` but `rev-parse` use `--short`?
 * Why are the options _after_ `HEAD` in `show-ref` but _before_ `HEAD` in `rev-parse`?
 * I leave answering these questions as an exercise to the reader.


### Commands
(bound to get out of date quickly)

get | git
------------- | -------------
get stage | git add -u :/
get stage %FILES% | git add %FILES%
get unstage | git reset HEAD
get unstage %FILES% | git reset HEAD %FILES%
get reset | git checkout -f HEAD
get reset %FILES% | git checkout %FILES%
get commit %MESSAGE% | git commit -m %MESSAGE%
get branch %BRANCH% | stashes working tree, creates or switches branch, and checks out branch
get rmbranch %BRANCH% | git branch -d %BRANCH% *TODO: rename?*
get fetch | Fetches all remotes and fast-forwards local branches when possible
get fetch %BRANCHES% | Fetches and fast-forwards the specified branches
get status | git status
get review | git diff --cached
get diff | compare working tree with HEAD (git diff HEAD)
get diff STAGE | compare working tree with stage (git diff)
get diff %REF% | compare working tree with %REF% (git diff %REF%)
get diff STAGE %REF% | compare stage with %REF% (git diff --cached %REF%)
get diff %REFA% %REFB% | compare %REFA% with %REFB% (git diff %REFA% %REFB%)
get undo commit | git reset --soft HEAD~1
get push | pushes to upstream. If upstream not set, prompt user to name a remote branch. (If multiple remotes exist, prompt for which remote to use.)
get clone %PATH% | %PATH% can be a normal url. Paths like "username/repo" will be expanded assuming a Github. Paths with just "repo" will expand to a Github url, if your Github username is stored in git config.
get tag %TAG% | git tag %TAG%
get untag %TAG% | Deletes local tag. Y/N prompt to delete remote tag.

### TODO
Now that I've added tab completion, I think "stage" and "status" are too similar.
Also, I have three commands that start with "r" which is a problem.

### Changelog
- I renamed "update" to "fetch" to avoid completion conflicts with "unstage".
Also, it really is just fetch + fast-forward. One of my goals is NOT to use
different terminology than git, because that makes StackOverflow less useful.
