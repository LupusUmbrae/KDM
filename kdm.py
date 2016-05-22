import config

from flask import Flask, request, session, g, redirect, url_for, abort, render_template, flash, Response
from contextlib import closing
import sqlite3

app = Flask(__name__)
app.config.from_object(config)


@app.route('/')
def show_entries():
    return render_template('index.html')


def connect_db():
    return sqlite3.connect(app.config['DATABASE'])


def init_db():
    with closing(connect_db()) as db:
        with app.open_resource('schema.sql', mode='r') as f:
            db.cursor().executescript(f.read())
        db.commit()


if __name__ == "__main__":
    app.run()
