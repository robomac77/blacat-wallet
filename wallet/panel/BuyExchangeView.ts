/// <reference path="../main.ts" />
/// <reference path="./ViewBase.ts" />

namespace BlackCat {
    
    export class BuyExchangeView extends ViewBase {

        static balance: number;

        private balanceElement : HTMLElement

        private abcbalanceElement : HTMLElement

        private recentElement: HTMLElement

        private reclistsDiv: HTMLElement;
        private recgetMoreDiv: HTMLDivElement;

        private s_getWalletLists = {};
        
        private page: number;
        private num: number;

        private isLast: boolean;

        static exTabs: Array<string> = ["myasset", "buyin", "sellout", "tradelog"]

        wallet_addr: string
        wallet_addr_other: any

        // 各种币
        // === blacat
        bct: number;
        bcp: number;
        // === neo
        gas: number;
        cgas: number;
        neo: number;
        cneo: number;
        // === other
        btc: number
        eth: number

        // cli高度
        height_clis: number;
        private divHeight_clis: HTMLElement;
        height_nodes: number;
        private divHeight_nodes: HTMLElement;

        // 记录每页显示数量
        listPageNum: number;

        // 钱包记录
        private walletListsHash: string;


        private divLists: HTMLDivElement;
        private divRecLists: HTMLDivElement
        private divListsMore: HTMLElement;
        private divRecListsMore: HTMLElement;
        private divNetSelect: HTMLElement;


        
            create() {
                this.div = this.objCreate("div") as HTMLDivElement
                this.div.classList.add("pc_bj", "pc_pay")
    
                //钱包标题
                var headerTitle = this.objCreate("div")
                headerTitle.classList.add("pc_header")
                this.ObjAppend(this.div, headerTitle)
    
                // 我的信息
                var myinfo_a = this.objCreate("a")
                myinfo_a.classList.add("iconfont", "icon-bc-touxiang")
                myinfo_a.onclick = () => {
                    this.hidden()
                    PersonalCenterView.refer = "PayView"
                    Main.viewMgr.change("PersonalCenterView")
                }
                this.ObjAppend(headerTitle, myinfo_a)
    
                // nodes高度
                this.divHeight_nodes = this.objCreate("div")
                this.divHeight_nodes.classList.add("pc_payheighet", "iconfont", "icon-bc-blalian", "network")
                this.divHeight_nodes.style.top = "5px";
                this.divHeight_nodes.textContent = "n/a"
                this.divHeight_nodes.onclick = () => {
                    this.hidden()
                    ModifyNetworkLineView.refer = "PayView"
    
                    ModifyNetworkLineView.defaultType = "nodes"
                    Main.viewMgr.change("ModifyNetworkLineView")
                }
                this.ObjAppend(headerTitle, this.divHeight_nodes)
    
                // clis高度
                this.divHeight_clis = this.objCreate("div")
                this.divHeight_clis.classList.add("pc_payheighet", "iconfont", "icon-bc-neolian", "network")
                this.divHeight_clis.textContent = "n/a"
                this.divHeight_clis.onclick = () => {
                    if (tools.WWW.api_clis && tools.WWW.api_clis != "") {
                        this.hidden()
                        ModifyNetworkLineView.refer = "PayView"
    
                        ModifyNetworkLineView.defaultType = "clis"
                        Main.viewMgr.change("ModifyNetworkLineView")
                    }
                }
                this.ObjAppend(headerTitle, this.divHeight_clis)
    
    
    
                // 钱包标题
                var headerh1 = this.objCreate("h1")
                headerh1.textContent = Main.platName;
                this.ObjAppend(headerTitle, headerh1)
    
                //切换网络
                var divNetType = this.objCreate("div")
                divNetType.classList.add("pc_net", "iconfont")
                divNetType.textContent = this.getNetTypeName() //Main.langMgr.get("nettype_" + Main.netMgr.type)
                divNetType.onclick = () => {
                    this.showChangeNetType()
                }
                this.ObjAppend(headerTitle, divNetType)
    
                this.divNetSelect = this.objCreate("div")
                this.divNetSelect.classList.add("pc_netbox")
                this.ObjAppend(headerTitle, this.divNetSelect)
    
                //返回游戏
                var aReturnGame = this.objCreate("i")
                aReturnGame.classList.add("pc_returngame", "iconfont", "icon-bc-fanhui1")
                aReturnGame.onclick = () => {
                    BlackCat.SDK.showIcon()
                }
                if (!window.hasOwnProperty("BC_androidSDK")) {
                    this.ObjAppend(headerTitle, aReturnGame)
                }
                
                var divAddress = this.objCreate("div")
                this.ObjAppend(this.div , divAddress)
                divAddress.classList.add("pc_exc")
               // divAddress.classList.add("pc_exchangelist" , "balance", "margin_top45")



                // 详情
                var aWalletDetail = this.objCreate("a")
                aWalletDetail.classList.add("pc_exmydetail", "iconfont", "icon-bc-xiangqing")
                aWalletDetail.onclick = () => {
                    this.wallet_detail()
                }
                this.ObjAppend(divAddress, aWalletDetail)

                // 通讯录
                var payAddressbook = this.objCreate("a")
                payAddressbook.classList.add("pc_exmydetail", "iconfont", "icon-bc-tongxunlu")
                payAddressbook.onclick = () => {
                    this.hidden()
                    AddressbookView.refer = "PayView"
                    Main.viewMgr.change("AddressbookView")
                }
                this.ObjAppend(divAddress, payAddressbook)


                // 我的(缩略)钱包地址
                var divWallet = this.objCreate("div")
                divWallet.classList.add("pc_cardexchangecon")
                divWallet.textContent = Main.user.info.wallet.substr(0, 4) + "****" + Main.user.info.wallet.substr(Main.user.info.wallet.length - 4)
                this.ObjAppend(divAddress, divWallet)

                var payRefresh = this.objCreate("div")
                payRefresh.classList.add("pc_exchangecardrefresh")
                payRefresh.textContent = Main.langMgr.get("pay_refresh") // "刷新"
                payRefresh.onclick = async () => {
                    Main.viewMgr.change("ViewLoading")
                   // await this.doGetBalances()
                  //  await this.doGetWalletLists(1)
                   // Main.viewMgr.viewLoading.remove()
                }
                this.ObjAppend(divAddress, payRefresh)

                //刷新图标            
                var iRefresh = this.objCreate("i")
                iRefresh.classList.add("iconfont", "icon-bc-shuaxin")
                this.ObjAppend(payRefresh, iRefresh)


                // 收款
                var butReceivables = this.objCreate("button")
                butReceivables.textContent = Main.langMgr.get("buy_exchange_pay_received") 
                butReceivables.onclick = () => {
                    this.doMakeReceivables()
                }
                this.ObjAppend(divWallet, butReceivables)

                // 提现
                var makeTransferObj = this.objCreate("button")
                makeTransferObj.textContent = Main.langMgr.get("buy_exchange_pay_sent") 
                makeTransferObj.onclick = () => {
                    this.doMakeTransfer()
                }
                this.ObjAppend(divWallet, makeTransferObj)

                // 代币
            var divCurrency = this.objCreate("div")
            divCurrency.classList.add("pc_currency")
            this.ObjAppend(this.div, divCurrency)

            // === 代币导航栏
            var divCurrencyNumber = this.objCreate("div")
            divCurrencyNumber.classList.add("pc_currencynumber")
            this.ObjAppend(divCurrency, divCurrencyNumber)

            for (let i = 0; i < PayView.tokens.length; i++) {
                let token = PayView.tokens[i]

                // 导航栏
                this["token_" + token] = this.objCreate("div")
                this["token_" + token].innerText = Main.langMgr.get("pay_coin_" + token)
                this["token_" + token].onclick = () => {
                    this.changeToken(token);
                }
                this.ObjAppend(divCurrencyNumber, this["token_" + token])

                // 数字币种list，默认不显示
                this["token_list_" + token] = this.objCreate("div")
                this["token_list_" + token].classList.add("pc_currencylist")
                this["token_list_" + token].style.display = "none"
                this.ObjAppend(divCurrency, this["token_list_" + token])

                // 数字币种具体
                for (let k = 0; k < PayView.tokens_coin[i].length; k++) {
                    let coin = PayView.tokens_coin[i][k]

                    let coinElement = this.objCreate("div")
                    // 名称
                    coinElement.innerHTML = Main.langMgr.get(coin)
                    this.ObjAppend(this["token_list_" + token], coinElement)
                    // LOGO
                    let logoElement = this.objCreate("img") as HTMLImageElement
                    logoElement.src = Main.resHost + "res/img/" + coin + ".png"
                    logoElement.classList.add("coinlogo")
                    this.ObjAppend(coinElement, logoElement)
                    // ?号
                    let labelElement = this.objCreate("label")
                    labelElement.classList.add("iconfont", "icon-bc-help")
                    this.ObjAppend(coinElement, labelElement)
                    let descText = Main.langMgr.get("pay_" + coin + "_desc")
                    if (descText != "") {
                        // ?描述
                        let descElement = this.objCreate("div")
                        descElement.classList.add("pc_coincon")
                        descElement.textContent = Main.langMgr.get("pay_" + coin + "_desc")
                        this.ObjAppend(labelElement, descElement)
                    }
                    else {
                        labelElement.style.display = "none"
                    }
                    // 字体图标">"
                    let moreElement = this.objCreate("i")
                    moreElement.classList.add("iconfont", "icon-bc-gengduo")
                    this.ObjAppend(coinElement, moreElement)
                    // 余额
                    this["span" + coin.toUpperCase()] = this.objCreate("span")
                    this["span" + coin.toUpperCase()].textContent = "0"
                    this.ObjAppend(coinElement, this["span" + coin.toUpperCase()])
                    // 点击事件
                    coinElement.onclick = () => {
                        this["doExchange" + coin.toUpperCase()]()
                    }
                }
            }
            // 显示第一组代币
            this["token_" + PayView.tokens[0]].classList.add("active")
            this["token_list_" + PayView.tokens[0]].style.display = ""

            // cgas_old/cneo_old信息
            for (let token in PayView.tokens_old) {
                PayView.tokens_old[token].forEach((coin) => {
                    let coin_upcase = coin.toUpperCase() + "_OLD"
                    if (tools.CoinTool["id_" + coin_upcase].length > 0) {
                        tools.CoinTool["id_" + coin_upcase].forEach((old) => {
                            let coinElement = this.objCreate("div")
                            // 名称
                            coinElement.innerHTML = Main.langMgr.get("pay_" + coin)
                            this.ObjAppend(this["token_list_" + token], coinElement)
                            // LOGO
                            let logoElement = this.objCreate("img") as HTMLImageElement
                            logoElement.src = Main.resHost + "res/img/old" + coin + ".png"
                            logoElement.classList.add("coinlogo")
                            this.ObjAppend(coinElement, logoElement)
                            // ?号
                            let labelElement = this.objCreate("label")
                            labelElement.classList.add("iconfont", "icon-bc-help")
                            this.ObjAppend(coinElement, labelElement)
                            // ?描述
                            let descElement = this.objCreate("div")
                            descElement.classList.add("pc_coincon")
                            descElement.textContent = old
                            this.ObjAppend(labelElement, descElement)
                            // 字体图标">"
                            let moreElement = this.objCreate("i")
                            moreElement.classList.add("iconfont", "icon-bc-gengduo")
                            this.ObjAppend(coinElement, moreElement)
                            // 余额
                            this["span"+ coin_upcase + old] = this.objCreate("span")
                            this["span"+ coin_upcase + old].textContent = "0"
                            this.ObjAppend(coinElement, this["span" + coin_upcase + old])
                            // 点击事件
                            coinElement.onclick = () => {
                                this.doMakeRefundOld(old, coin_upcase)
                            }
                        })
                    }
                })
            }
            
            // ABC 余额
            this.divLists = this.objCreate("ul") as HTMLDivElement
            this.divLists.classList.add("pc_paylists")
            this.ObjAppend(this.div, this.divLists)


            var liRecord = this.objCreate("li")
            liRecord.classList.add("pc_payrecord")
            // liRecord.innerText = Main.langMgr.get("pay_recentLists") //"近期记录"
            this.ObjAppend(this.divLists, liRecord)

            var spanRecord = this.objCreate("div")
            spanRecord.innerText = Main.langMgr.get("buy_exchange_pay_balance") //"近期记录"
            this.ObjAppend(liRecord, spanRecord)

           
            this.divListsMore = this.objCreate("button")
            this.divListsMore.classList.add("pc_paymore")
            this.divListsMore.textContent = BuyExchangeView.balance.toString() // "更多"

            this.divListsMore.onclick = () => {
                BuyExchangePurchaseView.refer = ""
                BuyExchangePurchaseView.callback_params = BuyExchangeView.callback_params
                BuyExchangePurchaseView.balance = BuyExchangeView.balance

                Main.viewMgr.change("BuyExchangePurchaseView")
            }
            // this.divListsMore.style.display = "none"
            this.ObjAppend(liRecord, this.divListsMore)

            var iListsMore = this.objCreate("i")
            iListsMore.classList.add("iconfont", "icon-bc-sanjiaoxing")
            this.ObjAppend(this.divListsMore, iListsMore)

            // 正在处理的
            this.abcbalanceElement = this.objCreate("div")
            this.ObjAppend(this.divLists, this.abcbalanceElement)




           //近期记录
            this.divRecLists = this.objCreate("ul") as HTMLDivElement
            this.divRecLists.classList.add("pc_payRec")
            this.ObjAppend(this.div, this.divRecLists)


            var liRecentRecord = this.objCreate("li")
            liRecentRecord.classList.add("pc_payRecentrecord")
            // liRecentRecord.innerText = Main.langMgr.get("pay_recentLists") //"近期记录"
            this.ObjAppend(this.divLists, liRecentRecord)

            var spanRecentRecord = this.objCreate("div")
            spanRecentRecord.innerText = Main.langMgr.get("buy_exchange_pay_recent") //"近期记录"
            this.ObjAppend(liRecentRecord, spanRecentRecord)

           
            this.divRecListsMore = this.objCreate("button")
            this.divRecListsMore.classList.add("pc_paymore")
            this.divRecListsMore.textContent = Main.langMgr.get("buy_exchange_pay_more") 
            this.divRecListsMore.onclick = () => {
                this.hidden()

                this.doGetWalletLists()
            }
            // this.divRecListsMore.style.display = "none"
            this.ObjAppend(liRecentRecord, this.divRecListsMore)

            var iRecListsMore = this.objCreate("i")
            iRecListsMore.classList.add("iconfont", "icon-bc-sanjiaoxing")
            this.ObjAppend(this.divRecListsMore, iRecListsMore)

            
            this.recentElement = this.objCreate("div")
            this.ObjAppend(this.divRecListsMore, this.recentElement)
            
            this.reclistsDiv = this.objCreate("ul")
            this.ObjAppend(liRecentRecord, this.reclistsDiv)

            this.recgetMoreDiv = this.objCreate("div") as HTMLDivElement
            this.recgetMoreDiv.classList.add("pc_gamemore")
            this.recgetMoreDiv.onclick = () => {
                Main.viewMgr.payView.doGetWalletLists() // call from pay page
            }
            this.ObjAppend(this.div, this.recgetMoreDiv)

            Main.viewMgr.payView.doGetWalletLists() 
            
                                     
           
           
           
             
        }

