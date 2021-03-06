﻿
declare const QrCodeWithLogo

namespace BlackCat {

    var BC_scriptSrc = document.getElementsByTagName('script')[document.getElementsByTagName('script').length - 1].src;
    var BC_scriptName = BC_scriptSrc.split('/')[BC_scriptSrc.split('/').length - 1];
    var BC_path = BC_scriptSrc.replace(BC_scriptName, '');

    export class Main {

        private static isCreated: boolean;
        private static isInitex: boolean;
        static isStart: boolean;

        static readonly platName = "BlaCat"
        static platLoginType = 0; // 0，SDK；1：PAGE
        static randNumber: number; // 随机数
        static tsOffset: number; // 和服务器时间差
        static urlHead: string; // url的主机头, 当是本地访问有效，取值http: 或者https

        // 资源图标前缀路径
        static resHost = BC_path + "../"

        // SDK相关
        static appid: string;               // appid
        static appkey: string;              // appkey
        static appname: string;             // appname
        static appicon: string;             // appicon
        static appcoin: string;             // appcoin
        static applang: string;             // app默认语言
        static apprefer: string;            // app来源refer
        static app_recharge_addr: string;   // app充值地址
        private static app_trust: Array<any>; // app信任合约

        static user: User;
        static wallet: tools.wallet;
        static viewMgr: ViewMgr;
        static langMgr: LangMgr;
        static netMgr: NetMgr;


        // wallet钱包记录更新相关
        static walletLogId: number; // 当前logid最大值(walletLists获取到的)

        static appWalletLogId: number; // 应用相关的logId最大值（makeRawTransaction/makeRecharge)
        static appWalletNotifyId: number; // 应用相关的notifyId最大值
        static needGetAppNotifys: boolean; // 是否需要获取notify数据
        private static appNotifyTxids: any; // 已经通知应用的txids列表

        static platWalletLogId: number; // 平台相关logid最大值（makeRefund）
        static platWalletNotifyId: number; // 平台相关notifyid最大值（主要是退款功能）
        static needGetPlatNotifys: boolean; // 平台是否需要获取notify数据
        static platNotifyTxids: any; // 平台已经通知的txids列表（refund)


        // SDK回调相关
        private static callback: Function; // 统一sdk调用回调接口，即sdk的listener
        private static transactionCallback: Function; // 接口makeRawTransaction/makeRecharge回调函数

        private static transferCallback: Function; // 接口makeTransfer/makeGasTransfer/makeNeoTransfer回调函数

        private static transGasMultiCallback: Function; // 接口makeGasTransferMulti回调函数

        private static loginFunctionCallback: Function; // 接口login的回调函数
        private static bancorCallback: Function; // bancor合约购买/卖出回调函数
        private static buyVipCallback: Function; // 购买会员回调函数
        private static isLoginCallback: boolean;


        // main定时任务相关
        private static s_update: any;
        private static update_timeout_max: number;
        private static update_timeout_min: number;

        // 存活时间
        private static liveTime: number;
        private static liveTimeMax: number = 60 * 60 * 1000; // 1小时未操作钱包，退出钱包登录

        constructor() {
            // 初始化
            Main.netMgr = new NetMgr();
            Main.user = new User();
            Main.wallet = new tools.wallet();
            Main.viewMgr = new ViewMgr();
            Main.langMgr = new LangMgr();
            Main.randNumber = parseInt((Math.random() * 10000000).toString())
            Main.urlHead = Main.getUrlHead()
            Main.apprefer = Main.getUrlParam('refer')

            Main.reset(0)

            Main.update_timeout_max = 5000;
            Main.update_timeout_min = 300;

            Main.isCreated = false;
            Main.isStart = false;

            // NEO的随机数生成器
            Neo.Cryptography.RandomNumberGenerator.startCollectors();
        }

        // 复位
        static reset(type = 0): void {
            Main.appWalletLogId = 0;
            Main.appWalletNotifyId = 0;
            Main.appNotifyTxids = {};

            Main.platWalletLogId = 0;
            Main.platWalletNotifyId = 0;
            Main.platNotifyTxids = {};

            Main.clearTimeout()

            if (type == 0) {
                Main.needGetAppNotifys = false;
                Main.needGetPlatNotifys = false;
            }
            else {
                Main.needGetAppNotifys = true;
                Main.needGetPlatNotifys = true;
            }
        }

        // 清理定时任务
        static clearTimeout(): void {
            if (Main.s_update) {
                clearTimeout(Main.s_update)
                Main.update()
            }
        }
        

        // 获取cgas余额
        static async getCGASBalanceByAddress(id_CGAS: string, address: string) {
            return Main.getNep5BalanceByAddress(id_CGAS, address, 100000000)
        }
        // 获取cgas_old余额
        static async getCGAS_OLDBalanceByAddress(id_CGAS: string, address: string) {
            return Main.getNep5BalanceByAddress(id_CGAS, address, 100000000)
        }
        // 获取cneo余额
        static async getCNEOBalanceByAddress(id_CNEO: string, address: string) {
            return Main.getNep5BalanceByAddress(id_CNEO, address, 100000000)
        }
        static async getCNEO_OLDBalanceByAddress(id_CNEO: string, address: string) {
            return Main.getNep5BalanceByAddress(id_CNEO, address, 100000000)
        }
        // 获取bcp余额
        static async getBCPBalanceByAddress(id_BCP: string, address: string) {
            return Main.getNep5BalanceByAddress(id_BCP, address, 100000000)
        }
        // 获取bct余额
        static async getBCTBalanceByAddress(id_BCT: string, address: string) {
            return Main.getNep5BalanceByAddress(id_BCT, address, 10000)
        }
        // 获取btc余额
        static async getBTCBalanceByAddress(id_BTC: string, address: string) {
            return Main.getNep5BalanceByAddress(id_BTC, address, 100000000)
        }
        // 获取eth余额
        static async getETHBalanceByAddress(id_ETH: string, address: string) {
            return Main.getNep5BalanceByAddress(id_ETH, address, 100000000)
        }
        // 获取nep5余额信息
        static async getNep5BalanceByAddress(id_hash: string, address: string, bits: number = 100000000) {
            if (id_hash == "") {
                return 0
            }
            var params = {
                sbParamJson: ["(addr)" + address],
                sbPushString: "balanceOf",
                nnc: id_hash
            }
            try {
                let res = await Main.wallet.invokescript(params)
                if (res.err == false) {
                    let data = res.info
                    if (data["stack"] && data["stack"].length > 0) {
                        let balances = data["stack"][0]
                        let balance = new Neo.BigInteger(balances.value.hexToBytes()).toString()
                        return Number(balance) / bits
                    }
                }
            }
            catch (e) {
                console.log("[BlaCat]", '[main]', 'getNep5BalanceByAddress =>', e, 'hash =>', id_hash)
            }
            return 0
        }






        // 对外接口：SDK初始化
        init(appid: string, appkey: string, listener: Function, lang: string): void {
            Main.appid = appid;
            Main.appkey = appkey;
            Main.callback = listener;
            Main.langMgr.setType(lang);
        }
        // 对外接口：SDK初始化加强版
        initex(params, callback = null): void {

            Main.isInitex = true;

            Main.appid = params.appid;
            Main.appkey = params.appkey;
            Main.callback = params.listener;
            Main.langMgr.setType(params.lang);
            Main.netMgr.setDefault(Number(params.default_net))

            // 创建遮罩层
            Main.viewMgr.mainView.createMask()
            if (Main.isCreated == false) {
                // 选择BlaCat节点
                Main.netMgr.selectApi(() => {
                    Main.netMgr.change(() => {
                        // icon颜色
                        Main.viewMgr.iconView.showSucc()
                        // icon状态
                        Main.viewMgr.iconView.removeState()
                        // 底色
                        Main.viewMgr.mainView.changNetType()
                        // 创建定时器
                        Main.update();
                        Main.isCreated = true;

                        if (Main.viewMgr.viewConnecting.isCreated) Main.viewMgr.viewConnecting.remove()

                        var result: Result = new Result();
                        result.err = false
                        result.info = 'success'

                        // listener回调
                        Main.listenerCallback("initexRes", result)
                        // function回调
                        if (callback) callback(result)

                        // login接口调用了，表明initex执行较慢，此时执行登录验证
                        if (Main.isStart == true) {
                            // 检查登录
                            Main.validateLogin();
                        }
                    })
                })
                return
            }
        }
        // 对外接口：SDK登录
        async start(callback: Function = null) {
            Main.isStart = true;
            Main.loginFunctionCallback = callback;

            if (!Main.isInitex) {
                // 创建遮罩层
                Main.viewMgr.mainView.createMask()
                if (Main.isCreated == false) {
                    // 选择BlaCat节点
                    Main.netMgr.selectApi(() => {
                        Main.netMgr.change(() => {
                            // icon颜色
                            Main.viewMgr.iconView.showSucc()
                            // icon状态
                            Main.viewMgr.iconView.removeState()
                            // 底色
                            Main.viewMgr.mainView.changNetType()
                            // 创建定时器
                            Main.update();
                            Main.isCreated = true;
                            // 检查登录
                            Main.validateLogin();
                        })
                    })
                    return
                }
                // 检查登录
                Main.validateLogin();
            }
            else if (Main.isCreated) {
                // 如果initex初始化完成，就执行登录验证
                Main.validateLogin()
            }
        }



        // 对外接口：SDK设置语言(type: cn/en)
        setLang(type: string): void {
            if (Main.langMgr.setType(type) === true) {
                Main.viewMgr.update()
            }
        }
        // 对外接口：设置初始网络
        setDefaultNetType(type: number): void {
            Main.netMgr.setDefault(type)
        }
        // 对外接口：显示SDK界面
        showMain(): void {
            if (Main.viewMgr.mainView.div.innerHTML == "") {
                return;
            }
            if (Main.viewMgr.iconView) {
                Main.viewMgr.iconView.hidden();
            }
            Main.viewMgr.mainView.show()
        }
        // 对外接口：显示icon界面
        showIcon(): void {
            if (Main.viewMgr.mainView.div.innerHTML == "") {
                return;
            }
            Main.viewMgr.mainView.hidden()
            Main.viewMgr.change("IconView")
        }



        // 对外接口：SDK获取余额
        async getBalance(type: string = null) {
            var callback_data  = {}
            if (type) {
                callback_data[type] = Main.viewMgr.payView[type]
            }
            else {
                callback_data = {}
                PayView.tokens_coin.forEach((coins) => {
                    coins.forEach((coin) => {
                        callback_data[coin] = Main.viewMgr.payView[coin]
                    })
                })
                callback_data['sgas'] = Main.viewMgr.payView['cgas'] // 兼容之前的
            }
            Main.listenerCallback("getBalanceRes", callback_data);
            return callback_data;
        }

        // 对外接口：SDK获取用户信息
        getUserInfo() {
            Main.listenerCallback("getUserInfoRes", Main.user.info)
            return Main.user.info;
        }
        // 对外接口：SDK获取网络类型
        getNetType() {
            let type = Main.netMgr.type;
            Main.listenerCallback("getNetTypeRes", type)
            return type;
        }
        // 对外接口：SDK获取高度
        async getHeight() {
            await Main.viewMgr.payView.getHeight("nodes")
            if (tools.WWW.api_clis && tools.WWW.api_clis != "") {
                await Main.viewMgr.payView.getHeight("clis")
            }
            var callback_data = {
                node: Main.viewMgr.payView.height_nodes,
                cli: Main.viewMgr.payView.height_clis
            }
            Main.listenerCallback("getHeightRes", callback_data)
            return callback_data;
        }



