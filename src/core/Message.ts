import { Bot, GroupMsg, PrivateMsg } from "xianyu-robot"

export default class MessageManger {
    Bot: Bot
    constructor(bot: Bot) {
        this.Bot = bot
    }
    /**
     * 根据传入的消息，返回信息。可以应对私聊或者群消息。
     * @param e 传入的信息
     * @param ms 需要传送的消息，可以是数组
     * @returns void
     */
    print(e: GroupMsg | PrivateMsg, ms: string | string[] | undefined) {
        if (!ms) return
        if (Array.isArray(ms)) {
            const f = setInterval(() => {
                this.print(e, ms.shift())
                if (ms.length === 0)
                    clearInterval(f)
            }, 1000)
        } else {
            if ((<GroupMsg>e).group_id) {
                this.Bot.Api.sendGroupMsg((<GroupMsg>e).group_id, ms)
            } else {
                this.Bot.Api.sendPrivateMsg((<PrivateMsg>e).user_id, ms)
            }
        }
    }
    privatePrint(userId: number, ms: string | string[] | undefined) {
        if (!ms) return
        if (Array.isArray(ms)) {
            const f = setInterval(() => {
                this.privatePrint(userId, ms.shift())
                if (ms.length === 0)
                    clearInterval(f)
            }, 1000)
        } else {
            this.Bot.Api.sendPrivateMsg(userId, ms)
        }
    }
    groupPrint(groupId: number, ms: string | string[] | undefined) {
        if (!ms) return
        if (Array.isArray(ms)) {
            const f = setInterval(() => {
                this.groupPrint(groupId, ms.shift())
                if (ms.length === 0)
                    clearInterval(f)
            }, 1000)
        } else {
            this.Bot.Api.sendGroupMsg(groupId, ms)
        }
    }
}
export { MessageManger }