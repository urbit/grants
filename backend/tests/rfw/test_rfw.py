import json

from mock import patch
from animal_case import animalify

from grant.proposal.models import Proposal, db
from grant.tag.models import Tag
from grant.rfw.models import (
    RFW,
    RFWSchema,
    RFWMilestone,
    RFWMilestoneSchema,
    RFWWorker,
    RFWWorkerSchema,
    RFWMilestoneClaim,
    RFWMilestoneClaimSchema,
    RFWException,
)
from grant.utils.enums import (
    Category,
    RFWStatus,
    RFWWorkerStatus,
    RFWMilestoneClaimStage
)
from grant.utils.misc import get
from ..config import BaseUserConfig
from ..test_data import test_proposal


class TestRfwOrm(BaseUserConfig):

    def test_rfw_orm(self):
        rfw = RFW.create()
        db.session.add(rfw)
        db.session.commit()
        self.assertEqual(RFWStatus.DRAFT, rfw.status)
        self.assertEqual(Category.ACCESSIBILITY, rfw.category)
        self.assertEqual(len(rfw.milestones), 1)

        # cannot set bounty directly on RFW
        def set_bounty():
            rfw.bounty = 123
        self.assertRaises(Exception, set_bounty)

        # must set correct category
        def set_bad_cat():
            rfw.category = 'BAD'
        self.assertRaises(RFWException, set_bad_cat)

        # must set correct status
        def set_bad_status():
            rfw.status = 'BAD'
        self.assertRaises(RFWException, set_bad_status)

        # must set index on milestone
        self.assertRaises(RFWException, lambda: RFWMilestone())

        # set a milestone bounty
        rfw.update_milestone_by_id(rfw.milestones[0].id, bounty=123)
        db.session.commit()
        self.assertEquals(rfw.milestones[0].bounty, 123)

        # add milestones
        ms0 = rfw.milestones[0]
        ms1 = rfw.create_next_milestone(bounty=234)
        self.assertEqual(ms1.index, 1)
        ms2 = rfw.create_next_milestone()
        self.assertEqual(ms2.index, 2)

        rfw.milestones[0].title = 'First'
        ms1.title = 'Second'
        ms2.title = 'Third'
        db.session.commit()

        for index, title in enumerate(['First', 'Second', 'Third']):
            with self.subTest(msg=f'milestone title check {index} {title}'):
                ms = next((x for x in rfw.milestones if x.index == index), None)
                self.assertIsNotNone(ms)
                self.assertEquals(ms.title, title)

        # rfw.bounty hybrid property sums all milestones
        ms2.bounty = 345
        db.session.commit()
        self.assertEquals(123 + 234 + 345, rfw.bounty)

        # rfw.update
        rfw.update(
            title='Hello work',
            status=RFWStatus.CLOSED,
            category=Category.DOCUMENTATION
        )
        db.session.commit()
        self.assertEquals('Hello work', rfw.title)
        self.assertEquals(RFWStatus.CLOSED, rfw.status)
        self.assertEquals(Category.DOCUMENTATION, rfw.category)

        # rfw.update milestones basics
        rfw.update(milestones=[
            {'id': ms1.id, 'title': '2nd'},
            {'id': ms2.id, 'title': '3rd'},
            {'id': ms0.id, 'brief': 'stuff'}
        ])
        self.assertEquals(ms1.title, '2nd')
        self.assertEquals(ms2.title, '3rd')
        self.assertEquals(ms0.brief, 'stuff')

        # rfw.update milestones borked index
        self.assertRaises(RFWException, lambda: rfw.update(milestones=[{'id': ms1.id, 'index': 0}]))

        # delete_milestone_by_id
        rfw.delete_milestone_by_id(ms1.id)
        self.assertEquals(len(rfw.milestones), 2)

        for index, ms in enumerate(rfw.milestones):
            # check the indexes
            self.assertEqual(index, ms.index, msg=f'ms {ms.title} should have index {index}')

        rfw.delete_milestone_by_id(ms2.id)
        self.assertEquals(len(rfw.milestones), 1)

        # re-add milestones
        rfw.update(milestones=[
            {'is_new': True, 'index': 1, 'title': 'second'},
            {'is_new': True, 'index': 2, 'title': 'third'},
        ])
        db.session.commit()
        ms1 = rfw.milestones[1]
        ms2 = rfw.milestones[2]
        self.assertEqual(ms1.title, 'second')
        self.assertEqual(ms2.title, 'third')

        # publish
        rfw.publish()

        # RFWWorker construct, validation
        rfw_worker = RFWWorker(status_message="Lemme work")
        self.assertEqual(rfw_worker.status, RFWWorkerStatus.REQUESTED)
        self.assertEqual(rfw_worker.status_message, "Lemme work")
        self.assertRaises(RFWException, lambda: setattr(rfw_worker, 'status', 'BAD'))

        # workers
        rfw_worker = rfw.create_worker_by_user_id_and_request(self.user.id, 'I wanna work')
        db.session.commit()
        self.assertEqual(RFWWorkerStatus.REQUESTED, rfw_worker.status)

        # worker relationships
        worker_in_rfw = next((x for x in rfw.workers if x.user_id == self.user.id), None)
        worker_on_user = next((x for x in self.user.rfws if x.rfw_id == rfw.id), None)
        self.assertIsNotNone(worker_in_rfw)
        self.assertIsNotNone(worker_on_user)

        # rfw.get_worker_by_id
        self.assertIsNotNone(rfw.get_worker_by_id(rfw_worker.id))
        self.assertRaises(RFWException, lambda: rfw.get_worker_by_id(12345678))

        # worker admin accept
        rfw.accept_worker_by_id(rfw_worker.id, 'accept')
        self.assertEqual(rfw_worker.status, RFWWorkerStatus.ACCEPTED)
        self.assertEqual(rfw_worker.status_message, 'accept')

        # worker admin reject
        rfw.reject_worker_by_id(rfw_worker.id, 'reject')
        self.assertEqual(rfw_worker.status, RFWWorkerStatus.REJECTED)
        self.assertEqual(rfw_worker.status_message, 'reject')

        # claim - new claim and updates by worker
        def request_and_check_claim(ind, ms, msg, url):
            print(f'req ms {ms.title} claim')
            claim = rfw.request_milestone_claim(rfw_worker.id, ms.id, msg, url)
            self.assertEqual(claim.stage, RFWMilestoneClaimStage.REQUESTED)
            self.assertEqual(claim.stage_message, msg)
            self.assertEqual(claim.stage_url, url)
            self.assertEqual(rfw.milestones[ms.index].claims[0].id, claim.id)
            self.assertEqual(ms.claims[0].id, claim.id)
            self.assertEqual(rfw_worker.claims[ind].id, claim.id)

        request_and_check_claim(0, ms0, 'first claim', 'http://x.io/pull/1')
        request_and_check_claim(1, ms1, 'second claim', 'http://x.io/pull/2')

        # admin accept claim
        claim0 = ms0.claims[0]
        claim1 = ms1.claims[0]
        rfw.accept_milestone_claim(ms0.id, claim0.id, 'accept msg')
        self.assertEqual(claim0.stage, RFWMilestoneClaimStage.ACCEPTED)
        self.assertEqual(claim0.stage_message, 'accept msg')

        # admin reject claim
        def reject_claim():
            rfw.reject_milestone_claim(ms0.id, claim0.id, 'reject msg')
            self.assertEqual(claim0.stage, RFWMilestoneClaimStage.REJECTED)
        self.assertRaises(RFWException, reject_claim)
        claim0.stage = RFWMilestoneClaimStage.REQUESTED
        db.session.commit()
        reject_claim()
        self.assertEqual(claim0.stage, RFWMilestoneClaimStage.REJECTED)

        # add tag
        tag = Tag.create_tag('new', 'New stuff!', '#ff0000')
        rfw.add_tag(tag)
        self.assertEqual(rfw.tags[0].id, tag.id)

        # remove tag
        rfw.remove_tag_by_id(tag.id)
        self.assertEqual(len(rfw.tags), 0, msg='Should not have any tags')
        rfw.remove_tag_by_id(1234)  # silent if tag not there
        db.session.commit()

        # tag still exists, not associated
        self.assertIsNotNone(Tag.query.get(tag.id))

        # add tag for serialization
        new_tag = Tag.create_tag('test', 'Test desc.', '#cccccc')
        rfw.add_tag(new_tag)
        db.session.commit()

        # serialize

        dump = RFWMilestoneClaimSchema().dump(claim0)
        self.assertEqual(dump['id'], claim0.id)
        self.assertRegex(str(dump['date_created']), '[0-9]+')
        self.assertEqual(dump['stage'], claim0.stage)
        self.assertEqual(dump['stage_message'], claim0.stage_message)
        self.assertEqual(dump['worker']['id'], claim0.worker.id)
        self.assertEqual(dump['milestone']['id'], claim0.milestone.id)

        dump = RFWMilestoneSchema().dump(ms0)
        self.assertEqual(dump['id'], ms0.id)
        self.assertRegex(str(dump['date_created']), '[0-9]+')
        self.assertRegex(str(dump['effort_from']), '0')
        self.assertRegex(str(dump['effort_to']), '0')
        self.assertEqual(dump['rfw']['id'], rfw.id)
        self.assertEqual(dump['claims'][0]['id'], claim0.id)

        dump = RFWWorkerSchema().dump(rfw_worker)
        self.assertEqual(dump['id'], rfw_worker.id)
        self.assertRegex(str(dump['date_created']), '[0-9]+')
        self.assertRegex(str(dump['status_change_date']), '[0-9]+')
        self.assertEqual(dump['rfw']['id'], rfw.id)
        self.assertEqual(dump['user']['id'], self.user.id)
        dumped_claims = [x['id'] for x in dump['claims']]
        self.assertIn(claim0.id, dumped_claims)
        self.assertIn(claim1.id, dumped_claims)

        dump = RFWSchema().dump(rfw)
        self.assertEqual(dump['id'], rfw.id)
        self.assertRegex(str(dump['date_created']), '[0-9]+')
        self.assertRegex(str(dump['status_change_date']), '[0-9]+')
        self.assertEqual(dump['workers'][0]['id'], rfw_worker.id)
        self.assertEqual(dump['milestones'][0]['id'], ms0.id)
        self.assertEqual(dump['tags'][0]['id'], new_tag.id)

        # delete RFW
        db.session.delete(rfw)
        db.session.commit()
        self.assertIsNone(RFW.query.get(rfw.id))
        self.assertIsNone(RFWMilestone.query.get(ms0.id))
        self.assertIsNone(RFWWorker.query.get(rfw_worker.id))
        self.assertIsNone(RFWMilestoneClaim.query.get(claim0.id))
        self.assertIsNotNone(Tag.query.get(new_tag.id))