        toRefer() {
            if (PayExchangeShowWalletView.refer) {
                Main.viewMgr.change(PayExchangeShowWalletView.refer)
                PayExchangeShowWalletView.refer = null;
            }
        }

        key_esc() {
            this.doCancel()
        }

        private doCancel() {
            this.addGetWalletLists()
            this.return()
        }

        private getNetTypeName() {
            return Main.langMgr.get("pay_nettype_" + Main.netMgr.type);
        }

        private showChangeNetType() {
            if (this.divNetSelect.innerHTML.length > 0) {
                this.divNetSelect.innerHTML = "";
            }
            else {
                var other = Main.netMgr.getOtherTypes()
                for (let i = 0; i < other.length; i++) {
                    this.ObjAppend(this.divNetSelect, this.getDivNetSelectType(other[i]))
                }
            }
        }


        private getDivNetSelectType(type: number) {
            var divObj = this.objCreate("div")
            divObj.textContent = Main.langMgr.get("pay_nettype_" + type)
            divObj.onclick = () => {
                Main.changeNetType(type)
            }
            return divObj;
        }

        private wallet_detail() {
            if (Main.isWalletOpen()) {
                // 打开钱包了

                // 打开详情页
                PayWalletDetailView.refer = "PayView"
                Main.viewMgr.change("PayWalletDetailView")
                this.hidden()

            } else {
                // 未打开钱包
                ViewWalletOpen.refer = "PayView"
                ViewWalletOpen.callback = () => {
                    this.wallet_detail()
                }
                Main.viewMgr.change("ViewWalletOpen")
                // this.hidden()
            }
        }

