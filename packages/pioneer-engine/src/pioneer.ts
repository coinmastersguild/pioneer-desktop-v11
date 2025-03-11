/*
    KeepKey Wallet
 */
import dotenv from 'dotenv';
dotenv.config({ path: ".env" });
dotenv.config({ path: "../.env" });
dotenv.config({ path: "./../../.env" });
dotenv.config({ path: "../../../.env" });
dotenv.config({ path: "../../../../.env" });


import { WalletOption, availableChainsByWallet, ChainToNetworkId, getChainEnumValue } from '@coinmasters/types';
import { getPaths } from '@pioneer-platform/pioneer-coins';
// @ts-ignore
import { SDK } from '@coinmasters/pioneer-sdk';
import crypto from 'crypto';
import { DB } from './db';
import { IDB } from './db/types';
import { v4 as uuidv4 } from 'uuid';

const TAG = ' | KeepKey | ';
interface KeepKeyWallet {
    type: string;
    icon: string;
    chains: string[];
    wallet: any;
    status: string;
    isConnected: boolean;
}

const connectKeepKey = async function () {
    try {
    } catch (e) {
        console.error(e);
    }
};

export const onStartPioneer = async function (db?: any) {
    let tag = TAG + ' | onStartPioneer | ';
    try {

        // let chains = [
        //     'bitcoin',
        //     'ethereum',
        //     'thorchain',
        //     'bitcoincash',
        //     'litecoin',
        //     'binance',
        //     'cosmos',
        //     'dogecoin'
        // ];
        //
        // const allByCaip = chains.map(chainStr => {
        //     const chain = getChainEnumValue(chainStr);
        //     if (chain) {
        //         return ChainToNetworkId[chain];
        //     }
        //     return undefined;
        // });
        let allByCaip = [
            'eip155:1'
        ]
        console.log(tag, 'allByCaip: ', allByCaip);
        const paths = getPaths(allByCaip);

        let keepkeyApiKey = await db.getValue('keepkeyApiKey') || 'key:123';

        let queryKey = uuidv4();
        let username = "user:" + queryKey;

        //save
        db.setValue("queryKey", queryKey);
        db.setValue("username", username);

        // let spec = 'https://pioneers.dev/spec/swagger.json';
        // let wss = 'wss://pioneers.dev';

        // let spec = 'https://pioneers.dev/spec/swagger.json';
        let spec = 'https://pioneers.dev/spec/swagger.json';
        let wss = 'wss://pioneers.dev';

        //console.log(tag, 'pre: keepkeyApiKey:', keepkeyApiKey);
        //console.log(tag, 'username:', username);
        //console.log(tag, 'queryKey:', queryKey);
        //console.log(tag, 'spec:', spec);
        //console.log(tag, 'wss:', wss);

        let config: any = {
            username,
            queryKey,
            spec,
            wss,
            keepkeyApiKey,
            paths,
            blockchains: allByCaip
        };

        let app = new SDK(spec, config);
        await app.init([], {});
        //console.log(tag, 'app: ', app);

        db.setValue("keepkeyApiKey", app.keepkeyApiKey);

        return app;
    } catch (e) {
        console.error(e);
        throw e;
    }
};