        // 对外接口：SDK合约读取
        async invokescript(params) {
            var res = await Main.wallet.invokescript(params)
            var callback_data = {
                params: params,
                res: res
            }
            Main.listenerCallback("invokescriptRes", callback_data);
            return res;
        }
        // 对外接口：SDK合约交易
        async makeRawTransaction(params, callback) {

            if (Main.isWalletOpen()) {
                // 打开钱包了

                // 重置状态（非信任合约、信任合约手续费够）
                ViewTransactionConfirm.isTrustFeeLess = false

                // 检查是否有未信任合约
                let unTrust = Main.getUnTrustNnc(params);
                if (unTrust.length == 0) {
                    // 信任合约
                    if (Main.viewMgr.payView.gas > Number(Main.user.info.service_charge) ) {
                        // 手续费足够，直接操作
                        console.log("[BlaCat]", '[main]', 'makeRawTransaction, trust nnc ...')
                        this._makeRawTransaction(params, "0", Main.user.info.service_charge, callback)
                        return
                    }
                    else {
                        // 信任合约，不够手续费
                        ViewTransactionConfirm.isTrustFeeLess = true
                    }
                }

                if (Main.viewMgr.mainView.isHidden()) {
                    // 如果mainView隐藏，显示出来
                    Main.viewMgr.mainView.show()
                    Main.viewMgr.iconView.hidden()
                }

                // 记录回调，锁定状态，当前不接收makerawtransaction请求了
                if (Main.transactionCallback) {
                    // 已经有请求在处理，返回
                    // Main.showErrMsg("请先确认或者取消上个交易请求再执行")
                    Main.showErrMsg("main_wait_for_last_tran")
                    return;
                }
                Main.transactionCallback = callback;

                // 打开确认页

                var list = new walletLists();
                list.params = JSON.stringify(params);
                list.wallet = Main.user.info.wallet;
                list.icon = Main.appicon;
                list.name = Main.appname;
                list.ctm = Math.round(new Date().getTime() / 1000).toString();
                list.cnts = "0"
                list.type = "5"
                list.state = "0"

                ViewTransactionConfirm.list = list;
                ViewTransactionConfirm.refer = ""
                ViewTransactionConfirm.callback_params = params

                ViewTransactionConfirm.callback = async (params, trust, net_fee) => {
                    console.log("[BlaCat]", '[main]', 'makeRawTransaction交易确认..')

                    Main.viewMgr.change("ViewLoading")

                    // var net_fee = "0.00000001" // for test
                    // var net_fee = ViewTransactionConfirm.net_fee

                    setTimeout(async () => {
                        try {
                            await this._makeRawTransaction(params, trust, net_fee, Main.transactionCallback)
                        }
                        catch (e) {
                            console.log("[BlaCat]", '[main]', 'makeRawTransaction, _makeRawTransaction(params, trust, net_fee, Main.transactionCallback) error, params => ', params, 'trust =>', trust, 'net_fee =>', net_fee, 'error => ', e.toString())
                        }
                        Main.viewMgr.viewLoading.remove()
                    }, 300);
                }
                ViewTransactionConfirm.callback_cancel = () => {
                    console.log("[BlaCat]", '[main]', 'makeRawTransaction交易取消..')

                    var res = new Result();
                    res.err = true;
                    res.info = 'cancel';
                    if (Main.transactionCallback) Main.transactionCallback(res);
                    Main.transactionCallback = null;
                    // listener回调
                    var callback_data = {
                        params: params,
                        res: res
                    }
                    Main.listenerCallback("makeRawTransactionRes", callback_data);
                }
                Main.viewMgr.change("ViewTransactionConfirm")

            } else {
                // 未打开钱包

                if (Main.viewMgr.mainView.isHidden()) {
                    // 如果mainView隐藏，显示出来
                    Main.viewMgr.mainView.show()
                    Main.viewMgr.iconView.hidden()
                }

                ViewWalletOpen.refer = ""
                ViewWalletOpen.callback_params = params;
                ViewWalletOpen.callback_callback = callback;
                ViewWalletOpen.callback = (params, callback) => {
                    this.makeRawTransaction(params, callback)
                }
                ViewWalletOpen.callback_cancel = (params, callback) => {
                    var res: Result = new Result();
                    res.err = true;
                    res.info = 'cancel'

                    var callback_data = {
                        params: params,
                        res: res
                    }
                    Main.listenerCallback("makeRawTransactionRes", callback_data);
                    callback(res)
                }
                Main.viewMgr.change("ViewWalletOpen")
            }
        }
        // 对外接口：合约交易的私有函数
        private async _makeRawTransaction(params, trust: string = "0", net_fee: string, callback = null) {
            // 合约交易，延长钱包退出时间
            Main.setLiveTime()

            try {
                var res = await Main.wallet.makeRawTransaction(params, trust, net_fee);
            }
            catch (e) {
                var res = new Result()
                res.err = true
                res.info = e.toString()

                console.log("[BlaCat]", '[main]', '_makeRawTransaction, Main.wallet.makeRawTransaction(params, trust, net_fee) error, params => ', params, 'trust =>', trust, 'net_fee =>', net_fee, 'e => ', e.toString())
            }

            // 重新获取钱包记录
            await Main.viewMgr.payView.doGetWalletLists(1)

            // listener回调
            var callback_data = {
                params: params,
                res: res
            }
            Main.listenerCallback("makeRawTransactionRes", callback_data);
            // function回调
            if (callback) {
                try {
                    callback(res);
                }
                catch(e) {
                    console.log("[BlaCat]", '[main]', '_makeRawTransaction, app callback error! Main.wallet.makeRawTransaction(params, trust, net_fee) error, params => ', params, 'trust =>', trust, 'net_fee =>', net_fee, 'e => ', e.toString())
                }
            }
            Main.transactionCallback = null;
        }
        // 对外接口：充值
        async makeRecharge(params, callback) {

            if (Main.viewMgr.mainView.isHidden()) {
                // 如果mainView隐藏，显示出来
                Main.viewMgr.mainView.show()
                Main.viewMgr.iconView.hidden()
            }

            // 判断后台有没有配置地址，没有配置返回错误
            if (!Main.app_recharge_addr) {
                // Main.showErrMsg("应用没有配置收款钱包地址，无法充值")
                Main.showErrMsg("main_no_app_wallet")

                var res = new Result()
                res.err = true
                res.info = "app_wallet_not_config"

                // listener回调
                var callback_data = {
                    params: params,
                    res: res
                }
                Main.listenerCallback("makeRechargeRes", callback_data);
                // function回调
                callback(res);

                return;
            }

            // 判断充值货币类型
            var coin_type = "cgas";
            if (params.hasOwnProperty('type')) {
                if (Main.in_array(params.type, ["cgas", "cneo", "bcp", "bct", "btc", "eth"]) == false) {
                    var res = new Result()
                    res.err = true
                    res.info = "type_error"

                    // listener回调
                    var callback_data = {
                        params: params,
                        res: res
                    }
                    Main.listenerCallback("makeRechargeRes", callback_data);
                    // function回调
                    callback(res);

                    return
                }
            }
            else {
                params['type'] = coin_type;
            }

            // 判断余额
            if (Main.viewMgr.payView && Main.viewMgr.payView[params['type']] < Number(params.count)) {
                Main.showErrMsg('pay_not_enough_money')

                var res = new Result()
                res.err = true
                res.info = "not_enough_" + params['type']

                // listener回调
                var callback_data = {
                    params: params,
                    res: res
                }
                Main.listenerCallback("makeRechargeRes", callback_data);
                // function回调
                callback(res);

                return
            }

            if (Main.isWalletOpen()) {
                // 打开钱包了

                // 记录回调，锁定状态，当前不接收makerawtransaction请求了
                if (Main.transactionCallback) {
                    // 已经有请求在处理，返回
                    // Main.showErrMsg("请先确认或者取消上个交易请求再执行")
                    Main.showErrMsg(("main_wait_for_last_tran"))

                    var res = new Result()
                    res.err = true
                    res.info = "wait_for_last_tran"

                    // listener回调
                    var callback_data = {
                        params: params,
                        res: res
                    }
                    Main.listenerCallback("makeRechargeRes", callback_data);

                    // function回调
                    callback(res);

                    return;
                }
                Main.transactionCallback = callback;

                // 打开确认页

                var list = new walletLists();

                if (!params.hasOwnProperty("nnc")) {
                    params['nnc'] = tools.CoinTool["id_" + params['type'].toUpperCase()];
                }
                
                if (!params.hasOwnProperty("sbParamJson")) params['sbParamJson'] = ["(address)" + Main.user.info.wallet, "(address)" + Main.app_recharge_addr, "(integer)" + params.count * 100000000]
                if (!params.hasOwnProperty("sbPushString")) params['sbPushString'] = "transfer"

                list.params = JSON.stringify(params);
                list.wallet = Main.user.info.wallet;
                list.icon = Main.appicon;
                list.name = Main.appname;
                list.ctm = Math.round(new Date().getTime() / 1000).toString();
                list.cnts = params.count.toString();
                list.type = "3";
                list.type_detail = PayTransferView.log_type_detail[params['type']]

                ViewTransactionConfirm.isTrustFeeLess = false
                
                ViewTransactionConfirm.list = list;
                ViewTransactionConfirm.refer = ""
                ViewTransactionConfirm.callback_params = params;

                ViewTransactionConfirm.callback = async (params, trust, net_fee) => {
                    console.log("[BlaCat]", '[main]', 'makeRecharge交易确认..')

                    Main.viewMgr.change("ViewLoading")

                    setTimeout(async () => {
                        try {
                            var res = await Main.wallet.makeRecharge(params, trust, net_fee);
                        }
                        catch (e) {
                            var res = new Result()
                            res.err = true
                            res.info = e.toString()

                            console.log("[BlaCat]", '[main]', 'makeRecharge, Main.wallet.makeRecharge(params) error, params => ', params, 'e => ', e.toString())
                        }

                        // 重新获取钱包记录
                        await Main.viewMgr.payView.doGetWalletLists(1)

                        Main.viewMgr.viewLoading.remove()

                        // listener回调
                        var callback_data = {
                            params: params,
                            res: res
                        }
                        Main.listenerCallback("makeRechargeRes", callback_data);

                        // function回调
                        if (Main.transactionCallback) {
                            try {
                                Main.transactionCallback(res);
                            }
                            catch (e) {
                                console.log("[BlaCat]", '[main]', 'makeRecharge, app callback error! Main.wallet.makeRecharge(params) error, params => ', params, 'e => ', e.toString())
                            }
                        }
                        Main.transactionCallback = null;

                    }, 300);

                }
                ViewTransactionConfirm.callback_cancel = () => {
                    console.log("[BlaCat]", '[main]', 'makeRecharge交易取消..')
                    var res = new Result();
                    res.err = true;
                    res.info = 'cancel';

                    // listener回调
                    var callback_data = {
                        params: params,
                        res: res
                    }
                    Main.listenerCallback("makeRechargeRes", callback_data);
                    // function回调
                    if (Main.transactionCallback) {
                        try {
                            Main.transactionCallback(res);
                        }
                        catch (e) {
                            console.log("[BlaCat]", '[main]', 'makeRecharge, app callback error! Main.wallet.makeRecharge(params) error, params => ', params, 'e => ', e.toString())
                        }
                        
                    }
                    Main.transactionCallback = null;
                }
                Main.viewMgr.change("ViewTransactionConfirm")

            } else {
                // 未打开钱包
                ViewWalletOpen.refer = ""
                ViewWalletOpen.callback_params = params;
                ViewWalletOpen.callback_callback = callback;
                ViewWalletOpen.callback = (params, callback) => {
                    this.makeRecharge(params, callback)
                }
                ViewWalletOpen.callback_cancel = (params, callback) => {
                    var res: Result = new Result();
                    res.err = true;
                    res.info = 'cancel'

                    var callback_data = {
                        params: params,
                        res: res
                    }
                    Main.listenerCallback("makeRechargeRes", callback_data);
                    callback(res)
                }
                Main.viewMgr.change("ViewWalletOpen")
            }
        }
        // 对外接口：转账，支持（gas/cgas/neo/cneo/bcp/bct/btc/eth)
        // 兼容老接口：makeGasTransfer，makeNeoTransfer, params带上参数type_first = 1
        async makeTransfer(params, callback = null) {
            var coin_type = params.type
            var coin_type_first = ""
            if (params.hasOwnProperty('type_first') && params['type_first'] == "1") {
                coin_type_first = coin_type.charAt(0).toUpperCase() + coin_type.slice(1)
            }
            var coin_type_upper = coin_type.toUpperCase()

            // 类型检查
            if (!Main.viewMgr.payView.hasOwnProperty(coin_type)) {
                var res = new Result()
                res.err = true
                res.info = "unsupport type " + coin_type

                // listener回调
                var callback_data = {
                    params: params,
                    res: res
                }
                Main.listenerCallback("make"+coin_type_first+"TransferRes", callback_data);
                // function回调
                callback(res);

                return
            }
            
            if (Main.viewMgr.mainView.isHidden()) {
                // 如果mainView隐藏，显示出来
                Main.viewMgr.mainView.show()
                Main.viewMgr.iconView.hidden()
            }

            // 判断余额
            if (Main.viewMgr.payView && Main.viewMgr.payView[coin_type] < Number(params.count)) {
                Main.showErrMsg('pay_not_enough_money')

                var res = new Result()
                res.err = true
                res.info = "not_enough_" + coin_type

                // listener回调
                var callback_data = {
                    params: params,
                    res: res
                }
                Main.listenerCallback("make"+coin_type_first+"TransferRes", callback_data);
                // function回调
                callback(res);

                return
            }

            if (Main.isWalletOpen()) {
                // 打开钱包了
                // 记录回调，锁定状态，当前不接收makeTransfer请求了
                if (Main.transferCallback) {
                    // 已经有请求在处理，返回
                    // Main.showErrMsg("请先确认或者取消上个交易请求再执行")
                    Main.showErrMsg(("main_wait_for_last_tran"))

                    var res = new Result()
                    res.err = true
                    res.info = "wait_for_last_tran"

                    // listener回调
                    var callback_data = {
                        params: params,
                        res: res
                    }
                    Main.listenerCallback("make"+coin_type_first+"TransferRes", callback_data);

                    // function回调
                    callback(res);

                    return;
                }
                Main.transferCallback = callback;

                // 打开确认页

                var list = new walletLists();

                params['nnc'] = tools.CoinTool['id_' + coin_type_upper]

                list.params = JSON.stringify(params);
                list.wallet = Main.user.info.wallet;
                list.icon = Main.appicon;
                list.name = Main.appname;
                list.ctm = Math.round(new Date().getTime() / 1000).toString();
                list.cnts = params.count.toString();
                list.type = "6";
                list.type_detail = PayTransferView.log_type_detail[coin_type]

                ViewTransferConfirm.list = list;
                ViewTransferConfirm.refer = ""
                ViewTransferConfirm.callback_params = params;

                ViewTransferConfirm.callback = async (params, net_fee) => {
                    console.log("[BlaCat]", '[main]', 'makeTransfer交易确认..')

                    Main.viewMgr.change("ViewLoading")

                    // var net_fee = "0.00000001" // for test
                    // var net_fee = ViewTransferConfirm.net_fee

                    setTimeout(async () => {
                        try {
                            if (Main.in_array(coin_type, ["gas", "neo"])) {
                                // utxo
                                var res: Result = await tools.CoinTool.rawTransaction(params.toaddr, tools.CoinTool["id_" + coin_type_upper], params.count, Neo.Fixed8.fromNumber(Number(net_fee)));
                            }
                            else {
                                // nep5
                                var res: Result = await tools.CoinTool.nep5Transaction(Main.user.info.wallet, params.toaddr, tools.CoinTool["id_" + coin_type_upper], params.count, net_fee);
                            }
                            if (res.err == false) {
                                params.sbPushString = "transfer"
                                // 成功，上报
                                var logRes = await ApiTool.addUserWalletLogs(
                                    Main.user.info.uid,
                                    Main.user.info.token,
                                    res.info,
                                    Main.appid,
                                    params.count.toString(),
                                    "6",
                                    JSON.stringify(params),
                                    Main.netMgr.type,
                                    "0",
                                    net_fee,
                                    PayTransferView.log_type_detail[coin_type]
                                );
                                Main.appWalletLogId = logRes.data;
                                // 重新获取钱包记录
                                await Main.viewMgr.payView.doGetWalletLists(1)
                            }
                        }
                        catch (e) {
                            var res: Result = new Result();
                            res.err = true;
                            res.info = 'make trans err'
                            res['ext'] = e.toString()

                            console.log("[BlaCat]", '[main]', 'make'+coin_type_first+'Transfer, ViewTransferConfirm.callback error, params => ', params, 'e => ', e.toString())
                        }

                        
                        Main.viewMgr.viewLoading.remove()

                        // listener回调
                        var callback_data = {
                            params: params,
                            res: res
                        }
                        Main.listenerCallback("make"+coin_type_first+"TransferRes", callback_data);

                        // function回调
                        if (Main.transferCallback) {
                            try {
                                Main.transferCallback(res);
                            }
                            catch (e) {
                                console.log("[BlaCat]", '[main]', 'make'+coin_type_first+'Transfer, app callback error! ViewTransferConfirm.callback error, params => ', params, 'e => ', e.toString())
                            }
                        }
                        Main.transferCallback = null;

                    }, 300);
                }
                ViewTransferConfirm.callback_cancel = () => {
                    console.log("[BlaCat]", '[main]', 'make'+coin_type_first+'Transfer交易取消..')

                    var res = new Result();
                    res.err = true;
                    res.info = 'cancel';

                    // listener回调
                    var callback_data = {
                        params: params,
                        res: res
                    }
                    Main.listenerCallback("make"+coin_type_first+"TransferRes", callback_data);

                    if (Main.transferCallback) {
                        try {
                            Main.transferCallback(res);
                        }
                        catch(e) {

                        }
                    }
                    Main.transferCallback = null;
                }
                Main.viewMgr.change("ViewTransferConfirm")

            } else {
                // 未打开钱包
                ViewWalletOpen.refer = ""
                ViewWalletOpen.callback_params = params;
                ViewWalletOpen.callback_callback = callback;
                ViewWalletOpen.callback = (params, callback) => {
                    this["make"+coin_type_first+"Transfer"](params, callback)
                }
                ViewWalletOpen.callback_cancel = (params, callback) => {
                    var res: Result = new Result();
                    res.err = true;
                    res.info = 'cancel'

                    var callback_data = {
                        params: params,
                        res: res
                    }
                    Main.listenerCallback("make"+coin_type_first+"TransferRes", callback_data);
                    callback(res)
                }
                Main.viewMgr.change("ViewWalletOpen")
            }
        }
        // 对外接口：gas转账
        async makeGasTransfer(params, callback = null) {
            params['type'] = 'gas'
            params['type_first'] = "1"
            return await this.makeTransfer(params, callback)
        }
        // 对外接口：Neo转账
        async makeNeoTransfer(params, callback = null) {
            params['type'] = "neo"
            params['type_first'] = "1"
            return await this.makeTransfer(params, callback)
        }
        
