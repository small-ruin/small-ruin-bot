import { BotPlugin, GroupMsg } from 'xianyu-robot';
import minimist, { ParsedArgs } from 'minimist';
import { getLogs, search, getAdventures} from './request'
import { Adventure, Log } from './interface';

const baseUrl = process.env.BASE_URL

type Command = 'list' | 'search'

export default class SmallRuin extends BotPlugin {
  constructor(bot: any) {
    super('small-ruin', bot);
  }

  handleSmallRuinCommand(e: GroupMsg) {
    const argv = minimist(e.message.split(' ').slice(1))

    const command: string = argv._[0] || ''

    switch (command as Command) {
      case 'list':
        this.handleList(argv, e)
        break
      case 'search':
        this.handleSearch(argv, e)
        break
      default:
        this.Bot.Api.sendGroupMsg(e.group_id, `未知指令: ${command}`)
    }
  }

  parseArgv(argv: ParsedArgs) {
    return {
      latest: argv.latest || argv.e,
      limit: argv.limit || argv.l,
      url: argv.url || argv.u,
    }
  }

  getLogMsg(logs: Log[], url: boolean, limit?: number) {
    let msg;
    if (url) {
      msg = logs.map(log => `${log.name}：${baseUrl}/log/${log.id}`).join('\n')
    } else {
      msg = logs.map(log => log.name).join('\n')
    }
    if (limit) msg = `最新${logs.length > limit ? limit : logs.length}条：\n` + msg
    return msg
  }

  getAdventureMsg(adventures: Adventure[], url: boolean) {
    if (url) {
      return adventures.map(adv => `${adv.name}: ${baseUrl}/adventure/${adv.id}`).join('\n')
    } else {
      return baseUrl + '\n' + adventures.map(adv => `${adv.name}`).join('\n')
    }
  }

  async handleList(argv: ParsedArgs, e: GroupMsg) {
    const { latest, limit = 10, url } = this.parseArgv(argv);
    const adventureName = argv._[1]

    try {
      if (adventureName) {
        console.log(adventureName, latest, limit)
        const logsRes = await getLogs(adventureName, latest, limit)
        if (logsRes?.data && logsRes.data.length !== 0) {
          this.Bot.Api.sendGroupMsg(e.group_id, this.getLogMsg(logsRes.data, url, limit))
        } else {
          this.Bot.Api.sendGroupMsg(e.group_id, '未命中')
        }
        return
      }
  
      const adventureRes = await getAdventures()
      if (adventureRes && adventureRes.data?.length >= 0) {
        return this.Bot.Api.sendGroupMsg(e.group_id, this.getAdventureMsg(adventureRes.data, url))
      }
  
      this.Bot.Api.sendGroupMsg(e.group_id, '错误')
    } catch(e) {
      console.error(e)
    }
  }
  async handleSearch(argv: ParsedArgs, e: GroupMsg) {
    const { url } = this.parseArgv(argv)
    const adventureName = argv._[1]
    const key = argv._[2]
    if (!adventureName || !key) {
      return this.Bot.Api.sendGroupMsg(e.group_id, '用法：sm search <adventure name> <keyword>')
    }
    try {
      const logsRes = await search(adventureName, key) 
      if (logsRes.data?.length !== 0) {
        return this.Bot.Api.sendGroupMsg(e.group_id, this.getLogMsg(logsRes.data, true))
      }
      return this.Bot.Api.sendGroupMsg(e.group_id, '未命中')
    } catch {
      return this.Bot.Api.sendGroupMsg(e.group_id, '出错了')
    }
  }

  init () {
    console.log('baseUrl:', baseUrl)
    this.Bot.Command
      .command('small-ruin')
      .reg(/^sm/)
      .desc('小废墟')
      .action('group', e => {
        this.handleSmallRuinCommand(e)
      })
  }
}