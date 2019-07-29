import { Router, Request, Response, NextFunction } from "express";
import { azimuth, initContracts } from 'azimuth-js';
import { patp } from 'urbit-ob';
import Web3 from 'web3';

const CONTRACT_ADDRESSES = {
  DEV: {
    ecliptic: '0x56db68f29203ff44a803faa2404a44ecbb7a7480',
    azimuth: '0x863d9c2e5c4c133596cfac29d55255f0d0f86381',
    polls: '0x935452c45eda2958976a429c9733c40302995efd',
  },
  ROPSTEN: {
    ecliptic: '0x8b9f86a28921d9c705b3113a755fb979e1bd1bce',
    azimuth: '0x308ab6a6024cf198b57e008d0ac9ad0219886579',
    polls: '0xf5DA85f0d285A0F88af2388DD177A221872C8971',
  },
  MAINNET: {
    ecliptic: '0x6ac07b7c4601b5ce11de8dfe6335b871c7c4dd4d',
    azimuth: '0x223c067f8cf28ae173ee5cafea60ca44c335fecb',
    polls: '0x7fecab617c868bb5996d99d95200d2fa708218e4',
  },
};

const router = Router();
const provider = new Web3.providers.HttpProvider(process.env.WEB3_HTTP_URI as string);
const web3 = new Web3(provider);
const contracts = initContracts(web3, CONTRACT_ADDRESSES.MAINNET);

router.get("/address-points", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { address } = req.query;
    const pointNums = await azimuth.getOwnedPoints(contracts, address);
    const points = pointNums.map(patp);
    res.json({ points });
    next();
  } catch(err) {
    next(err);
  }
});

export const AzimuthController = router;