        // 对外接口：gas转账（批量）
        async makeGasTransferMulti(params, callback = null) {
            if (Main.viewMgr.mainView.isHidden()) {
                // 如果mainView隐藏，显示出来
                Main.viewMgr.mainView.show()
                Main.viewMgr.iconView.hidden()
            }

            // 计算交易金额
            var _count: number = 0;
            for (let i = 0; i < params.length; i++) {
                // _count += Number(params[i].count)
                _count = floatNum.plus(_count, Number(params[i].count))
            }

            params[0]['nnc'] = tools.CoinTool.id_GAS

            // 判定余额
            if (Main.viewMgr.payView && Main.viewMgr.payView.gas < Number(_count)) {
                Main.showErrMsg('pay_not_enough_money')

                var res = new Result()
                res.err = true
                res.info = "not_enough_gas"

                // listener回调
                var callback_data = {
                    params: params,
                    res: res
                }
                Main.listenerCallback("makeGasTransferMultiRes", callback_data);

                // function回调
                callback(res);

                return
            }

            if (Main.isWalletOpen()) {
                // 打开钱包了
                // 记录回调，锁定状态，当前不接收makeGasTransferMulti请求了
                if (Main.transGasMultiCallback) {
                    // 已经有请求在处理，返回
                    // Main.showErrMsg("请先确认或者取消上个交易请求再执行")
                    Main.showErrMsg(("main_wait_for_last_tran"))
                    return;
                }
                Main.transGasMultiCallback = callback;

                // 打开确认页

                var list = new walletLists();

                list.params = JSON.stringify(params);
                list.wallet = Main.user.info.wallet;
                list.icon = Main.appicon;
                list.name = Main.appname;
                list.ctm = Math.round(new Date().getTime() / 1000).toString();
                list.cnts = _count.toString(); // params.count.toString();
                list.type = "6";
                list.type_detail = PayTransferView.log_type_detail['gas']

                ViewTransferConfirm.list = list;
                ViewTransferConfirm.refer = ""
                ViewTransferConfirm.callback_params = params;

                ViewTransferConfirm.callback = async (params, net_fee) => {
                    console.log("[BlaCat]", '[main]', 'makeGasTransferMulti交易确认..')

                    Main.viewMgr.change("ViewLoading")

                    // var net_fee = "0.00000001" // for test

                    setTimeout(async () => {
                        try {
                            var res: Result = await tools.CoinTool.rawTransactionMulti(params, tools.CoinTool.id_GAS, Neo.Fixed8.fromNumber(Number(net_fee)));
                            if (res.err == false) {
                                params.map(item => (item.sbPushString = "transfer"))
                                // 成功，上报
                                await ApiTool.addUserWalletLogs(
                                    Main.user.info.uid,
                                    Main.user.info.token,
                                    res.info,
                                    Main.appid,
                                    _count.toString(),
                                    "6",
                                    JSON.stringify(params),
                                    Main.netMgr.type,
                                    "0",
                                    net_fee
                                );
                                // 重新获取钱包记录
                                await Main.viewMgr.payView.doGetWalletLists(1)
                            }
                        }
                        catch (e) {
                            var res: Result = new Result();
                            res.err = true;
                            res.info = 'make trans err'
                            res['ext'] = e.toString()

                            console.log("[BlaCat]", '[main]', 'makeGasTransferMulti, ViewTransferConfirm.callback error, params => ', params, 'e => ', e.toString())
                        }

                        Main.viewMgr.viewLoading.remove()

                        // listener回调
                        var callback_data = {
                            params: params,
                            res: res
                        }
                        Main.listenerCallback("makeGasTransferMultiRes", callback_data);

                        // function回调
                        if (Main.transGasMultiCallback) {
                            try {
                                Main.transGasMultiCallback(res);
                            }
                            catch (e) {
                                console.log("[BlaCat]", '[main]', 'makeGasTransferMulti, app callback error! ViewTransferConfirm.callback error, params => ', params, 'e => ', e.toString())
                            }
                        }
                        Main.transGasMultiCallback = null;

                    }, 300);
                }
                ViewTransferConfirm.callback_cancel = () => {
                    console.log("[BlaCat]", '[main]', 'makeGasTransfer交易取消..')

                    var res = new Result();
                    res.err = true;
                    res.info = 'cancel';

                    if (Main.transGasMultiCallback) {
                        Main.transGasMultiCallback(res);
                        Main.transGasMultiCallback = null;
                    }
                    // listener回调
                    var callback_data = {
                        params: params,
                        res: res
                    }
                    Main.listenerCallback("makeRechargeRes", callback_data);
                }
                Main.viewMgr.change("ViewTransferConfirm")

            } else {
                // 未打开钱包
                ViewWalletOpen.refer = ""
                ViewWalletOpen.callback_params = params;
                ViewWalletOpen.callback_callback = callback;
                ViewWalletOpen.callback = (params, callback) => {
                    this.makeGasTransferMulti(params, callback)
                }
                ViewWalletOpen.callback_cancel = (params, callback) => {
                    var res: Result = new Result();
                    res.err = true;
                    res.info = 'cancel'

                    var callback_data = {
                        params: params,
                        res: res
                    }
                    Main.listenerCallback("makeGasTransferMultiRes", callback_data);
                    callback(res)
                }
                Main.viewMgr.change("ViewWalletOpen")
            }
        }
        // 对外接口：SDK客户端合约确认回调
        async confirmAppNotify(params) {
            var data_res = await ApiTool.walletNotify(Main.user.info.uid, Main.user.info.token, params.txid, Main.netMgr.type);
            var res = new Result();
            if (data_res.r) {
                res.err = false;
                res.info = data_res.data
                var callback_data = {
                    params: params,
                    res: res
                }
                Main.listenerCallback("confirmAppNotifyRes", callback_data);
                // 删除notiyTxids里面的记录
                delete Main.appNotifyTxids[params.txid];
            }
            else {
                res.err = true;
                res.info = data_res.errCode;
                var callback_data = {
                    params: params,
                    res: res
                }
                Main.listenerCallback("confirmAppNotifyRes", callback_data);
            }
            return res;
        }
        // 对外接口：bancor交易
        async bancor(params, callback = null) {
            // 第一步，执行转账bcp到bancor合约
            if (tools.CoinTool.id_bancor != "") {
                if (Main.isWalletOpen()) {
                    // 打开钱包了

                    // 都是8位精度，四舍五入
                    var size = 100000000
                    params.count = floatNum.divide(Math.round(Number(params.count) * size), size).toString()
    
                    // 重置状态（非信任合约、信任合约手续费够）
                    ViewTransactionConfirm.isTrustFeeLess = false

                    var type_num = Number(params.type)
                    switch (type_num) {
                        case 1:
                            // 购买代币，消耗BCP，BCP就是合约地址
                            params['nnc'] = tools.CoinTool.id_BCP
                            break;
                        case 2:
                            // 退回BCP，消耗代币，nnc就是代币合约地址
                            params['nnc'] = params.asset
                            break;
                        default:
                            var res: Result = new Result();
                            res.err = true;
                            res.info = 'type error'
        
                            var callback_data = {
                                params: params,
                                res: res
                            }
                            Main.listenerCallback("bancorRes", callback_data);
                            callback(res)
                            return
                    }
                    // 合约方法
                    params['sbPushString'] = "transfer"
                    // 合约参数，默认所有币种精度8位
                    var scriptaddress = tools.CoinTool.id_bancor.hexToBytes().reverse();
                    var bancorAddr = ThinNeo.Helper.GetAddressFromScriptHash( scriptaddress )
                    params['sbParamJson'] = "(addr)" + Main.user.info.wallet + ",(address)" + bancorAddr + ",(integer)" + (params.count * size).toString()
                    params['bancorAddr'] = bancorAddr
    
                    // 检查是否有未信任合约
                    let unTrust = Main.getUnTrustNnc(params);
                    if (unTrust.length == 0) {
                        // 信任合约
                        if (Main.viewMgr.payView.gas > Number(Main.user.info.service_charge) ) {
                            // 手续费足够，直接操作
                            console.log("[BlaCat]", '[main]', 'bancor, trust nnc ...')
                            this._bancor(params, "0", Main.user.info.service_charge, callback)
                            return
                        }
                        else {
                            // 信任合约，不够手续费
                            ViewTransactionConfirm.isTrustFeeLess = true
                        }
                    }
    
                    if (Main.viewMgr.mainView.isHidden()) {
                        // 如果mainView隐藏，显示出来
                        Main.viewMgr.mainView.show()
                        Main.viewMgr.iconView.hidden()
                    }
    
                    // 记录回调，锁定状态，当前不接收makerawtransaction请求了
                    if (Main.bancorCallback) {
                        // 已经有请求在处理，返回
                        // Main.showErrMsg("请先确认或者取消上个交易请求再执行")
                        Main.showErrMsg("main_wait_for_last_tran")
                        return;
                    }
                    Main.bancorCallback = callback;
    
                    // 打开确认页
    
                    var list = new walletLists();
                    list.params = JSON.stringify(params);
                    list.wallet = Main.user.info.wallet;
                    list.icon = Main.appicon;
                    list.name = Main.appname;
                    list.ctm = Math.round(new Date().getTime() / 1000).toString();
                    list.cnts = "0"
                    list.type = "14"
                    
                    ViewTransactionConfirm.list = list;
                    ViewTransactionConfirm.refer = ""
                    ViewTransactionConfirm.callback_params = params
    
                    ViewTransactionConfirm.callback = async (params, trust, net_fee) => {
                        console.log("[BlaCat]", '[main]', 'bancor交易确认..')
    
                        Main.viewMgr.change("ViewLoading")
    
                        // var net_fee = "0.00000001" // for test
                        // var net_fee = ViewTransactionConfirm.net_fee
    
                        setTimeout(async () => {
                            try {
                                await this._bancor(params, trust, net_fee, Main.bancorCallback)
                            }
                            catch (e) {
                                console.log("[BlaCat]", '[main]', 'bancor, _bancor(params, trust, net_fee, Main.bancorCallback) error, params => ', params, 'trust =>', trust, 'net_fee =>', net_fee, 'Main.bancorCallback =>', Main.bancorCallback, 'error => ', e.toString())
                            }
                            Main.viewMgr.viewLoading.remove()
                        }, 300);
                    }
                    ViewTransactionConfirm.callback_cancel = () => {
                        console.log("[BlaCat]", '[main]', 'bancor交易取消..')
    
                        var res = new Result();
                        res.err = true;
                        res.info = 'cancel';
                        if (Main.bancorCallback) Main.bancorCallback(res);
                        Main.bancorCallback = null;
                        // listener回调
                        var callback_data = {
                            params: params,
                            res: res
                        }
                        Main.listenerCallback("bancorRes", callback_data);
                        Main.bancorCallback = null;
                    }
                    Main.viewMgr.change("ViewTransactionConfirm")
    
                } else {
                    // 未打开钱包
    
                    if (Main.viewMgr.mainView.isHidden()) {
                        // 如果mainView隐藏，显示出来
                        Main.viewMgr.mainView.show()
                        Main.viewMgr.iconView.hidden()
                    }
    
                    ViewWalletOpen.refer = ""
                    ViewWalletOpen.callback_params = params;
                    ViewWalletOpen.callback_callback = callback;
                    ViewWalletOpen.callback = (params, callback) => {
                        this.bancor(params, callback)
                    }
                    ViewWalletOpen.callback_cancel = (params, callback) => {
                        var res: Result = new Result();
                        res.err = true;
                        res.info = 'cancel'
    
                        var callback_data = {
                            params: params,
                            res: res
                        }
                        Main.listenerCallback("bancorRes", callback_data);
                        callback(res)
                    }
                    Main.viewMgr.change("ViewWalletOpen")
                }
            }
            else {
                var res: Result = new Result();
                res.err = true;
                res.info = 'bancor not ready'

                var callback_data = {
                    params: params,
                    res: res
                }
                Main.listenerCallback("bancorRes", callback_data);
                callback(res)
            }
        }
        // 对外接口：bancor交易的私有函数
        private async _bancor(params, trust: string = "0", net_fee: string, callback = null) {
            // 合约交易，延长钱包退出时间
            Main.setLiveTime()

            try {
                // 购买代币，消耗BCP
                // 退回BCP，消耗代币
                var res = await tools.CoinTool.nep5Transaction(Main.user.info.wallet, params.bancorAddr, params.nnc, params.count, net_fee)

                if (res) {
                    console.log("[BlaCat]", '[main]', '_bancor转账结果 => ', res)
                    if (res.err == false) {
                        // 成功，上报
                        await ApiTool.addUserWalletLogs(
                            Main.user.info.uid,
                            Main.user.info.token,
                            res.info,
                            "0",
                            params.count,
                            "14",
                            JSON.stringify(params),
                            //'{"sbPushString":"transfer", "toaddr":"' + bancorAddr + '", "count": "' + params.count + '"}',
                            Main.netMgr.type,
                            trust,
                            net_fee
                        );
                    }
                }
            }
            catch (e) {
                var res = new Result()
                res.err = true
                res.info = e.toString()

                console.log("[BlaCat]", '[main]', '_bancor, tools.CoinTool.nep5TransactionMain.user.info.wallet, bancorAddr, params.asset, params.count, net_fee) error, params => ', params, 'trust =>', trust, 'net_fee =>', net_fee, 'e => ', e.toString())
            }

            
            // 重新获取钱包记录
            await Main.viewMgr.payView.doGetWalletLists(1)
            // 开启getNotifyPlat
            Main.needGetPlatNotifys = true
            Main.getPlatNotifys()

            // listener回调
            var callback_data = {
                params: params,
                res: res
            }
            Main.listenerCallback("bancorRes", callback_data);

            // function回调
            if (callback) {
                try {
                    callback(res);
                }
                catch (e) {
                    console.log("[BlaCat]", '[main]', '_bancor, app callback error! tools.CoinTool.nep5TransactionMain.user.info.wallet, bancorAddr, params.asset, params.count, net_fee) error, params => ', params, 'trust =>', trust, 'net_fee =>', net_fee, 'e => ', e.toString())
                }
            }
            Main.bancorCallback = null;
        }
        // 购买会员
        async buyVip(params, callback = null) {
            if (Main.isWalletOpen()) {
                // 打开钱包了
                // params = { pay_way: 支付币种(BCT/BCP)， month: 会员月份, invite: 邀请者 }

                params.pay_way = params.pay_way.toUpperCase()
                params.month = params.month.toString()

                var nnc: string = ModifyVipView.getPayNnc(params.pay_way)
                var target: string = ModifyVipView.getPayTarget()
                var total = ModifyVipView.getPayAmount(params.pay_way, params.month)

                // bcp是8位精度，四舍五入；bct4位
                var size = 100000000
                if (params.pay_way == "BCT") {
                    size = 10000
                }
                // var total = floatNum.divide(Math.round(Number(params.count) * size), size)

                var log_sbParamJson = "(addr)" + Main.user.info.wallet + ",(address)" + target + ",(integer)" + (total * size).toString()

                // params添加
                params['uid'] = Main.user.info.uid,
                params['nnc'] = nnc
                params['sbPushString'] = "transfer"
                params['sbParamJson'] = log_sbParamJson
                params['toaddr'] = target
                params['total'] = total.toString()
                params['refer'] = "1"

                // 重置状态（非信任合约、信任合约手续费够）
                ViewTransactionConfirm.isTrustFeeLess = false

                // 检查是否有未信任合约
                let unTrust = Main.getUnTrustNnc(params);
                if (unTrust.length == 0) {
                    // 信任合约
                    if (Main.viewMgr.payView.gas > Number(Main.user.info.service_charge) ) {
                        // 手续费足够，直接操作
                        console.log("[BlaCat]", '[main]', 'bancor, trust nnc ...')
                        this._buyVip(params, "0", Main.user.info.service_charge, callback)
                        return
                    }
                    else {
                        // 信任合约，不够手续费
                        ViewTransactionConfirm.isTrustFeeLess = true
                    }
                }

                if (Main.viewMgr.mainView.isHidden()) {
                    // 如果mainView隐藏，显示出来
                    Main.viewMgr.mainView.show()
                    Main.viewMgr.iconView.hidden()
                }

                // 记录回调，锁定状态，当前不接收makerawtransaction请求了
                if (Main.buyVipCallback) {
                    // 已经有请求在处理，返回
                    // Main.showErrMsg("请先确认或者取消上个交易请求再执行")
                    Main.showErrMsg("main_wait_for_last_tran")
                    return;
                }
                Main.buyVipCallback = callback;

                // 打开确认页

                var list = new walletLists();
                list.params = JSON.stringify(params);
                list.wallet = Main.user.info.wallet;
                list.g_id = "0"
                list.ctm = Math.round(new Date().getTime() / 1000).toString();
                list.cnts = total.toString()
                list.type = "16"
                list.type_detail = PayTransferView.log_type_detail[params.pay_way.toLowerCase()]
                
                ViewTransactionConfirm.list = list;
                ViewTransactionConfirm.refer = ""
                ViewTransactionConfirm.callback_params = params

                ViewTransactionConfirm.callback = async (params, trust, net_fee) => {
                    console.log("[BlaCat]", '[main]', 'buyVip交易确认..')

                    // Main.viewMgr.change("ViewLoading")

                    // var net_fee = "0.00000001" // for test
                    // var net_fee = ViewTransactionConfirm.net_fee

                    // setTimeout(async () => {
                    //     try {
                    //         await this._buyVip(params, trust, net_fee, Main.buyVipCallback)
                    //     }
                    //     catch (e) {
                    //         console.log("[BlaCat]", '[main]', 'buyVip, _buyVip(params, trust, net_fee, Main.bancorCallback) error, params => ', params, 'trust =>', trust, 'net_fee =>', net_fee, 'Main.buyVipCallback =>', Main.buyVipCallback, 'error => ', e.toString())
                    //         Main.buyVipCallback = null
                    //     }
                    //     Main.viewMgr.viewLoading.remove()
                    // }, 300);
                    await this._buyVip(params, trust, net_fee, Main.buyVipCallback)
                }
                ViewTransactionConfirm.callback_cancel = () => {
                    console.log("[BlaCat]", '[main]', 'buyVip交易取消..')

                    var res = new Result();
                    res.err = true;
                    res.info = 'cancel';
                    if (Main.buyVipCallback) Main.buyVipCallback(res);
                    Main.buyVipCallback = null;

                    // listener回调
                    var callback_data = {
                        params: params,
                        res: res
                    }
                    Main.listenerCallback("buyVipRes", callback_data);
                }
                Main.viewMgr.change("ViewTransactionConfirm")

            } else {
                // 未打开钱包

                if (Main.viewMgr.mainView.isHidden()) {
                    // 如果mainView隐藏，显示出来
                    Main.viewMgr.mainView.show()
                    Main.viewMgr.iconView.hidden()
                }

                ViewWalletOpen.refer = ""
                ViewWalletOpen.callback_params = params;
                ViewWalletOpen.callback_callback = callback;
                ViewWalletOpen.callback = (params, callback) => {
                    this.buyVip(params, callback)
                }
                ViewWalletOpen.callback_cancel = (params, callback) => {
                    var res: Result = new Result();
                    res.err = true;
                    res.info = 'cancel'

                    var callback_data = {
                        params: params,
                        res: res
                    }
                    Main.listenerCallback("buyVipRes", callback_data);
                    callback(res)
                }
                Main.viewMgr.change("ViewWalletOpen")
            }
        }
        // 购买会员私有函数
        private async _buyVip(params, trust: string = "0", net_fee: string, callback = null) {
            // 合约交易，延长钱包退出时间
            Main.setLiveTime()

            try {
                var res: Result = await ModifyVipView.pay(params.pay_way, params.month, params.invite, net_fee, trust, callback, true, params)
            }
            catch (e) {
                var res = new Result()
                res.err = true
                res.info = e.toString()

                console.log("[BlaCat]", '[main]', '_buyVip, ModifyVipView.pay(params.pay_way, params.month, params.invite, net_fee, trust, callback, true, params) error, params => ', params, 'trust =>', trust, 'net_fee =>', net_fee, 'e => ', e.toString())
            }

            // 重新获取钱包记录
            //await Main.viewMgr.payView.doGetWalletLists(1)

            // listener回调
            var callback_data = {
                params: params,
                res: res
            }
            Main.listenerCallback("buyVipRes", callback_data);

            // function回调
            if (callback) {
                try {
                    callback(res);
                }
                catch (e) {
                    console.log("[BlaCat]", '[main]', '_buyVip, app callback error! ModifyVipView.pay(params.pay_way, params.month, params.invite, net_fee, trust, callback, true, params) error, params => ', params, 'trust =>', trust, 'net_fee =>', net_fee, 'e => ', e.toString())
                }
            }
            Main.buyVipCallback = null;
        }



