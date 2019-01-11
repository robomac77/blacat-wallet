/// <reference path="../main.ts" />
/// <reference path="./ViewBase.ts" />

namespace BlackCat {
    
    export class BuyExchangePurchaseView extends ViewBase {

        static balance: number;

        private balanceElement : HTMLElement

        private abcbalanceElement : HTMLElement

        private recentElement: HTMLElement

        private reclistsDiv: HTMLElement;
        private recgetMoreDiv: HTMLDivElement;

        private s_getWalletLists = {};


        wallet_addr: string
        wallet_addr_other: any


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



        static tokens_coin: Array<Array<string>> = [
            ["bct", "bcp"],
            ["gas", "cgas", "neo", "cneo"],
            ["btc", "eth"],
        ]
        // === 老币种
        static tokens_old: Object = {
            neo: ["cgas", "cneo"],
        }





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
            
            
            var divpageSelect = this.objCreate("div")
            divpageSelect.classList.add("pc_pageselect")
            this.ObjAppend(this.div , divpageSelect)


            var divexPages = this.objCreate("div")
            divexPages.classList.add("pc_excurrency")
            this.ObjAppend(divpageSelect, divexPages)

            
            var divexTab = this.objCreate("div")
            divexTab.classList.add("pc_excurrencynumber")
            this.ObjAppend(divexPages, divexTab)

            /*for (let i = 0; i < BuyExchangeView.exTabs.length; i++) {
                    let tab = BuyExchangeView.exTabs[i]
    
                    // 导航栏
                    this["token_" + tab] = this.objCreate("div")
                    this["token_" + tab].innerText = Main.langMgr.get("pay_coin_" + tab)
                    this["token_" + tab].onclick = () => {
                        this.changeToken(tab);
                    }
                    this.ObjAppend(divexTab, this["token_" + tab])*/
             

            for (let i = 0; i < PayView.tokens.length; i++) {
                let token = PayView.tokens[i]

                
                this["token_" + token] = this.objCreate("div")
                this["token_" + token].innerText = Main.langMgr.get("pay_coin_" + token)
                this["token_" + token].onclick = () => {
                    this.changeToken(token);
                }
                this.ObjAppend(divexTab, this["token_" + token])

    
                 
                this["token_list_" + token] = this.objCreate("div")
                this["token_list_" + token].classList.add("pc_tablist")
                this["token_list_" + token].style.display = "none"
                this.ObjAppend(divexPages, this["token_list_" + token])


                

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
                }
                    /*
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
               
               */        
             
              
               }


               this["token_" + PayView.tokens[0]].classList.add("active")


            

                  
            
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

    private changeToken(type: string) {
        let types = ['blact', 'neo', 'other']
        for (let i = 0; i < types.length; i++) {
            this["token_list_" + types[i]].style.display = "none"
            this["token_" + types[i]].classList.remove("active")
        }
        this["token_list_" + type].style.display = "block"
        this["token_" + type].classList.add("active")
    }

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



}


}