# Kingdom Death Monster - Web Forms
An attempt to create a small, simple(ish) web form for the KDM Character sheet and Lantern Hoard sheet. 

Currently aiming to make the forms look like the sheets from KDM and allow saving/loading via JSON output

## How to use
Its a web form, 'should' be easy to use

## How to run
You simply need to host the contents of this package with a webserver, for development i use 
[Flask] (http://flask.pocoo.org/) which is what the `kdm.py` is used for but any will do just
make sure the `root` for the web server is the root of the git repo

## Built with..
[Bootstrap](http://getbootstrap.com/) - Used extensively for the layout
[AngularJS](https://angularjs.org/) - Used to handle the saving/loading and to make my life much easier with includes and looping