        // SDK登录回调
        static async loginCallback() {
            if (!Main.isLoginCallback) {
                var res = await ApiTool.getEnterParams(Main.user.info.uid, Main.user.info.token, Main.appid);
                if (res.r) {
                    Main.setGameInfo(res.data.gameParam);

                    Main.setTsOffset(res.data.loginParam);

                    var res_nncs = await ApiTool.getTrustNncs(Main.user.info.uid, Main.user.info.token, Main.appid)
                    if (res_nncs.r) {
                        Main.app_trust = res_nncs.data;
                    }
                    else {
                        Main.app_trust = []
                    }


                    Main.isLoginCallback = true;
                    // 首次登录，获取应用notify
                    Main.needGetAppNotifys = true;
                    // 首次登录，获取平台notify
                    Main.needGetPlatNotifys = true;

                    // listener回调
                    Main.listenerCallback("loginRes", res.data.loginParam)
                    // function回调
                    if (Main.loginFunctionCallback) Main.loginFunctionCallback(res.data.loginParam)

                    console.log("[BlaCat]", '[main]', 'loginCallback，轮询平台notify和应用notify')
                }
                else {
                    Main.showErrCode(res.errCode);
                }
            }
        }
        // SDK设置游戏信息
        private static setGameInfo(param) {
            Main.appname = param.name;
            Main.appicon = param.icon;
            Main.applang = param.lang;
            Main.app_recharge_addr = param.recharge_addr;

            // 新数据格式
            if (param.hasOwnProperty('region')) {
                var appname = {}
                var appicon = {}
                for (let region in param.region) {
                    if (region == Main.langMgr.type) {
                        appname[region] = param.region[region]['name']
                        appicon[region] = param.region[region]['icon']
                    }
                }
                if (appname != {}) {
                    Main.appname = JSON.stringify(appname);
                }
                if (appicon != {}) {
                    Main.appicon = JSON.stringify(appicon);
                }
            }
            if (param.hasOwnProperty('coin')) {
                var appcoin = {}
                for (let icon in param.coin) {
                    appcoin[icon] = param.coin[icon]
                }
                if (appcoin != {}) {
                    Main.appcoin = JSON.stringify(appcoin)
                }
            }
        }
        // SDK判断是否登录
        isLogined() {
            return Main.isLoginCallback;
        }
        // SDK登出回调
        static async logoutCallback() {
            Main.isLoginCallback = false;

            Main.listenerCallback("logoutRes", null);

            // 信息清理
            Main.reset()

            // 页面登录的退回
            if (Main.platLoginType === 1) {
                window.history.back();
            }
        }
        // SDK回调
        static async listenerCallback(cmd, data) {
            var callback_data = {
                cmd: cmd,
                data: data
            }
            Main.callback(JSON.stringify(callback_data));
        }



