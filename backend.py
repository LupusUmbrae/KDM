from autobahn.twisted.wamp import ApplicationSession
from twisted.internet.defer import inlineCallbacks
from twisted.logger import Logger

import common

PUBLIC_PREFIX = "com.kdmwebforms.public."
PRIVATE_PREFIX = "com.kdmwebforms.private."


class AppSession(ApplicationSession):
    db = common.connect_db()

    log = Logger()

    def __init__(self, config=None):
        ApplicationSession.__init__(self, config)
        print("backend component created")

    def onConnect(self):
        print("backend transport connected")
        try:
            self.join(self.config.realm)
        except Exception as e:
            print("Unexpected exception while joining %s" % e)

    def onChallenge(self, challenge):
        print("backend authentication challenge received")

    def onLeave(self, details):
        print("backend session left")

    def onDisconnect(self):
        print("backend transport disconnected")

    @inlineCallbacks
    def onJoin(self, details):
        print("backend session joined: {}".format(details))

        def check_username(username):
            return self.db.execute("select 1 from users where username = '%s'" % username).fetchall() == []

        def register(username, raw_password):
            if check_username(username):
                self.log.info("Registering user: {name}", name=username)
                enc_password = common.hash_password(raw_password)
                try:
                    self.db.execute("insert into users (username, password) values ('%s', '%s')" % (
                    username, enc_password))
                    self.db.commit()
                except Exception as e:
                    print("DB Execution error: %s" % e)
                    raise Exception("Error in the backend :(")
                return True
            else:
                raise Exception("Username already taken")

        def login(username, raw_password):
            result = self.db.execute("select password from users where username='%s'" % username).fetchone()
            self.log.info("db select result: {result}", result=result)
            if result is not None and len(result) is not 0:
                enc_password = result[0]
                if common.check_password(enc_password, raw_password):
                    return enc_password.split('$')[1]

            raise Exception("Login failed")



        try:
            yield self.register(check_username, PUBLIC_PREFIX + 'checkusername')
            yield self.register(register, PUBLIC_PREFIX + 'register')
            yield self.register(login, PUBLIC_PREFIX + 'login')
            self.log.info("Registered methods to {prefix}", prefix=PUBLIC_PREFIX)
        except Exception as e:
            print("Unexpected exception while registering public RPC's %s" % e)
            self.log.error("Unexpected exception while registering public RPC's {e}", e=e)

        def save(userid, data, campaignid=None):
            name = data["name"]
            if id is not None:
                # update
                self.db.execute("update kdm set content='%s', name='%s' where user_id='%s' and kdm_id='%s'" % (
                    data, name, userid, campaignid))
            else:
                # insert
                self.db.execute(
                    "insert into kdm (owner_id, name, content) values ('%s', '%s', '%s')" % (userid, name, data))

        def load(userid, campaignid):
            return self.db.execute(
                "select content from kdm where owner_id='%s' and kdm_id='%s'" % (userid, campaignid)).fetchall()

        def delete(userid, campaignid):
            self.db.execute("delete from kdm where user_id='%s' and kdm_id='%s'" % (userid, campaignid))

        def list_campaigns(userid):
            results = self.db.execute("select name, kdm_id from kdm where user_id='%s'" % userid)
            return results;

        def add_editor(userid, campaignid, username):
            results = self.db.execute("select user_id from users where username='%s'" % username).fetchall()
            if results is not []:
                editorid = results[0]
                self.db.execute(
                    "insert into kdm_editors (kdm_id, user_id) values ('%s', '%s') where not exists(select 1 from kdm_editors where kdm_id='%s' and user_id='%s')" % (
                        campaignid, editorid, campaignid, editorid))
            else:
                raise Exception("Unknown username: %s" % username)

        def remove_editor(userid, campaignid, username):
            results = self.db.execute("select user_id from users where username='%s'" % username).fetchall()
            if results is not []:
                editorid = results[0]
                self.db.execute("delete from kdm_editors where kdm_id='%s' and user_id='%s'" % (campaignid, editorid))
            else:
                raise Exception("Unknown username: %s" % username)

        def list_editors(userid, campaignid):
            results = self.db.execute(
                "select username from users where user_id in (select user_id from kdm_editors where kdm_id='%s')").fetchall(
                campaignid)
            return results

        try:
            yield self.register(save, PRIVATE_PREFIX + 'save')
            yield self.register(load, PRIVATE_PREFIX + 'load')
            yield self.register(delete, PRIVATE_PREFIX + 'delete')
            yield self.register(list_campaigns, PRIVATE_PREFIX + 'list')
            yield self.register(add_editor, PRIVATE_PREFIX + 'addEditor')
            yield self.register(remove_editor, PRIVATE_PREFIX + 'remove_editor')
            yield self.register(list_editors, PRIVATE_PREFIX + 'list_editors')

        except Exception as e:
            print("Unexpected exception while registering private RPC's %s" % e)
            self.log.error("Unexpected exception while registering private RPC's {e}", e=e)

    def onLeave(self, details):
        if self.db is not None:
            self.db.close()

    def onUserError(self, fail, msg):
        print("User error; fail: %s, msg: %s" % fail, msg)
        self.log.error("User error (backend); fail: {fail}, msg: {msg}", fail=fail, msg=msg)
