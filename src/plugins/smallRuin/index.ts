import { BotPlugin, GroupMsg, PrivateMsg } from 'xianyu-robot';
import minimist, { ParsedArgs } from 'minimist';
import cheerio from 'cheerio';
import { getLogs, search, getAdventures, searchInLog} from './request'
import { Adventure, Log } from './interface';
import { HELP_SM, HELP_SUFFIX } from '../../constant';
import MessageManger from '../../core/Message';

// @ts-ignore
const baseUrl = process.env.BASE_URL

type Command = 'list' | 'search' | 'help'

export default class SmallRuin extends BotPlugin {
  name = 'small-ruin'
  mm = new MessageManger(this.Bot)

  handleSmallRuinCommand(e: GroupMsg | PrivateMsg) {
    const argv = minimist(e.message.split(' ').slice(1))

    const command: string = argv._[0] || ''

    switch (command as Command) {
      case 'list':
        this.handleList(argv, e)
        break
      case 'search':
        this.handleSearch(argv, e)
        break
      case 'help':
        this.mm.print(e, HELP_SUFFIX + HELP_SM)
        break
      default:
        this.mm.print(e, `未知指令: ${command}`)
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

  async handleList(argv: ParsedArgs, e: GroupMsg | PrivateMsg) {
    const { latest, limit = 10, url } = this.parseArgv(argv);
    const adventureName = argv._[1]

    try {
      if (adventureName) {
        const logsRes = await getLogs(adventureName, latest, limit)
        if (logsRes?.data && logsRes.data.length !== 0) {
          this.mm.print(e, this.getLogMsg(logsRes.data, url, limit))
        } else {
          this.mm.print(e, '未命中')
        }
        return
      }
  
      const adventureRes = await getAdventures()
      if (adventureRes && adventureRes.data?.length >= 0) {
        return this.mm.print(e, this.getAdventureMsg(adventureRes.data, url))
      }
  
      this.mm.print(e, '错误')
    } catch(e) {
      console.error(e)
    }
  }
  async handleSearch(argv: ParsedArgs, e: GroupMsg | PrivateMsg) {
    const adventureName = argv._[1]
    let logName: string | null = argv._[2]
    let key = argv._[3]
    if (!key) {
      key = logName
      logName = null
    }
    if (!adventureName || !key) {
      return this.mm.print(e, '用法：sm search <adventure name> [log name] <keyword>')
    }
    try {
      if (logName) {
        const logRes = await searchInLog(adventureName, key, logName)
        const log = logRes.data[0]
        let htmlStr = log?.content
        if (htmlStr) {
          htmlStr = htmlStr.substr(3, htmlStr.length - 3);
          const $ = cheerio.load(htmlStr);
          const result: string[] = [];
          let count = 0;
          $('font, p').each(function() {
              const text = $(this).html();
              if (text && text.indexOf(key) !== -1 && count < 1000) {
                  result.push(text.replace('&lt;', '<').replace('&gt;', '>'));
                  count += text.length;
              }
          })
          
          let msg = `${this.getLogMsg([log], true)}\n${result.join('\n')}`
          if (count > 1000) {
            msg += '\n--------\n更多命中项请在log中确认。'
          }

          return this.mm.print(e, msg)
        }
      } else {
        const logsRes = await search(adventureName, key) 
        if (logsRes.data?.length !== 0) {
          return this.mm.print(e, this.getLogMsg(logsRes.data, true))
        }
      }
      return this.mm.print(e, '未命中')
    } catch(error) {
      console.log(error)
      return this.mm.print(e, '出错了:' + error)
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
      .action('private', e => {
        this.handleSmallRuinCommand(e)
      })
  }
}