        // 主定时器
        static async update() {
            // console.log("[BlaCat]", '[main]', 'update ...')

            // 获取app交易notify
            try {
                await Main.getAppNotifys();
            }
            catch (e) {
                console.log("[BlaCat]", '[main]', 'update, Main.getAppNotifys() error => ', e.toString())
            }


            // 获取平台交易notiy
            try {
                await Main.getPlatNotifys();
            }
            catch (e) {
                console.log("[BlaCat]", '[main]', 'update, Main.getPlatNotifys() error => ', e.toString())
            }


            // 更新payView的List时间
            if (Main.viewMgr.payView && Main.viewMgr.payView.isCreated && !Main.viewMgr.payView.isHidden()) {
                try {
                    Main.viewMgr.payView.flushListCtm()
                }
                catch (e) {
                    console.log("[BlaCat]", '[main]', 'update, Main.viewMgr.payView.flushListCtm() error => ', e.toString())
                }
            }

            // 存活时间判定，过期就退出钱包
            if (Main.liveTime && Main.liveTime > 0 && Main.liveTimeMax != 0) {
                if (Main.isWalletOpen() == true) {
                    // 钱包已经打开
                    var cur_ts = new Date().getTime();
                    if (cur_ts - Main.liveTime > Main.liveTimeMax) {
                        Main.wallet.closeWallet()
                    }
                }
            }

            // update间隔时间判定
            var timeout = Main.update_timeout_min;
            if (Main.isLoginCallback) {
                timeout = Main.update_timeout_max;
            }

            Main.s_update = setTimeout(() => { this.update() }, timeout);
        }
        // main获取交易确认通知记录
        static async getAppNotifys(): Promise<boolean> {
            // 开启获取、已经有上报记录，并且没有获取到notify时开启
            if (Main.needGetAppNotifys == true || (Main.appWalletLogId && Main.appWalletLogId > Main.appWalletNotifyId)) {
                console.log("[BlaCat]", '[main]', 'getAppNotifys, 执行前，是否获取: ' + Main.needGetAppNotifys
                    + ", 最近记录ID: " + Main.appWalletLogId
                    + ", 最近通知ID: " + Main.appWalletNotifyId)

                var res = await ApiTool.getAppWalletNotifys(Main.user.info.uid, Main.user.info.token, Main.appid, Main.netMgr.type);
                if (res.r) {
                    // 有待通知列表，找出待通知列表中记录最大ID
                    if (res.data.pending.length > 0) {
                        await res.data.pending.forEach(
                            list => {
                                var list_id = parseInt(list.id)
                                if (Main.appWalletLogId < list_id) {
                                    Main.appWalletLogId = list_id
                                }
                            }
                        )
                    }
                    else {
                        // 没有pending数据，定时获取关闭
                        console.log("[BlaCat]", '[main]', 'getAppNotifys, 没有等待确认的数据，关闭轮询')
                        Main.needGetAppNotifys = false;
                        Main.appWalletNotifyId = Main.appWalletLogId // 和最高记录对齐
                    }

                    // 有待通知列表
                    if (res.data.complete.length > 0) {
                        var new_app_notifys = new Array();

                        var has_partner_txid = false; // 默认没有合伙人信息

                        // 和notifyTxids比较，看是否有新通知数据，更新最近记录ID，更新最近通知ID
                        await res.data.complete.forEach(
                            list => {
                                var list_id = parseInt(list.id)

                                if (!Main.appNotifyTxids.hasOwnProperty(list.txid)) {
                                    new_app_notifys.push(list);
                                    if (list.type_detail == "3") {
                                        has_partner_txid = true;
                                    }
                                }

                                if (Main.appWalletNotifyId < list_id) Main.appWalletNotifyId = list_id;
                                if (Main.appWalletLogId < list_id) Main.appWalletLogId = list_id;

                                // 记录数据，以便比较后发给客户端，避免后续重复发送
                                Main.appNotifyTxids[list.txid] = 1;
                            }
                        )

                        if (new_app_notifys.length > 0) {
                            console.log("[BlaCat]", '[main]', 'getAppNotifys, 需要回调数据 => ', new_app_notifys)

                            // 有合伙人
                            if (has_partner_txid) {
                                console.log("[BlaCat]", '[main]', 'getAppNotifys, 有合伙人信息，开启getPlatNotifys ')
                                // 开启getNotifyPlat
                                Main.needGetPlatNotifys = true
                                Main.getPlatNotifys()
                            }

                            // 有新数据
                            Main.listenerCallback("getAppNotifysRes", new_app_notifys);
                        }
                    }
                }

                console.log("[BlaCat]", '[main]', 'getAppNotifys，执行后，是否获取: ' + Main.needGetAppNotifys
                    + ", 最近记录ID: " + Main.appWalletLogId
                    + ", 最近通知ID: " + Main.appWalletNotifyId)

                return true;
            }
            return false;
        }
        // 完成状态的plat_notify处理
        private static async doPlatNotify(params: Array<any>) {
            console.log("[BlaCat]", '[main]', 'doPlatNotify, params => ', params)
            var openTask = null; // 打开钱包任务
            for (let k in params) {
                switch (params[k].type) {
                    // case "9": // 储值到交易钱包
                    //     if (params[k].state == "1") {
                    //         if (params[k].ext) {
                    //             // 提交成功，循环获取结果，不需要开钱包
                    //             try {
                    //                 let ext_obj = JSON.parse(params[k].ext)
                    //                 if (ext_obj.hasOwnProperty('txid')) {
                    //                     Main.doPlatNotifyTransferRes(params[k], ext_obj['txid'])
                    //                 }
                    //             }
                    //             catch(e) {
                    //                 this.confirmPlatNotify(params[k])
                    //             }
                    //         }
                    //         else {
                    //             this.confirmPlatNotify(params[k])
                    //         }
                    //     }
                    //     else {
                    //         // 失败的，直接回调
                    //         this.confirmPlatNotify(params[k])
                    //     }
                    //     break;
                    case "2": // cgas->gas、cneo->neo退款
                        if (params[k].state == "1") {
                            if (params[k].ext) {
                                // utxo->gas提交成功，循环获取结果，不需要开钱包
                                Main.doPlatNotifyRefundRes(params[k], params[k].ext)
                            }
                            else {
                                if (!Main.isWalletOpen()) {
                                    console.log("[BlaCat]", '[main]', '***getPlatNotifys，钱包未打开，收集数据')

                                    if (!openTask) {
                                        openTask = new Array();
                                    }
                                    openTask.push(params[k]);
                                    break;
                                }
                                // cgas->utxo确定，发起utxo->gas请求，需要打开钱包
                                Main.doPlatNotiyRefund(params[k])
                            }
                        }
                        else {
                            // 失败的，直接回调
                            this.confirmPlatNotify(params[k])
                        }
                        break;
                    case "14": // bancor转账
                        if (params[k].state == "1") {

                            if (!Main.isWalletOpen()) {
                                console.log("[BlaCat]", '[main]', '***getPlatNotifys，钱包未打开，收集数据')

                                if (!openTask) {
                                    openTask = new Array();
                                }
                                openTask.push(params[k]);
                                break;
                            }
                            // cgas->utxo确定，发起utxo->gas请求，需要打开钱包
                            Main.doPlatNotifyBancor(params[k])
                            
                        }
                        else {
                            // 失败的，直接回调
                            this.confirmPlatNotify(params[k])
                        }
                        break;
                    case "16": // 购买会员
                        if (params[k].state == "1") {
                            // 刷新个人信息isLogined
                            try {
                                var res = await Main.user.isLogined()
                                // 刷新vip数据
                                if (res && Main.viewMgr.personalCenterView) {
                                    Main.viewMgr.personalCenterView.updateVip()
                                }

                                // 添加listener通知
                                let params_tmp = JSON.parse(params[k].params);
                                if (params_tmp.hasOwnProperty("refer") && params_tmp['refer'] == "1") {
                                    var listener_res: Result = new Result()
                                    listener_res.err = false
                                    listener_res.info = params_tmp
                                    Main.listenerCallback("buyVipResNotify", listener_res)
                                }
                            }
                            catch (e) {}
                        }
                        // 失败的，直接回调
                        this.confirmPlatNotify(params[k])
                        break
                    case "17": // 合伙人
                        if (params[k].state == "1") {
                            // 刷新个人信息isLogined
                            try {
                                var res = await Main.user.isLogined()
                                // 刷新vip数据
                                if (res && Main.viewMgr.personalCenterView) {
                                    Main.viewMgr.personalCenterView.updateVip()
                                }

                                // 添加listener通知
                                let params_tmp = JSON.parse(params[k].params);
                                var listener_res: Result = new Result()
                                listener_res.err = false
                                listener_res.info = params_tmp
                                Main.listenerCallback("PartnerResNotify", listener_res)
                            }
                            catch (e) {}
                        }
                        // 失败的，直接回调
                        this.confirmPlatNotify(params[k])
                        break;
                }
            }

            if (openTask) {
                // 钱包未打开，有需要打开钱包的操作
                ViewConfirm.callback_params = openTask;
                ViewConfirm.callback = (params) => {
                    // 确认打开钱包，去打开钱包
                    ViewWalletOpen.callback_params = params;
                    ViewWalletOpen.callback = (params) => {
                        // 打开钱包完成
                        this.doPlatNotify(params)
                    }
                    ViewWalletOpen.callback_cancel = (params) => {
                        // 打开钱包取消
                        // 不打开钱包，记录一个钱包打开任务标识
                        ViewWalletOpen.addTask("getPlatNotifys", params)
                    }
                    Main.viewMgr.change("ViewWalletOpen")
                }
                ViewConfirm.callback_cancel = (params) => {
                    // 不打开钱包，记录一个钱包打开任务标识
                    ViewWalletOpen.addTask("getPlatNotifys", params)
                }
                // Main.showConFirm("提现操作需要打开钱包，是否立即打开？")
                Main.showConFirm("main_need_open_wallet_confirm")
            }
        }
        static async continueWithOpenWallet() {
            // 钱包未打开，有需要打开钱包的操作
            ViewConfirm.callback = () => {
                // 确认打开钱包，去打开钱包
                ViewWalletOpen.refer = null
                ViewWalletOpen.callback = null
                Main.viewMgr.change("ViewWalletOpen")
            }
            // Main.showConFirm("提现操作需要打开钱包，是否立即打开？")
            Main.showConFirm("main_need_open_wallet_confirm")
        }
        private static async doPlatNotifyBancor(params) {
            try {
                var params_obj = JSON.parse(params.params)
            }
            catch (e) {
                // 数据异常了
                Main.showErrMsg("main_bancor_second_fail")
                return
            }

            if (params_obj['type'] == "1") {
                // 购买代币
                var params_data = {
                    nnc: tools.CoinTool.id_bancor,
                    sbParamJson: ["(hex160)"+params_obj['asset'], "(hex256)"+params.txid],
                    sbPushString: "purchase",
                }
            }
            else if (params_obj['type'] == "2") {
                // 卖出代币
                var params_data = {
                    nnc: tools.CoinTool.id_bancor,
                    sbParamJson: ["(hex160)"+params_obj['asset'], "(hex256)"+params.txid],
                    sbPushString: "sale",
                }
            }

            if (params_data) {
                var res: Result = await Main.wallet.bancorTransaction(params_data, params.net_fee)
                if (res.err === false) {
                    this.confirmPlatNotify(params)
                    // 刷新交易记录
                    Main.viewMgr.payView.doGetWalletLists(1)
                }
            }
        }
        private static async doPlatNotiyRefund(params) {

            var key = "cgas"
            for (let k in PayTransferView.log_type_detail) {
                if (PayTransferView.log_type_detail[k] == params.type_detail) {
                    key = k
                }
            }

            var id_asset = tools.CoinTool.id_GAS
            if (key == "cneo") {
                id_asset = tools.CoinTool.id_NEO
            }
            var id_asset_name = key.toUpperCase() //'CGAS'
            var id_asset_nep5 = tools.CoinTool["id_" + id_asset_name];

            //tx的第一个utxo就是给自己的
            var utxo: tools.UTXO = new tools.UTXO();
            utxo.addr = Main.user.info.wallet;
            utxo.txid = params.txid;
            utxo.asset = id_asset;
            utxo.count = Neo.Fixed8.parse(params.cnts.toString());
            utxo.n = 0;

            // 生成转换请求
            var utxos_assets = {};
            utxos_assets[id_asset] = [];
            utxos_assets[id_asset].push(utxo);

            console.log("[BlaCat]", '[main]', 'doPlatNotiyRefund, utxos_assets => ', utxos_assets);

            try {
                let net_fee = "0"
                try {
                    let p = JSON.parse(params.params)
                    if (p.hasOwnProperty("net_fee")) {
                        net_fee = p.net_fee
                    }
                }
                catch (e) {

                }

                if (id_asset_name == "CGAS") {
                    var refundcounts = Number(params.cnts) - Number(net_fee)
                    if (refundcounts < Number(net_fee)) {
                        // 不够支付手续
                        var makeTranRes: Result = tools.CoinTool.makeTran(
                            utxos_assets,
                            Main.user.info.wallet,
                            id_asset,
                            Neo.Fixed8.fromNumber(Number(params.cnts)),
                        );
                    }
                    else {
                        var makeTranRes: Result = tools.CoinTool.makeTran(
                            utxos_assets,
                            Main.user.info.wallet,
                            id_asset,
                            Neo.Fixed8.fromNumber(Number(params.cnts) - Number(net_fee)),
                            Neo.Fixed8.Zero,
                            // 余额作为手续费
                            1
                        );
                    }
                }
                else {
                    // NEO
                    var makeTranRes: Result = tools.CoinTool.makeTran(
                        utxos_assets,
                        Main.user.info.wallet,
                        id_asset,
                        Neo.Fixed8.fromNumber(Number(params.cnts)),
                    );
                    
                    // ***************** CNEO退款暂时不支持支付GAS手续费 ****************************
                    if (Number(net_fee) > 0 && Main.viewMgr.payView.gas >= Number(net_fee)) {
                        // 有足够GAS支付手续费
                        try {
                            // 获取用户utxo
                            var user_utxos_assets = await tools.CoinTool.getassets();
                            console.log("[BlaCat]", '[PayView]', 'makeRefundTransaction, user_utxos_assets => ', user_utxos_assets)
    
                            var user_makeTranRes: Result = tools.CoinTool.makeTran(
                                user_utxos_assets,
                                Main.user.info.wallet,
                                tools.CoinTool.id_GAS,
                                Neo.Fixed8.Zero,
                                Neo.Fixed8.fromNumber(Number(net_fee)),
                            );
    
                            // inputs、outputs、oldarr塞入
                            var user_tran = user_makeTranRes.info.tran
                            for (let i = 0; i < user_tran.inputs.length; i++) {
                                makeTranRes.info.tran.inputs.push(user_tran.inputs[i])
                            }
                            for (let i = 0; i < user_tran.outputs.length; i++) {
                                makeTranRes.info.tran.outputs.push(user_tran.outputs[i])
                            }
                            var user_oldarr = user_makeTranRes.info.oldarr
                            for (let i = 0; i < user_oldarr.length; i++) {
                                makeTranRes.info.oldarr.push(user_oldarr[i])
                            }
                            console.log("[BlaCat]", '[PayView]', 'makeRefundTransaction, user_makeTranRes => ', user_makeTranRes)
                        }
                        catch (e) {
                            let errmsg = Main.langMgr.get(e.message);
                            if (errmsg) {
                                Main.showErrMsg((e.message)); // "GAS余额不足"
                            }
                            else {
                                Main.showErrMsg(("pay_makeMintGasNotEnough"))
                            }
    
                            return;
                        }

                    }
                }

            }
            catch (e) {
                // Main.showErrMsg("生成转换请求（utxo->gas）失败");
                Main.showErrMsg(("main_refund_second_"+ id_asset_name +"_fail"))
                return;
            }

            var tran: any = makeTranRes.info.tran;
            var oldarr: Array<tools.OldUTXO> = makeTranRes.info.oldarr;

            tran.type = ThinNeo.TransactionType.ContractTransaction;
            tran.version = 0;

            //sign and broadcast
            //做智能合约的签名
            // 考虑到老的cgas合约，这里合约地址应该是记录的合约地址
            try {
                let params_decode = JSON.parse(params.params)
                if (params_decode && params_decode.hasOwnProperty("nnc")) {
                    id_asset_nep5 = params_decode.nnc
                }
            }
            catch (e) { }
            var r = await tools.WWW.api_getcontractstate(id_asset_nep5);

            if (r && r["script"]) {
                var Script = r["script"].hexToBytes();

                var sb = new ThinNeo.ScriptBuilder();
                sb.EmitPushNumber(new Neo.BigInteger(0));
                sb.EmitPushNumber(new Neo.BigInteger(0));
                tran.AddWitnessScript(Script, sb.ToArray());

                var txid = tran.GetHash().clone().reverse().toHexString();

                var trandata = tran.GetRawData();

                // 发送转换请求
                r = await tools.WWW.api_postRawTransaction(trandata);
                if (r) {
                    console.log("[BlaCat]", '[main]', 'doPlatNotiyRefund, api_postRawTransaction.r => ', r);

                    // 成功
                    if (r["txid"] || r['sendrawtransactionresult']) {
                        if (!r["txid"] || r["txid"] == "") {
                            r["txid"] = txid
                        }
                        console.log("[BlaCat]", '[main]', 'doPlatNotiyRefund, txid => ', r.txid);
                        // 确认转换请求
                        // this.confirmPlatNotifyExt(params)
                        var res = await Main.confirmPlatNotifyExt(params, r.txid);
                        // 轮询请求r.txid的交易状态
                        this.doPlatNotifyRefundRes(params, r.txid)
                        // 记录使用的utxo，后面不再使用，需要记录高度
                        var height = await tools.WWW.api_getHeight_nodes();
                        oldarr.map(old => old.height = height);
                        tools.OldUTXO.oldutxosPush(oldarr);

                        // 刷新payView的状态
                        Main.viewMgr.payView.doGetWalletLists(1);

                    } else {
                        // this.confirmPlatNotify(params)
                        // Main.showErrMsg("转换合约执行失败！");
                        Main.showErrMsg(("main_refund_doFail"))
                    }
                } else {
                    // Main.showErrMsg("发送转换请求失败！");
                    Main.showErrMsg(("main_refund_sendRequest_err"))
                }
            } else {
                // Main.showErrMsg("获取转换合约失败！");
                Main.showErrMsg(("main_refund_getScript_err"))
            }
        }
        private static async doPlatNotifyTransferRes(params, txid) {
            var r = await tools.WWW.getrawtransaction(txid)
            if (r) {
                console.log("[BlaCat]", '[main]', 'doPlatNotifyTransferRes, txid: ' + txid + ", r => ", r)
                await Main.confirmPlatNotify(params)
                // 刷新payview交易状态
                Main.viewMgr.payView.doGetWalletLists()
            }
            else {
                setTimeout(() => {
                    this.doPlatNotifyTransferRes(params, txid)
                }, 10000);
            }
        }
        private static async doPlatNotifyRefundRes(params, txid) {
            var r = await tools.WWW.getrawtransaction(txid)
            if (r) {
                console.log("[BlaCat]", '[main]', 'doPlatNotifyRefundRes, txid: ' + txid + ", r => ", r)
                await Main.confirmPlatNotify(params)
                // 刷新payview交易状态
                Main.viewMgr.payView.doGetWalletLists()
            }
            else {
                setTimeout(() => {
                    this.doPlatNotifyRefundRes(params, txid)
                }, 10000);
            }
        }
        // 确认回调
        private static async confirmPlatNotify(params) {
            var res = await ApiTool.walletNotify(Main.user.info.uid, Main.user.info.token, params.txid, Main.netMgr.type);
            // 删除notiyTxids里面的记录
            delete Main.platNotifyTxids[params.txid];
            return res;
        }
        // 退款状态
        private static async confirmPlatNotifyExt(params, ext) {
            var res = await ApiTool.walletNotifyExt(Main.user.info.uid, Main.user.info.token, params.txid, ext, Main.netMgr.type)
            return res;
        }
        // 获取平台notifys
        static async getPlatNotifys(): Promise<boolean> {
            // 开启获取、已经有上报记录，并且没有获取到notify时开启
            if (Main.needGetPlatNotifys == true || (Main.platWalletLogId && Main.platWalletLogId > Main.platWalletNotifyId)) {
                console.log("[BlaCat]", '[main]', '***getPlatNotifys, 执行前，是否获取: ' + Main.needGetPlatNotifys
                    + ', 最近记录ID: ' + Main.platWalletLogId
                    + ', 最近处理ID: ' + Main.platWalletNotifyId)

                var res = await ApiTool.getPlatWalletNotifys(Main.user.info.uid, Main.user.info.token, Main.netMgr.type);
                if (res.r) {
                    if (res.data.pending.length > 0) {
                        await res.data.pending.forEach(
                            list => {
                                var list_id = parseInt(list.id)
                                if (Main.platWalletLogId < list_id) {
                                    Main.platWalletLogId = list_id
                                }
                            }
                        )
                    }
                    else {
                        // 没有pending数据，定时获取关闭
                        console.log("[BlaCat]", '[main]', '***getPlatNotifys, 没有等待确认的数据，关闭轮询')
                        Main.needGetPlatNotifys = false;
                        Main.platWalletNotifyId = Main.appWalletLogId // 和最高记录对齐
                    }


                    if (res.data.complete.length > 0) {
                        // 和notifyTxids比较，看是否有新通知数据
                        var new_plat_notifys = new Array();

                        await res.data.complete.forEach(
                            list => {
                                var list_id = parseInt(list.id)

                                if (!Main.platNotifyTxids.hasOwnProperty(list.txid)) {
                                    new_plat_notifys.push(list);
                                }

                                if (Main.platWalletNotifyId <= parseInt(list.id)) Main.platWalletNotifyId = parseInt(list.id);
                                if (Main.platWalletLogId < list_id) Main.platWalletLogId = list_id;

                                Main.platNotifyTxids[list.txid] = 1;
                            }
                        )
                        if (new_plat_notifys.length > 0) {
                            console.log("[BlaCat]", '[main]', '***getPlatNotifys, 有新数据 => ', new_plat_notifys)
                            // 有新数据
                            Main.doPlatNotify(new_plat_notifys)

                            // 更新PayView
                            // if (isFirst == false) Main.viewMgr.payView.doGetWalletLists()
                        }
                    }
                }

                console.log("[BlaCat]", '[main]', '***getPlatNotifys, 执行后，是否获取: ' + Main.needGetPlatNotifys
                    + ', 最近记录ID: ' + Main.platWalletLogId
                    + ', 最近处理ID: ' + Main.platWalletNotifyId)
                return true;
            }
            return false;
        }