class TestRfwApi(BaseUserConfig):
    rfw_count = 0

    def setUp(self):
        super().setUp()
        self.rfw0 = self.make_rfw()
        self.rfw0_json = animalify(RFWSchema().dump(self.rfw0))

    def check_auth(self, req_fn):
        # unauthenticated
        self.assert401(req_fn())

        # non-admin
        self.login_default_user()
        self.assert401(req_fn())

    def make_rfw(self):
        rfw = RFW.create(title=f'rfw{self.rfw_count}')
        # ms0 is created by default
        ms0 = rfw.milestones[0]
        ms1 = rfw.create_next_milestone(bounty=1, title=f'rfw{self.rfw_count} - ms1')
        ms2 = rfw.create_next_milestone(bounty=2, title=f'rfw{self.rfw_count} - ms2')
        ms3 = rfw.create_next_milestone(bounty=3, title=f'rfw{self.rfw_count} - ms3')

        rfw.publish()
        w = rfw.create_worker_by_user_id_and_request(self.user.id, 'req msg')
        rfw.request_milestone_claim(w.id, ms0.id, 'claim0', 'https://claim.is/0')
        rfw.request_milestone_claim(w.id, ms1.id, 'claim1', 'https://claim.is/1')
        tag0 = Tag.create_tag('tag0', 'Tag 0', '#000000')
        tag1 = Tag.create_tag('tag1', 'Tag 1', '#111111')
        rfw.add_tag(tag0)
        rfw.add_tag(tag1)
        db.session.commit()
        self.rfw_count += 1
        return rfw

    def clear_authed_json(self, rfw_json):
        rfw_json['authedWorker'] = None
        for x in rfw_json['milestones']:
            x['authedClaim'] = None
            x['isAuthedActive'] = False
            for y in x['claims']:
                y['worker']['isSelf'] = False
        for x in rfw_json['workers']:
            x['isSelf'] = False
            x['claims'][0]['milestone']['authedClaim'] = None
            x['claims'][0]['milestone']['isAuthedActive'] = False
            x['claims'][1]['milestone']['authedClaim'] = None
            x['claims'][1]['milestone']['isAuthedActive'] = False

    def test_admin_rfw_api_get_list(self):
        url = '/api/v1/admin/rfws'
        self.check_auth(lambda: self.app.get(url))

        # admin
        rfw1 = self.make_rfw()
        rfw2 = self.make_rfw()
        self.login_admin()
        r = self.app.get(f'{url}?sort=CREATED:ASC')
        self.assert200(r)
        self.maxDiff = None
        self.clear_authed_json(r.json['items'][0])
        self.assertEqual(self.rfw0_json, r.json['items'][0])

    def test_admin_rfw_api_get_single(self):
        url = f'/api/v1/admin/rfws/{self.rfw0.id}'
        self.check_auth(lambda: self.app.get(url))

        # admin
        self.login_admin()
        r = self.app.get(url)
        self.assert200(r)
        self.clear_authed_json(r.json)
        self.assertEqual(r.json, self.rfw0_json)

        # missing
        r = self.app.get(url.replace(str(self.rfw0.id), '9999999'))
        self.assert404(r)

    def test_admin_rfw_api_create(self):
        url = f'/api/v1/admin/rfws'
        data = {
            'title': 'new rfw',
            'brief': 'new rfw brief',
            'content': 'new rfw content',
            'category': Category.DEV_TOOL,
            'milestones': {
                'index': 0,
                'bounty': 9,
            }
        }

        def req(): return self.app.post(
            url,
            data=json.dumps(data),
            content_type='application/json'
        )

        self.check_auth(req)

        # admin
        self.login_admin()
        r = req()
        self.assert200(r)
        self.maxDiff = None
        self.assertEqual(r.json['title'], data['title'])
        self.assertEqual(r.json['bounty'], 9)
        self.assertEqual(r.json['milestones'][0]['bounty'], 9)

    def test_admin_rfw_api_update(self):
        url = f'/api/v1/admin/rfws/{self.rfw0.id}'
        data = {
            'title': 'Muh new title',
            'brief': 'different brief',
            'milestones': [
                {'id': self.rfw0.milestones[1].id, 'bounty': 333}
            ],
            'deleteMilestones': [self.rfw0.milestones[2].id]
        }

        def req(): return self.app.put(
            url,
            data=json.dumps(data),
            content_type='application/json'
        )

        self.check_auth(req)

        # admin
        self.login_admin()
        r = req()
        self.assert200(r)
        self.maxDiff = None
        self.assertEqual(r.json['title'], data['title'])
        self.assertEqual(r.json['brief'], data['brief'])
        self.assertEqual(r.json['bounty'], 336)
        self.assertEqual(r.json['milestones'][1]['bounty'], 333)
        self.assertEqual(len(r.json['milestones']), 3)
        for i in [0, 1, 2]:  # check indexes
            with self.subTest(msg='indexes should be ordered', i=i):
                self.assertEqual(r.json['milestones'][i]['index'], i)

    def test_admin_rfw_api_delete(self):
        url = f'/api/v1/admin/rfws/{self.rfw0.id}'

        def req():
            return self.app.delete(url)

        self.check_auth(req)

        self.login_admin()
        r = req()
        self.assert200(r)
        self.assertEqual(r.json['message'], 'ok')
        self.assertIsNone(RFW.query.get(self.rfw0.id))

        # missing
        r = req()
        self.assert404(r)

    def make_worker(self):
        worker = self.rfw0.create_worker_by_user_id_and_request(self.other_user.id, 'req msg')
        db.session.commit()
        return worker

    def test_admin_rfw_api_worker_accept(self):
        worker = self.make_worker()
        data = {
            'isAccept': True,
            'message': 'accept msg'
        }

        def _req(a, b):
            url = f'/api/v1/admin/rfws/{a}/worker/{b}/accept'
            return lambda: self.app.put(
                url,
                data=json.dumps(data),
                content_type='application/json'
            )

        req = _req(self.rfw0.id, worker.id)

        self.check_auth(req)

        self.login_admin()

        # accept
        r = req()
        self.assert200(r)
        r_worker = [x for x in r.json['workers'] if x['id'] == worker.id]
        print(r_worker)
        self.assertEqual(r_worker[0]['status'], RFWWorkerStatus.ACCEPTED)
        self.assertEqual(r_worker[0]['statusMessage'], 'accept msg')
        self.assertEqual(RFWWorker.query.get(worker.id).status, RFWWorkerStatus.ACCEPTED)

        # missing rfw
        r = _req(123, worker.id)()
        self.assert404(r)

        # missing worker
        r = _req(self.rfw0.id, 123)()
        self.assert404(r)

        # reject
        data['isAccept'] = False
        data['message'] = 'reject msg'
        r = req()
        self.assert200(r)
        r_worker = [x for x in r.json['workers'] if x['id'] == worker.id]
        self.assertEqual(r_worker[0]['status'], RFWWorkerStatus.REJECTED)
        self.assertEqual(r_worker[0]['statusMessage'], 'reject msg')

    def test_admin_rfw_api_worker_ms_accept(self):
        worker = self.make_worker()
        worker_id = worker.id
        ms = self.rfw0.milestones[0]
        claim = self.rfw0.request_milestone_claim(
            worker.id,
            ms.id,
            'msg',
            'http://done.com'
        )
        data = {
            'isAccept': False,
            'message': 'reject msg'
        }
        db.session.commit()

        # print(json.dumps(RFWSchema().dump(self.rfw0), indent=4, sort_keys=True))
        # raise Exception('fail')

        def _req(a, b, c):
            url = f'/api/v1/admin/rfws/{a}/milestone/{b}/accept/{c}'
            return lambda: self.app.put(
                url,
                data=json.dumps(data),
                content_type='application/json'
            )

        req = _req(self.rfw0.id, ms.id, claim.id)

        self.check_auth(req)

        self.login_admin()

        def grab_claim(x):
            x = x['milestones']
            x = get(x, 'id', ms.id)
            return get(x['claims'], 'id', claim.id)

        # reject
        r = req()
        self.assert200(r)
        r = grab_claim(r.json)
        self.assertEqual(r['stage'], RFWMilestoneClaimStage.REJECTED)
        self.assertEqual(r['stageMessage'], 'reject msg')

        RFW.query.get(self.rfw0.id).request_milestone_claim(worker_id, ms.id, 'req msg', 'https://done.com')

        # accept
        data['isAccept'] = True
        data['message'] = 'accept msg'
        r = req()
        self.assert200(r)
        r = grab_claim(r.json)
        self.assertEqual(r['stage'], RFWMilestoneClaimStage.ACCEPTED)
        self.assertEqual(r['stageMessage'], 'accept msg')

    def test_rfw_api_get(self):
        # unauthenticated
        r = self.app.get('/api/v1/rfws')
