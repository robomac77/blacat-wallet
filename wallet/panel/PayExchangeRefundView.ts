/// <reference path="../main.ts" />
/// <reference path="./ViewBase.ts" />

namespace BlackCat {

    export class PayExchangeRefundView extends ViewBase {

        static balance: number;

        private inputTransferCount: HTMLInputElement;
        private inputTransferAddr: HTMLInputElement;

        private divTransferAddr: HTMLDivElement;
        private labelName: HTMLLabelElement;

        private netFeeCom: NetFeeComponent; // 手续费组件

        private net_fee: string // 网络交易费

        static crosschain_fee: string  = "0.0001";// 跨链交易费

        start() {
            super.start()
            this.inputTransferAddr.focus()
        }

        create() {

            this.div = this.objCreate("div") as HTMLDivElement
            this.div.classList.add("pc_popup")

            //弹窗的框 
            var popupbox = this.objCreate('div')
            popupbox.classList.add("pc_popupbox", "pc_transfer")
            this.ObjAppend(this.div, popupbox)

            // 弹窗的标题
            var popupTitle = this.objCreate('div')
            popupTitle.classList.add("pc_popup_title")
            popupTitle.innerText = Main.langMgr.get("pay_exchange_refund_transfer")  + PayExchangeRefundView.callback_params.type_src// "提款"
            this.ObjAppend(popupbox, popupTitle)


            //转账容器
            var divtransfer = this.objCreate("div")
            divtransfer.classList.add("pc_transferbox")
            this.ObjAppend(popupbox, divtransfer)

            // 类型
            var divtransferdiv = this.objCreate("div")
            divtransferdiv.classList.add("pc_transfertype")
            this.ObjAppend(divtransfer, divtransferdiv)


            //输入收款钱包地址
            this.divTransferAddr = this.objCreate("div") as HTMLDivElement
            this.divTransferAddr.classList.add("pc_transfertype")
            this.ObjAppend(divtransfer, this.divTransferAddr)

            // 收款地址
            this.labelName = this.objCreate("label") as HTMLLabelElement
            this.labelName.classList.add("pc_transfername")
            this.ObjAppend(this.divTransferAddr, this.labelName)

            this.inputTransferAddr = this.objCreate("input") as HTMLInputElement
            this.inputTransferAddr.classList.add("pc_transaddress")
            this.inputTransferAddr.placeholder = Main.langMgr.get("pay_exchange_refund_address")
            this.inputTransferAddr.onfocus = () => {
                this.inputTransferAddr.select()
            }
            this.inputTransferAddr.onchange = () => {
                this.divTransferAddr.classList.remove("pc_transfer_active")
                this.inputTransferAddr.style.padding = "0 35px 0 5px"
                this.inputTransferAddr.style.width = "85%"
            }
            this.ObjAppend(this.divTransferAddr, this.inputTransferAddr)



            // 收款金额
            var divTransferCount = this.objCreate("div")
            divTransferCount.classList.add("pc_transfertype")
            this.ObjAppend(divtransfer, divTransferCount)

            this.inputTransferCount = this.objCreate("input") as HTMLInputElement
            this.inputTransferCount.placeholder = Main.langMgr.get("pay_exchange_refund_amount")
            this.ObjAppend(divTransferCount, this.inputTransferCount)

            // 全部
            var getAll = this.objCreate("a")
            getAll.classList.add("pc_transferbalance")
            getAll.textContent = BlackCat.Main.langMgr.get("pay_exchange_refund_all");
            getAll.onclick = () => {
                this.getAll()
            }
            this.ObjAppend(divTransferCount, getAll)

            var divCrosschainfee = this.objCreate("div");
            divCrosschainfee.classList.add("pc_crosschain")
            divCrosschainfee.textContent = BlackCat.Main.langMgr.get("pay_exchange_refund_crosschainfee");
            
            this.ObjAppend(popupbox, divCrosschainfee)



            // 提交交易上链手续费
            this.netFeeCom = new NetFeeComponent(popupbox, (net_fee) => {
                this.netFeeChange(net_fee)
            })
            this.netFeeCom.createDiv()


            // 弹窗按钮外框
            var popupbutbox = this.objCreate('div')
            popupbutbox.classList.add("pc_popupbutbox")
            this.ObjAppend(popupbox, popupbutbox)

            // 取消
            var popupClose = this.objCreate('button')
            popupClose.classList.add("pc_cancel")
            popupClose.textContent = Main.langMgr.get("cancel") // "取消"
            popupClose.onclick = () => {
                this.remove(300)
            }
            this.ObjAppend(popupbutbox, popupClose)

            // 转账确认
            var transferObj = this.objCreate("button")
            transferObj.textContent = Main.langMgr.get("ok") // "确认"
            transferObj.onclick = () => {
                this.doTransfer()   //提款
            }
            this.ObjAppend(popupbutbox, transferObj)

        }

