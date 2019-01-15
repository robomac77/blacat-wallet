/// <reference path="../main.ts" />
/// <reference path="./ViewBase.ts" />






namespace BlackCat {
    
    export class BuyExchangePurchaseView extends ViewBase {

        static balance: number;

       

        private inputPrice: HTMLInputElement
        private inputAmount:HTMLInputElement;
        private inputassetSearch:HTMLInputElement

        private buyPriceTable:HTMLTableElement;
        private sellPriceTable:HTMLTableElement;

        private selectGas: HTMLSelectElement;
        private selectToken:HTMLSelectElement;

        private s_getWalletLists = {};


        wallet_addr: string
        wallet_addr_other: any


        height_clis: number;
        private divHeight_clis: HTMLElement;
        height_nodes: number;
        private divHeight_nodes: HTMLElement;

        // 记录每页显示数量
        listPageNum: number;

       
        private divNetSelect: HTMLElement;

        private assettabDiv;
        private buyintabDiv;


        start() {
            super.start()
             
             this.assettabDiv.hidden()
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

            var myAssetspan = this.objCreate("div")
            myAssetspan.innerText = Main.langMgr.get("buy_exchange_purchase_myasset")
            
            myAssetspan.onclick = () => {
                buyInspan.classList.remove("active")
                this.buyintabDiv.remove()

                myAssetspan.classList.add("active")
                //this.assettabDiv.display()
             }
            this.ObjAppend(divexTab,myAssetspan)

            var buyInspan = this.objCreate("div")
            buyInspan.classList.add("active")
            buyInspan.innerText = Main.langMgr.get("buy_exchange_purchase_buyin") 
            
        
             buyInspan.onclick = () => {
                buyInspan.classList.add("active")
                this.assettabDiv.remove()
                myAssetspan.classList.remove("active")
                //this.assettabDiv.display()
             }

            

            this.ObjAppend(divexTab,buyInspan)
            

            var sellOutspan = this.objCreate("div")
            sellOutspan.innerText = Main.langMgr.get("buy_exchange_purchase_sellout") 
            
            this.ObjAppend(divexTab,sellOutspan)

            var tradeLogspan = this.objCreate("div")
            tradeLogspan.innerText = Main.langMgr.get("buy_exchange_purchase_tradelog") 
            this.ObjAppend(divexTab,tradeLogspan)

            this.buyintabDiv = this.objCreate("div") 
            this.buyintabDiv.classList.add("pc_exchangetab")
            this.ObjAppend(this.div,this.buyintabDiv)
           

            

             var divSelectBox = this.objCreate("div")
            divSelectBox.classList.add("pc_exleftpane")
            this.ObjAppend(this.buyintabDiv,divSelectBox)

            var divSelectToken = this.objCreate("div")
            divSelectToken.classList.add("selecttoken")  
            divSelectToken.innerText = Main.langMgr.get("buy_exchange_purchase_selecttoken") 
            this.ObjAppend(divSelectBox,divSelectToken)

            

            this.selectToken = this.objCreate("select") as HTMLSelectElement
            this.selectToken.classList.add("tokenoption")
            var tokenType = AreaView.getAreaByLang(Main.langMgr.type)
              tokenType.forEach(
                token => {
                    var tokenoption = this.objCreate("option") as HTMLOptionElement;
                    tokenoption.setAttribute("value", token.codename);
                    tokenoption.textContent = Main.langMgr.get("token_type_" + token.codename)
                    if (token.codename == "CN") {
                        tokenoption.setAttribute("selected", "selected")
                    }
                    this.selectToken.options.add(tokenoption)

                }
            )
            this.selectToken.onchange = () => {
                tokenType.forEach(
                    token => {
                       // if (area.codename == this.selectArea.value) {
                        //    this.divArea.textContent = area.areacode
                     //   }
                    }
                )
            }
            this.ObjAppend(divSelectToken, this.selectToken)

            

            var divDayGraph = this.objCreate("div")
            divDayGraph.classList.add("daygraph")
            this.ObjAppend(divSelectBox,divDayGraph)

            var chartDiv = this.objCreate("div")
            chartDiv.classList.add("chart")
            this.ObjAppend(divDayGraph, chartDiv)

             /*   var myChart = echarts.init(chartDiv);
                option = {
                grid: {
                    left: 0,
                    right: 0
                },
                xAxis: {
                    type: 'category',
                    axisLine: false,
                    boundaryGap: false,
                },
                yAxis: {
                    type: 'value',
                    axisLine: false,
                    splitLine: false,
                },
                series: [{
                    data: vmm.dataList[key]["7D"],
                    type: 'line',
                    areaStyle: {},
                    symbolSize: 0,
                    itemStyle: {
                    normal: {
                        color: '#eee',
                        borderColor: '#1295e5',
                        lineStyle: {
                        color: "#1295e5"
                        },
                    }
                    }
                }]
                };
            myChart.setOption(option);*/

           
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
            
            
            var gasSelect = this.objCreate("div")
            gasSelect.classList.add("gasselect")
            gasSelect.textContent = Main.langMgr.get("buy_exchange_purchase_gas") 
            this.ObjAppend(divSelectBox,gasSelect)
            

            this.selectGas = this.objCreate("select") as HTMLSelectElement
            this.selectGas.classList.add("gasoption")
            var gasAmount = AreaView.getAreaByLang(Main.langMgr.type)
              gasAmount.forEach(
                gas => {
                    var gasoption = this.objCreate("option") as HTMLOptionElement;
                    gasoption.setAttribute("value", gas.codename);
                    gasoption.textContent = Main.langMgr.get("gas_amount_" + gas.codename)
                    if (gas.codename == "CN") {
                        gasoption.setAttribute("selected", "selected")
                    }
                    this.selectGas.options.add(gasoption)

                }
            )
            this.selectGas.onchange = () => {
                gasAmount.forEach(
                    gas => {
                       // if (area.codename == this.selectArea.value) {
                        //    this.divArea.textContent = area.areacode
                     //   }
                    }
                )
            }
            this.ObjAppend(gasSelect, this.selectGas)
           


            var butBuyIn = this.objCreate("button")
            butBuyIn.classList.add("buybutton")
            butBuyIn.textContent = Main.langMgr.get("buy_exchange_purchase_buyin") 
            butBuyIn.onclick = () => {
               // this.doMakeReceivables()
            }
            this.ObjAppend(divSelectBox, butBuyIn)


            var divRightPane = this.objCreate("div")
            divRightPane.classList.add("pc_exrightpane")
            this.ObjAppend(this.buyintabDiv,divRightPane)
   
            var divTitleBar = this.objCreate("div")
             divTitleBar.classList.add("titlebar")
            this.ObjAppend(divRightPane,divTitleBar)


            var divBuyTable = this.objCreate("div")
             divBuyTable.classList.add("pc_buytable")
            this.ObjAppend(divRightPane,divBuyTable)

            this.buyPriceTable = this.objCreate("div") as HTMLTableElement
            this.ObjAppend(divBuyTable,this.buyPriceTable)


            var divSellTable = this.objCreate("div")
            divSellTable.classList.add("pc_selltable")
           this.ObjAppend(divRightPane,divSellTable)

           //TODO: sell price amount table here
           this.sellPriceTable = this.objCreate("div") as HTMLTableElement
           this.ObjAppend(divSellTable,this.sellPriceTable)



            var divPriceTitle = this.objCreate("div")
             divPriceTitle.classList.add("price")
             divPriceTitle.textContent = Main.langMgr.get("buy_exchange_purchase_price") 
            this.ObjAppend(divTitleBar,divPriceTitle)

           // var divAmountTitle = this.objCreate("span")
            // divAmountTitle.classList.add("amount")
            // divAmountTitle.textContent = Main.langMgr.get("buy_exchange_purchase_amount") 
          //  this.ObjAppend(divTitleBar,divAmountTitle)

            this.assettabDiv = this.objCreate("div") 
            this.assettabDiv.classList.add("pc_exchangetab")
            this.ObjAppend(this.div,this.assettabDiv)

            
 
              //SearchBar
            var divassetSearch = this.objCreate("div")
            divassetSearch.classList.add("pc_assetsearch")
            this.ObjAppend(this.assettabDiv, divassetSearch)

            var iassetSearch = this.objCreate("i")
            iassetSearch.classList.add("iconfont", "icon-bc-sousuo")
            this.ObjAppend(divassetSearch, iassetSearch)

            //搜索input
            this.inputassetSearch = this.objCreate("input") as HTMLInputElement
            this.inputassetSearch.placeholder = Main.langMgr.get("buy_exchange_purchase_assetsearch") // "搜索"
            this.inputassetSearch.onkeyup = () => {
               // this.searchAddressbook()
            }
            this.ObjAppend(divassetSearch, this.inputassetSearch)  
     
            var titleDiv = this.objCreate("div")
            titleDiv.classList.add("pc_tokentitle")
            this.ObjAppend(this.assettabDiv, titleDiv)


            var tokenSpan = this.objCreate("span");
            tokenSpan.classList.add("tokentype")
            tokenSpan.textContent = BlackCat.Main.langMgr.get("buy_exchange_purchase_tokentype");
            this.ObjAppend(titleDiv, tokenSpan)

            var exBalanceSpan = this.objCreate("span");
            exBalanceSpan.classList.add("exbalance")
            exBalanceSpan.textContent = BlackCat.Main.langMgr.get("buy_exchange_purchase_exchangetitle");
            this.ObjAppend(titleDiv, exBalanceSpan)


            var walletBalanceSpan = this.objCreate("span");
            walletBalanceSpan.classList.add("walbalance")
            walletBalanceSpan.textContent = BlackCat.Main.langMgr.get("buy_exchange_purchase_wallettitle");
            this.ObjAppend(titleDiv, walletBalanceSpan)



            var divAssetList = this.objCreate("div")
            divAssetList.classList.add("pc_assetlist")
           // divAssetList.style.display = "none"
            this.ObjAppend(this.assettabDiv, divAssetList)



            // 数字币种具体
            for (let i = 0; i < PayView.tokens.length; i++) {
                let coin = PayView.tokens[i]



                let assetElement = this.objCreate("div")
                 //assetElement.classList.add("assetspan")
                // 名称
                assetElement.innerHTML = Main.langMgr.get(coin)
                this.ObjAppend(divAssetList, assetElement)

                var assetBalance = this.objCreate("span")
                assetBalance.classList.add("assetspan")
                assetBalance.textContent = "0"
                this.ObjAppend(assetElement, assetBalance)

                var walletBalance = this.objCreate("span")
                walletBalance.textContent = "0"
                this.ObjAppend(assetElement, walletBalance)
              
                // 字体图标">"
                let moreElement = this.objCreate("i")
                moreElement.classList.add("morelement")
                moreElement.classList.add("iconfont", "icon-bc-gengduo")
                this.ObjAppend(assetElement, moreElement)


                // 余额
               
                // 点击事件
                assetElement.onclick = () => {
                BuyExchangeDepositView.refer = ""
                BuyExchangeDepositView.callback_params = BuyExchangePurchaseView.callback_params
                BuyExchangeDepositView.balance = BuyExchangePurchaseView.balance

                Main.viewMgr.change("BuyExchangeDepositView")

                }
                
                
            }  
            

         


            



            

                  

                  
            
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