        // 切换网络
        static changeNetType(type: number) {
            Main.netMgr.change(() => {
                // 切换回调
                Main.listenerCallback('changeNetTypeRes', type);
                // 替换底色
                Main.viewMgr.mainView.changNetType()
                // 刷新视图
                Main.viewMgr.update()
                // 重置
                Main.reset(1)
            }, type)
        }

        // 从url地址获取参数
        static getUrlParam(name) {
            var reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)"); //构造一个含有目标参数的正则表达式对象
            var r = window.location.search.substr(1).match(reg);  //匹配目标参数
            if (r != null) {
                return unescape(r[2]);
            }
            return null; //返回参数值
        }

        // 验证登录信息
        static async validateLogin() {
            // 判断是否从页面登录
            var uid = Main.getUrlParam('uid');
            var token = Main.getUrlParam('token');
            if (uid && token) {
                var res_isLogined = await ApiTool.isLogined(uid, token);
                if (res_isLogined.r) {
                    localStorage.setItem(this.user.cacheKey, JSON.stringify(res_isLogined.data));
                    this.user.getInfo()
                    Main.platLoginType = 1;

                    // 获取钱包文件
                    var new_wallet_file = await this.user.getWalletFile();

                    if (new_wallet_file != null) {
                        // 设置钱包文件缓存
                        localStorage.setItem(this.user.info.wallet, new_wallet_file);
                    }
                }
            }

            var res = await Main.user.validateLogin();
            switch (res) {
                case 0:
                    // 登录
                    console.log("[BlaCat]", '[main]', '未登录 ...');
                    Main.viewMgr.change("LoginView");
                    break;
                case 1:
                    // 主页
                    console.log("[BlaCat]", '[main]', '已登录，已绑定钱包 ...')
                    Main.viewMgr.change("PayView");
                    break;
                case -1:
                    // 绑定&导入钱包
                    console.log("[BlaCat]", '[main]', '已登录，未绑定钱包 ...')
                    Main.viewMgr.change("WalletView");
                    break;
            }
        }

