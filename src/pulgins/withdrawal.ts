import { BotPlugin, GroupRecall, MemberInfo } from "xianyu-robot";

interface GroupCache {
  [key: number]: MemberInfo[]
}
export default class Widhdrawal extends BotPlugin {
  group: GroupCache = {}
  constructor(bot: any) {
    super('Withdrawal', bot)
  }

  init = () => {
    if (!this.group) {
    }
    this.Bot.Event.on('message.private', ({message, user_id}) => {
      this.Bot.Api.sendPrivateMsg(user_id, `received. the message is ${message}`)
    })

    this.Bot.Event.on('notice.group_recall', async ({ user_id, message_id, group_id }: GroupRecall) => {
      if (!this.group[group_id]) {
        this.group[group_id] = await this.Bot.Api.getGroupMemberList(group_id)
      }
      this.Bot.Api.getMsg(message_id).then((m) => {
        if (m) {
          const { sender, message } = m
          this.Bot.Api.sendGroupMsg(group_id, `${sender.nickname}（${this.group[group_id]?.find(m => m.user_id === user_id)?.card}）撤回：${message}`)
            .catch(e => {
              throw e
            })
        }
      }).catch(e => {
        console.error(e)
        this.Bot.Api.sendGroupMsg(group_id, `还原失败。你逃过一劫啊。`)
      })
    })
  }
}