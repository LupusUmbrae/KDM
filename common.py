import config

import sqlite3
import hashlib


def connect_db():
    db = sqlite3.connect(config.DATABASE)
    db.execute("PRAGMA foreign_keys = ON")
    return db


def hash_password(raw_password):
    import random
    salt = hashlib.sha1('%s%s' % (random.random(), random.random())).hexdigest()[:5]
    hsh = hashlib.sha1('%s%s' % (salt, raw_password)).hexdigest()
    return '%s$%s' % (salt, hsh)


def check_password(enc_password, raw_password):
    salt, hsh = enc_password.split('$')
    return hsh == hashlib.sha1('%s%s' % (salt, raw_password)).hexdigest()
