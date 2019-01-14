/// <reference path="../main.ts" />
/// <reference path="./ViewBase.ts" />

namespace BlackCat {
    
    export class BuyExchangeDepositView extends ViewBase {

        static balance: number;

       

        
        private inputCount:HTMLInputElement;
        

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

        // 钱包记录
        private walletListsHash: string;


        private divLists: HTMLDivElement;
        private divRecLists: HTMLDivElement
        private divListsMore: HTMLElement;
        private divRecListsMore: HTMLElement;
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

            var depositSpan = this.objCreate("div")
            depositSpan.classList.add("active")

            depositSpan.textContent = "存入"
            this.ObjAppend(divexTab,depositSpan)

            var withdrawSpan = this.objCreate("div")
            withdrawSpan.textContent = "取出"
            this.ObjAppend(divexTab,withdrawSpan)


            

            var divExBalanceBar = this.objCreate("div")
            divExBalanceBar.classList.add("pc_exchangebalance")
            this.ObjAppend(this.div,divExBalanceBar)

            var divExBalanceLabel = this.objCreate("span")
            divExBalanceLabel.textContent = Main.langMgr.get("buy_exchange_purchase_exchangebalance") 
            this.ObjAppend(divExBalanceBar,divExBalanceLabel)
            

            var exchangeAmount = this.objCreate("centerlabel")
            exchangeAmount.textContent = "0"
            this.ObjAppend(divExBalanceBar, exchangeAmount)

            var exchangeCount = this.objCreate("rightlabel")
            exchangeCount.textContent = "0"
            this.ObjAppend(divExBalanceBar,exchangeCount)

            
             

            var divwalletBalanceBar = this.objCreate("div")
            divwalletBalanceBar.classList.add("pc_exchangebalance")
            this.ObjAppend(this.div,divwalletBalanceBar)

            var divwalletBalanceLabel = this.objCreate("span")
            divwalletBalanceLabel.textContent = Main.langMgr.get("buy_exchange_purchase_walletbalance") 
            this.ObjAppend(divwalletBalanceBar,divwalletBalanceLabel)
            

            var walletAmount = this.objCreate("centerlabel")
            walletAmount.textContent = "0"
            this.ObjAppend(divwalletBalanceBar, walletAmount)

            var walletCount = this.objCreate("rightlabel")
            walletCount.textContent = "0"
            this.ObjAppend(divwalletBalanceBar,walletCount)




            var divCountBar = this.objCreate("div")
            divCountBar.classList.add("pc_exchangebalance") 
            this.ObjAppend(this.div,divCountBar)


            this.inputCount = this.objCreate("input")as HTMLInputElement
            this.inputCount.placeholder = Main.langMgr.get("buy_exchange_purchase_depositamount") 
            this.inputCount.onkeyup = () => {
                //this.searchAddressbook()
            }
            this.ObjAppend(divCountBar, this.inputCount)


           /* var divgasLabel = this.objCreate("label")
            divgasLabel.textContent = Main.langMgr.get("buy_exchange_purchase_gas") 
            this.ObjAppend(this.div,divgasLabel)*/
            

            var butConfirmDeposit = this.objCreate("button")
             butConfirmDeposit.classList.add("depositbutton")
            butConfirmDeposit.textContent = Main.langMgr.get("buy_exchange_purchase_confirmdeposit") 
            butConfirmDeposit.onclick = () => {
               // this.doMakeReceivables()
            }
            this.ObjAppend(this.div, butConfirmDeposit)
 
            





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
    