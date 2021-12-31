import minimist from "minimist";
import { Battle } from "../battle";
import { BotPlugin, GroupMsg, PrivateMsg } from "xianyu-robot";
import { HELP_SB } from "../constant";

type Command = 'on' | 'pause' | 'end' | 'member' | 'next'
    | 'nextRound' | 'switch' | 'reset' | 'init' | 'help' | 'jump' | 'jump-off'
    | 'reminder' | 'reminder-off' | 'J' | 'R' | 'jump-time' | 'jt' | 'current'
    | 'row' | 'at' | 'at-off' | 'A' | 'status' | 'status'

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

    async parseArgv(argv: minimist.ParsedArgs, battle: Battle,) {
        let userId
        if (argv.q || argv.qq) {
            const input = argv.q || argv.qq
            const ml = await this.Bot.Api.getGroupMemberList(battle.groupId)
            userId = Number.isInteger(+input) ? input
                : ml.find(m => m.card.indexOf(input) !== -1 || m.nickname.indexOf(input) !== -1)?.user_id
            if (!userId) throw new Error('没找到pc:' + input)
        }
        const rst: Record<string, any> = {
            time: argv.jumpTime || argv.t,
            hp: argv.h || argv.hp,
            init: argv.i || argv.init,
            tempHp: argv.t || argv.tempHp,
            enemy: argv.e || argv.enemy,
            all: argv.a || argv.all,
            condition: argv.c || argv.condition,
            round: argv.r || argv.round,
            pc: userId || null,
        }

        if (argv.jump || argv.j) rst.autoJump = true
        if (argv.jumpOff || argv.J) rst.autoJump = false

        if (argv.reminder || argv.r) rst.autoInfo = true
        if (argv.reminderOff || argv.R) rst.autoInfo = false

        if (argv.at || argv.a) rst.autoAt = true
        if (argv.atOff || argv.A) rst.autoAt = false

        return rst
    }

    async handleMember(m: GroupMsg | PrivateMsg, argv: minimist.ParsedArgs, battle: Battle) {
        const command = argv._[2]
        const name = argv._[3]
        const parsedArgv = await this.parseArgv(argv, battle) as any
        switch (command) {
            case 'add':
                parsedArgv.name = name
                battle.addMember(parsedArgv)
                this.privatePrint(battle.dm, '添加成功:' + name)
                break;
            case 'set':
                battle.setMember(name, parsedArgv)
                this.privatePrint(battle.dm, '设置成功:' + battle.getMember(name).print())
                break
            case 'delete':
                battle.delete(name)
                this.privatePrint(battle.dm, '删除成功:\n' + battle.printMember())
                break
            case 'condition':
                battle.setCondition(name, parsedArgv.condition, parsedArgv.round)
                this.privatePrint(battle.dm, '设置成功:' + battle.getMember(name).print())
                break
            case 'damage':
                const damage = +argv._[4]
                if (isNaN(damage)) throw new Error('错误的数值')
                battle.damage(name, damage)
                this.privatePrint(battle.dm, '设置成功:' + battle.getMember(name).print())
                break
            case 'list':
                this.print(m, battle.printMember())
                break
            default:
                break;
        }
    }
    async handleInit(m: GroupMsg | PrivateMsg, argv: minimist.ParsedArgs, battle: Battle) {
        const command = argv._[2]
        const name = argv._[3]
        const parsedArgv = await this.parseArgv(argv, battle) as any
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
        this.handleNextOne(battle)
    }
    handleNextOne(battle: Battle) {
        battle.next()
        const rst = [`-------- 第${battle.round+1}轮，${battle.current?.name}的回合 --------`]

        if (battle.autoInfo && battle.current) {
            let m = battle.getMember(battle.current.name)
            rst.push(`${m.name}: ${m.hp}hp ${m.conditions.map(c => c.name).join('、')}`)
        }
        if (battle.autoAt && battle.current?.pc) {
            rst.push(this.Bot.CQCode.at(+battle.current.pc))
        }
        this.groupPrint(battle.groupId, rst)

        if (battle.autoJump) {
            this.resetTimer(battle)
        }
    }
    resetTimer(battle: Battle) {
        if (this.timeoutFlag) {
            clearInterval(this.timeoutFlag)
        }
        // @ts-ignore
        this.timeoutFlag = setInterval(() => {
            this.groupPrint(battle.groupId, `${battle.current?.name}${battle.time}分钟没有响应，自动跳过`)
            this.handleNextOne(battle)
        }, battle.time * 1000 * 60)
    }
    async battleOn(argv: minimist.ParsedArgs, battle: Battle) {
        this.active = true

        let config = await this.parseArgv(argv, battle)
        const { autoJump, autoInfo, autoAt, time } = config
        config = { autoJump, autoInfo, autoAt, time }
        Object.keys(config).forEach(k => (config[k] === undefined) && delete config[k])
        Object.assign(battle, config)

        if (!battle.current)
            this.groupPrint(battle.groupId, '======== 战斗开始 ========')

        this.handleNextOne(battle)
    }
    async parseCmd(e: GroupMsg | PrivateMsg, battle: Battle) {
        const { message } = e
        const argv = minimist(message.split(' '))
        console.log('argv', argv)
        switch(argv._[1] as Command) {
            case 'current':
                battle.groupId = (<GroupMsg>e).group_id
                break;
            case 'on':
                this.battleOn(argv, battle)
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
                await this.handleMember(e, argv, battle)
                break;
            case 'init':
                await this.handleInit(e, argv, battle)
                break
            case 'nextRound':
                this.handleNext(battle)
                break;
            case 'next':
                this.handleNextOne(battle)
                break
            case 'reset':
                battle.reset();
                break
            case 'jump':
                battle.autoJump = true;
                break
            case 'jump-off' || 'J':
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
            case 'reminder-off' || 'R':
                battle.autoInfo = false
                break
            case 'at':
                battle.autoAt = true
                break
            case 'at-off' || 'A':
                battle.autoAt = false
                break
            case 'help':
                this.print(e, HELP_SB)
                break
            case 'status':
                this.print(e, battle.print())
                break;
            default:
                throw new Error('未知指令：' + argv._[1])
        }
    }
    handleRow(e: PrivateMsg | GroupMsg, battle: Battle) {
            const msgs = e.message.replace(/^sb\s+row\s+/, '').split('\n').map(i => i.replace('\r', ''))
            const f: any = setInterval(async () => {
                try {
                    if (msgs.length) {
                        const message = msgs.shift()
                        if (!message) return clearInterval(f)
                        e.message = message
                        await this.parseCmd(e, battle)
                    } else {
                        clearInterval(f)
                    }
                } catch(err) {
                    this.print(e, err+'')
                }
            }, 1000)
    }
    init(): void | Promise<void> {
        this.Bot.Command
            .command('battle')
            .reg(/^sb|end/)
            .action('group', async (e: GroupMsg) => {
                const {message, group_id, sender} = e
                try {
                    let bt = this.cache[sender.user_id];
                    if (!bt) bt = this.cache[sender.user_id] = new Battle(sender.user_id, group_id)
                    if (message.match(/^sb/)) {
                        if (message.split(' ')[1] = 'row') {
                            await this.handleRow(e, bt)
                        } else {
                            await this.parseCmd(e, bt)
                        }
                    } else if (message.match(/end/) && this.active) {
                        this.handleNextOne(bt)
                    }

                    if (this.active && bt.autoJump) {
                        if (bt.current && bt.current.pc) {
                            if (e.sender.nickname.indexOf(bt.current.pc) !== -1) {
                                this.resetTimer(bt)
                            }
                        } else {
                            this.resetTimer(bt)
                        }
                    }
                } catch(err) {
                    this.print(e, err + '')
                }
            })
            .action('private', async (e: PrivateMsg) => {
                const {message, user_id, sender} = e
                try {
                    let bt = this.cache[sender.user_id];
                    if (!bt)
                        throw new Error('无挂载中的战斗')
                    if (e.message.match(/^sb/)) {
                        if (message.split(' ')[1] = 'row') {
                            await this.handleRow(e, bt)
                        } else {
                            await this.parseCmd(e, bt)
                        }
                    }
                } catch(err) {
                    this.privatePrint(user_id, err + '')
                }
            })     
        }
}