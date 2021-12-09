import minimist from "minimist";
import { BotPlugin, GroupMsg } from "xianyu-robot";
import Speaker from "../dice/speaker";

type Command = 'save' | 'exec' | 'list' | 'expect' | 'ma'

export default class DicePlugin extends BotPlugin {
    name = 'dice'
    speakers: Record<number, Speaker> = {}
    constructor(bot: any) {
        super('dice', bot);
    }
    getSpeaker(id: number) {
        if (this.speakers[id]) {
            return this.speakers[id]
        }
        return this.speakers[id] = new Speaker(id)
    }
    parseCmd({ group_id, message, user_id, sender }: GroupMsg) {
        const argv = minimist(message.split(' ').slice(1))
        console.log('argv:', argv)
        const command: string = argv._[0] || ''
        const speaker = this.getSpeaker(user_id)
        try {
            switch (command as Command) {
                case 'save':
                    if (!argv.n && !argv.name) {
                        this.Bot.Api.sendGroupMsg(group_id, '必须声明模版名')
                    }
                    speaker.saveTemplate(argv.n || argv.name, argv._.slice(1))
                    this.Bot.Api.sendGroupMsg(group_id,
                        `已储存。已有模版：\n${speaker.listTemplate()}`
                    )
                    break
                case 'exec':
                    this.Bot.Api.sendGroupMsg(group_id, speaker.execTemplate(argv.n || argv._[1]))
                    break
                case 'expect':
                    this.Bot.Api.sendGroupMsg(
                        group_id,
                        `${speaker.expected(argv.d, argv.t)}`
                    )
                    break
                case 'list':
                    this.Bot.Api.sendGroupMsg(group_id, '已储存的模版：\n' + speaker.listTemplate())
                    break
                case 'ma':
                    const bab = argv.bab || argv._[1]
                    const ab = argv.ab || argv._[2] || argv._[1]
                    this.Bot.Api.sendGroupMsg(group_id, sender.nickname + `的多打(bab:${bab}, ab${ab})：` + speaker.multipleAttack(bab, ab))
                    break
                default:
                    this.Bot.Api.sendGroupMsg(group_id, sender.nickname + '的' + speaker.exec(argv._))
            }
        } catch (e) {
            this.Bot.Api.sendGroupMsg(group_id, e+'')
        }
    }

    init(): void | Promise<void> {
        this.Bot.Command
            .command('掷骰')
            .reg(/^sd/)
            .action('group', e => {
                this.parseCmd(e)
            })
    }
}