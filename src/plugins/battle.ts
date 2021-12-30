import minimist from "minimist";
import { Battle } from "../battle";
import { BotPlugin, GroupMsg, PrivateMsg } from "xianyu-robot";
import { HELP_SB } from "../constant";

type Command = 'on' | 'pause' | 'end' | 'member' | 'next' | 'nextone' | 'switch' | 'reset' | 'init' | 'help' | 'jump' | 'jump-off' | 'reminder' | 'reminder-off' | 'jf' | 'rf' | 'jump-time' | 'jt'

export default class DicePlugin extends BotPlugin {
    active: boolean = false
    cache: Record<number, Battle> = {}
    timeoutFlag = null
    print(e: GroupMsg | PrivateMsg, ms: string | string[] | undefined) {
        if (!ms) return
        if (Array.isArray(ms)) {
            setTimeout(() => this.print(e, ms.shift()), 1000)
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
            setTimeout(() => this.privatePrint(userId, ms.shift()), 1000)
        } else {
            this.Bot.Api.sendPrivateMsg(userId, ms)
        }
    }
    groupPrint(groupId: number, ms: string | string[] | undefined) {
        if (!ms) return
        if (Array.isArray(ms)) {
            setTimeout(() => this.privatePrint(groupId, ms.shift()), 1000)
        } else {
            this.Bot.Api.sendPrivateMsg(groupId, ms)
        }
    }

    parseArgv(argv: minimist.ParsedArgs) {
        return {
            autoJump: argv.offJump,
            time: argv.t || argv.time,
            autoInfo: argv.offInro,
            hp: argv.h || argv.hp,
            init: argv.i || argv.init,
            tempHp: argv.t || argv.tempHp,
            e: argv.e,
            all: argv.a,
            condition: argv.c || argv.condition,
            round: argv.r || argv.round,
        }
    }

    handleMember(m: GroupMsg | PrivateMsg, argv: minimist.ParsedArgs, battle: Battle) {
        const command = argv._[1]
        const name = argv._[2]
        const parsedArgv = this.parseArgv(argv) as any
        switch (command) {
            case 'add':
                battle.addMember(parsedArgv)
                this.privatePrint(battle.dm, '添加成功:' + name)
                break;
            case 'set':
                battle.setMember(name, parsedArgv)
                this.privatePrint(battle.dm, '设置成功:' + battle.getMember(name))
            case 'delete':
                battle.delete(name)
                this.privatePrint(battle.dm, '删除成功:\n' + battle)
            case 'condition':
                battle.setCondition(name, parsedArgv.condition, parsedArgv.round)
                this.privatePrint(battle.dm, '设置成功:' + battle.getMember(name))
            case 'damage':
                const damage = +argv._[3]
                if (isNaN(damage)) throw new Error('错误的数值')
                battle.damage(name, damage)
                this.privatePrint(battle.dm, '设置成功:' + battle.getMember(name))
            case 'list':
                this.print(m, ''+battle)
            default:
                break;
        }
    }
    handleInit(m: GroupMsg | PrivateMsg, argv: minimist.ParsedArgs, battle: Battle) {
        const command = argv._[1]
        const name = argv._[2]
        const parsedArgv = this.parseArgv(argv) as any
        switch (command) {
            case 'list':
                this.print(m, battle.printInit(parsedArgv.all))
                break;
            case 'set':
                const init = +argv._[3]
                if (isNaN(init)) throw new Error('错误的数值')
                battle.setInit(name, init)
                this.privatePrint(battle.dm, '设置成功')
                break
            default:
                break;
        }
    }
    handleNext(battle: Battle) {
        battle.nextRound()
        this.groupPrint(battle.groupId, `======== 第${battle.round}轮 ========`)
    }
    handleNextOne(battle: Battle) {
        battle.next()
        const rst = [`-------- 第${battle.round}轮，${battle.current?.name}的回合 --------`]

        if (battle.autoInfo && battle.current) {
            rst.push(battle.getMember(battle.current.name) + '')
        }
        this.groupPrint(battle.groupId, rst)
    }
    battleOn(battle: Battle) {
        if (battle.autoJump) {
            // @ts-ignore
            this.timeoutFlag = setTimeout(() => {
                this.handleNextOne(battle)
            }, battle.time * 1000 * 60)
        } else {
            this.handleNextOne(battle)
        }
    }
    parseCmd(e: GroupMsg | PrivateMsg, battle: Battle) {
        const { message } = e
        const argv = minimist(message.split(' '))
        switch(argv._[0] as Command) {
            case 'on':
                this.active = true
                if (!battle.current)
                    this.groupPrint(battle.groupId, '******** 战斗开始 ********')
                this.battleOn(battle)
                
                break;
            case 'pause':
                this.active = false
                if (this.timeoutFlag)
                    clearTimeout(this.timeoutFlag)
                break;
            case 'end':
                this.active = false
                if (this.timeoutFlag)
                    clearTimeout(this.timeoutFlag)
                battle.reset()
                this.groupPrint(battle.groupId, '******** 战斗结束 ********')
            case 'member':
                this.handleMember(e, argv, battle)
                break;
            case 'init':
                this.handleInit(e, argv, battle)
                break
            case 'next':
                this.handleNext(battle)
                break;
            case 'nextone':
                this.handleNextOne(battle)
                break
            case 'reset':
                battle.reset();
                break
            case 'jump':
                battle.autoJump = true;
                break
            case 'jump-off' || 'jf':
                battle.autoJump = false;
                break
            case 'jump-time' || 'jt':
                if (isNaN(+argv._[1]))
                    throw new Error('错误的时间')
                battle.time = +argv._[1]
                break
            case 'reminder':
                battle.autoInfo = true;
                break
            case 'reminder-off' || 'rf':
                battle.autoInfo = false
                break
            case 'help':
                this.print(e, HELP_SB)
                break
        }
    }
    init(): void | Promise<void> {
        this.Bot.Command
            .command('battle')
            .action('group', (e: GroupMsg) => {
                const {message, group_id, sender} = e
                try {
                    let bt = this.cache[sender.user_id];
                    if (!bt) bt = this.cache[sender.user_id] = new Battle(sender.user_id, group_id)
                    if (message.match(/^sb/)) {
                        this.parseCmd(e, bt)
                    } else if (message.match(/end/) && this.active) {
                        this.handleNext(bt)
                    }
                } catch(err) {
                    this.print(e, err + '')
                }
            })
            .action('private', (e: PrivateMsg) => {
                const {message, user_id, sender} = e
                try {
                    let bt = this.cache[sender.user_id];
                    if (!bt)
                        throw new Error('无挂载中的战斗')
                    if (e.message.match(/^sb/)) {
                        this.parseCmd(e, bt)
                    } else if (e.message.match(/end/) && this.active) {
                        this.handleNext(bt)
                    }
                } catch(err) {
                    this.privatePrint(user_id, err + '')
                }
            })     
        }
}