        private async doMakeReceivables() {
            this.hidden()
            PayReceivablesView.refer = "PayView"
            Main.viewMgr.change("PayReceivablesView")
        }


        //转账
        private async doMakeTransfer() {
            if (Main.isWalletOpen()) {
                // 打开钱包了

                // 打开转账页
                PayTransferView.refer = "PayView"
                PayTransferView.callback = () => {
                   // this.doGetWalletLists(1)
                }
                Main.viewMgr.change("PayTransferView")

            } else {
                // 未打开钱包
                ViewWalletOpen.refer = "PayView"
                ViewWalletOpen.callback = () => {
                    this.doMakeTransfer()
                }
                Main.viewMgr.change("ViewWalletOpen")
                // this.hidden()
            }
        }

        private changeToken(type: string) {
            let types = ['blacat', 'neo', 'other']
            for (let i = 0; i < types.length; i++) {
                this["token_list_" + types[i]].style.display = "none"
                this["token_" + types[i]].classList.remove("active")
            }
            this["token_list_" + type].style.display = "block"
            this["token_" + type].classList.add("active")
        }


        private async doMakeRefundOld(id_old: string, type: string = "CGAS_OLD") {
            if (Main.isWalletOpen()) {
                // 打开钱包了

                // 获取cgas合约地址
                // 暂时以第一个合约地址为准，后续如果多个，新开view显示
                let id_OLD = id_old

                // 获取cgas余额
                let balance = await Main["get" + type + "BalanceByAddress"](id_OLD, Main.user.info.wallet)
                let id_balance = balance.toString()

                // 打开输入数量
                ViewTransferCount.transType = "refund"
                ViewTransferCount.transNncOld = id_OLD

                if (type == "CGAS_OLD") {
                    ViewTransferCount.coinType = "CGAS"
                }
                else if (type == "CNEO_OLD") {
                    ViewTransferCount.coinType = "CNEO"
                }

                ViewTransferCount.refer = "PayView"
                ViewTransferCount.callback = () => {
                    this.makeRefundTransaction(id_old, type)
                }
                Main.viewMgr.change("ViewTransferCount")

            } else {
                // 未打开钱包
                ViewWalletOpen.refer = "PayView"
                ViewWalletOpen.callback = () => {
                    this.doMakeRefundOld(id_old, type)
                }
                Main.viewMgr.change("ViewWalletOpen")
                // this.hidden()
            }

        }


