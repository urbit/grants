import json
from grant.utils.enums import ProposalStatus
import grant.utils.admin as admin
from grant.utils import totp_2fa
from grant.user.models import admin_user_schema
from grant.proposal.models import proposal_schema, db
from grant.tag import models as tag_models
from mock import patch

from ..config import BaseProposalCreatorConfig


json_checklogin = {
    "isLoggedIn": False,
    "is2faAuthed": False,
}
json_checklogin_true = {
    "isLoggedIn": True,
    "is2faAuthed": True,
}
json_2fa = {
    "isLoginFresh": True,
    "has2fa": False,
    "is2faAuthed": False,
    "backupCodeCount": 0,
    "isEmailVerified": True,
}


class TestAdminAPI(BaseProposalCreatorConfig):

    def p(self, path, data):
        return self.app.post(path, data=json.dumps(data), content_type="application/json")

    def r(self, method, path, data=None):
        if not data:
            return method(path)

        return method(path, data=data)

    def assert_autherror(self, resp, contains):
        # this should be 403
        self.assert403(resp)
        print(f'...check that [{resp.json["message"]}] contains [{contains}]')
        self.assertTrue(contains in resp.json['message'])

    # happy path (mostly)
    def test_admin_2fa_setup_flow(self):
        # 1. initial checklogin
        r = self.app.get("/api/v1/admin/checklogin")
        self.assert200(r)
        self.assertEqual(json_checklogin, r.json, msg="initial login")

        def send_login():
            return self.p("/api/v1/admin/login", {
                "username": self.user.email_address,
                "password": self.user_password
            })

        # 2. login attempt (is_admin = False)
        r = send_login()
        self.assert401(r)

        # 3. make user admin
        self.user.set_admin(True)
        db.session.commit()

        # 4. login again
        r = send_login()
        self.assert200(r)
        json_checklogin['isLoggedIn'] = True
        self.assertEqual(json_checklogin, r.json, msg="login again")

        # 5. get 2fa state (fresh login)
        r = self.app.get("/api/v1/admin/2fa")
        self.assert200(r)
        self.assertEqual(json_2fa, r.json, msg="get 2fa state")

        # 6. get 2fa setup
        r = self.app.get("/api/v1/admin/2fa/init")
        self.assert200(r)
        self.assertTrue('backupCodes' in r.json)
        self.assertTrue('totpSecret' in r.json)
        self.assertTrue('totpUri' in r.json)

        codes = r.json['backupCodes']
        secret = r.json['totpSecret']
        uri = r.json['totpUri']

        # 7. enable 2fa (bad hash)
        r = self.p("/api/v1/admin/2fa/enable", {
            "backupCodes": ['bad-code'],
            "totpSecret": "BADSECRET",
            "verifyCode": "123456"
        })
        self.assert_autherror(r, 'Bad hash')

        # 8. enable 2fa (bad verification code)
        r = self.p("/api/v1/admin/2fa/enable", {
            "backupCodes": codes,
            "totpSecret": secret,
            "verifyCode": "123456"
        })
        self.assert_autherror(r, 'Bad verification code')

        # 9. enable 2fa (success)
        r = self.p("/api/v1/admin/2fa/enable", {
            "backupCodes": codes,
            "totpSecret": secret,
            "verifyCode": totp_2fa.current_totp(secret)
        })
        self.assert200(r)
        json_2fa['has2fa'] = True
        json_2fa['is2faAuthed'] = True
        json_2fa['backupCodeCount'] = 16
        self.assertEquals(json_2fa, r.json)

        # 10. check login (logged in)
        r = self.app.get("/api/v1/admin/checklogin")
        self.assert200(r)
        self.assertEqual(json_checklogin_true, r.json, msg="checklogin - logged in")

        # 11. 2fa state (logged in & verified)
        r = self.app.get("/api/v1/admin/2fa")
        self.assert200(r)
        self.assertEqual(json_2fa, r.json, msg="get 2fa state (logged in)")

        # 12. logout
        r = self.app.get("/api/v1/admin/logout")
        self.assert200(r)
        json_checklogin['isLoggedIn'] = False
        self.assertEquals(json_checklogin, r.json)

        # 13. 2fa state (logged out)
        r = self.app.get("/api/v1/admin/2fa")
        self.assert403(r)

        # 14. 2fa verify (fail; logged out)
        r = self.p("/api/v1/admin/2fa/verify", {'verifyCode': totp_2fa.current_totp(secret)})
        self.assert_autherror(r, 'Must be auth')

        # 15. login
        r = send_login()
        self.assert200(r)

        # 16. check login (logged in, not verified)
        r = self.app.get("/api/v1/admin/checklogin")
        self.assert200(r)
        json_checklogin['isLoggedIn'] = True
        self.assertEqual(json_checklogin, r.json, msg="checklogin - logged in, not verified")

        # 17. 2fa state (logged in, not verified)
        r = self.app.get("/api/v1/admin/2fa")
        self.assert200(r)
        json_2fa['is2faAuthed'] = False
        self.assertEqual(json_2fa, r.json, msg="get 2fa state (logged in, not verified)")

        # 18. 2fa verify (success: logged in)
        r = self.p("/api/v1/admin/2fa/verify", {'verifyCode': totp_2fa.current_totp(secret)})
        self.assert200(r)
        json_2fa['is2faAuthed'] = True
        self.assertEqual(json_2fa, r.json)

        # 19. check login (natural login and verify)
        r = self.app.get("/api/v1/admin/checklogin")
        self.assert200(r)
        self.assertEqual(json_checklogin_true, r.json, msg="checklogin - logged in")

        # 20. logout
        r = self.app.get("/api/v1/admin/logout")
        self.assert200(r)

        # 21. login
        r = send_login()
        self.assert200(r)

        # 22. 2fa verify (use backup code)
        r = self.p("/api/v1/admin/2fa/verify", {'verifyCode': codes[0]})
        self.assert200(r)
        json_2fa['is2faAuthed'] = True
        json_2fa['backupCodeCount'] = json_2fa['backupCodeCount'] - 1
        self.assertEqual(json_2fa, r.json)

        # 23. logout
        r = self.app.get("/api/v1/admin/logout")
        self.assert200(r)

        # 24. login
        r = send_login()
        self.assert200(r)

        # 25. 2fa verify (fail: re-use backup code)
        r = self.p("/api/v1/admin/2fa/verify", {'verifyCode': codes[0]})
        self.assert_autherror(r, 'Bad 2fa code')

        # Here ends the epic of Loginomesh.

    def test_get_users(self):
        self.login_admin()
        resp = self.app.get("/api/v1/admin/users")
        self.assert200(resp)
        print(resp.json)
        # 2 users created by BaseProposalCreatorConfig
        self.assertEqual(len(resp.json['items']), 2)

    def test_get_proposals(self):
        self.login_admin()
        resp = self.app.get("/api/v1/admin/proposals")
        self.assert200(resp)
        # 2 proposals created by BaseProposalCreatorConfig
        self.assertEqual(len(resp.json['items']), 2)

    # def test_update_proposal(self):
    #     pass

    def test_update_proposal_no_auth(self):
        resp = self.app.put(f"/api/v1/admin/proposals/{self.proposal.id}", data=json.dumps({"contributionMatching": 1}))
        self.assert401(resp)

    def test_approve_proposal(self):
        self.login_admin()

        # proposal needs to be PENDING
        self.proposal.status = ProposalStatus.PENDING

        # approve
        resp = self.app.put(
            "/api/v1/admin/proposals/{}/approve".format(self.proposal.id),
            data=json.dumps({"isApprove": True})
        )
        self.assert200(resp)
        self.assertEqual(resp.json["status"], ProposalStatus.APPROVED)

    def test_reject_proposal(self):
        self.login_admin()

        # proposal needs to be PENDING
        self.proposal.status = ProposalStatus.PENDING

        # reject
        resp = self.app.put(
            "/api/v1/admin/proposals/{}/approve".format(self.proposal.id),
            data=json.dumps({"isApprove": False, "rejectReason": "Funnzies."})
        )
        self.assert200(resp)
        self.assertEqual(resp.json["status"], ProposalStatus.REJECTED)
        self.assertEqual(resp.json["rejectReason"], "Funnzies.")

    def test_create_rfp_succeeds(self):
        self.login_admin()

        resp = self.app.post(
            "/api/v1/admin/rfps",
            data=json.dumps({
                "brief": "Some brief",
                "category": "CORE_DEV",
                "content": "CONTENT",
                "dateCloses": 1553980004,
                "status": "DRAFT",
                "title": "TITLE"
            })
        )
        self.assert200(resp)

    def test_create_rfp_fails_with_bad_category(self):
        self.login_admin()

        resp = self.app.post(
            "/api/v1/admin/rfps",
            data=json.dumps({
                "brief": "Some brief",
                "category": "NOT_CORE_DEV",
                "content": "CONTENT",
                "dateCloses": 1553980004,
                "status": "DRAFT",
                "title": "TITLE"
            })
        )
        self.assert400(resp)

    def test_admin_tags(self):
        self.login_admin()
        r = self.app.get("/api/v1/admin/tags")
        self.assert200(r)
        self.assertEqual(r.json, [])

        # create
        data = {
            "text": "Tag",
            "description": "My tag",
            "color": "#cccccc"
        }
        r = self.app.put(
            "/api/v1/admin/tags",
            data=json.dumps(data)
        )
        self.assert200(r)
        tag_id = r.json.pop('id', None)
        self.assertIsNotNone(tag_id)
        self.assertEqual(r.json, data)

        # update
        data["id"] = tag_id
        data["text"] = "Changed"
        r = self.app.put(
            "/api/v1/admin/tags",
            data=json.dumps(data)
        )
        self.assert200(r)
        self.assertEqual(r.json, data)

        # delete
        r = self.app.delete(f"/api/v1/admin/tags/{tag_id}")
        self.assert200(r)
        self.assertEqual(r.json['message'], 'ok')

    def test_update_proposal_private(self):
        self.login_admin()

        # make public
        resp = self.app.put(
            f"/api/v1/admin/proposals/{self.proposal.id}",
            data=json.dumps({"private": False})
        )
        self.assert200(resp)
        self.assertEqual(resp.json["private"], False)

        # make private
        resp = self.app.put(
            f"/api/v1/admin/proposals/{self.proposal.id}",
            data=json.dumps({"private": True})
        )
        self.assert200(resp)
        self.assertEqual(resp.json["private"], True)

        # get from main api
        self.proposal.status = ProposalStatus.LIVE
        db.session.commit()
        resp = self.app.get(f"/api/v1/proposals/{self.proposal.id}")
        self.assert200(resp)
        resp = self.app.get(f"/api/v1/proposals")
        # never in the list, even if authed user is team member
        self.assert200(resp)
        self.assertNotIn(self.proposal.id, [x['id'] for x in resp.json['items']])

        # get as outside user
        self.login_other_user()
        resp = self.app.get(f"/api/v1/proposals/{self.proposal.id}")
        self.assert404(resp)
        resp = self.app.get(f"/api/v1/proposals")
        self.assert200(resp)
        self.assertNotIn(self.proposal.id, [x['id'] for x in resp.json['items']])
