import { BotPlugin, GroupMsg, PrivateMsg } from 'xianyu-robot';
import MessageManger from '../core/Message';
import spells from '../rules/3r_spells.json'

export default class SearchPlugin extends BotPlugin {
    name = 'search'
    mm: MessageManger = new MessageManger(this.Bot)
    spells = spells as Record<string, string>
    sIndex = Object.keys(spells)

    parseCmd(e: GroupMsg | PrivateMsg) {
        let keyword = e.message.slice(3)

        if (keyword in spells) {
            this.mm.print(e, keyword + '\r\n' + this.spells[keyword])
        } else {
            const maybe = this.sIndex.filter(i => (i.toLocaleLowerCase()).indexOf(keyword.toLocaleLowerCase()) !== -1)
            console.log(maybe)
            if (maybe.length) {
                if (maybe.length === 1) {
                    this.mm.print(e, maybe[0] + '\r\n' +this.spells[maybe[0]])
                } else if (
                    maybe.find(n => /([^（^）]+)/.exec(n)
                    // @ts-ignore
                        && (/([^（^）]+)/.exec(n)[0] === keyword))
                ) {
                    // @ts-ignore
                    const name = maybe.find(n => /([^（^）]+)/.exec(n))
                    if (name) this.mm.print(e, name + '\n' + this.spells[name])
                } else {
                    this.mm.print(e, '未找到, 是不是要找' + maybe.join('、'))
                }
            } else {
                this.mm.print(e, '未找到')
            }
        }
    }
    init(): void | Promise<void> {
        this.Bot.Command
            .command('查找')
            .reg(/^ss/)
            .action('group', e => {
                this.parseCmd(e)
            })
            .action('private', e => {
                this.parseCmd(e)
            })
    }
}