        toRefer() {
            if (PayExchangeRefundView.refer) {
                Main.viewMgr.change(PayExchangeRefundView.refer)
                PayExchangeRefundView.refer = null;
            }
        }

        key_esc() {
            this.doCancel()
        }

        private doCancel() {
            this.return()
        }


        private getAll() {
            this.inputTransferCount.value = PayExchangeRefundView.balance.toString()  //   选全部金额 change to number
        }


        private async doTransfer() {
            // TODO: 检查地址长度
      
            // 检查金额格式
            if (!Main.viewMgr.payView.checkTransCount(this.inputTransferCount.value)) {
                Main.showErrMsg("pay_exchange_refund_amount_error", () => {
                    this.inputTransferCount.focus()
                })
                return;
            }

            // 手续费
            var net_fee = this.net_fee
                        
            // 手续费判断
            if (Number(net_fee) > Main.viewMgr.payView.gas) {
                Main.showErrMsg("pay_exchange_refund_gas_fee_error", () => {
                    this.inputTransferCount.focus()
                })
                return
            }

            // 余额判断
            if (Number(this.inputTransferCount.value) > (Number(PayExchangeRefundView.balance)) - Number(PayExchangeRefundView.crosschain_fee) ){  //扣跨链费
                Main.showErrMsg("pay_exchange_refund_not_enough", () => {
                    this.inputTransferCount.focus()
                })
                return
            }

            Main.viewMgr.change("ViewLoading")

            try {
                var tat_addr = this.inputTransferAddr.value
                var transfer_type = PayExchangeRefundView.callback_params.type_src
                var destroy_addr = tools.CoinTool["id_" + transfer_type + "_DESTROY"]
                var res: Result = await tools.CoinTool.nep5Transaction(Main.user.info.wallet, destroy_addr, tools.CoinTool["id_" + transfer_type], this.inputTransferCount.value, net_fee);
            }
            catch (e) {
                var res = new Result()
                res.err = true;
                res.info = e.toString();

                console.log("[BlaCat]", '[PayExchangeRefundView]', 'doTransfer, tools.CoinTool.rawTransaction error => ', e.toString())
            }


            Main.viewMgr.viewLoading.remove()

            if (res) {
                console.log("[BlaCat]", '[PayExchangeRefundView]', '提款结果 => ', res)
                if (res.err == false) {
                    // 成功，上报
                    await ApiTool.addUserWalletLogs(
                        Main.user.info.uid,
                        Main.user.info.token,
                        res.info,
                        "0",
                        this.inputTransferCount.value,
                        "19",
                        '{"sbPushString":"transfer", "toaddr":"' + tat_addr + '", "count": "' + this.inputTransferCount.value + '", "nnc": "' + tools.CoinTool["id_" + transfer_type] + '"}',
                        Main.netMgr.type, 
                        "0",
                        net_fee,
                        PayTransferView.log_type_detail[transfer_type.toLowerCase()]
                    );

                    this.updateBalance()

                    // "提款操作成功"
                    Main.showInfo("pay_exchange_refund_do_succ")



                    this.remove();
                    if (PayExchangeRefundView.callback) PayExchangeRefundView.callback();
                    PayExchangeRefundView.callback = null;
                }
                else {
                    // 转账失败
                    Main.showErrMsg(("pay_exchange_refund_do_fail"))
                }
            }
            else {
                Main.showErrMsg(("pay_exchange_refund_do_fail"))
            }
        }

        private netFeeChange(net_fee) {
            this.net_fee = net_fee

            var v = this.inputTransferCount.value;
            // 没有输入值，返回
            if (v.length == 0 || v.replace(/(^s*)|(s*$)/g, "").length == 0) {
                return
            }
        }

        private checkTransCount(count: string): boolean {
            var regex = /(?!^0*(\.0{1,2})?$)^\d{1,14}(\.\d{1,8})?$/
            if (!regex.test(count)) {
                return false
            }
            if (Number(count) <= 0) {
                return false
            }
            return true
        }


        private txHash: string = this.getBuyContractHash()  



        private getBuyContractHash() {
            var cHash = ""
            if (tools.CoinTool.hasOwnProperty("id_" + PayExchangeRefundView.callback_params.type)) {
                cHash = tools.CoinTool["id_" + PayExchangeRefundView.callback_params.type]
            }
            return cHash
        }

        private updateBalance(){
            var newBalance = PayExchangeShowWalletView.balance - (Number(this.inputTransferCount.value) + (Number(PayExchangeRefundView.crosschain_fee)))
            PayExchangeShowWalletView.balance = newBalance

            //PayExchangeShowWalletView.balanceElement.textContent = PayExchangeShowWalletView.balance.toString()
        }

    }
}