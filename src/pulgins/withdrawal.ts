import { BotPlugin, GroupRecall, MemberInfo } from "xianyu-robot";

interface GroupCacheMap {
  [key: number]: GroupCache
}
interface GroupCache {
  mems: MemberInfo[],
  switchs: boolean,
  timeStep: Date
}
export default class Withdrawal extends BotPlugin {
  group: GroupCacheMap = {}
  constructor(bot: any) {
    super('Withdrawal', bot)
  }

  cacheOutDate(group_id: number) {
    const cache = this.group[group_id]
    if (!cache || !cache.timeStep) return true
    return (+new Date() - +cache.timeStep) > 24 * 60 * 60 * 1000
  }

  init = () => {
    this.Bot.Event.on('message.private', ({message, user_id}) => {
      this.Bot.Api.sendPrivateMsg(user_id, `received. the message is ${message}`)
    })

    this.Bot.Event.on('notice.group_recall', async ({ operator_id, message_id, group_id }: GroupRecall) => {
      // 没有缓存信息代表是初始化
      if (!this.group[group_id]) {
        this.group[group_id] = {
          mems: await this.Bot.Api.getGroupMemberList(group_id),
          switchs: false,
          timeStep: new Date(),
        }
      } else if (this.cacheOutDate(group_id)) {
        this.group[group_id].mems = await this.Bot.Api.getGroupMemberList(group_id)
        this.group[group_id].timeStep = new Date()
      }
      this.Bot.Api.getMsg(message_id).then((m) => {
        if (m) {
          const { sender, message } = m
          const operator = this.group[group_id].mems?.find(m => m.user_id === operator_id)
          let msg;
          if (operator) {
            msg = `${operator.card || operator.nickname}撤回了${sender.nickname}的消息：${message}`
          } else {
            msg = `？？？撤回了${sender.nickname}的消息：${message}`
          }
          this.Bot.Api.sendGroupMsg(group_id, msg)
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