import pytest
from grant.email.subscription_settings import (
    email_subscriptions_to_bits,
    email_subscriptions_to_dict,
    get_default_email_subscriptions,
    validate_email_subscriptions,
    is_subscribed,
    EmailSubscription
)
from grant.utils.exceptions import ValidationException

from ..config import BaseTestConfig

test_dict = get_default_email_subscriptions()

# set all False
for k in test_dict:
    test_dict[k] = False

# turn on a couple
test_dict[EmailSubscription.MY_COMMENT_REPLY.value['key']] = True
test_dict[EmailSubscription.ADMIN_APPROVAL.value['key']] = True
test_dict[EmailSubscription.WORK_REVIEW.value['key']] = True

# calculate number
test_bits = \
    2 ** EmailSubscription.MY_COMMENT_REPLY.value['bit'] + \
    2 ** EmailSubscription.ADMIN_APPROVAL.value['bit'] + \
    2 ** EmailSubscription.WORK_REVIEW.value['bit']


class TestEmailSubscriptionSettings(BaseTestConfig):
    def test_email_subscriptions_to_bits(self):
        res = email_subscriptions_to_bits(test_dict)
        self.assertEquals(res, test_bits)

    def test_email_subscriptions_to_dict(self):
        res = email_subscriptions_to_dict(test_bits)
        self.maxDiff = None
        self.assertEquals(res, test_dict)

    def test_validate_email_subscriptions(self):
        test = get_default_email_subscriptions()
        # no Exception
        validate_email_subscriptions(test)
        # cause ValidationException
        test['incorrect_key'] = True
        with pytest.raises(ValidationException) as e_info:
            validate_email_subscriptions(test)

    def test_is_subscribed(self):
        self.assertTrue(is_subscribed(test_dict, EmailSubscription.MY_COMMENT_REPLY))
        self.assertTrue(is_subscribed(test_dict, EmailSubscription.WORK_REVIEW))
        self.assertFalse(is_subscribed(test_dict, EmailSubscription.MY_PROPOSAL_APPROVAL))
        self.assertFalse(is_subscribed(test_dict, EmailSubscription.ADMIN_WORK_MILESTONE_REVIEW))
