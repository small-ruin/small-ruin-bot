import minimist from "minimist";
import { Battle } from "../battle";
import { BotPlugin, GroupMsg, PrivateMsg } from "xianyu-robot";
import { HELP_SB } from "../constant";

type Command = 'on' | 'pause' | 'end' | 'member' | 'next' | 'nextRound' | 'switch' | 'reset' | 'init' | 'help' | 'jump' | 'jump-off' | 'reminder' | 'reminder-off' | 'jf' | 'rf' | 'jump-time' | 'jt' | 'current' | 'row'

export default class DicePlugin extends BotPlugin {
    active: boolean = false
    cache: Record<number, Battle> = {}
    timeoutFlag = null
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
        const command = argv._[2]
        const name = argv._[3]
        const parsedArgv = this.parseArgv(argv) as any
        switch (command) {
            case 'add':
                parsedArgv.name = name
                battle.addMember(parsedArgv)
                this.privatePrint(battle.dm, '添加成功:' + name)
                break;
            case 'set':
                battle.setMember(name, parsedArgv)
                this.privatePrint(battle.dm, '设置成功:' + battle.getMember(name))
                break
            case 'delete':
                battle.delete(name)
                this.privatePrint(battle.dm, '删除成功:\n' + battle)
                break
            case 'condition':
                battle.setCondition(name, parsedArgv.condition, parsedArgv.round)
                this.privatePrint(battle.dm, '设置成功:' + battle.getMember(name))
                break
            case 'damage':
                const damage = +argv._[4]
                if (isNaN(damage)) throw new Error('错误的数值')
                battle.damage(name, damage)
                this.privatePrint(battle.dm, '设置成功:' + battle.getMember(name))
                break
            case 'list':
                this.print(m, battle.print())
                break
            default:
                break;
        }
    }
    handleInit(m: GroupMsg | PrivateMsg, argv: minimist.ParsedArgs, battle: Battle) {
        const command = argv._[2]
        const name = argv._[3]
        const parsedArgv = this.parseArgv(argv) as any
        switch (command) {
            case 'list':
                this.print(m, battle.printInit(parsedArgv.all))
                break;
            case 'set':
                const init = +argv._[4]
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
        this.groupPrint(battle.groupId, `-------- 跳至${battle.round}轮 --------`)
    }
    handleNextOne(e: GroupMsg | PrivateMsg, battle: Battle) {
        battle.next()
        const rst = [`-------- 第${battle.round+1}轮，${battle.current?.name}的回合 --------`]

        if (battle.autoInfo && battle.current) {
            let m = battle.getMember(battle.current.name)
            rst.push(`${m.name}: ${m.hp}hp ${m.conditions.map(c => c.name).join('、')}`)
        }
        this.groupPrint(battle.groupId, rst)

        if (battle.autoJump) {
            if (this.timeoutFlag) {
                clearInterval(this.timeoutFlag)
            }
            // @ts-ignore
            this.timeoutFlag = setInterval(() => {
                this.print(e, `${battle.time}分钟没有响应，自动跳过`)
                this.handleNextOne(e, battle)
            }, battle.time * 1000 * 60)
        }
    }
    battleOn(e: GroupMsg | PrivateMsg, battle: Battle) {
        this.handleNextOne(e, battle)
    }
    parseCmd(e: GroupMsg | PrivateMsg, battle: Battle) {
        const { message } = e
        const argv = minimist(message.split(' '))
        console.log('argv', argv)
        switch(argv._[1] as Command) {
            case 'row':
                const msgs = e.message.replace(/^sb\s+row\s+/, '').split('\n')
                const f: any = setInterval(() => {
                    if (msgs.length) {
                        const message = msgs.shift()
                        if (!message) return clearInterval(f)
                        e.message = message
                        this.parseCmd(e, battle)
                    } else {
                        clearInterval(f)
                    }
                }, 1000)
                break;
            case 'current':
                battle.groupId = (<GroupMsg>e).group_id
                break;
            case 'on':
                this.active = true
                if (!battle.current)
                    this.groupPrint(battle.groupId, '======== 战斗开始 ========')
                this.battleOn(e, battle)
                break;
            case 'pause':
                this.active = false
                if (this.timeoutFlag)
                    clearInterval(this.timeoutFlag)
                break;
            case 'end':
                this.active = false
                if (this.timeoutFlag)
                    clearInterval(this.timeoutFlag)
                delete this.cache[battle.dm]
                this.groupPrint(battle.groupId, '======== 战斗结束 ========')
                break;
            case 'member':
                this.handleMember(e, argv, battle)
                break;
            case 'init':
                this.handleInit(e, argv, battle)
                break
            case 'nextRound':
                this.handleNext(battle)
                break;
            case 'next':
                this.handleNextOne(e, battle)
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
                if (isNaN(+argv._[2]))
                    throw new Error('错误的时间')
                battle.time = +argv._[2]
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
            default:
                throw new Error('未知指令：' + argv._[1])
        }
    }
    init(): void | Promise<void> {
        this.Bot.Command
            .command('battle')
            .reg(/^sb|end/)
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