        // 通过错误码显示错误信息
        static async showErrCode(errCode: number, callback = null) {
            var msgId = "errCode_" + errCode.toString();

            var msg = Main.langMgr.get(msgId);
            if (msg == "") {
                // "未知错误！错误码："
                msgId = "errCode_default";
                msg = Main.langMgr.get("errCode_default") + errCode;
                this.showErrMsg(msgId, callback, { errCode: errCode })
                return
            }
            if (errCode == 100701) {
                // msg = "登录失效，请重新登录";
                this.showErrMsg(msgId, () => {
                    Main.viewMgr.removeAll();
                    Main.viewMgr.change("LoginView")
                })
                Main.user.logout()
                Main.logoutCallback()
                return
            }
            this.showErrMsg(msgId, callback)
        }
        // 显示错误信息
        static async showErrMsg(errMsgKey: string, callback = null, content_ext = null) {
            // alert(errMsg)
            ViewAlert.content = errMsgKey;
            ViewAlert.content_ext = content_ext;
            ViewAlert.callback = callback
            Main.viewMgr.change("ViewAlert")
        }
        // 显示toast信息
        static async showToast(msgKey: string, showTime: number = 1500) {
            // alert(msg)
            ViewToast.content = msgKey;
            ViewToast.showTime = showTime;
            Main.viewMgr.change("ViewToast")
        }
        // 显示信息
        static async showInfo(msgKey: string, callback = null, content_ext = null) {
            // alert(msg)
            ViewAlert.content = msgKey;
            ViewAlert.content_ext = content_ext;
            ViewAlert.callback = callback
            Main.viewMgr.change("ViewAlert")
        }
        // 显示确认
        static async showConFirm(msgKey: string) {
            // alert(errMsg)
            ViewConfirm.content = msgKey;
            Main.viewMgr.change("ViewConfirm")
        }
        // 显示Loading
        static async showLoading(msgKey: string) {
            // alert(errMsg)
            ViewLoading.content = msgKey;
            Main.viewMgr.change("ViewLoading")
        }

