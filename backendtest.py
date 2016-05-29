import unittest
import json
from contextlib import closing

import backend
import config
import common


class TestBackend(unittest.TestCase):
    config.DATABASE = config.TEST_DATABASE
    backend = backend.AppSession()

    @classmethod
    def setUpClass(cls):
        with closing(common.connect_db()) as db:
            db.execute("PRAGMA foreign_keys = OFF")
            with open('kdm.sql', 'r') as f:
                db.cursor().executescript(f.read())
            db.commit()
            with open('test_data.sql', 'r') as f:
                db.cursor().executescript(f.read())
            db.commit()

    def test_checkusername(self):
        self.assertFalse(self.backend.check_username("robin"))
        self.assertTrue(self.backend.check_username("cheese"))

    def test_login(self):
        self.assertEqual(self.backend.login("robin", "bob"), "45f8f03f694c7c5a15a88c235adf7acafc052acc")
        try:
            self.backend.login("cheese", "grommit")
            self.fail("Should of gotten an error")
        except Exception as e:
            self.assertEqual(str(e), "Login failed")

    def test_register(self):
        enc_password = self.backend.register("monkey", "puzzle")
        self.backend.logout()
        self.assertEqual(self.backend.login("monkey", "puzzle"), enc_password)
        try:
            self.backend.register("monkey", "puzzle")
            self.fail("Should of gotten an error")
        except Exception as e:
            self.assertEqual(str(e), "Username already taken")

    def test_load(self):
        self.backend.login("robin", "bob")
        result = self.backend.load(1)
        self.assertEqual(result[0], "test")
        campaign = json.loads(result[1])
        self.assertEqual(campaign[0]["type"], "settlement")

    def test_save(self):
        self.backend.login("robin", "bob")
        id1 = self.backend.save("saveTest", json.dumps([{"type": "settlement"}]))
        id2 = self.backend.save("saveTest", json.dumps([{"type": "settlement"}, {"type": "bob"}]), id1)
        self.assertEqual(id1, id2)
        result = self.backend.load(id1)
        self.assertEqual(result[0], "saveTest")

        campaign = json.loads(result[1])
        self.assertEqual(len(campaign), 2)
        self.assertEqual(campaign[0]['type'], 'settlement')
        self.assertEqual(campaign[1]['type'], 'bob')

    def test_delete(self):
        self.backend.login("robin", "bob")
        campaignid = self.backend.save("saveTest", json.dumps([{"type": "settlement"}]))
        self.backend.delete(campaignid)
        self.assertEqual(self.backend.load(campaignid), None)

    def test_listeditors(self):
        self.backend.login("robin", "bob")
        editors = self.backend.list_editors(2)
        self.assertListEqual(editors, [('robin',), ("bob",)])

    def test_addeditors(self):
        self.backend.login("robin", "bob")
        self.backend.add_editor(1, "bob")
        editors = self.backend.list_editors(1)
        self.assertListEqual(editors, [("bob",)])

    def test_remoteeditors(self):
        self.backend.login("robin", "bob")
        self.backend.add_editor(1, "bob")
        editors = self.backend.list_editors(1)
        self.assertListEqual(editors, [("bob",)])
        self.backend.remove_editor(1, "bob")
        editors = self.backend.list_editors(1)
        self.assertListEqual(editors, [])

    def test_listjoinable(self):
        self.backend.login("robin", "bob")
        results = self.backend.list_joinable()
        self.assertEqual(results[0], ("robin", "test2"))

if __name__ == '__main__':
    unittest.main()