        private async makeRefundTransaction(id_ASSET: string = tools.CoinTool.id_CGAS, coinType: string = "CGAS") {
            Main.viewMgr.change("ViewLoading")

            var refundCount = Main.viewMgr.viewTransferCount.inputCount.value;
            var sendCount = Neo.Fixed8.fromNumber(Number(refundCount))

            var net_fee = Main.viewMgr.viewTransferCount.net_fee;// 手续费
            // var net_fee = "0.00000001"
            console.log("[BlaCat]", '[PayView]', '退到gas/neo，数量 => ', refundCount, '手续费netfee =>', net_fee)

            // 查询余额
            var scriptaddress = id_ASSET.hexToBytes().reverse();

            var login = tools.LoginInfo.getCurrentLogin();

            //获取cgas/cneo合约地址的资产列表
            if (id_ASSET == '0x74f2dc36a68fdc4682034178eb2220729231db76') {
                // 注意，如果合约升级了，需要改动
                // 协调退款
                var utxos_assets = await tools.CoinTool.getCgasAssets(id_ASSET, Number(refundCount));
            }
            else {
                // cneo也可以用这个
                var utxos_assets = await tools.CoinTool.getNep5Assets(id_ASSET);
            }


            var log_type = "2"

            var coinType_asset = tools.CoinTool.id_GAS
            var not_enough_utxo_err = "pay_makeRefundCgasNotEnoughUtxo"
            var not_enough_err = "pay_makeRefundCgasNotEnough"
            if (coinType == "CNEO" || coinType == "CNEO_OLD") {
                coinType_asset = tools.CoinTool.id_NEO
                not_enough_utxo_err = "pay_makeRefundCneoNotEnoughUtxo"
                not_enough_err = "pay_makeRefundCneoNotEnough"
            }

            var us = utxos_assets[coinType_asset];
            if (us == undefined) {
                Main.viewMgr.viewLoading.remove()
                Main.showErrMsg(not_enough_utxo_err)
                return;
            }

            // 打乱us顺序，尽量避免一个块时间内，使用了重复的utxo，导致交易失败
            // 不能完全避免失败，但是可以提高并发成功率
            let us_random = []
            Main.randomSort(us, us_random)
            us = us_random

            console.log("[BlaCat]", '[payView]', 'makeRefundTransaction, us.before => ', us);

            //检查cgas地址拥有的gas的utxo是否有被标记过
            var us_parse = [] // us处理后结果
            var count: Neo.Fixed8 = Neo.Fixed8.Zero;
            for (var i = us.length - 1; i >= 0; i--) {

                if (count.compareTo(sendCount) > 0) {
                    // 足够数量了，后面的直接剔除了
                    console.log("[BlaCat]", '[payView]', 'makeRefundTransaction, enough us[' + i + '].delete => ', us[i]);
                    // delete us[i];
                    continue
                }

                if (us[i].n > 0) {
                    count = count.add(us[i].count)
                    us_parse.push(us[i])
                    continue;
                }

                var sb = new ThinNeo.ScriptBuilder();
                sb.EmitParamJson(["(hex256)" + us[i].txid.toString()]);
                sb.EmitPushString("getRefundTarget");
                sb.EmitAppCall(scriptaddress);

                var data = sb.ToArray();
                var r = await tools.WWW.rpc_getInvokescript(data);
                if (r) {
                    var stack = r["stack"];
                    var value = stack[0]["value"].toString();
                    if (value.length > 0) {
                        console.log("[BlaCat]", '[payView]', 'makeRefundTransaction, us[' + i + '].delete => ', us[i]);
                        // delete us[i];
                    }
                    else {
                        count = count.add(us[i].count)
                        us_parse.push(us[i])
                    }
                }
            }
            us = us_parse

            console.log("[BlaCat]", '[payView]', 'makeRefundTransaction, us.after => ', us);

            utxos_assets[coinType_asset] = us;

            console.log("[BlaCat]", '[payView]', 'makeRefundTransaction, utxos_assets.after => ', utxos_assets);

            // 生成交易请求

            //cgas 自己给自己转账   用来生成一个utxo  合约会把这个utxo标记给发起的地址使用
            try {
                var nepAddress = ThinNeo.Helper.GetAddressFromScriptHash(scriptaddress);
                var makeTranRes: Result = tools.CoinTool.makeTran(
                    utxos_assets,
                    nepAddress,
                    coinType_asset,
                    Neo.Fixed8.fromNumber(Number(refundCount))
                );
                // 有网络手续费
                // ***************** CNEO退款暂时不支持支付GAS手续费 ****************************
                if (Number(net_fee) > 0) {

                    // makeTranRes.info.tran.extdata.gas = Neo.Fixed8.fromNumber(Number(net_fee));
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
                        Main.viewMgr.viewLoading.remove()
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
            catch (e) {
                Main.viewMgr.viewLoading.remove()
                Main.showErrMsg(not_enough_err)
                return;
            }

            console.log(
                "[BlaCat]", "[payView]", "makeRefundTransaction, makeTranRes => ",
                makeTranRes
            );

            var r = await tools.WWW.api_getcontractstate(id_ASSET);
            if (r && r["script"]) {
                var Script = r["script"].hexToBytes();

                var scriptHash = ThinNeo.Helper.GetPublicKeyScriptHash_FromAddress(
                    login.address
                );

                var sb = new ThinNeo.ScriptBuilder();
                sb.EmitParamJson(["(bytes)" + scriptHash.toHexString()]);
                sb.EmitPushString("refund");
                sb.EmitAppCall(scriptaddress);

                var tran: any = makeTranRes.info.tran;
                var oldarr: Array<tools.OldUTXO> = makeTranRes.info.oldarr;

                tran.type = ThinNeo.TransactionType.InvocationTransaction;
                tran.extdata = new ThinNeo.InvokeTransData();
                tran.extdata.script = sb.ToArray();
                // 网络手续费
                if (Number(net_fee) > 0) tran.extdata.gas = Neo.Fixed8.fromNumber(Number(net_fee));

                //附加鉴证
                tran.attributes = new Array<ThinNeo.Attribute>(1);
                tran.attributes[0] = new ThinNeo.Attribute();
                tran.attributes[0].usage = ThinNeo.TransactionAttributeUsage.Script;
                tran.attributes[0].data = scriptHash;

                var wsb = new ThinNeo.ScriptBuilder();
                wsb.EmitPushString("whatever");
                wsb.EmitPushNumber(new Neo.BigInteger(250));
                tran.AddWitnessScript(Script, wsb.ToArray());

                //做提款人的签名
                var signdata = ThinNeo.Helper.Sign(tran.GetMessage(), login.prikey);
                tran.AddWitness(signdata, login.pubkey, login.address);

                var txid = tran.GetHash().clone().reverse().toHexString();

                var trandata = tran.GetRawData();

                console.log("[BlaCat]", '[payView]', 'makeRefundTransaction, tran => ', tran);

                // 发送交易请求

                r = await tools.WWW.api_postRawTransaction(trandata);

                if (r) {
                    if (r.txid || r['sendrawtransactionresult']) {
                        if (!r["txid"] || r["txid"] == "") {
                            r["txid"] = txid
                        }
                        var paramJson_tmp = "(bytes)" + scriptHash.toHexString();
                        // 上报钱包操作记录
                        var logRes = await ApiTool.addUserWalletLogs(
                            Main.user.info.uid,
                            Main.user.info.token,
                            r.txid,
                            "0",
                            refundCount,
                            log_type,
                            // 塞入net_fee，以便退款第二步参考手续费
                            '{"sbParamJson":"' + paramJson_tmp + '", "sbPushString": "refund", "nnc": "' + id_ASSET + '", "net_fee": "' + net_fee + '"}',
                            Main.netMgr.type,
                            "0",
                            "",
                            PayTransferView.log_type_detail[coinType.toLowerCase()]
                        );
                        if (logRes.r) {
                            Main.platWalletLogId = parseInt(logRes.data);
                        }

                        // 记录使用的utxo，后面不再使用，需要记录高度
                        var height = await tools.WWW.api_getHeight_nodes();
                        oldarr.map(old => old.height = height);
                        tools.OldUTXO.oldutxosPush(oldarr);

                        // 等待交易确认
                        // this.makeRefundTransaction_confirm(r["txid"], refundCount);

                        // 刷新钱包记录，显示当前交易信息
                        Main.viewMgr.viewLoading.remove()
                      //  this.doGetWalletLists(1)

                    } else {
                        Main.viewMgr.viewLoading.remove()
                        // Main.showErrMsg("提取合约执行失败！请等待上个提现或兑换交易完成再操作！");
                        Main.showErrMsg(("pay_makeRefundDoFail"))
                    }
                    console.log("[BlaCat]", '[payView]', 'makeRefundTransaction, api_postRawTransaction结果 => ', r);

                }
                else {
                    Main.viewMgr.viewLoading.remove()
                    // Main.showErrMsg("发送提取交易失败！请检查网络，稍候重试！");
                    Main.showErrMsg("pay_makeRefundDoFail2")
                }
            }
            else {
                Main.viewMgr.viewLoading.remove()
                // Main.showErrMsg("获取提取合约失败！");
                Main.showErrMsg("pay_makeRefundGetScriptFail")
            }
        }
        

        

        
        // 延时一段时间刷新交易记录
        private addGetWalletLists() {
            var type = PayExchangeShowWalletView.callback_params.type_src
            var timeout = 1000;
            switch (type) {
                case "BTC":
                    timeout = 15 * 60 * 1000; // 15分钟
                    break;
                case "ETH":
                    timeout = 3 * 60 * 1000; // 3分钟
                    break;
                default:
                    timeout = 2 * 60 * 1000; // 2分钟
                    break;
            }

            if (this.s_getWalletLists.hasOwnProperty(type)) {
                if (this.s_getWalletLists[type]) {
                    clearTimeout(this.s_getWalletLists[type])
                }
            }
            this.s_getWalletLists[type] = setTimeout(() => {
                Main.viewMgr.payView.doGetWalletLists()
            }, timeout);
        }

        private async doGetWalletLists() {
            if (this.isLast) {
                return;
            }

            // 获取已确认的订单
            var res = await ApiTool.getWalletListss(Main.user.info.uid, Main.user.info.token, this.page, this.num, Main.netMgr.type, 0);

            if (res.r) {
                if (res.data && res.data.length >= 1) {
                    if (res.data.length < this.num) {
                        this.isLast = true;
                        this.divRecListsMore.textContent = Main.langMgr.get("paylist_noMore") //"没有记录了"
                    }
                    else {
                        this.page += 1;
                        this.divRecListsMore.textContent = Main.langMgr.get("paylist_getMore") //"点击加载更多记录"
                    }

                    // 加载新数据
                    await res.data.forEach(
                        txlist => {
                            // li
                            var txlistObj = this.objCreate("li")
                            txlistObj.onclick = () => {
                                for (var i in this.divRecLists.children) {
                                    if (this.divRecLists.children[i].className == "active") {
                                        this.divRecLists.children[i].classList.remove('active')
                                    }
                                }
                                txlistObj.classList.add("active")
                                this.hidden()
                                PayListDetailView.refer = "PayListMoreView"
                                PayListDetailView.list = txlist;
                                Main.viewMgr.change("PayListDetailView")
                            }


                            


                            
                           

                            

                            // img
                            var gameimg_div = this.objCreate("div")
                            gameimg_div.classList.add("pc_liststate")
                            var img = this.objCreate("img") as HTMLImageElement
                            img.src = Main.viewMgr.payView.getListImg(txlist)
                            this.ObjAppend(gameimg_div, img)
                            this.ObjAppend(txlistObj, gameimg_div)

                            
                            
                          

                             // Tokenname & amount
                            var txcontent_div = this.objCreate("div")
                            txcontent_div.classList.add("pc_txinfo")

                            var tokenname_div = this.objCreate("div")
                            tokenname_div.classList.add("pc_listname")
                            tokenname_div.textContent = Main.viewMgr.payView.getListName(txlist)
                            this.ObjAppend(txcontent_div, tokenname_div)


                            //交易时间
                            var txdate_p = this.objCreate("p")
                            txdate_p .classList.add("pc_method")
                            txdate_p .textContent = Main.viewMgr.payView.getListParamMethods(txlist)
                            this.ObjAppend(txcontent_div, txdate_p )

                            this.ObjAppend(txlistObj, txcontent_div)

                            // cnts 
                            var cnts_div = this.objCreate("div")
                            cnts_div.classList.add("pc_cnts")

                            //数量
                            var txamount_span = this.objCreate("div")
                            txamount_span.classList.add("pc_listdate")
                            txamount_span.textContent = Main.viewMgr.payView.getListCtmMsg(txlist)
                            this.ObjAppend(cnts_div, txamount_span)

                    

                            this.ObjAppend(txlistObj, cnts_div)

                            

                             var cnts = Main.viewMgr.payView.getListCnts(txlist)
                            if (cnts) {
                                this.ObjAppend(cnts_div, cnts);

                                var cnts_class = Main.viewMgr.payView.getListCntsClass(txlist);
                                if (cnts_class) cnts_div.classList.add(cnts_class)
                            }

                            var state = Main.viewMgr.payView.getListState(txlist)
                            if (state) this.ObjAppend(cnts_div, state)

                            this.ObjAppend(txlistObj, cnts_div)

                            

                            this.ObjAppend(this.divRecLists, txlistObj)
                        }
                    );
                }
                else {
                    // 无交易记录
                    this.divRecListsMore.textContent = Main.langMgr.get("paylist_noRecord") //"没有记录信息哦"
                }
            }
            else {
                Main.showErrCode(res.errCode)
            }

        

    
}

        updateBalance() {
            let type_lowcase = PayExchangeShowWalletView.callback_params.type_src.toLowerCase()
            PayExchangeShowWalletView.balance = Main.viewMgr.payView[type_lowcase]
            this.balanceElement.textContent = PayExchangeShowWalletView.balance.toString()
        }

    }
}