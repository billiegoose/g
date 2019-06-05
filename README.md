# g - the improved CLI for git

This project takes inspiration from [gitless](http://gitless.com/) and [legit](https://github.com/kennethreitz/legit), and is
influenced by this [blog post](http://www.saintsjd.com/2012/01/a-better-ui-for-git/) and this [fantastic diatribe](http://stevebennett.me/2012/02/24/10-things-i-hate-about-git).
However, I feel all of these tools are either *underdeveloped* or *too opinionated*. I want a tool that gives me all the
same control as git but without the headache of its impossible to remember commands.

### Project Goals
1. Stay as close to the original jargon of git as possible, rather than create a dialect or "new" abstractions.
  - Some exceptions must be made for the horribly confusing unintuitive names.
* Have a consistant, predictable command names
* Have more useful and predictable default behaviors
* Make recovering from mistakes easier

### Equivalent Command List

#### Stage operations
There are a lot of really terribly named commands here: add, reset, checkout. (checkout? What is this, SVN?) They are probably named so because they are seen from the point-of-view of the stage, rather than the working directory. But since the stage is a new concept to beginners, thinking from the working directory point-of-view is how most new users (or even most normal developers) think.

So here is where I make perhaps the biggest naming changes. Updating the stage copy of a file is now `stage` as a verb. Reseting the stage copy is now called `unstage`. `g reset` now resets the file in the working directory, rather than the file in the stage.

g | git equivalent
--- | --------------
g add *untracked_file* | git add *untracked_file*
g rm *tracked_file* | git rm -r *tracked_file* Then prompt y/n to delete untracked files in deleted directories.
g stage | git add -u :/
g stage *tracked_file* | git add *tracked_file*
g unstage | git reset HEAD
g unstage *staged_file* | git reset HEAD *staged_file*
g reset | git checkout -f HEAD
g reset *file* | git checkout *file*

#### Making commits/branches/tags
Here I mostly just enhanced the porcelain commands. At some point, I would like to consolidate the syntax for creating and deleting things, where things can be branches, tags, remotes, etc.

g | git equivalent
--- | --------------
g commit | Prompts for commit message inline, rather than opening a text editor
g commit *message* | git commit -m *message*
g uncommit | git reset --soft HEAD~1
g ammend | git commit --amend --no-edit
g branch *branch* | stashes working tree, creates or switches branch, and checks out branch
g rmbranch *branch* | git branch -d *branch* *TODO: rename?*
g tag *tag* | git tag *tag*
g untag *tag* | Deletes local tag and shows Y/N prompt to delete remote tag.
g branches | Print all local and remote branches sorted by last commit date, and more.

For `g branches` it's easiest just to show an example:
```console
user@host:~/project g branches
  2 days ago    c1632be  master -> origin/master
* 11 days ago   1e8eab0  develop -> origin/develop  (merged)
  5 months ago  d58b929  feature/historical -> ?    (merged)
  5 months ago  3b22622  save -> ?
  2 days ago    c1632be  origin/HEAD
  2 days ago    c1632be  origin/master
  11 days ago   1e8eab0  origin/develop
  11 days ago   1e8eab0  origin/will
  4 weeks ago   f58098a  origin/paul
```

#### Viewing changes
By default, all diff commands compare the working directory to something else. By default, that something else is HEAD, not the stage as it is in git, because I think the most common query is "what have I changed since my last commit?" not "what is different between the stage and my working directory?". STAGE refers to the git staging area. I choose to always use the keyword *stage* rather than *index*, because they're the same thing and having two names for the same thing is unnecessarily confusing. And calling it the *cache* in the --cached option just makes it even worse. I avoid the stage/index/cached confusion by choosing to give it a name (STAGE) and treating it like a special reference akin to HEAD.

g | git equivalent
--- | --------------
g status | git status
g review | git diff --cached
g diff | compare working tree with HEAD (git diff HEAD)
g diff STAGE | compare working tree with stage (git diff)
g diff *ref* | compare working tree with *ref* (git diff *ref*)
g diff STAGE *ref* | compare stage with *ref* (git diff --cached *ref*)
g diff *refA* *refB* | compare *refA* with *refB* (git diff *refA* *refB*)

#### Working with remotes
Here, I want practicality and "it just works (TM)". The clone command installs submodules by default. I am (slowly) adding support for popular hosting services. Right now its just Github but I will probably add Bitbucket.

The biggest grievance when working with remotes is the "git pull" command. Which as anyone will tell you, just does "git fetch" followed by "git merge". But merging can be downright dangerous, especially if you have unsaved changed, leading to unsuccessful "git pull" attempts. I am going to avoid "pull" altogether, but to speed things up, my "fetch" operation goes ahead and fast-forwards branches.

g | git equivalent
--- | --------------
g clone *PATH* | git clone --recurse-submodules [-b *branch*] *PATH* <ul><li> Paths like "username/repo" will be expanded to a Github URL. </li> <li> Paths like "repo" will be expanded to a Github url if your username is stored in git config.\* </li> <li> Paths ending with #*branch* (the URL style used by NPM and Bower) will clone that branch.  </ul>
g fetch | Fetches all remotes and fast-forwards local branches when possible
g fetch *branches* | Fetches and fast-forwards the specified branches
g push | pushes to upstream. <ul><li> If upstream not set, prompt user to name a remote branch. </li> <li> If multiple remotes exist, prompt for which remote to use. </li></ul>
g remote | Interactive prompt to add a remote.
g ff | git pull --ff-only
g fff | deletes the local branch and rechecks it out (useful when remote branch has been force-pushed and can't be fast-forwarded)

\* To save your Github username where `get` can see it: `git config --global github.user your_user_name`

#### Miscellaneous

g | git equivalent
--- | --------------
g log | git log --graph --pretty=format:'%h - %d %s (%cr) <%an>' --abbrev-commit -10
g ignore *file* | Adds *file* to the current .gitignore file
g submodule | Finds all git repos underneath the main repo and makes them submodules
g squash *n* | Squash the last *n* commits into one commit. <ul><li> Prompts for a new commit message. </li><li> Moves HEAD without actually deleting the old commits. </li></ul>
g hist | List branches you've recently visited and when (I was about to call it `g recent` but I mistyped and did `g reset`... hence the new name.)

#### Shortcuts
Because sometimes you just want to type one letter.

Short Aliases | Full
--------------|-----
g ? | g status
g + | g add
g - | g rm
g = | g stage
g ! | g commit
g @ | g branch
g # | g tag
g ^ | g push


### Why?
I started this project because `git log --no-pager` gives an error. Apparently I wanted `git --no-pager log`. This was the last straw.
*So I decided to "fix" the git CLI.*

#### EDIT 1:
Here is an even better example of the inanity of git CLI. To get the SHA reference of HEAD, which of these would you use?
```
git show-ref HEAD --abbrev --hash
```
or
```
git rev-parse --short HEAD
```
Questions:
 * Why are they different results?
 * Why does `show-ref` use `--abbrev` but `rev-parse` use `--short`?
 * Why are the options _after_ `HEAD` in `show-ref` but _before_ `HEAD` in `rev-parse`?

I leave answering these questions as an exercise to the reader.

#### EDIT 2:
Another example of git's terrible option parsing. This command lists all the local branches that have been merged:
```
$ git branch --list --merged
* develop
  feature/latest
```
So what do you think this command does?
```
$ git branch --merged --list
fatal: malformed object name --list
```
OH MY GOD COULD YOU BE ANY MORE FRAGILE GIT?

### TODO
* ~~Now that I've added tab completion, I think "stage" and "status" are too similar.~~
  I've solved that for now by adding short aliases 'g =' and 'g ?'. Not intuitive,
  but I didn't want to rename status or stage. (Remember, I'm
  trying to keep as much lingo unchanged.) It's the same number of keystrokes as if using
  tab completion and one letter. I know, I know, still feels inconvenient somehow.
* Also, I have ~~three~~ four commands that start with "r" which is a problem for tab completion.
  Seriously considering renaming 'rmbranch' to 'unbranch' to match 'untag' and 'unstage'.

### Changelog
- I renamed "update" to "fetch" to avoid completion conflicts with "unstage".
Also, it really is just fetch + fast-forward. One of my goals is NOT to use
different terminology than git, because that makes StackOverflow less useful.
