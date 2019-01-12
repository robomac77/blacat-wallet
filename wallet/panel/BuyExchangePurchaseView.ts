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

        private inputPrice: HTMLInputElement
        private inputAmount:HTMLInputElement;

        private selectGas: HTMLSelectElement;

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

            var myAssetspan = this.objCreate("div")
            myAssetspan.classList.add("active")
            myAssetspan.textContent = "我的资产"
            this.ObjAppend(divexTab,myAssetspan)

            var buyInspan = this.objCreate("div")
            buyInspan.textContent = "买入"
            this.ObjAppend(divexTab,buyInspan)

            var sellOutspan = this.objCreate("div")
            sellOutspan.textContent = "卖出"
            this.ObjAppend(divexTab,sellOutspan)

            var tradeLogspan = this.objCreate("div")
            tradeLogspan.textContent = "交易记录"
            this.ObjAppend(divexTab,tradeLogspan)

            var tabDiv = this.objCreate("div") 
            tabDiv.classList.add("pc_exchangetab")
            this.ObjAppend(this.div,tabDiv)
           

            

             var divSelectBox = this.objCreate("div")
            divSelectBox.classList.add("pc_exleftpane")
            this.ObjAppend(tabDiv,divSelectBox)

            var divSelectToken = this.objCreate("div")
            divSelectToken.classList.add("selecttoken")  
            divSelectToken.innerText = Main.langMgr.get("buy_exchange_purchase_selecttoken") 
            this.ObjAppend(divSelectBox,divSelectToken)

            var divDayGraph = this.objCreate("div")
            divDayGraph.classList.add("daygraph")
            this.ObjAppend(divSelectBox,divDayGraph)

            var divPriceBar = this.objCreate("div")
            divPriceBar.classList.add("pricebar")
            this.ObjAppend(divSelectBox,divPriceBar)

            this.inputPrice = this.objCreate("input") as HTMLInputElement
            this.inputPrice.placeholder = Main.langMgr.get("buy_exchange_purchase_inputpriceplaceholder") 
            this.inputPrice.onkeyup = () => {
                //this.searchAddressbook()
            }
            this.ObjAppend(divPriceBar, this.inputPrice)

            var divAmountBar = this.objCreate("div")
            divAmountBar.classList.add("amountbar")
            this.ObjAppend(divSelectBox,divAmountBar)

            this.inputAmount = this.objCreate("input") as HTMLInputElement
            this.inputAmount.placeholder = Main.langMgr.get("buy_exchange_purchase_inputamountplaceholder") 
            this.inputAmount.onkeyup = () => {
                //this.searchAddressbook()
            }
            this.ObjAppend(divAmountBar, this.inputAmount)

            var divCountBar = this.objCreate("div")
            divCountBar.classList.add("countbar")
            this.ObjAppend(divSelectBox,divCountBar)

           /*
            this.selectGas = this.objCreate("select") as HTMLSelectElement
            var gasAmount = AreaView.getAreaByLang(Main.langMgr.type)
              gasAmount.forEach(
                gas => {
                    var gasoption = this.objCreate("option") as HTMLOptionElement;
                    option.setAttribute("value", area.codename);
                    option.textContent = Main.langMgr.get("gas_amount_" + area.codename)
                    if (area.codename == "CN") {
                        option.setAttribute("selected", "selected")
                    }
                    this.selectGas.options.add(option)

                }
            )
            this.selectGas.onchange = () => {
                gasAmount.forEach(
                    gas => {
                        if (area.codename == this.selectArea.value) {
                            this.divArea.textContent = area.areacode
                        }
                    }
                )
            }
            this.ObjAppend(areaSelect, this.selectArea)
           */


            var butBuyIn = this.objCreate("button")
            butBuyIn.classList.add("buybutton")
            butBuyIn.textContent = Main.langMgr.get("buy_exchange_purchase_buyin") 
            butBuyIn.onclick = () => {
               // this.doMakeReceivables()
            }
            this.ObjAppend(divSelectBox, butBuyIn)


            var divRightPane = this.objCreate("div")
            divRightPane.classList.add("pc_exrightpane")
            this.ObjAppend(tabDiv,divRightPane)
   
            var divTitleBar = this.objCreate("div")
             divTitleBar.classList.add("titlebar")
            this.ObjAppend(divRightPane,divTitleBar)


            var divBuyTable = this.objCreate("div")
             divBuyTable.classList.add("pc_buytable")
            this.ObjAppend(divRightPane,divBuyTable)

            var divSellTable = this.objCreate("div")
            divSellTable.classList.add("pc_selltable")
           this.ObjAppend(divRightPane,divSellTable)



            var divPriceTitle = this.objCreate("div")
             divPriceTitle.classList.add("price")
             divPriceTitle.textContent = Main.langMgr.get("buy_exchange_purchase_price") 
            this.ObjAppend(divTitleBar,divPriceTitle)

           // var divAmountTitle = this.objCreate("span")
            // divAmountTitle.classList.add("amount")
            // divAmountTitle.textContent = Main.langMgr.get("buy_exchange_purchase_amount") 
          //  this.ObjAppend(divTitleBar,divAmountTitle)

            


            


 


            

                  
            
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