        // 判断钱包是否打开
        static isWalletOpen(): boolean {
            if (Main.wallet.isOpen() && Main.user.info.wallet == Main.wallet.wallet_addr) {
                return true;
            }
            return false;
        }
        // 判断是否在登录初始化中
        static isLoginInit(): boolean {
            if (tools.WWW.api_nodes) {
                return false
            }
            return true
        }

        // 验证数据格式，=== false表示失败；成功可能是true，也可能是其他（例如钱包地址）
        static async validateFormat(type: string, inputElement: HTMLInputElement | HTMLTextAreaElement) {
            var regex;
            switch (type) {
                case "user":
                    regex = /^[a-zA-Z0-9_]{4,16}$/
                    break;
                case "email":
                    regex = /^([0-9A-Za-z\-_\.]+)@([0-9A-Za-z]+\.[a-zA-Z]{2,3}(\.[a-zA-Z]{2})?)$/g;
                    break;
                case "phone":
                    regex = /^\d{4,}$/
                    break;
                case "vcode":
                    regex = /^\d{6}$/
                    break;
                case "walletaddr":
                    let isAddress = tools.NNSTool.verifyAddr(inputElement.value);
                    if (isAddress) {
                        try {
                            if (tools.neotools.verifyPublicKey(inputElement.value)) {
                                return true;
                            }
                        }
                        catch (e) {

                        }
                    }
                    else {
                        let isDomain = tools.NNSTool.verifyDomain(inputElement.value);
                        if (isDomain) {
                            try {
                                inputElement.value = inputElement.value.toLowerCase();
                                let addr = await tools.NNSTool.resolveData(inputElement.value);
                                if (addr) {
                                    return addr;
                                }
                            }
                            catch (e) {

                            }
                        }
                    }
                    break;
            }
            if (regex) {
                if (regex.test(inputElement.value)) {
                    return true;
                }
            }
            Main.showErrMsg('main_' + type + '_format_err', () => {
                inputElement.focus()
            })
            return false;
        }

        // 获取带地区代码的手机号码
        static getPhone(selectArea: string, phone: string) {
            // 多地区支持，转换手机号码
            var area = AreaView.getByCodeName(selectArea)
            if (!area) return null;
            var phoneMerge = phone + '@' + area.areacode;
            return phoneMerge;
        }

        // 通过时间戳获取日期
        static getDate(timeString: string) {
            if (timeString != "0" && timeString != "") {
                var date = new Date(parseInt(timeString) * 1000);
                var fmt = "yyyy-MM-dd hh:mm:ss";
                var o = {
                    "M+": date.getMonth() + 1, //月份
                    "d+": date.getDate(), //日
                    "h+": date.getHours(), //小时
                    "m+": date.getMinutes(), //分
                    "s+": date.getSeconds(), //秒
                    "q+": Math.floor((date.getMonth() + 3) / 3), //季度
                    S: date.getMilliseconds() //毫秒
                };
                if (/(y+)/.test(fmt))
                    fmt = fmt.replace(
                        RegExp.$1,
                        (date.getFullYear() + "").substr(4 - RegExp.$1.length)
                    );
                for (var k in o)
                    if (new RegExp("(" + k + ")").test(fmt))
                        fmt = fmt.replace(
                            RegExp.$1,
                            RegExp.$1.length == 1
                                ? o[k]
                                : ("00" + o[k]).substr(("" + o[k]).length)
                        );
                return fmt;
            }
            return "";
        }

        // 获取obj类名
        static getObjectClass(obj) {
            if (obj && obj.constructor && obj.constructor.toString()) {
                /*
                 * for browsers which have name property in the constructor
                 * of the object,such as chrome 
                 */
                if (obj.constructor.name) {
                    return obj.constructor.name;
                }
                var str = obj.constructor.toString();
                /*
                 * executed if the return of object.constructor.toString() is 
                 * "[object objectClass]"
                 */
                if (str.charAt(0) == '[') {
                    var arr = str.match(/\[\w+\s*(\w+)\]/);
                } else {
                    /*
                     * executed if the return of object.constructor.toString() is 
                     * "function objectClass () {}"
                     * for IE Firefox
                     */
                    var arr = str.match(/function\s*(\w+)/);
                }
                if (arr && arr.length == 2) {
                    return arr[1];
                }
            }
            return undefined;
        };

        // 获取未信任合约
        static getUnTrustNnc(params): Array<string> {
            var result = []
            if (params.hasOwnProperty('nnc')) {
                params = [params]
            }
            if (params instanceof Array) {
                for (let i = 0; i < params.length; i++) {
                    if (params[i].hasOwnProperty('nnc')) {
                        let nnc = params[i]['nnc']
                        if (Main.app_trust.length == 0) {
                            result.push(nnc)
                        }
                        else {
                            var isTrust = false;
                            for (let m = 0; m < Main.app_trust.length; m++) {
                                if (Main.app_trust[m] && nnc == Main.app_trust[m]['nnc']) {
                                    isTrust = true;
                                    break;
                                }
                            }
                            if (isTrust == false) {
                                result.push(nnc)
                            }
                        }
                    }
                }
            }
            return result;
        }
        // 信任合约重新获取
        static async updateTrustNnc(): Promise<void> {
            try {
                var res_nncs = await ApiTool.getTrustNncs(Main.user.info.uid, Main.user.info.token, Main.appid)
                if (res_nncs.r) {
                    Main.app_trust = res_nncs.data;
                    if (Main.viewMgr.trustContractView && !Main.viewMgr.trustContractView.isHidden()) {
                        Main.viewMgr.trustContractView.remove()
                    }
                }
                else {
                    Main.app_trust = []
                }
            }
            catch (e) {
                console.log("[BlaCat]", '[main]', 'updateTrustNnc, ApiTool.getTrustNncs error => ', e.toString())
            }
        }
        // 信任合约移除
        static removeTrustNnc(nnc: string) {
            if (Main.app_trust.length > 0) {
                for (let k = 0; k < Main.app_trust.length; k++) {
                    if (Main.app_trust[k] && Main.app_trust[k]['nnc'] == nnc) {
                        delete Main.app_trust[k]
                        // Main.app_trust.length -= 1
                        break;
                    }
                }
            }
        }

        // 设置存活时间
        static setLiveTime() {
            Main.liveTime = new Date().getTime()
            // console.log("[BlaCat]", '[main]', 'liveTime => ', Main.liveTime)
        }
        // 设置存活时间最大值
        static setLiveTimeMax(minutes: number) {
            Main.liveTimeMax = minutes * 60 * 1000;
            //console.log("[BlaCat]", '[main]', 'liveTimeMax => ', Main.liveTimeMax)
        }
        // 获取存活时间
        static getLiveTimeMax(): number {
            return Main.liveTimeMax;
        }
        // JS科学计数转换string
        static getStringNumber(num: number): string {
            let num_str = num.toString()
            if (num_str.indexOf('-') >= 0) {
                num_str = '0' + (num + 1).toString().substr(1)
            }
            return num_str;
        }
        // 获取客户端和服务端时间差
        private static setTsOffset(loginParam) {
            let curr_ts = Math.round((new Date()).getTime() / 1000);
            Main.tsOffset = (curr_ts - loginParam.time) * 1000
            console.log('[BlaCat]', '[Main]', 'setTsOffset, tsOffset时间偏移(s) => ', Main.tsOffset/1000)
        }
        // 获取url主机头
        private static getUrlHead() {
            if (Main.urlHead === undefined) {
                if (window.location.protocol == "file:") {
                    Main.urlHead = "http:"
                }
                else {
                    Main.urlHead = ""
                }
            }
            return Main.urlHead
        }
        // 随机数组
        static randomSort(arr, newArr) {
            // 如果原数组arr的length值等于1时，原数组只有一个值，其键值为0
            // 同时将这个值push到新数组newArr中
            if (arr.length == 1) {
                newArr.push(arr[0]);
                return newArr; // 相当于递归退出
            }
            // 在原数组length基础上取出一个随机数
            var random = Math.ceil(Math.random() * arr.length) - 1;
            // 将原数组中的随机一个值push到新数组newArr中
            newArr.push(arr[random]);
            // 对应删除原数组arr的对应数组项
            arr.splice(random, 1);
            return Main.randomSort(arr, newArr);
        }

        static check(){
            //判断访问设备，方便后面针对不同设备调用代码  
            var dev = "";  
            if ((navigator.userAgent.match(/(phone|pad|pod|iPhone|iPod|ios|iPad|Android|Mobile|BlackBerry|IEMobile|MQQBrowser|JUC|Fennec|wOSBrowser|BrowserNG|WebOS|Symbian|Windows Phone)/i))) {  
                //设备为移动端  
                dev = "mobile";  
            }  
            else {  
                //设备为pc  
                dev = "pc";  
            }  
            return dev;
        }

        static in_array(search:string, array: Array<string>)
        {
            for (let k=0; k<array.length; k++) {
                if (array[k] == search) {
                    return true
                }
            }
            return false
        }
    }
}