import json
import requests
from grant.settings import EIP_712_URL

def validate_azimuth_signature(data: dict, signature: str):
    headers = {'content-type': 'application/json'}

    url = EIP_712_URL + "/message/recover"
    payload = json.dumps({"sig": signature, "data": data})
    response = requests.request("POST", url, data=payload, headers=headers)
    json_response = response.json()
    address = json_response.get('recoveredAddress')
    if not address:
        raise Exception("Authorization signature is invalid")

    url = EIP_712_URL + "/azimuth/address-points"
    params = {"address": address}
    response = requests.request("GET", url, params=params, headers=headers)
    json_response = response.json()
    points = json_response.get('points')

    return data['message']['point'] in points

# Past attempt to do it without node server.
# Not currently working due to EIP712 issues.
# https://github.com/ethereum/eth-account/issues/71
#
# from eth_account.messages import encode_structured_data
# from eth_account.account import Account
# from grant.settings import ETHEREUM_CHAIN_ID

# def validate_azimuth_signature(data: dict, signature: str):
#     from web3.auto.infura import w3
#     if not w3.isConnected():
#         raise Exception('No Infura API key configured, cannot validate Azimuth proof signature')

#     encoded = encode_structured_data(primitive=data)
#     addr = Account.recover_message(encoded, signature=signature)
