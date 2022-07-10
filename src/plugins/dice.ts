import minimist from "minimist";
import { BotPlugin, GroupMsg, PrivateMsg } from "xianyu-robot";
import { HELP_DICE, HELP_SUFFIX } from "../constant";
import MessageManger from "../core/Message";
import Speaker from "../dice/speaker";

type Command = 'save' | 's' | 'exec' | 'e' | 'list' | 'l' | 'expect' | 'ma' | 'delete' | 'd' | 'clear' | 'c' | 'help'

export default class DicePlugin extends BotPlugin {
    name = 'dice'
    speakers: Record<number, Speaker> = {}
    mm = new MessageManger(this.Bot)
    getSpeaker(id: number) {
        if (this.speakers[id]) {
            return this.speakers[id]
        }
        return this.speakers[id] = new Speaker(id)
    }
    getNick(e: PrivateMsg | GroupMsg) {
        if ('card' in e.sender) {
            return e.sender.card
        } else {
            return e.sender.nickname
        }
    }
    parseCmd(e: GroupMsg | PrivateMsg) {
        let message = e.message

        const argv = minimist(message.slice(
            /^s(\d+)?d\d/.exec(message) ? 1 : 2
        ).split(' ').filter(i => i))
        const command: string = argv._[0] || ''
        const speaker = this.getSpeaker(e.user_id)
        try {
            switch (command as Command) {
                case 'save':
                case 's':
                    if (!argv.n && !argv.name) {
                        return this.mm.print(e, '必须声明模版名')
                    }
                    speaker.saveTemplate(argv.n || argv.name, argv._.slice(1))
                    this.mm.print(e, `已储存。已有模版：\n${speaker.listTemplate()}`)
                    break
                case 'exec':
                case 'e':
                    this.mm.print(e, this.getNick(e) + '的' + speaker.execTemplate(argv.n || argv._[1], argv.t || argv.times))
                    break
                case 'delete':
                case 'd':
                    const name = argv.n || argv.name || argv._[1]
                    if (!name) {
                        return this.mm.print(e, '必须声明模版名')
                    }
                    if (!speaker.getTemplate(name)) {
                        return this.mm.print(e, `没有名称为${name}的模板，现有模版${speaker.listTemplate()}`)
                    }
                    speaker.deleteTemplate(name)
                    this.mm.print(e, `已删除。现有模版：\n${speaker.listTemplate()}`)
                    break
                case 'clear':
                case 'c':
                    speaker.clearTemplate()
                    this.mm.print(e, `已清空所有模版`)
                    break
                case 'expect':
                    this.mm.print(
                        e,
                        `执行${argv.t || 1000}次，均值${speaker.expected(argv._[1], argv.t)}`
                    )
                    break
                case 'list':
                case 'l':
                    this.mm.print(e, '已储存的模版：\n' + speaker.listTemplate())
                    break
                case 'ma':
                    const bab = argv.bab || argv._[1]
                    const ab = argv.ab || argv._[2] || argv._[1]
                    this.mm.print(
                        e,
                        this.getNick(e) +
                            `的多打(bab:${bab}, ab${ab})：` +
                            speaker.multipleAttack(bab, ab, argv.d || argv.damage, argv.t || argv.times))
                    break
                case 'help':
                    this.mm.print(e, HELP_SUFFIX + HELP_DICE)
                    break
                default:
                    this.mm.print(e, this.getNick(e) + '的' + speaker.exec(argv._, argv.t || argv.times))
            }
        } catch (err) {
            this.mm.print(e, err+'')
        }
    }

    init(): void | Promise<void> {
        this.Bot.Command
            .command('掷骰')
            .reg(/^s(\d+)?d/)
            .action('group', e => {
                this.parseCmd(e)
            })
            .action('private', e => {
                this.parseCmd(e)
            })
    }
}