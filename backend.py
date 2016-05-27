from autobahn.twisted.wamp import ApplicationSession
from twisted.internet.defer import inlineCallbacks
from twisted.logger import Logger
import json

import common

PUBLIC_PREFIX = "com.kdmwebforms.public."
PRIVATE_PREFIX = "com.kdmwebforms.private."


class AppSession(ApplicationSession):
    db = common.connect_db()

    log = Logger()

    user_id = None

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

    def onDisconnect(self):
        print("backend transport disconnected")

    def is_logged_in(self):
        return self.user_id is not None

    @inlineCallbacks
    def onJoin(self, details):
        print("backend session joined: {}".format(details))

        def check_username(username):
            """
            Helper RPC used to check if a username is taken before calling register
            :param username: Username to check is available
            :return: True if the username is not taken, False if it is
            """
            return self.db.execute("select 1 from users where username = '%s'" % username).fetchall() == []

        def register(username, raw_password):
            """
            Attempts to register the given username with the given password
            :param username: Username to register
            :param raw_password: USers password to register
            :return: Secret used to authenticate against WAMP with, or exception if successful, otherwise an exception is raised with failure details
            """
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
                return enc_password.split('$')[1]
            else:
                raise Exception("Username already taken")

        def login(username, raw_password):
            """
            Attempt to login the given user
            :param username: Username to login against
            :param raw_password: password to check against
            :return: Secret used to authenticate against WAMP with, or exception
            """
            result = self.db.execute("select user_id, password from users where username='%s'" % username).fetchone()
            self.log.info("db select result: {result}", result=result)
            if result is not None and len(result) is not 0:
                enc_password = result[1]
                if common.check_password(enc_password, raw_password):
                    self.user_id = result[0]
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

        def save(name, data, campaignid=None):
            """
            Used to save a given game to the database
            :param name: Name of the campaign
            :param data: JSON Data containing the campaign details
            :param campaignid: If this is set update an already existing game, otherwise create one
            :return: nothing
            """
            self.log.info("save")
            if not self.is_logged_in():
                raise Exception("You are not logged in!")

            if campaignid is not None:
                # update
                self.log.info("Update save")
                self.db.execute("update kdm set content='%s', name='%s' where user_id='%s' and kdm_id='%s'" % (
                    data, name, self.user_id, campaignid))
            else:
                # insert
                self.log.info("Create save")
                self.log.info(type(data))
                self.db.execute(
                    "insert into kdm (owner_id, name, content) values ('%s', '%s', '%s')" % (self.user_id, name, json.dumps(data)))

        def load(campaignid):
            """
            Load a saved campaign from the database
            :param campaignid: Campaign ID to load
            :return: Returns an array containing [name, json]
            """
            if not self.is_logged_in():
                raise Exception("You are not logged in!")
            return self.db.execute(
                "select name, content from kdm where owner_id='%s' and kdm_id='%s'" % (
                    self.user_id, campaignid)).fetchone()

        def delete(campaignid):
            """
            Deletes a campaign from the database
            :param campaignid: CampaignID to delete
            :return: nothing
            """
            if not self.is_logged_in():
                raise Exception("You are not logged in!")
            self.db.execute("delete from kdm where user_id='%s' and kdm_id='%s'" % (self.user_id, campaignid))

        def list_campaigns():
            """
            Get the list of existing campaigns for this user
            :return:
            """
            if not self.is_logged_in():
                raise Exception("You are not logged in!")
            queryresults = self.db.execute("select name, kdm_id from kdm where user_id='%s'" % self.user_id).fetchall()
            results = []
            for entry in queryresults:
                results.append({"name": entry[0], "id": entry[1]})
            return results


        def add_editor(campaignid, username):
            """
            Add a new editor to the given campaign
            :param campaignid: Campaign ID to add an editor to
            :param username: username to add
            :return:
            """
            if not self.is_logged_in():
                raise Exception("You are not logged in!")
            results = self.db.execute("select user_id from users where username='%s'" % username).fetchone()
            if results is not []:
                editorid = results[0]
                self.db.execute(
                    "insert into kdm_editors (kdm_id, user_id) values ('%s', '%s') where not exists(select 1 from kdm_editors where kdm_id='%s' and user_id='%s')" % (
                        campaignid, editorid, campaignid, editorid))
            else:
                raise Exception("Unknown username: %s" % username)

        def remove_editor(campaignid, username):
            if not self.is_logged_in():
                raise Exception("You are not logged in!")
            results = self.db.execute("select user_id from users where username='%s'" % username).fetchall()
            if results is not []:
                editorid = results[0]
                self.db.execute("delete from kdm_editors where kdm_id='%s' and user_id='%s'" % (campaignid, editorid))
            else:
                raise Exception("Unknown username: %s" % username)

        def list_editors(userid, campaignid):
            if not self.is_logged_in():
                raise Exception("You are not logged in!")
            results = self.db.execute(
                "select username from users where user_id in (select user_id from kdm_editors where kdm_id='%s')").fetchall(
                campaignid)
            return results

        try:
            yield self.register(save, PUBLIC_PREFIX + 'save')
            yield self.register(load, PUBLIC_PREFIX + 'load')
            yield self.register(delete, PUBLIC_PREFIX + 'delete')
            yield self.register(list_campaigns, PUBLIC_PREFIX + 'list')
            yield self.register(add_editor, PUBLIC_PREFIX + 'addEditor')
            yield self.register(remove_editor, PUBLIC_PREFIX + 'remove_editor')
            yield self.register(list_editors, PUBLIC_PREFIX + 'list_editors')

        except Exception as e:
            print("Unexpected exception while registering private RPC's %s" % e)
            self.log.error("Unexpected exception while registering private RPC's {e}", e=e)

    def onLeave(self, details):
        print("backend session left")
        if self.db is not None:
            self.db.close()

    def onUserError(self, fail, msg):
        print("User error; fail: %s, msg: %s" % fail, msg)
        self.log.error("User error (backend); fail: {fail}, msg: {msg}", fail=fail, msg=msg)
