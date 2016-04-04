extern crate clap;
extern crate git2;

use clap::App;
use git2::Repository;

fn main () {
    App::new("fake").version("v1.0-beta").get_matches();
}
