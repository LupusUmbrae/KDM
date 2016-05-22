import common
from autobahn.twisted.wamp import ApplicationSession
from autobahn.wamp.exception import ApplicationError
from twisted.internet.defer import inlineCallbacks
from twisted.logger import Logger


class AuthenticatorSession(ApplicationSession):
    print("AUTH Created")
    log = Logger()

    db = common.connect_db()

    def __init__(self, config=None):
        ApplicationSession.__init__(self, config)
        print("AUTH component created")

    def onConnect(self):
        print("AUTH transport connected")
        try:
            self.join(self.config.realm)
        except Exception as e:
            print("Unexpected exception while joining %s" % e)

    def onChallenge(self, challenge):
        print("AUTH authentication challenge received")

    def onLeave(self, details):
        print("AUTH session left")

    def onDisconnect(self):
        print("AUTH transport disconnected")

    @inlineCallbacks
    def onJoin(self, details):

        def authenticate(realm, authid, details):
            self.log.info("WAMP-CRA dynamic authenticator invoked: realm='{}', authid='{}'".format(realm, authid))

            results = self.db.execute("select password from users where username='%s'" % authid).fetchone()
            self.log.info("results from DB {db}", db=results)
            if len(results) is not 0:

                hsh = results[0].split('$')[1]

                wamp_auth = {'authid': authid, 'secret': unicode(hsh), 'role': unicode('frontend')}
                self.log.info("WAMP Auth object: {auth}", auth=wamp_auth)
                return wamp_auth
            else:
                raise ApplicationError(u'com.kdmwebforms.no_such_user',
                                       'could not authenticate session - no such user {}'.format(authid))

        try:
            yield self.register(authenticate, u'com.kdmwebforms.authenticate')
            print("WAMP-CRA dynamic authenticator registered!")
        except Exception as e:
            print("Failed to register dynamic authenticator: {0}".format(e))

    def onUserError(self, fail, msg):
        print("User error; fail: %s, msg: %s" % fail, msg)
        self.log.error("User error (auth); fail: {fail}, msg: {msg}", fail=fail, msg=msg)
