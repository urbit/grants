import datetime
import random
import re
import string
import time

from grant.settings import SITE_URL, ADMIN_SITE_URL

epoch = datetime.datetime.utcfromtimestamp(0)
RANDOM_CHARS = string.ascii_letters + string.digits


def dt_from_ms(ms):
    return datetime.datetime.utcfromtimestamp(ms / 1000.0)


def dt_to_ms(dt):
    delta = dt - epoch
    return int(delta.total_seconds() * 1000)


def dt_to_unix(dt):
    return int(time.mktime(dt.timetuple()))


def gen_random_code(length=32):
    return ''.join(
        [random.choice(RANDOM_CHARS) for n in range(length)]
    )


def clean_random_code(code: str):
    return ''.join(c for c in code if c in RANDOM_CHARS)


def make_url(path: str):
    return f'{SITE_URL}{path}'


def make_admin_url(path: str):
    return f'{ADMIN_SITE_URL}{path}'


def is_email(email: str):
    return bool(re.match(r"[^@]+@[^@]+\.[^@]+", email))


def from_zat(zat: int):
    return zat / 100000000


def to_zat(zec: float):
    return zec * 100000000


def make_preview(content: str, max_length: int):
    truncated = False

    # Show only the first line. Add ellipsis if there are more than two lines,
    # even if first line isn't truncated.
    preview = content.split('\n', 1)[0]
    if len(preview) != len(content):
        truncated = True

    # Truncate to max length
    if len(preview) > max_length:
        preview = preview[:max_length - 3]
        truncated = True

    return content + '...' if truncated else content


def gen_random_id(model):
    min_id = 100000
    max_id = pow(2, 31) - 1
    random_id = random.randint(min_id, max_id)

    # If it already exists, generate a new one (recursively)
    existing = model.query.filter_by(id=random_id).first()
    if existing:
        random_id = gen_random_id(model)

    return random_id

def clean_decimal(num):
    return '{0:.2f}'.format(num).rstrip('0').rstrip('.')

def get(source: list, key: str, val, default=None):
    def getter(x, k, d):
        if isinstance(x, dict):
            return x.get(k, d)
        return getattr(x, k, d)
    return next((x for x in source if getter(x, key, None) == val), default)


# Converts camel case string to words, e.g. "displayName" to "Display name"
def camel_to_words(text: str):
    words = ''.join(map(lambda x: x if x.islower() else " " + x, text))
    return words.lower().capitalize()
