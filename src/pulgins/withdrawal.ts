import { BotPlugin, GroupRecall, MemberInfo } from "xianyu-robot";
import { WITHDRAWAL_CLOSE_ALERT, WITHDRAWAL_OPEN_ALERT, HELP } from '../constant'

interface GroupCacheMap {
  [key: number]: GroupCache
}
interface GroupCache {
  mems: MemberInfo[],
  switch: boolean,
  timeStep: Date
}
export default class Withdrawal extends BotPlugin {
  group: GroupCacheMap = {}
  constructor(bot: any) {
    super('Withdrawal', bot)
  }

  // 判断qq群缓存是否过期(默认每天刷新一次)
  cacheOutDate(group_id: number) {
    const cache = this.group[group_id]
    if (!cache || !cache.timeStep) return true
    return (+new Date() - +cache.timeStep) > 24 * 60 * 60 * 1000
  }

  // 确认群缓存
  async checkGroupCache(group_id: number) {
    // 没有缓存信息代表是初始化
    if (!this.group[group_id]) {
      this.group[group_id] = {
        mems: await this.Bot.Api.getGroupMemberList(group_id),
        switch: true,
        timeStep: new Date(),
      }
    } else if (this.cacheOutDate(group_id)) {
      this.group[group_id].mems = await this.Bot.Api.getGroupMemberList(group_id)
      this.group[group_id].timeStep = new Date()
    }
  }

  // 私聊返回，测试用
  handlePrivateMsg() {
    this.Bot.Event.on('message.private', ({ message, user_id }) => {
      this.Bot.Api.sendPrivateMsg(user_id, `received. the message is ${message}`)
    })
  }

  parseBotMsg(message: string) {
    const regArr = /^bot(.+)?$/.exec(message)
    return regArr && regArr[1].trim()
  }

  // 发送机器人状态
  async sendBotStatus(group_id: number) {
    await this.checkGroupCache(group_id)
    this.Bot.Api.sendGroupMsg(group_id, this.group[group_id].switch ? `防撤回功能运作中` : `防撤回功能已关闭`)
  }


  // 监听群消息，开关
  handleGroupMsg() {
    this.Bot.Event.on('message.group', async ({ message, group_id }) => {
      const commander = this.parseBotMsg(message)
      if (!commander) return
      console.log('[BOT] get commander > ', commander)
      switch (commander) {
        case 'on':
          await this.checkGroupCache(group_id)
          this.group[group_id].switch = true
          this.Bot.Api.sendGroupMsg(group_id, WITHDRAWAL_OPEN_ALERT)
          break;
        case 'off':
          await this.checkGroupCache(group_id)
          this.group[group_id].switch = false
          this.Bot.Api.sendGroupMsg(group_id, WITHDRAWAL_CLOSE_ALERT)
          break;
        case 'status':
          this.sendBotStatus(group_id)
          break;
        default:
          this.Bot.Api.sendGroupMsg(group_id, HELP)
      }
    })
  }
  // 发送撤回的消息
  handleGroupRecall() {
    this.Bot.Event.on('notice.group_recall', async ({ operator_id, message_id, group_id }: GroupRecall) => {
      await this.checkGroupCache(group_id)
      if (!this.group[group_id].switch) return
      this.Bot.Api.getMsg(message_id).then((m) => {
        if (m) {
          const { sender, message } = m
          const operator = this.group[group_id].mems?.find(m => m.user_id === operator_id)
          const senderGroupMsg = this.group[group_id].mems.find(m => m.user_id === sender.user_id)
          let msg;
          if (operator) {
            if (operator.nickname === sender.nickname) {
              msg = `${operator.card || operator.nickname}撤回了：${message}`
            } else {
              msg = `${operator.nickname || operator.card}撤回了${sender.nickname || senderGroupMsg?.card }的消息：${message}`
            }
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

  init = () => {
    this.handlePrivateMsg()
    this.handleGroupRecall()
    this.handleGroupMsg()
  }
}